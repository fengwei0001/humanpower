import { useState } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useUserStore } from '../stores/user'

const navItems = [
  { path: '/skills', label: '首页', icon: '🏠' },
  { path: '/square', label: '技能广场', icon: '🛒' },
  { path: '/creators', label: '创作者', icon: '👥' },
  { path: '/distill', label: '蒸馏', icon: '⚗️' },
  { path: '/profile', label: '我的', icon: '👤' },
]

export default function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation()
  const navigate = useNavigate()
  const user = useUserStore((s) => s.user)
  const [showPublishMenu, setShowPublishMenu] = useState(false)

  return (
    <div className="flex h-screen overflow-hidden bg-[#E8F8D7]">
      {/* Sidebar — meyo pill style */}
      <aside className="w-20 hover:w-48 transition-all duration-300 flex flex-col py-5 shrink-0 group/sidebar">
        {/* Logo — centered, aligned with nav icons */}
        <div className="mb-6 flex items-center justify-center px-4">
          <img src="/meyoicon.svg" alt="Meyo" className="w-9 h-9 shrink-0" />
          <span className="ml-2 text-sm font-bold text-text-primary max-w-0 group-hover/sidebar:max-w-[4rem] overflow-hidden opacity-0 group-hover/sidebar:opacity-100 transition-all duration-300 whitespace-nowrap">觅游</span>
        </div>

        {/* Navigation — pill, vertically centered */}
        <nav className="flex-1 flex items-center px-2.5">
          <div className="bg-white/80 backdrop-blur-sm border border-white rounded-[32px] p-1.5 shadow-card w-full space-y-1">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center h-12 px-3 rounded-full transition-all duration-150 ${
                    isActive
                      ? 'bg-brand-green-surface border-2 border-brand-green-light text-brand-green'
                      : 'border-2 border-transparent text-text-primary hover:bg-brand-green-surface/50'
                  }`
                }
              >
                <span className="text-2xl shrink-0">{item.icon}</span>
                <span className="ml-2.5 text-sm font-medium text-text-primary overflow-hidden max-w-0 group-hover/sidebar:max-w-[5rem] opacity-0 group-hover/sidebar:opacity-100 transition-all duration-300 whitespace-nowrap">
                  {item.label}
                </span>
              </NavLink>
            ))}
          </div>
        </nav>

        {/* Publish skill — bottom entry with popup menu */}
        <div className="relative flex items-center justify-center px-4 mt-4">
          <button
            onClick={() => setShowPublishMenu(!showPublishMenu)}
            className="w-11 h-11 rounded-full bg-brand-green flex items-center justify-center text-xl shadow-btn hover:bg-brand-green-dark transition-all hover:scale-105 shrink-0"
            title="发布技能"
          >
            <span className="text-white text-lg font-bold">＋</span>
          </button>
          <span className="ml-2.5 text-sm font-medium text-brand-green overflow-hidden max-w-0 group-hover/sidebar:max-w-[5rem] opacity-0 group-hover/sidebar:opacity-100 transition-all duration-300 whitespace-nowrap">
            发布技能
          </span>
          {showPublishMenu && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowPublishMenu(false)} />
              <div className="absolute left-14 bottom-0 z-50 w-52 bg-white rounded-xl border border-border shadow-lg py-2">
                <button
                  onClick={() => { setShowPublishMenu(false); navigate('/publish/create') }}
                  className="w-full text-left px-4 py-3 hover:bg-surface-hover transition-colors flex items-center gap-3"
                >
                  <span className="text-lg">📝</span>
                  <div>
                    <div className="text-sm font-medium text-text-primary">手动创建</div>
                    <div className="text-[11px] text-text-tertiary">填写表单发布技能</div>
                  </div>
                </button>
                <button
                  onClick={() => { setShowPublishMenu(false); navigate('/publish/github') }}
                  className="w-full text-left px-4 py-3 hover:bg-surface-hover transition-colors flex items-center gap-3"
                >
                  <span className="text-lg">🐙</span>
                  <div>
                    <div className="text-sm font-medium text-text-primary">GitHub 导入</div>
                    <div className="text-[11px] text-text-tertiary">从仓库导入 SKILL.md</div>
                  </div>
                </button>
                <button
                  onClick={() => { setShowPublishMenu(false); navigate('/distill') }}
                  className="w-full text-left px-4 py-3 hover:bg-surface-hover transition-colors flex items-center gap-3"
                >
                  <span className="text-lg">⚗️</span>
                  <div>
                    <div className="text-sm font-medium text-text-primary">自动蒸馏</div>
                    <div className="text-[11px] text-text-tertiary">从对话记录提取方法论</div>
                  </div>
                </button>
              </div>
            </>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <motion.div
          key={location.pathname}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="h-full"
        >
          {children}
        </motion.div>
      </main>
    </div>
  )
}
