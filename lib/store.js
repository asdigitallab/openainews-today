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
const TOPICS_KEY = 'news:topics' // recent headline fingerprints for cross-source dedup
const CAP = 120 // keep at most this many items in the feed
const TOPIC_CAP = 200 // remember this many recent topic fingerprints

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

export async function getRecentTopics() {
  if (!redis) return []
  const arr = await redis.lrange(TOPICS_KEY, 0, -1)
  return (arr || []).filter(Boolean)
}

export async function publishItems(items, seenIds, topicFingerprints = []) {
  if (!redis || items.length === 0) return
  const p = redis.pipeline()
  // Push so the newest item (items[0]) ends up at the head of the list.
  for (const it of [...items].reverse()) p.lpush(FEED_KEY, it)
  p.ltrim(FEED_KEY, 0, CAP - 1)
  for (const id of seenIds) p.sadd(SEEN_KEY, id)
  for (const fp of topicFingerprints) if (fp) p.lpush(TOPICS_KEY, fp)
  if (topicFingerprints.length) p.ltrim(TOPICS_KEY, 0, TOPIC_CAP - 1)
  await p.exec()
}

// ---- Daily Machine Observations (the archive / the machine's memory) ----
const OBS_INDEX = 'obs:dates'
const obsKey = (date) => `obs:${date}`

export async function publishObservation(obs) {
  if (!redis || !obs || !obs.date) return
  const existed = await redis.exists(obsKey(obs.date))
  await redis.set(obsKey(obs.date), obs)
  if (!existed) await redis.lpush(OBS_INDEX, obs.date)
}

export async function getObservation(date) {
  if (!redis || !date) return null
  return (await redis.get(obsKey(date))) || null
}

export async function getLatestObservation() {
  if (!redis) return null
  const dates = await redis.lrange(OBS_INDEX, 0, 0)
  if (!dates || !dates.length) return null
  return (await redis.get(obsKey(dates[0]))) || null
}

export async function listObservations(limit = 60, offset = 0) {
  if (!redis) return []
  const dates = await redis.lrange(OBS_INDEX, offset, offset + limit - 1)
  if (!dates || !dates.length) return []
  const items = await redis.mget(...dates.map(obsKey))
  return (items || []).filter(Boolean)
}
