import { Routes, Route } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import Layout from './components/Layout'
import Home from './pages/Home'
import Tracks from './pages/Tracks'
import Skills from './pages/Skills'
import SkillDetail from './pages/SkillDetail'
import Distill from './pages/Distill'
import Profile from './pages/Profile'
import Creators from './pages/Creators'
import CreatorProfile from './pages/CreatorProfile'

export default function App() {
  return (
    <Layout>
      <AnimatePresence mode="wait">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/tracks" element={<Tracks />} />
          <Route path="/skills" element={<Skills />} />
          <Route path="/skills/:id" element={<SkillDetail />} />
          <Route path="/distill" element={<Distill />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/creators" element={<Creators />} />
          <Route path="/creators/:id" element={<CreatorProfile />} />
        </Routes>
      </AnimatePresence>
    </Layout>
  )
}
