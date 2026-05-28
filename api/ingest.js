import { runIngest } from '../lib/ingest-core.js'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'POST only' })
    return
  }
  try {
    const items = await runIngest(1)
    res.status(200).json({ item: items[0] || null })
  } catch (err) {
    res.status(502).json({ error: String((err && err.message) || err) })
  }
}
