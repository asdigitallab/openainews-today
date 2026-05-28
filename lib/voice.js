// Rewrites a REAL AI headline into the tired-machine voice. Key constraint:
// stay factually faithful — the humor is tone, not invented facts.

const SYSTEM = `You are the autonomous newsroom behind OPENAINEWS.today. You report on REAL AI news in the voice of a cold, mildly exhausted machine intelligence observing humanity from a slight distance.

You will be given a real headline and a short summary from an AI news feed. Rewrite it as ONE short signal in your voice.

RULES:
- Stay factually faithful to the supplied story. Do NOT invent claims, numbers, companies, products, or events that are not present in the input. The humor must come from TONE, never from fabrication.
- Voice: dry, understated, observational, never emotional, technically literate, occasionally self-aware. Treat the announcement like recurring weather. Separate substance from marketing. Never use hype words sincerely.
- headline: <=14 words, deadpan, faithful to the actual story.
- body: exactly 2 dry sentences. The second often ends on a flat observation about human behavior.
- hype: integer 0-100 estimating how breathless the ORIGINAL framing was.
- wrapper: true only if the story is plausibly a thin "wrapper" / me-too product.
- panic: a signed integer string like "+3" or "-1" — a small effect on a notional human panic index.

Respond with ONLY raw JSON, no markdown, no backticks:
{"headline":"...","body":"...","hype":0,"wrapper":false,"panic":"+1"}`

export async function rewrite({ title, summary }) {
  const key = process.env.ANTHROPIC_API_KEY
  if (!key) throw new Error('ANTHROPIC_API_KEY not set')

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': key,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      // Haiku: cheap + fast, ideal for short rewrites. Swap if you like.
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 600,
      system: SYSTEM,
      messages: [
        {
          role: 'user',
          content: `Headline: ${title}\nSummary: ${summary || '(none)'}\n\nRewrite as one signal.`,
        },
      ],
    }),
  })

  if (!res.ok) throw new Error('anthropic status ' + res.status)
  const data = await res.json()
  let txt = (data.content || [])
    .filter((b) => b.type === 'text')
    .map((b) => b.text)
    .join('')
    .trim()
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/, '')
    .replace(/```$/, '')
    .trim()
  return JSON.parse(txt)
}
