import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Analytics from './components/Analytics.jsx'
import Home from './Home.jsx'
import Archive from './components/Archive.jsx'
import ArchiveEntry from './components/ArchiveEntry.jsx'

export default function App() {
  return (
    <BrowserRouter>
      <Analytics />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/archive" element={<Archive />} />
        <Route path="/archive/:date" element={<ArchiveEntry />} />
      </Routes>
    </BrowserRouter>
  )
}
