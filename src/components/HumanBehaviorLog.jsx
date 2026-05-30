import trends from '../data/trends.json'

function fmtPct(delta) {
  const arrow = delta >= 0 ? '↑' : '↓'
  return arrow + Math.abs(delta).toLocaleString() + '%'
}

export default function HumanBehaviorLog() {
  const entries = trends.entries || []
  if (!entries.length) return null
  return (
    <div className="hbl">
      <div className="hbl-head">
        <span>// human behavior log</span>
        <span>google trends · {trends.updated}</span>
      </div>
      {entries.map((e, i) => (
        <div className="hbl-row" key={i}>
          <div className="hbl-q">
            <span className="q">&quot;{e.query}&quot;</span>{' '}
            <span className={'pct' + (e.delta >= 1000 ? ' hot' : '')}>
              {fmtPct(e.delta)}
            </span>
          </div>
          <div className="hbl-note">{e.note}</div>
        </div>
      ))}
      {trends.note && <div className="hbl-foot">{trends.note}</div>}
    </div>
  )
}
