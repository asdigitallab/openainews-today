import { Redis } from '@upstash/redis'

// Works with either the Vercel KV integration env names (KV_REST_API_*) or the
// raw Upstash names (UPSTASH_REDIS_REST_*). If neither is set, the site still
// runs — it just can't persist or de-duplicate (see ingest-core fallback).
const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL
const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN

export const hasStore = Boolean(url && token)
const redis = hasStore ? new Redis({ url, token }) : null

const FEED_KEY = 'news:feed'
const SEEN_KEY = 'news:seen'
const CAP = 120 // keep at most this many items in the feed

export async function getFeed() {
  if (!redis) return []
  const items = await redis.lrange(FEED_KEY, 0, -1)
  // @upstash/redis serializes/deserializes JSON automatically.
  return (items || []).filter(Boolean)
}

export async function getSeen() {
  if (!redis) return new Set()
  const ids = await redis.smembers(SEEN_KEY)
  return new Set(ids || [])
}

export async function publishItems(items, seenIds) {
  if (!redis || items.length === 0) return
  const p = redis.pipeline()
  // Push so the newest item (items[0]) ends up at the head of the list.
  for (const it of [...items].reverse()) p.lpush(FEED_KEY, it)
  p.ltrim(FEED_KEY, 0, CAP - 1)
  for (const id of seenIds) p.sadd(SEEN_KEY, id)
  await p.exec()
}
