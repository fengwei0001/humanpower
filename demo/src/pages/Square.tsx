import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { tracks } from '../data/tracks'
import { useSkillsStore } from '../stores/skills'
import type { Skill } from '../data/skills'

// 模拟"本周新上线"的方法
function getNewMethods(skills: Skill[]): Skill[] {
  return [...skills].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 3)
}

// 模拟"有人分享了新方法"动态
const socialUpdates = [
  { user: 'Zephyr Wang', avatar: '🧑‍💼', action: '分享了一个新方法', skill: '30 分钟搞定 PRD', time: '2小时前' },
  { user: 'Jesse Vincent', avatar: '👨‍💻', action: '更新了技能', skill: '让 AI 帮你写出生产级代码', time: '5小时前' },
  { user: 'Zara Zhang', avatar: '👩‍💼', action: '分享了一个新方法', skill: '做一份惊艳的演示', time: '昨天' },
]

export default function Square() {
  const navigate = useNavigate()
  const { skills, loadSkills, getFilteredSkills } = useSkillsStore()
  const [activeTrack, setActiveTrack] = useState<string>(tracks[0].id)

  useEffect(() => {
    loadSkills()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const allSkills = getFilteredSkills()
  const trackSkills = allSkills.filter(s => s.trackIds?.includes(activeTrack) || s.trackId === activeTrack)
  const hotSkills = [...trackSkills].sort((a, b) => b.installs - a.installs).slice(0, 5)
  const newMethods = getNewMethods(allSkills)
  const activeTrackData = tracks.find(t => t.id === activeTrack)

  return (
    <div className="px-8 py-8 max-w-[900px] mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-text-primary mb-1">技能广场</h1>
        <p className="text-sm text-text-secondary">看看同行最近在用什么方法，别掉队了。</p>
      </div>

      {/* Track Tabs */}
      <div className="flex gap-2 mb-8">
        {tracks.map(track => (
          <button
            key={track.id}
            onClick={() => setActiveTrack(track.id)}
            className={`px-4 py-2 rounded-btn text-sm font-medium transition-all ${
              activeTrack === track.id
                ? 'bg-brand-green text-white'
                : 'bg-white border border-border text-text-secondary hover:border-brand-green hover:text-brand-green'
            }`}
          >
            {track.icon} {track.name}
          </button>
        ))}
      </div>

      <div className="flex gap-6">
        {/* Main Feed */}
        <div className="flex-1 min-w-0">
          {/* 本周热门 */}
          <section className="mb-8">
            <h2 className="text-base font-bold text-text-primary mb-4">
              🔥 本周{activeTrackData?.name}圈热门
            </h2>
            <div className="space-y-3">
              {hotSkills.map((skill, i) => (
                <motion.div
                  key={skill.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  onClick={() => navigate(`/skills/${skill.id}`)}
                  className="flex items-center gap-4 p-4 bg-white rounded-card shadow-card cursor-pointer transition-all hover:shadow-card-hover"
                >
                  <span className="text-lg font-bold text-text-tertiary w-6 text-center">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-text-primary truncate">{skill.name}</p>
                    <p className="text-xs text-text-secondary mt-0.5 line-clamp-1">{skill.description}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-sm font-medium text-brand-green">{skill.installs.toLocaleString()} 人用过</div>
                    <div className="text-[11px] text-text-tertiary">成功率 {skill.successRate}%</div>
                  </div>
                </motion.div>
              ))}
              {hotSkills.length === 0 && (
                <p className="text-sm text-text-tertiary text-center py-8">该赛道暂无数据</p>
              )}
            </div>
          </section>

          {/* 新上线 */}
          <section className="mb-8">
            <h2 className="text-base font-bold text-text-primary mb-4">
              🆕 最近新上线
            </h2>
            <div className="space-y-3">
              {newMethods.map((skill, i) => (
                <div
                  key={skill.id}
                  onClick={() => navigate(`/skills/${skill.id}`)}
                  className="flex items-center gap-4 p-4 bg-white rounded-card shadow-card cursor-pointer transition-all hover:shadow-card-hover"
                >
                  <div className="w-10 h-10 rounded-xl bg-brand-green-surface flex items-center justify-center text-lg">🆕</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-text-primary">{skill.name}</p>
                    <p className="text-xs text-text-tertiary mt-0.5">{skill.creator.name} · {skill.createdAt}</p>
                  </div>
                  <button className="text-xs px-3 py-1.5 rounded-btn bg-brand-green-surface text-brand-green font-medium hover:bg-brand-green hover:text-white transition-colors">
                    试试看
                  </button>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Right Sidebar */}
        <div className="w-[260px] shrink-0 hidden lg:block">
          <div className="sticky top-8 space-y-5">
            {/* 社区动态 */}
            <div className="bg-white rounded-card p-5 shadow-card">
              <h3 className="text-sm font-bold text-text-primary mb-4">📢 社区动态</h3>
              <div className="space-y-4">
                {socialUpdates.map((update, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <span className="text-lg">{update.avatar}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-text-primary">
                        <span className="font-medium">{update.user}</span>
                        <span className="text-text-secondary"> {update.action}</span>
                      </p>
                      <p className="text-xs text-brand-green font-medium mt-0.5">「{update.skill}」</p>
                      <p className="text-[10px] text-text-tertiary mt-0.5">{update.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 赛道数据 */}
            <div className="bg-white rounded-card p-5 shadow-card">
              <h3 className="text-sm font-bold text-text-primary mb-3">📊 {activeTrackData?.name}赛道</h3>
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-text-secondary">总方法数</span>
                  <span className="font-medium text-text-primary">{activeTrackData?.skillCount}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-text-secondary">本周新增</span>
                  <span className="font-medium text-brand-green">+3</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-text-secondary">总执行次数</span>
                  <span className="font-medium text-text-primary">{(activeTrackData?.skillCount || 0) * 89}</span>
                </div>
              </div>
            </div>

            {/* FOMO 提示 */}
            <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-card p-4 border border-amber-100">
              <p className="text-xs text-amber-800 font-medium mb-1">💡 你知道吗</p>
              <p className="text-[11px] text-amber-700 leading-relaxed">
                本周有 <strong>38 位{activeTrackData?.name}</strong>使用了新方法，平均每人节省了 2.5 小时。你的同行正在用 AI 方法提效——别掉队了。
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
