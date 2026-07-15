import { Routes, Route, Navigate } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import Layout from './components/Layout'
// import Home from './pages/Home' // 暂时隐藏，见 README
import Tracks from './pages/Tracks'
import Skills from './pages/Skills'
import SkillDetail from './pages/SkillDetail'
import Square from './pages/Square'
import Distill from './pages/Distill'
import Profile from './pages/Profile'
import Creators from './pages/Creators'
import CreatorProfile from './pages/CreatorProfile'
import PublishCreate from './pages/PublishCreate'
import PublishGithub from './pages/PublishGithub'
import SharedChat from './pages/SharedChat'

export default function App() {
  return (
    <Layout>
      <AnimatePresence mode="wait">
        <Routes>
          <Route path="/" element={<Navigate to="/skills" replace />} />
          <Route path="/skills" element={<Skills />} />
          <Route path="/skills/:id" element={<SkillDetail />} />
          <Route path="/square" element={<Square />} />
          <Route path="/tracks" element={<Tracks />} />
          <Route path="/distill" element={<Distill />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/creators" element={<Creators />} />
          <Route path="/creators/:id" element={<CreatorProfile />} />
          <Route path="/publish/create" element={<PublishCreate />} />
          <Route path="/publish/github" element={<PublishGithub />} />
          <Route path="/shared/:id" element={<SharedChat />} />
        </Routes>
      </AnimatePresence>
    </Layout>
  )
}
