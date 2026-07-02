import { NavLink, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useUserStore } from '../stores/user'

const navItems = [
  { path: '/', label: '日报', icon: '📋', desc: 'Agent 今天帮你做了什么' },
  { path: '/skills', label: '广场', icon: '🔍', desc: '发现技能' },
  { path: '/creators', label: '创作者', icon: '👥', desc: 'Follow 牛人' },
  { path: '/distill', label: '蒸馏', icon: '⚗️', desc: '主动蒸馏经验' },
  { path: '/profile', label: '我的', icon: '👤', desc: '个人主页' },
]

export default function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation()
  const user = useUserStore((s) => s.user)

  return (
    <div className="flex h-screen overflow-hidden bg-surface">
      {/* Sidebar */}
      <aside className="w-[240px] bg-white border-r border-border flex flex-col shrink-0">
        {/* Logo */}
        <div className="px-5 py-5 border-b border-border">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-brand-green flex items-center justify-center text-lg">
              ⚗️
            </div>
            <div>
              <h1 className="text-base font-bold text-text-primary leading-tight">觅游</h1>
              <p className="text-[11px] text-text-tertiary">来觅游，用方法解决问题</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-150 group ${
                  isActive
                    ? 'bg-brand-green-surface text-brand-green font-medium'
                    : 'text-text-secondary hover:bg-surface-hover hover:text-text-primary'
                }`
              }
            >
              <span className="text-lg">{item.icon}</span>
              <div className="flex-1 min-w-0">
                <div className="text-sm leading-tight">{item.label}</div>
                <div className="text-[11px] text-text-tertiary group-hover:text-text-secondary truncate">
                  {item.desc}
                </div>
              </div>
            </NavLink>
          ))}
        </nav>

        {/* User Card */}
        <div className="p-4 border-t border-border">
          <NavLink to="/profile" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-full bg-brand-green-surface flex items-center justify-center text-xl">
              {user.avatar}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-text-primary truncate">{user.name}</div>
              <div className="text-[11px] text-text-tertiary">
                Lv.{user.level} · 声望 {user.reputation.toLocaleString()}
              </div>
            </div>
          </NavLink>
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
