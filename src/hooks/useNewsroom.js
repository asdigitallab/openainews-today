import { useCallback, useEffect, useRef, useState } from 'react'
import { SEED } from '../data/seed.js'
import { fetchFeed, ingestOne } from '../lib/api.js'
import { nowHM, sigId } from '../lib/util.js'

const BOOT_LINES = [
  ['> initializing newsroom kernel v2.6.1 ... ', 'ok'],
  ['> mounting /dev/hype ... ', 'ok'],
  ['> calibrating cynicism ... ', 'ok'],
  ['> attempting to locate AGI ...', 'warn'],
  ['  > AGI not found. estimating arrival instead.', 'warn'],
  ['> loading human behavior model ... ', 'ok'],
  ['  > observation: subjects appear excited and exhausted simultaneously', ''],
  ['> syncing with upstream feeds ... ', 'ok'],
]

const RESP = {
  whoami: '> you are a human refreshing an AI news site. logged without judgment.',
  help: '> ingest · agi · panic · calm · whoami · clear · help\n> ingest pulls the next real headline. the rest is for fun.',
}

let lineSeq = 0
function makeLine(text, cls = '', inline = false) {
  return { key: 'L' + lineSeq++, text, cls, inline }
}

// Wrap a raw signal (e.g. from the offline bank) into a renderable item.
// Items that already have an id (from the backend) are used as-is.
function makeItem(s) {
  if (s && s.id) return s
  return {
    id: sigId(),
    ts: nowHM(),
    use: Math.random() < 0.5 ? 'inconclusive' : 'probably not',
    ...s,
  }
}

export function useNewsroom() {
  const [lines, setLines] = useState([])
  const [feed, setFeed] = useState([])
  const [agiSecs, setAgiSecs] = useState(() => 86400 * Math.floor(40 + Math.random() * 900))
  const [daysSince, setDaysSince] = useState(0)
  const [panic, setPanic] = useState(34)
  const [fatigue, setFatigue] = useState(6)
  const [busy, setBusy] = useState(false)
  const [recalcKey, setRecalcKey] = useState(0)

  const busyRef = useRef(false)
  busyRef.current = busy
  const booted = useRef(false)

  const log = useCallback((text, cls = '', inline = false) => {
    setLines((prev) => {
      const next = [...prev, makeLine(text, cls, inline)]
      return next.length > 60 ? next.slice(next.length - 60) : next
    })
  }, [])

  const recalcAGI = useCallback((loud) => {
    setAgiSecs(86400 * Math.floor(20 + Math.random() * 1200))
    setRecalcKey((k) => k + 1)
    if (loud) log('> AGI estimate recalculated. humanity unmoved.')
  }, [log])

  const publish = useCallback((s) => {
    setFeed((prev) => [makeItem(s), ...prev])
    const delta = parseInt(String(s.panic || '+1').replace(/[^\-0-9]/g, ''), 10) || 1
    setPanic((p) => p + delta)
    setFatigue((f) => f + 1)
    if (Math.random() < 0.6) recalcAGI(false)
  }, [recalcAGI])

  const ingest = useCallback(async () => {
    if (busyRef.current) return
    setBusy(true)
    const sid = String(400 + Math.floor(Math.random() * 599))
    log('> ingesting signal_' + sid + ' ...')
    await new Promise((r) => setTimeout(r, 220))
    log('  > pulling upstream headlines ... corporate optimism detected')
    const { item, mode } = await ingestOne()
    if (mode === 'live') log('  > real headline rewritten. publishing.', 'ok')
    else if (mode === 'quiet') log('  > nothing new upstream. drawing from archive.', 'warn')
    else log('  > live link unavailable. drawing from local archive.', 'warn')
    publish(item)
    setBusy(false)
  }, [log, publish])

  const runCommand = useCallback(
    (raw) => {
      const v = raw.trim().toLowerCase()
      if (!v) return
      log('newsroom@today:~$ ' + v, 'you')
      if (v === 'ingest' || v === 'i') ingest()
      else if (v === 'agi') { recalcAGI(false); log('> recalculated on request. note: this changes nothing.') }
      else if (v === 'panic') { setPanic((p) => p + 12); setFatigue((f) => f + 1); log('> panic increased on request. a strange ask, but recorded.') }
      else if (v === 'calm') { setPanic((p) => p - 15); log('> panic reduced. the underlying situation is unchanged.') }
      else if (v === 'clear') { setFeed([]); log('> feed cleared. the news will return. it always does.') }
      else if (RESP[v]) log(RESP[v])
      else log("> unknown command: '" + v + "'. the machine does not understand, but is used to that.")
    },
    [ingest, recalcAGI, log],
  )

  // boot sequence — runs exactly once (ref guard survives StrictMode double-mount)
  useEffect(() => {
    if (booted.current) return
    booted.current = true
    let i = 0
    const loadFeed = async () => {
      const items = await fetchFeed()
      if (items.length) {
        setFeed(items)
        log('  > ' + items.length + ' signal' + (items.length !== 1 ? 's' : '') + ' on record.', 'ok')
      } else {
        log('  > upstream quiet. loading seed archive.', 'warn')
        SEED.forEach((s, idx) =>
          setTimeout(() => setFeed((prev) => [...prev, makeItem(s)]), idx * 180),
        )
      }
    }
    const step = () => {
      if (i >= BOOT_LINES.length) { loadFeed(); return }
      const [text, cls] = BOOT_LINES[i++]
      if (cls === 'ok') {
        log(text)
        setTimeout(() => { log('[ OK ]', 'ok', true); step() }, 120)
      } else {
        log(text, cls)
        setTimeout(step, 120 + Math.random() * 110)
      }
    }
    step()
  }, [log])

  // AGI countdown (1s)
  useEffect(() => {
    const id = setInterval(() => setAgiSecs((s) => Math.max(1, s - 1)), 1000)
    return () => clearInterval(id)
  }, [])

  // panic/fatigue drift + "AGI is near" counter (5s)
  useEffect(() => {
    const id = setInterval(() => {
      setDaysSince((d) => {
        const next = Math.random() < 0.5 ? d + 1 : d
        if (next > 7) { log('> someone declared "AGI is near" again. counter reset.'); return 0 }
        return next
      })
    }, 5000)
    return () => clearInterval(id)
  }, [log])

  // spontaneous AGI recalc — flickers often, logs rarely (never floods)
  useEffect(() => {
    const id = setInterval(() => {
      if (!busyRef.current && Math.random() < 0.5) recalcAGI(Math.random() < 0.15)
    }, 11000)
    return () => clearInterval(id)
  }, [recalcAGI])

  return { lines, feed, agiSecs, daysSince, panic, fatigue, busy, recalcKey, ingest, runCommand }
}
