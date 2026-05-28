import { useEffect, useState } from 'react'
import { bar } from '../lib/util.js'

function fmtAGI(s) {
  const d = Math.floor(s / 86400)
  const h = Math.floor((s % 86400) / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  const pad = (n) => String(n).padStart(2, '0')
  return d > 0
    ? `T-${d}d ${pad(h)}h ${pad(m)}m`
    : `T-${pad(h)}:${pad(m)}:${pad(sec)}`
}

export default function StatGrid({ agiSecs, daysSince, panic, fatigue, recalcKey }) {
  const [flash, setFlash] = useState(false)

  useEffect(() => {
    if (recalcKey === 0) return
    setFlash(true)
    const t = setTimeout(() => setFlash(false), 500)
    return () => clearTimeout(t)
  }, [recalcKey])

  const p = Math.max(2, Math.min(99, panic))
  const f = Math.max(0, Math.min(10, fatigue))
  const panicCls = p > 70 ? ' alert' : p > 45 ? ' amber' : ''
  const fatCls = f >= 8 ? ' alert' : f >= 5 ? ' amber' : ''

  return (
    <div className="grid">
      <div className="stat">
        <div className="k">AGI // est. arrival</div>
        <div className={'v amber' + (flash ? ' recalc' : '')}>{fmtAGI(agiSecs)}</div>
      </div>
      <div className="stat">
        <div className="k">days since &quot;AGI is near&quot;</div>
        <div className="v">{daysSince}</div>
      </div>
      <div className="stat">
        <div className="k">human panic index</div>
        <div className={'v' + panicCls}>{p}%</div>
        <div className="bar">[{bar(p, 12)}]</div>
      </div>
      <div className="stat">
        <div className="k">model release fatigue</div>
        <div className={'v' + fatCls}>{f >= 9 ? 'TERMINAL' : f + '/10'}</div>
        <div className="bar">[{bar(f * 10, 12)}]</div>
      </div>
    </div>
  )
}
