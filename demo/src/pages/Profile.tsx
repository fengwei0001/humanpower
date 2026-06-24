import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useUserStore } from '../stores/user'
import { useSkillsStore } from '../stores/skills'
import { tracks } from '../data/tracks'
import HeatMap from '../components/HeatMap'
import ShrimpTeam from '../components/ShrimpTeam'

export default function Profile() {
  const navigate = useNavigate()
  const { user } = useUserStore()
  const { skills } = useSkillsStore()
  const currentTrack = tracks.find((t) => t.id === user.trackId)!

  // Get user's created skills (simulated)
  const mySkills = skills.filter((s) => s.creator.name === user.name).slice(0, 3)

  return (
    <div className="p-8 max-w-[1000px] mx-auto">
      {/* Profile Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-card p-8 border border-border mb-6"
      >
        <div className="flex items-start gap-6">
          {/* Avatar */}
          <div className="w-20 h-20 rounded-full bg-brand-green-surface flex items-center justify-center text-4xl ring-4 ring-brand-green/10">
            {user.avatar}
          </div>

          {/* Info */}
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-text-primary">{user.name}</h1>
              <span className="tag-green">Lv.{user.level}</span>
              <span className="tag-gold">🏆 Top {user.trackRank}</span>
            </div>
            <p className="text-sm text-text-secondary mt-1">{user.title}</p>
            <p className="text-sm text-text-secondary mt-2">{user.bio}</p>

            {/* Track & Tags */}
            <div className="flex items-center gap-2 mt-3">
              <span
                className="tag"
                style={{ backgroundColor: currentTrack.bgColor, color: currentTrack.color }}
              >
                {currentTrack.icon} {currentTrack.name}
              </span>
              <span className="text-xs text-text-tertiary">加入于 {user.joinedAt}</span>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-4 text-center">
            <div className="p-3 bg-brand-gold-light/50 rounded-xl">
              <div className="text-xl font-bold text-text-primary">{user.reputation.toLocaleString()}</div>
              <div className="text-[11px] text-text-tertiary">声望</div>
            </div>
            <div className="p-3 bg-brand-purple-surface rounded-xl">
              <div className="text-xl font-bold text-text-primary">{user.totalCitations.toLocaleString()}</div>
              <div className="text-[11px] text-text-tertiary">被引用</div>
            </div>
            <div className="p-3 bg-brand-green-surface rounded-xl">
              <div className="text-xl font-bold text-text-primary">{user.totalInstalls.toLocaleString()}</div>
              <div className="text-[11px] text-text-tertiary">被安装</div>
            </div>
            <div className="p-3 bg-blue-50 rounded-xl">
              <div className="text-xl font-bold text-text-primary">{user.skillsCreated}</div>
              <div className="text-[11px] text-text-tertiary">创建 Skill</div>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-3 gap-6">
        {/* Left - Main Content */}
        <div className="col-span-2 space-y-6">

          {/* Top Skills */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-card p-5 border border-border"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="section-title">⭐ 代表作</h2>
              <button className="text-xs text-brand-green hover:underline">查看全部 →</button>
            </div>
            <div className="space-y-3">
              {(mySkills.length > 0 ? mySkills : skills.slice(0, 3)).map((skill, i) => (
                <motion.div
                  key={skill.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + i * 0.1 }}
                  className="flex items-center gap-4 p-4 bg-surface rounded-xl border border-border hover:bg-surface-hover cursor-pointer transition-all"
                  onClick={() => navigate(`/skills/${skill.id}`)}
                >
                  <div className="w-10 h-10 rounded-xl bg-brand-purple-surface flex items-center justify-center text-lg">
                    ⚡
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-text-primary">{skill.name}</div>
                    <div className="text-xs text-text-secondary mt-0.5 truncate">{skill.description}</div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-sm font-bold text-text-primary">{skill.citations}</div>
                    <div className="text-[11px] text-text-tertiary">引用</div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Milestones */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-card p-5 border border-border"
          >
            <h2 className="section-title mb-4">🏅 成长里程碑</h2>
            <div className="relative">
              {/* Timeline line */}
              <div className="absolute left-[7px] top-2 bottom-2 w-[2px] bg-brand-green/20" />

              <div className="space-y-4">
                {user.milestones.map((milestone, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 + i * 0.1 }}
                    className="flex items-start gap-4 relative"
                  >
                    <div className="w-4 h-4 rounded-full bg-brand-green border-4 border-brand-green-surface shrink-0 mt-0.5 z-10" />
                    <div className="flex-1 pb-4">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-text-tertiary font-mono">{milestone.date}</span>
                      </div>
                      <div className="text-sm font-semibold text-text-primary mt-0.5">
                        {milestone.title}
                      </div>
                      <div className="text-xs text-text-secondary mt-0.5">
                        {milestone.description}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>

        {/* Right - Sidebar */}
        <div className="space-y-6">
          {/* Shrimp Team */}
          <motion.div
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.15 }}
            className="bg-white rounded-card p-5 border border-border"
          >
            <h2 className="section-title mb-4">🦐 我的虾兵蟹将</h2>
            <ShrimpTeam shrimps={user.shrimps} />
          </motion.div>


          {/* Quick Actions */}
          <motion.div
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.35 }}
            className="bg-white rounded-card p-5 border border-border"
          >
            <button
              onClick={() => navigate('/distill')}
              className="w-full btn-purple flex items-center justify-center gap-2 text-sm mb-2"
            >
              ⚗️ 蒸馏新 Skill
            </button>
            <button
              onClick={() => navigate('/skills')}
              className="w-full btn-secondary flex items-center justify-center gap-2 text-sm"
            >
              ⚡ 逛技能广场
            </button>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
