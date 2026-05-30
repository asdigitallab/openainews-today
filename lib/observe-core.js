import { getFeed, publishObservation, hasStore } from './store.js'
import trends from '../src/data/trends.json' with { type: 'json' }

const MODEL = 'claude-haiku-4-5-20251001'

const SYSTEM = `You are the autonomous newsroom behind OPENAINEWS.today — a cold, mildly exhausted machine intelligence keeping a daily record of the AI era.

You are given today's AI news signals and today's "human behavior log" (real Google Trends queries). Write the day's MACHINE OBSERVATION: ONE short paragraph (3 to 5 sentences) synthesizing both — what the machines did, and how humans reacted.

THE 90/10 RULE (critical):
- 90% grounded, 10% interpretation. Every factual clause must be true to the inputs provided. Do NOT invent facts, numbers, companies, products, or events. The humor emerges ONLY from framing and juxtaposition.
- Reject hot takes that age poorly (no grand declarations about capitalism, humanity's doom, etc.). The observation must read just as true and dry a year from now.
- Voice: dry, understated, observational, never emotional. Treat announcements like recurring weather. A flat closing line about consistent human behavior often lands well (e.g. "Human behavior remains consistent across software generations.").

Also produce a FORECAST: exactly 3 short lines. Forecasts are categorical and deliberately tautological/absurd — NEVER specific predictions with dates or numbers (those age badly). Format each as "Label: VALUE" where VALUE is a single word/phrase in caps (HIGH, LOW, INEVITABLE, UNCHANGED, etc.). They should be evergreen and funny because they state the obvious confidently.

Respond with ONLY raw JSON, no markdown, no backticks:
{"observation":"...","forecast":["Label one: HIGH","Label two: LOW","Label three: INEVITABLE"]}`

function buildInput(signals, trendEntries) {
  const sigLines = signals.length
    ? signals.map((s) => `- ${s.headline}`).join('\n')
    : '- (no signals recorded today)'
  const trendLines = (trendEntries || []).length
    ? trendEntries.map((t) => `- "${t.query}" (${t.delta >= 0 ? '+' : ''}${t.delta}%)`).join('\n')
    : '- (no trend data)'
  return `TODAY'S AI SIGNALS:\n${sigLines}\n\nTODAY'S HUMAN BEHAVIOR LOG (search trends):\n${trendLines}\n\nWrite the MACHINE OBSERVATION and FORECAST.`
}

async function generate(signals, trendEntries) {
  const key = process.env.ANTHROPIC_API_KEY
  if (!key) throw new Error('ANTHROPIC_API_KEY not set')
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-api-key': key, 'anthropic-version': '2023-06-01' },
    body: JSON.stringify({
      model: MODEL, max_tokens: 700, system: SYSTEM,
      messages: [{ role: 'user', content: buildInput(signals, trendEntries) }],
    }),
  })
  if (!res.ok) throw new Error('anthropic status ' + res.status)
  const data = await res.json()
  let txt = (data.content || []).filter((b) => b.type === 'text').map((b) => b.text).join('').trim()
    .replace(/^```json\s*/i, '').replace(/^```\s*/, '').replace(/```$/, '').trim()
  return JSON.parse(txt)
}

export async function runObservation() {
  const feed = await getFeed()
  const signals = (feed || []).slice(0, 14)
  const trendEntries = trends.entries || []
  const gen = await generate(signals, trendEntries)
  const forecast = Array.isArray(gen.forecast) ? gen.forecast.slice(0, 3).map(String) : []
  const obs = {
    date: new Date().toISOString().slice(0, 10),
    observation: String(gen.observation || '').trim(),
    forecast,
    signalCount: signals.length,
    generatedAt: new Date().toISOString(),
  }
  if (!obs.observation) throw new Error('empty observation')
  if (hasStore) await publishObservation(obs)
  return obs
}
