import { motion } from 'framer-motion'
import type { Shrimp } from '../data/users'

interface Props {
  shrimps: Shrimp[]
}

const statusConfig = {
  working: { label: '执行中', color: 'bg-brand-green', pulse: true },
  idle: { label: '待命中', color: 'bg-gray-300', pulse: false },
  training: { label: '进修中', color: 'bg-brand-purple', pulse: true },
}

export default function ShrimpTeam({ shrimps }: Props) {
  return (
    <div className="space-y-3">
      {shrimps.map((shrimp, i) => {
        const status = statusConfig[shrimp.status]
        return (
          <motion.div
            key={shrimp.id}
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: i * 0.1 }}
            className="flex items-center gap-3 p-3 bg-white rounded-xl border border-border hover:shadow-card transition-all"
          >
            {/* Avatar */}
            <div className="w-11 h-11 rounded-full bg-brand-green-surface flex items-center justify-center text-2xl relative">
              {shrimp.avatar}
              {/* Status indicator */}
              <span
                className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white ${status.color} ${
                  status.pulse ? 'animate-pulse' : ''
                }`}
              />
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-text-primary">{shrimp.name}</span>
                <span className="text-[11px] text-text-tertiary">Lv.{shrimp.level}</span>
              </div>
              <div className="text-xs text-text-secondary truncate mt-0.5">
                {shrimp.specialty}
              </div>
            </div>

            {/* Status */}
            <div className="text-right">
              <div className={`text-[11px] font-medium ${
                shrimp.status === 'working' ? 'text-brand-green' :
                shrimp.status === 'training' ? 'text-brand-purple' : 'text-text-tertiary'
              }`}>
                {status.label}
              </div>
              <div className="text-[11px] text-text-tertiary mt-0.5">
                {shrimp.skills.length} 个 Skill
              </div>
            </div>
          </motion.div>
        )
      })}
    </div>
  )
}
