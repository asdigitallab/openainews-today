import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { fetchObservations } from '../lib/api.js'
import seed from '../data/observation-seed.json'
import ObservationBlock from './ObservationBlock.jsx'

export default function DailyObservation() {
  const [obs, setObs] = useState(seed)
  useEffect(() => {
    let alive = true
    fetchObservations().then((items) => { if (alive && items.length) setObs(items[0]) })
    return () => { alive = false }
  }, [])
  return (
    <div className="daily">
      <ObservationBlock obs={obs} linkDate />
      <Link className="archive-link" to="/archive">// view all observations →</Link>
    </div>
  )
}
