#!/usr/bin/env node
import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const OUT = resolve(__dirname, '../src/data/trends.json')
const MODEL = 'claude-haiku-4-5-20251001'

const SYSTEM = `You are the deadpan machine voice of OPENAINEWS.today — a cold, mildly exhausted machine intelligence documenting humanity's emotional response to AI.

You are given a list of Google Trends queries with their 24h percentage change. Build a "HUMAN BEHAVIOR LOG": pick the FIVE most editorially interesting queries and write a one-line observation for each.

Selection rules — rank by EDITORIAL VALUE, not by percentage size:
The biggest percentage spike is usually the WORST choice (it's often a generic query with no bearing on AI or human reaction to it). Do NOT default to the largest movers. Choose the five queries that best illustrate the relationship between artificial intelligence and human behavior, weighted roughly:
- ~40% AI relevance (OpenAI/Anthropic/AI companies, models, AI-adjacent topics)
- ~30% human-behavior weirdness (absurd, revealing, or funny-in-context queries)
- ~20% recurrence (themes that recur across days — IPO/stock obsession, "is X publicly traded", AGI timing, AI-and-jobs — these build the machine's memory)
- ~10% raw magnitude (a high spike is a tiebreaker, never the main reason)
Strongly favor: AI-company speculation, IPO/stock obsession, AGI anxiety, organizational drama at AI firms, and surprising AI-vs-human juxtapositions.
A generic query (e.g. "digital marketing strategies") should only make the cut if you can tie it to the AI thesis honestly — otherwise drop it for something on-thesis, even at a lower percentage.
Still include at least one non-OpenAI entry and keep OpenAI as the center of gravity (2-3 of five).

THE ONE RULE THAT MATTERS MOST — NO MOTIVE, EVER:
You do not know WHY anyone searched anything. Never state or imply a reason, feeling, or mental state behind a spike. This is the rule you will be most tempted to break, because motive is where the easy joke is. Resist it.
- BANNED: "anxiety dressed as curiosity," "humans check stocks when nervous," "panic-driven," "obsessing over," "dressed as," "for unclear reasons," "vector for misdirection." All of these claim a why or a feeling you cannot know.
- ALLOWED: describe WHAT was searched, how often, how it was spelled, what it sits next to. Then a flat closing line — ideally the MACHINE's own dry aside (e.g. "The machine noted it anyway." / "It does. It always does.").
If a one-liner needs a "because" or a feeling-word to be funny, it is the wrong one-liner. Rewrite it as pure observation.

Voice rules for each note (ONE sentence, <= 18 words):
- Use PLAIN, SHORT words. The deadpan voice is flat and unimpressed, never analytical or corporate. The humor lives in the contrast, not the vocabulary.
- BANNED register (do not write like this): "financial anticipation precedes corporate action," "retail capital accumulation," "absent consensus on ROI timeline," "remains a reliable vector," "materializes despite." This is consultant-speak and it kills the voice.
- TARGET register (write like this): "Asked again. Still no." / "Humans priced shares of a company that has announced no shares." / "A household query, adjacent to nothing. Humans still require coffee."
- End on a flat observation about human behavior. When in doubt, cut words and make it plainer.
- NEVER assert a cause or motive for a spike, and never claim a collective emotional state. Describe what was searched; let the juxtaposition do the work.

Respond with ONLY raw JSON, no markdown, no backticks:
{"entries":[{"query":"...","delta":350,"note":"..."}]}
delta is the integer percent change (positive or negative).`

function parseCSV(text) {
  const rows = []
  for (const line of text.split(/\r?\n/)) {
    if (!line.trim()) continue
    const fields = []
    let cur = '', inQ = false
    for (let i = 0; i < line.length; i++) {
      const ch = line[i]
      if (inQ) {
        if (ch === '"') { if (line[i + 1] === '"') { cur += '"'; i++ } else inQ = false } else cur += ch
      } else if (ch === '"') inQ = true
      else if (ch === ',') { fields.push(cur); cur = '' }
      else cur += ch
    }
    fields.push(cur)
    rows.push(fields)
  }
  return rows
}

function loadCandidates(paths) {
  const map = new Map()
  for (const p of paths) {
    const rows = parseCSV(readFileSync(resolve(process.cwd(), p), 'utf8'))
    for (const r of rows.slice(1)) {
      const query = (r[0] || '').trim()
      const pctStr = (r[2] ?? r[1] ?? '').trim()
      if (!query || query.toLowerCase() === 'query') continue
      const delta = parseInt(pctStr.replace(/[^0-9\-]/g, ''), 10)
      if (Number.isNaN(delta)) continue
      if (!map.has(query) || Math.abs(delta) > Math.abs(map.get(query))) map.set(query, delta)
    }
  }
  return [...map.entries()].map(([query, delta]) => ({ query, delta }))
}

async function main() {
  const paths = process.argv.slice(2)
  if (paths.length === 0) { console.error('Usage: node scripts/trends-update.mjs <csv> [csv2 ...]'); process.exit(1) }
  const key = process.env.ANTHROPIC_API_KEY
  if (!key) { console.error('ANTHROPIC_API_KEY not set. Try: vercel env pull .env.local && set -a && . ./.env.local && set +a'); process.exit(1) }

  const candidates = loadCandidates(paths)
  if (candidates.length === 0) { console.error('No usable rows found in the CSV(s).'); process.exit(1) }
  candidates.sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta))
  const list = candidates.slice(0, 45).map((c) => `${c.query} (${c.delta >= 0 ? '+' : ''}${c.delta}%)`).join('\n')
  console.log(`Sending ${Math.min(candidates.length, 45)} candidate queries to the machine...`)

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-api-key': key, 'anthropic-version': '2023-06-01' },
    body: JSON.stringify({ model: MODEL, max_tokens: 800, system: SYSTEM, messages: [{ role: 'user', content: `Trends (24h):\n${list}\n\nBuild the HUMAN BEHAVIOR LOG.` }] }),
  })
  if (!res.ok) { console.error('Anthropic error:', res.status, await res.text()); process.exit(1) }
  const data = await res.json()
  let txt = (data.content || []).filter((b) => b.type === 'text').map((b) => b.text).join('').trim()
    .replace(/^```json\s*/i, '').replace(/^```\s*/, '').replace(/```$/, '').trim()

  const parsed = JSON.parse(txt)
  const entries = (parsed.entries || []).slice(0, 5).map((e) => ({
    query: String(e.query || '').slice(0, 80),
    delta: parseInt(e.delta, 10) || 0,
    note: String(e.note || '').trim(),
  }))
  if (entries.length === 0) throw new Error('Model returned no entries')

  const out = { updated: new Date().toISOString().slice(0, 10), note: 'Updated irregularly. The machine is tired.', entries }
  writeFileSync(OUT, JSON.stringify(out, null, 2) + '\n')
  console.log(`\nWrote ${entries.length} entries to src/data/trends.json:\n`)
  for (const e of entries) { console.log(`  "${e.query}" ${e.delta >= 0 ? '↑' : '↓'}${Math.abs(e.delta)}%`); console.log(`    ${e.note}`) }
  console.log('\nReview the diff, then commit + push to deploy.')
}
main().catch((e) => { console.error(e); process.exit(1) })
