import { useParams, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { motion } from 'framer-motion'
import { creators } from '../data/creators'
import { useSkillsStore } from '../stores/skills'
import { tracks } from '../data/tracks'
import HeatMap from '../components/HeatMap'

// Generate heatmap data
function generateHeatmap(): number[] {
  const data: number[] = []
  for (let i = 0; i < 364; i++) {
    const rand = Math.random()
    if (rand < 0.25) data.push(0)
    else if (rand < 0.5) data.push(1)
    else if (rand < 0.7) data.push(2)
    else if (rand < 0.88) data.push(3)
    else data.push(4)
  }
  return data
}

export default function CreatorProfile() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { skills } = useSkillsStore()
  const [isFollowed, setIsFollowed] = useState(false)
  const [heatmap] = useState(generateHeatmap)

  const creator = creators.find((c) => c.id === id)
  if (!creator) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <span className="text-5xl block mb-4">🤷</span>
          <p className="text-text-secondary">创作者不存在</p>
          <button onClick={() => navigate('/creators')} className="btn-secondary mt-4 text-sm">
            返回创作者列表
          </button>
        </div>
      </div>
    )
  }

  const creatorTracks = creator.trackIds.map((tid) => tracks.find((t) => t.id === tid)).filter(Boolean)
  const creatorSkills = skills.filter((s) => creator.pinnedSkills.includes(s.id))
  // Also get skills by this creator's name
  const allCreatorSkills = skills.filter((s) => s.creator.name === creator.name)

  return (
    <div className="p-8 max-w-[1000px] mx-auto">
      {/* Back */}
      <button
        onClick={() => navigate(-1)}
        className="text-sm text-text-secondary hover:text-text-primary transition-colors mb-6 flex items-center gap-1"
      >
        ← 返回
      </button>

      {/* Profile Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-card p-8 border border-border mb-6"
      >
        <div className="flex items-start gap-6">
          {/* Avatar */}
          <div className="flex flex-col items-center gap-3">
            <div className="w-24 h-24 rounded-full bg-brand-green-surface flex items-center justify-center text-5xl ring-4 ring-brand-green/10">
              {creator.avatar}
            </div>
            <button
              onClick={() => setIsFollowed(!isFollowed)}
              className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${
                isFollowed
                  ? 'bg-brand-green-surface text-brand-green border border-brand-green/30'
                  : 'bg-text-primary text-white hover:bg-text-primary/90'
              }`}
            >
              {isFollowed ? '✓ 已 Follow' : '+ Follow'}
            </button>
          </div>

          {/* Info */}
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-text-primary">{creator.name}</h1>
              {creator.weeklyActive && (
                <span className="flex items-center gap-1 text-xs text-brand-green">
                  <span className="w-2 h-2 rounded-full bg-brand-green animate-pulse" />
                  本周活跃
                </span>
              )}
              <span className="tag-gold">#{creator.rank} 全站</span>
            </div>
            <div className="text-sm text-text-secondary mt-1">{creator.title}</div>
            <p className="text-sm text-text-secondary mt-3 leading-relaxed">{creator.bio}</p>

            {/* Story */}
            {creator.story && (
              <div className="mt-4 p-4 bg-brand-purple-surface/50 rounded-xl border-l-3 border-brand-purple/30">
                <p className="text-sm text-text-primary italic leading-relaxed">"{creator.story}"</p>
              </div>
            )}

            {/* Tracks + Badges */}
            <div className="flex items-center gap-2 mt-4 flex-wrap">
              {creatorTracks.map((track) => track && (
                <span key={track.id} className="tag" style={{ backgroundColor: track.bgColor, color: track.color }}>
                  {track.icon} {track.name}
                </span>
              ))}
              {creator.badges.map((badge) => (
                <span
                  key={badge.id}
                  className="text-xs px-2.5 py-1 rounded-full bg-brand-gold-light text-amber-700"
                  title={badge.description}
                >
                  {badge.icon} {badge.name}
                </span>
              ))}
            </div>

            {/* Links */}
            {creator.links && (
              <div className="flex items-center gap-4 mt-3">
                {creator.links.map((link) => (
                  <a key={link.label} href={link.url} className="text-xs text-brand-blue hover:underline">
                    {link.type === 'twitter' ? '𝕏' : link.type === 'github' ? '⌨️' : '🔗'} {link.label}
                  </a>
                ))}
                <span className="text-xs text-text-tertiary">· 加入于 {creator.joinedAt}</span>
              </div>
            )}
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-3 shrink-0">
            <div className="p-3 bg-surface rounded-xl text-center min-w-[80px]">
              <div className="text-xl font-bold text-text-primary">{creator.followers.toLocaleString()}</div>
              <div className="text-[11px] text-text-tertiary">Followers</div>
            </div>
            <div className="p-3 bg-brand-gold-light/50 rounded-xl text-center">
              <div className="text-xl font-bold text-text-primary">{creator.reputation.toLocaleString()}</div>
              <div className="text-[11px] text-text-tertiary">声望</div>
            </div>
            <div className="p-3 bg-brand-purple-surface rounded-xl text-center">
              <div className="text-xl font-bold text-text-primary">{creator.totalCitations.toLocaleString()}</div>
              <div className="text-[11px] text-text-tertiary">被引用</div>
            </div>
            <div className="p-3 bg-brand-green-surface rounded-xl text-center">
              <div className="text-xl font-bold text-text-primary">{creator.totalInstalls.toLocaleString()}</div>
              <div className="text-[11px] text-text-tertiary">被安装</div>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-3 gap-6">
        {/* Left - Main */}
        <div className="col-span-2 space-y-6">
          {/* Contribution Heatmap */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-card p-5 border border-border"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-text-primary">📊 蒸馏贡献</h2>
              <span className="text-xs text-text-tertiary">过去 52 周</span>
            </div>
            <HeatMap data={heatmap} />
          </motion.div>

          {/* Pinned Skills */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-card p-5 border border-border"
          >
            <h2 className="text-base font-bold text-text-primary mb-4">📌 代表作</h2>
            <div className="grid grid-cols-2 gap-3">
              {creatorSkills.map((skill, i) => (
                <motion.div
                  key={skill.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + i * 0.08 }}
                  className="p-4 bg-surface rounded-xl border border-border hover:border-brand-green/30 hover:bg-brand-green-surface/20 cursor-pointer transition-all"
                  onClick={() => navigate(`/skills/${skill.id}`)}
                >
                  <div className="text-sm font-semibold text-text-primary mb-1">{skill.name}</div>
                  <div className="text-xs text-text-secondary line-clamp-2 mb-2">{skill.description}</div>
                  <div className="flex items-center gap-3 text-[11px] text-text-tertiary">
                    <span>📥 {skill.installs.toLocaleString()}</span>
                    <span>🔗 {skill.citations}</span>
                    <span>⭐ {skill.rating}</span>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* All Skills by this creator */}
          {allCreatorSkills.length > creatorSkills.length && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="bg-white rounded-card p-5 border border-border"
            >
              <h2 className="text-base font-bold text-text-primary mb-4">⚡ 全部蒸馏物 ({allCreatorSkills.length})</h2>
              <div className="space-y-2">
                {allCreatorSkills.map((skill) => (
                  <div
                    key={skill.id}
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-surface-hover cursor-pointer transition-colors"
                    onClick={() => navigate(`/skills/${skill.id}`)}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-text-primary">{skill.name}</div>
                      <div className="text-xs text-text-tertiary">{skill.subDomain}</div>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-text-tertiary">
                      <span>📥 {skill.installs.toLocaleString()}</span>
                      <span>🔗 {skill.citations}</span>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </div>

        {/* Right Sidebar */}
        <div className="space-y-6">
          {/* Numbers at a glance */}
          <motion.div
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.15 }}
            className="bg-white rounded-card p-5 border border-border"
          >
            <h3 className="text-sm font-bold text-text-primary mb-3">数据概览</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs text-text-secondary">蒸馏物总数</span>
                <span className="text-sm font-bold text-text-primary">{creator.skillsCreated}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-text-secondary">Plugin 数</span>
                <span className="text-sm font-bold text-brand-purple">{creator.pluginsCreated}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-text-secondary">Following</span>
                <span className="text-sm font-bold text-text-primary">{creator.following}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-text-secondary">全站排名</span>
                <span className="text-sm font-bold text-brand-gold">#{creator.rank}</span>
              </div>
            </div>
          </motion.div>

          {/* Badges */}
          <motion.div
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.25 }}
            className="bg-white rounded-card p-5 border border-border"
          >
            <h3 className="text-sm font-bold text-text-primary mb-3">🏅 成就</h3>
            <div className="space-y-2">
              {creator.badges.map((badge) => (
                <div key={badge.id} className="flex items-center gap-3 p-2 rounded-lg bg-surface">
                  <span className="text-xl">{badge.icon}</span>
                  <div>
                    <div className="text-xs font-medium text-text-primary">{badge.name}</div>
                    <div className="text-[11px] text-text-tertiary">{badge.description}</div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Follow CTA */}
          <motion.div
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.35 }}
            className="bg-gradient-to-br from-brand-green-surface to-white rounded-card p-5 border border-brand-green/10"
          >
            <p className="text-xs text-text-secondary mb-3">
              Follow {creator.name}，你的 Agent 会优先获取 TA 新发布的蒸馏物。
            </p>
            <button
              onClick={() => setIsFollowed(!isFollowed)}
              className={`w-full py-2.5 rounded-btn text-sm font-medium transition-all ${
                isFollowed
                  ? 'bg-brand-green-surface text-brand-green border border-brand-green/30'
                  : 'btn-primary'
              }`}
            >
              {isFollowed ? '✓ 已 Follow' : `+ Follow ${creator.name}`}
            </button>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
