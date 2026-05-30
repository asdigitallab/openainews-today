import { listObservations, getObservation } from '../lib/store.js'

export default async function handler(req, res) {
  try {
    const date = req.query && req.query.date
    if (date) {
      const item = await getObservation(String(date))
      res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600')
      res.status(200).json({ item }); return
    }
    const items = await listObservations(90)
    res.setHeader('Cache-Control', 's-maxage=120, stale-while-revalidate=600')
    res.status(200).json({ items })
  } catch (err) {
    res.status(200).json({ items: [], error: String((err && err.message) || err) })
  }
}
