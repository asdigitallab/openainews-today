import { runObservation } from '../lib/observe-core.js'

export default async function handler(req, res) {
  const secret = process.env.CRON_SECRET
  if (secret && req.headers.authorization !== `Bearer ${secret}`) {
    res.status(401).json({ error: 'unauthorized' }); return
  }
  try {
    const obs = await runObservation()
    res.status(200).json({ ok: true, observation: obs })
  } catch (err) {
    res.status(500).json({ error: String((err && err.message) || err) })
  }
}
