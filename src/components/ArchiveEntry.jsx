import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { fetchObservation } from '../lib/api.js'
import seed from '../data/observation-seed.json'
import ObservationBlock from './ObservationBlock.jsx'

export default function ArchiveEntry() {
  const { date } = useParams()
  const [state, setState] = useState({ loading: true, obs: null })
  useEffect(() => {
    let alive = true
    fetchObservation(date).then((obs) => {
      if (!alive) return
      const fallback = !obs && seed.date === date ? seed : obs
      setState({ loading: false, obs: fallback })
    })
    return () => { alive = false }
  }, [date])
  return (
    <div className="wrap archive-page">
      <div className="mast">
        <span className="corner c-tl" /><span className="corner c-tr" />
        <span className="corner c-bl" /><span className="corner c-br" />
        <div className="logo">OPENAINEWS<span className="dot">.</span>today</div>
        <div className="tag">// archived observation</div>
      </div>
      <div className="archive-nav">
        <Link to="/archive">← all observations</Link>
        <Link to="/">newsroom →</Link>
      </div>
      {state.loading
        ? (<div className="archive-loading">retrieving memory ...</div>)
        : state.obs
        ? (<ObservationBlock obs={state.obs} />)
        : (<div className="archive-loading">No observation on record for {date}. The machine may not have been watching that day.</div>)}
    </div>
  )
}
