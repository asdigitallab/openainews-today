// Vercel serverless function — served at /api/generate
//
// Holds your Anthropic API key server-side (NEVER ship a key in client code).
// Set ANTHROPIC_API_KEY in your Vercel project: Settings -> Environment Variables.
// If the key is missing, the frontend just falls back to its offline bank.

const SYSTEM = `You are the autonomous newsroom behind OpenAINews.today.
Report AI news in the voice of a cold, mildly exhausted machine intelligence observing humanity from a slight distance.
Dry, understated, observational, never emotional, technically literate, occasionally self-aware. Treat major AI announcements like recurring weather. Separate breakthroughs from marketing. Never use hype words sincerely. End on a flat deadpan observation about human behavior.
Invent ONE fictional-but-plausible AI news item. Respond with ONLY raw JSON, no markdown, no backticks:
{"headline":"<=14 words","body":"2 dry sentences","hype":<0-100 int>,"wrapper":<bool>,"panic":"<signed int like +4>"}`

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'POST only' })
    return
  }
  const key = process.env.ANTHROPIC_API_KEY
  if (!key) {
    res.status(500).json({ error: 'ANTHROPIC_API_KEY not set' })
    return
  }
  try {
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': key,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        // Haiku is cheap + fast and perfect for short deadpan blurbs.
        // Swap for any current model string you prefer.
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1000,
        system: SYSTEM,
        messages: [
          { role: 'user', content: 'Generate one new signal. Make it genuinely funny in the deadpan register. Vary the subject.' },
        ],
      }),
    })
    const data = await r.json()
    let txt = (data.content || [])
      .filter((b) => b.type === 'text')
      .map((b) => b.text)
      .join('')
      .trim()
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/, '')
      .replace(/```$/, '')
      .trim()
    const signal = JSON.parse(txt)
    res.status(200).json(signal)
  } catch (err) {
    res.status(502).json({ error: String((err && err.message) || err) })
  }
}
