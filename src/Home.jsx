import Masthead from './components/Masthead.jsx'
import MissionStatus from './components/MissionStatus.jsx'
import DailyObservation from './components/DailyObservation.jsx'
import StatGrid from './components/StatGrid.jsx'
import Console from './components/Console.jsx'
import HumanBehaviorLog from './components/HumanBehaviorLog.jsx'
import Feed from './components/Feed.jsx'
import CommandLine from './components/CommandLine.jsx'
import { useNewsroom } from './hooks/useNewsroom.js'

export default function Home() {
  const nr = useNewsroom()
  return (
    <>
      <div className="wrap">
        <Masthead />
        <MissionStatus />
        <DailyObservation />
        <StatGrid agiSecs={nr.agiSecs} daysSince={nr.daysSince} panic={nr.panic} fatigue={nr.fatigue} recalcKey={nr.recalcKey} />
        <Console lines={nr.lines} />
        <HumanBehaviorLog />
        <Feed items={nr.feed} />
      </div>
      <CommandLine busy={nr.busy} onCommand={nr.runCommand} />
    </>
  )
}
