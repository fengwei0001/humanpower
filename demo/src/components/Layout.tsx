import { NavLink, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useUserStore } from '../stores/user'

const navItems = [
  { path: '/', label: '首页', icon: '🏠' },
  { path: '/skills', label: '技能广场', icon: '🛒' },
  { path: '/creators', label: '创作者', icon: '👥' },
  { path: '/distill', label: '蒸馏', icon: '⚗️' },
  { path: '/profile', label: '我的', icon: '👤' },
]

export default function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation()
  const user = useUserStore((s) => s.user)

  return (
    <div className="flex h-screen overflow-hidden bg-[#E8F8D7]">
      {/* Sidebar — meyo style */}
      <aside className="w-20 hover:w-48 transition-all duration-300 flex flex-col items-center py-5 px-2.5 shrink-0 group/sidebar">
        {/* Logo */}
        <div className="mb-6 flex items-center overflow-hidden px-1">
          <div className="w-8 h-8 rounded-lg bg-brand-green flex items-center justify-center text-base shrink-0">
            🌿
          </div>
          <span className="ml-2 text-sm font-bold text-text-primary opacity-0 group-hover/sidebar:opacity-100 transition-opacity whitespace-nowrap">觅游</span>
        </div>

        {/* Navigation — pill style */}
        <nav className="flex-1 flex flex-col items-center w-full">
          <div className="bg-white/80 backdrop-blur-sm border border-white rounded-[32px] p-1.5 shadow-card w-full space-y-1">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center h-12 px-3 rounded-full transition-all duration-150 ${
                    isActive
                      ? 'bg-brand-green-surface border-2 border-brand-green-light text-brand-green'
                      : 'border-2 border-transparent text-text-secondary hover:bg-brand-green-surface/50'
                  }`
                }
              >
                <span className="text-xl shrink-0">{item.icon}</span>
                <span className="ml-2.5 text-sm font-medium overflow-hidden max-w-0 group-hover/sidebar:max-w-[5rem] opacity-0 group-hover/sidebar:opacity-100 transition-all duration-300 whitespace-nowrap">
                  {item.label}
                </span>
              </NavLink>
            ))}
          </div>
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
