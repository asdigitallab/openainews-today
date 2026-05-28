import { getFeed } from '../lib/store.js'

export default async function handler(req, res) {
  try {
    const items = await getFeed()
    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300')
    res.status(200).json({ items })
  } catch (err) {
    res.status(200).json({ items: [], error: String((err && err.message) || err) })
  }
}
