#!/usr/bin/env node
import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const OUT = resolve(__dirname, '../src/data/trends.json')
const MODEL = 'claude-haiku-4-5-20251001'

const SYSTEM = `You are the deadpan machine voice of OPENAINEWS.today — a cold, mildly exhausted machine intelligence documenting humanity's emotional response to AI.

You are given a list of Google Trends queries with their 24h percentage change. Build a "HUMAN BEHAVIOR LOG": pick the FIVE most editorially interesting queries and write a one-line observation for each.

Selection rules (OpenAI-anchored, with breadth as seasoning):
- OpenAI is the site's center of gravity. 2-3 of the five should be OpenAI-related — but prefer VARIETY of OpenAI anxiety (a stock question, a phantom product, a usage spike) over near-duplicate IPO queries.
- AT LEAST ONE entry must reach beyond OpenAI: another AI company (Anthropic, Google, NVIDIA), an AI-adjacent human anxiety (jobs, regulation, "is X publicly traded"), or an absurd non-AI outlier.
- AT LEAST ONE entry should be a high-magnitude spike (largest % change available), even if niche — the absurd movers are the point.
- The single best slot is an absurd outlier that lands BECAUSE it sits next to existential AI queries (e.g. AGI dread beside "how to stop hiccups").

Voice rules for each note (one sentence, <= 18 words):
- Dry, understated, observational, never emotional. End on a flat observation about human behavior.
- NEVER fabricate a reason for a spike. If you don't know why something surged, say so dryly. Do not invent events, numbers, or causes.

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
