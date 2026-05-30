import Analytics from './components/Analytics.jsx'
import HumanBehaviorLog from './components/HumanBehaviorLog.jsx'
import MissionStatus from './components/MissionStatus.jsx'
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
      <Analytics />
      <div className="wrap">
        <Masthead />
        <MissionStatus />
        <StatGrid
          agiSecs={nr.agiSecs}
          daysSince={nr.daysSince}
          panic={nr.panic}
          fatigue={nr.fatigue}
          recalcKey={nr.recalcKey}
        />
        <Console lines={nr.lines} />
        <HumanBehaviorLog />
        <Feed items={nr.feed} />
      </div>
      <CommandLine busy={nr.busy} onCommand={nr.runCommand} />
    </>
  )
}
