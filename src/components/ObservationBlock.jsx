import { Link } from 'react-router-dom'

export default function ObservationBlock({ obs, linkDate = false }) {
  if (!obs) return null
  const dateEl = linkDate ? (
    <Link className="obs-date-link" to={`/archive/${obs.date}`}>{obs.date}</Link>
  ) : (<span>{obs.date}</span>)
  return (
    <div className="obs">
      <div className="obs-head">// machine observation — {dateEl}</div>
      <p className="obs-body">{obs.observation}</p>
      {obs.forecast && obs.forecast.length > 0 && (
        <div className="obs-forecast">
          <div className="obs-forecast-head">// forecast</div>
          {obs.forecast.map((f, i) => (<div className="obs-forecast-line" key={i}>{f}</div>))}
        </div>
      )}
    </div>
  )
}
