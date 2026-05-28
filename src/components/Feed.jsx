import { bar } from '../lib/util.js'

function SignalItem({ item }) {
  return (
    <div className="item">
      <div className="meta">
        <span className="id">{item.id}</span>
        <span>·</span>
        <span>{item.ts}</span>
        {item.wrapper && <span className="badge">another wrapper?</span>}
        {item.hype >= 85 && <span className="badge crit">peak hype</span>}
      </div>
      <h2>{item.headline}</h2>
      <p>{item.body}</p>
      <div className="hype">
        hype-o-meter: <b>{bar(item.hype, 10)}</b> {item.hype}/100 &nbsp;·&nbsp; will
        anyone use this: <b>{item.use}</b>
      </div>
    </div>
  )
}

export default function Feed({ items }) {
  return (
    <div id="stage">
      <div className="feed-head">
        <span>// incoming signal log</span>
        <span>
          {items.length} record{items.length !== 1 ? 's' : ''}
        </span>
      </div>
      <div id="feed">
        {items.map((it) => (
          <SignalItem key={it.id} item={it} />
        ))}
      </div>
    </div>
  )
}
