import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { fetchObservations } from '../lib/api.js'
import seed from '../data/observation-seed.json'
import ObservationBlock from './ObservationBlock.jsx'

export default function Archive() {
  const [items, setItems] = useState(null)
  useEffect(() => { fetchObservations().then((list) => setItems(list.length ? list : [seed])) }, [])
  return (
    <div className="wrap archive-page">
      <div className="mast">
        <span className="corner c-tl" /><span className="corner c-tr" />
        <span className="corner c-bl" /><span className="corner c-br" />
        <div className="logo">OPENAINEWS<span className="dot">.</span>today</div>
        <div className="tag">// long-term memory — the machine&apos;s daily record</div>
      </div>
      <div className="archive-nav">
        <Link to="/">← back to newsroom</Link>
        <span>{items ? items.length : 0} observations on record</span>
      </div>
      {items === null
        ? (<div className="archive-loading">retrieving memory ...</div>)
        : items.map((obs) => <ObservationBlock key={obs.date} obs={obs} linkDate />)}
    </div>
  )
}
