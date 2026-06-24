import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { tracks } from '../data/tracks'
import { useUserStore } from '../stores/user'
import { useSkillsStore } from '../stores/skills'

export default function Tracks() {
  const navigate = useNavigate()
  const user = useUserStore((s) => s.user)
  const getSkillsByTrack = useSkillsStore((s) => s.getSkillsByTrack)

  return (
    <div className="p-8 max-w-[1200px] mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-2xl font-bold text-text-primary">职业赛道</h1>
        <p className="text-sm text-text-secondary mt-1">
          选择你的战场，在专业领域持续进化。每个赛道都有系统化的能力图谱。
        </p>
      </motion.div>

      {/* Track Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {tracks.map((track, i) => {
          const isMyTrack = track.id === user.trackId
          const trackSkills = getSkillsByTrack(track.id)

          return (
            <motion.div
              key={track.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: i * 0.08 }}
              className={`relative bg-white rounded-card p-6 border cursor-pointer transition-all duration-200 hover:shadow-card-hover hover:-translate-y-1 ${
                isMyTrack ? 'border-brand-green ring-2 ring-brand-green/10' : 'border-border'
              }`}
              onClick={() => {
                navigate('/skills')
                // trigger filter by track
              }}
            >
              {/* My Track Badge */}
              {isMyTrack && (
                <div className="absolute top-4 right-4">
                  <span className="tag-green">我的赛道</span>
                </div>
              )}

              {/* Icon */}
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl mb-4"
                style={{ backgroundColor: track.bgColor }}
              >
                {track.icon}
              </div>

              {/* Info */}
              <h3 className="text-lg font-bold text-text-primary mb-1">{track.name}</h3>
              <p className="text-sm text-text-secondary mb-4 line-clamp-2">{track.description}</p>

              {/* Sub Domains */}
              <div className="flex flex-wrap gap-1.5 mb-4">
                {track.subDomains.slice(0, 4).map((domain) => (
                  <span
                    key={domain}
                    className="text-[11px] px-2 py-0.5 rounded-full bg-gray-50 text-text-secondary"
                  >
                    {domain}
                  </span>
                ))}
                {track.subDomains.length > 4 && (
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-gray-50 text-text-tertiary">
                    +{track.subDomains.length - 4}
                  </span>
                )}
              </div>

              {/* Stats */}
              <div className="flex items-center justify-between pt-4 border-t border-border">
                <div className="flex items-center gap-4">
                  <div>
                    <div className="text-base font-bold text-text-primary">{trackSkills.length > 0 ? trackSkills.length : track.skillCount}</div>
                    <div className="text-[11px] text-text-tertiary">Skill</div>
                  </div>
                  <div>
                    <div className="text-base font-bold text-text-primary">{track.subDomains.length}</div>
                    <div className="text-[11px] text-text-tertiary">能力域</div>
                  </div>
                </div>

                {/* Top Player */}
                <div className="flex items-center gap-2">
                  <span className="text-lg">{track.topPlayer.avatar}</span>
                  <div className="text-right">
                    <div className="text-xs font-medium text-text-primary">{track.topPlayer.name}</div>
                    <div className="text-[11px] text-text-tertiary">🏆 头号玩家</div>
                  </div>
                </div>
              </div>
            </motion.div>
          )
        })}
      </div>

      {/* Bottom CTA */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="mt-10 text-center"
      >
        <div className="inline-flex items-center gap-3 px-6 py-4 bg-white rounded-2xl border border-border">
          <span className="text-2xl">🔓</span>
          <div className="text-left">
            <div className="text-sm font-medium text-text-primary">更多赛道即将开放</div>
            <div className="text-xs text-text-tertiary">教师 / 律师 / 销售 / 自媒体 / 创业者...</div>
          </div>
          <span className="tag-purple">Coming Soon</span>
        </div>
      </motion.div>
    </div>
  )
}
