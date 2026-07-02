import { Routes, Route, Navigate } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import Layout from './components/Layout'
// import Home from './pages/Home' // 暂时隐藏，见 README
import Tracks from './pages/Tracks'
import Skills from './pages/Skills'
import SkillDetail from './pages/SkillDetail'
import Distill from './pages/Distill'
import Profile from './pages/Profile'
import Creators from './pages/Creators'
import CreatorProfile from './pages/CreatorProfile'

// 技能广场占位页（待填充）
function SquarePlaceholder() {
  return (
    <div className="flex items-center justify-center h-full">
      <div className="text-center">
        <span className="text-5xl block mb-4">🛒</span>
        <h2 className="text-xl font-bold text-text-primary mb-2">技能广场</h2>
        <p className="text-sm text-text-secondary">即将上线，敬请期待</p>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <Layout>
      <AnimatePresence mode="wait">
        <Routes>
          <Route path="/" element={<Navigate to="/skills" replace />} />
          <Route path="/skills" element={<Skills />} />
          <Route path="/skills/:id" element={<SkillDetail />} />
          <Route path="/square" element={<SquarePlaceholder />} />
          <Route path="/tracks" element={<Tracks />} />
          <Route path="/distill" element={<Distill />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/creators" element={<Creators />} />
          <Route path="/creators/:id" element={<CreatorProfile />} />
        </Routes>
      </AnimatePresence>
    </Layout>
  )
}
