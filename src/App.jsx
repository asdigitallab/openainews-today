import Masthead from './components/Masthead.jsx'
import StatGrid from './components/StatGrid.jsx'
import Console from './components/Console.jsx'
import Feed from './components/Feed.jsx'
import CommandLine from './components/CommandLine.jsx'
import { useNewsroom } from './hooks/useNewsroom.js'

export default function App() {
  const nr = useNewsroom()
  return (
    <>
      <div className="wrap">
        <Masthead />
        <StatGrid
          agiSecs={nr.agiSecs}
          daysSince={nr.daysSince}
          panic={nr.panic}
          fatigue={nr.fatigue}
          recalcKey={nr.recalcKey}
        />
        <Console lines={nr.lines} />
        <Feed items={nr.feed} />
      </div>
      <CommandLine busy={nr.busy} onCommand={nr.runCommand} />
    </>
  )
}
