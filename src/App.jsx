import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import Home from './pages/Home'
import History from './pages/History'
import BlockDetail from './pages/BlockDetail'
import SessionView from './pages/SessionView'
import SessionOverview from './pages/SessionOverview'
import DrillEntry from './pages/DrillEntry'
import Progress from './pages/Progress'
import Drills from './pages/Drills'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout><Home /></Layout>} />
      <Route path="/history" element={<Layout><History /></Layout>} />
      <Route path="/history/:blockId" element={<Layout><BlockDetail /></Layout>} />
      <Route path="/history/:blockId/sessions/:sessionId" element={<Layout><SessionView /></Layout>} />
      <Route path="/sessions/:sessionId" element={<Layout><SessionOverview /></Layout>} />
      <Route path="/sessions/:sessionId/drill/:drillId" element={<DrillEntry />} />
      <Route path="/progress" element={<Layout><Progress /></Layout>} />
      <Route path="/drills" element={<Layout><Drills /></Layout>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
