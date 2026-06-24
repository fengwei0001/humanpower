import { useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { creators } from '../data/creators'
import { tracks } from '../data/tracks'
import { useSkillsStore } from '../stores/skills'

// Feed data — linked to real skills in the data store
const feedItems = [
  { id: 'f1', creatorId: 'creator-zara', skillId: 'pm-slides', time: '2 小时前', note: '更新了演示模板库，新增 5 套暗色系风格' },
  { id: 'f2', creatorId: 'creator-zephyr', skillId: 'pm-prd-writer', time: '5 小时前', note: '优化了异常处理的自动补全，现在能识别更多边界情况' },
  { id: 'f3', creatorId: 'creator-jesse', skillId: 'eng-superpowers', time: '昨天', note: '新增并行子 Agent 调度，大任务拆解速度提升 3x' },
  { id: 'f4', creatorId: 'creator-dean', skillId: 'pm-ost', time: '昨天', note: '补充了「如何判断机会是否值得投入」的评估框架' },
  { id: 'f5', creatorId: 'creator-corey', skillId: 'ops-ab-testing', time: '2 天前', note: '增加了多变量实验的样本量速查表' },
  { id: 'f6', creatorId: 'creator-matt', skillId: 'eng-debugging', time: '3 天前', note: '新增「并发 Bug 诊断」专项路径，适合多线程场景' },
  { id: 'f7', creatorId: 'creator-zara', skillId: 'ops-lark-minutes', time: '3 天前', note: '支持识别会议中的隐含承诺（不只是显式 TODO）' },
  { id: 'f8', creatorId: 'creator-zephyr', skillId: 'pm-review-board', time: '4 天前', note: '法务角色审查能力增强，现在能检测 GDPR 合规问题' },
]

export default function Creators() {
  const navigate = useNavigate()
  const { skills } = useSkillsStore()
  const [followedIds, setFollowedIds] = useState<string[]>(['creator-zephyr', 'creator-zara', 'creator-jesse'])
  const [filterTrack, setFilterTrack] = useState<string | null>(null)

  const toggleFollow = (id: string) => {
    setFollowedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )
  }

  const filteredCreators = filterTrack
    ? creators.filter((c) => c.trackIds.includes(filterTrack))
    : creators

  return (
    <div className="p-8 max-w-[1100px] mx-auto">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <h1 className="text-2xl font-bold text-text-primary">创作者</h1>
        <p className="text-sm text-text-secondary mt-1">
          关注的创作者有新动态时，你的 Agent 会第一时间学到他们的新方法论。
        </p>
      </motion.div>

      <div className="flex gap-6">
        {/* Left: Feed */}
        <div className="flex-1 min-w-0">
          <h2 className="text-base font-bold text-text-primary mb-4">📢 关注动态</h2>
          <div className="space-y-4">
            {feedItems.map((item, i) => {
              const creator = creators.find(c => c.id === item.creatorId)
              const skill = skills.find(s => s.id === item.skillId)
              if (!creator || !skill) return null
              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06 }}
                  className="bg-white rounded-card p-5 border border-border hover:shadow-card transition-all"
                >
                  {/* Creator header */}
                  <div className="flex items-center gap-3 mb-3">
                    <div
                      className="w-9 h-9 rounded-full bg-brand-green-surface flex items-center justify-center text-lg cursor-pointer"
                      onClick={() => navigate(`/creators/${creator.id}`)}
                    >
                      {creator.avatar}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span
                          className="text-sm font-semibold text-text-primary hover:text-brand-green cursor-pointer transition-colors"
                          onClick={() => navigate(`/creators/${creator.id}`)}
                        >
                          {creator.name}
                        </span>
                        <span className="text-[11px] text-text-tertiary">更新了蒸馏物</span>
                      </div>
                      <div className="text-[11px] text-text-tertiary">{item.time}</div>
                    </div>
                  </div>

                  {/* Content — links to real skill */}
                  <div className="ml-12">
                    <div
                      className="flex items-center gap-2 mb-1 cursor-pointer group"
                      onClick={() => navigate(`/skills/${skill.id}`)}
                    >
                      <span className="text-sm">⚡</span>
                      <h3 className="text-[15px] font-semibold text-text-primary group-hover:text-brand-green transition-colors">{skill.name}</h3>
                    </div>
                    <p className="text-sm text-text-secondary leading-relaxed mb-2">{item.note}</p>
                    <p className="text-xs text-text-tertiary mb-3 line-clamp-1">{skill.description}</p>
                    <div className="flex items-center gap-4">
                      <span className="text-xs text-text-tertiary">📥 {skill.installs.toLocaleString()} · 🔗 {skill.citations} · ⭐ {skill.rating}</span>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </div>

        {/* Right Sidebar: Creator Recommendations */}
        <div className="w-[300px] shrink-0">
          <div className="sticky top-8 space-y-5">
            {/* Filter */}
            <div className="flex flex-wrap gap-1.5">
              <button
                onClick={() => setFilterTrack(null)}
                className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-all ${
                  !filterTrack ? 'bg-text-primary text-white' : 'bg-white border border-border text-text-secondary'
                }`}
              >
                全部
              </button>
              {tracks.map((track) => (
                <button
                  key={track.id}
                  onClick={() => setFilterTrack(track.id === filterTrack ? null : track.id)}
                  className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-all ${
                    filterTrack === track.id ? 'text-white' : 'bg-white border border-border text-text-secondary'
                  }`}
                  style={filterTrack === track.id ? { backgroundColor: track.color } : undefined}
                >
                  {track.icon} {track.name}
                </button>
              ))}
            </div>

            {/* Creator List */}
            <div className="bg-white rounded-card border border-border overflow-hidden">
              <div className="px-4 py-3 border-b border-border">
                <h3 className="text-sm font-bold text-text-primary">推荐关注</h3>
              </div>
              <div className="divide-y divide-border">
                {filteredCreators.map((creator) => {
                  const isFollowed = followedIds.includes(creator.id)
                  return (
                    <div key={creator.id} className="px-4 py-3 hover:bg-surface-hover transition-colors">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 rounded-full bg-brand-green-surface flex items-center justify-center text-xl cursor-pointer"
                          onClick={() => navigate(`/creators/${creator.id}`)}
                        >
                          {creator.avatar}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div
                            className="text-sm font-medium text-text-primary truncate hover:text-brand-green cursor-pointer transition-colors"
                            onClick={() => navigate(`/creators/${creator.id}`)}
                          >
                            {creator.name}
                          </div>
                          <div className="text-[11px] text-text-tertiary truncate">{creator.title}</div>
                        </div>
                        <button
                          onClick={() => toggleFollow(creator.id)}
                          className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-all shrink-0 ${
                            isFollowed
                              ? 'bg-brand-green-surface text-brand-green'
                              : 'bg-text-primary text-white hover:bg-text-primary/90'
                          }`}
                        >
                          {isFollowed ? '✓' : '+'}
                        </button>
                      </div>
                      <div className="ml-[52px] mt-1 flex items-center gap-3 text-[11px] text-text-tertiary">
                        <span>{creator.followers.toLocaleString()} followers</span>
                        <span>{creator.skillsCreated} 蒸馏物</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
