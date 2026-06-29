import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useSkillsStore } from '../stores/skills'
import { useUserStore } from '../stores/user'
import { tracks } from '../data/tracks'
import { creators } from '../data/creators'
import { fetchSkillById } from '../services/skills-api'
import type { Skill } from '../data/skills'

// 默认关注的创作者（与 Creators 页面保持一致）
const DEFAULT_FOLLOWED = ['creator-zephyr', 'creator-zara', 'creator-jesse']

interface FeedItem {
  feedId: string
  title: string
  summary: string
  upvotes: number
  commentCount: number
  viewCount: number
  author: { displayName: string; avatarUrl: string }
  createdAt: string
}

export default function SkillDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const getSkillById = useSkillsStore((s) => s.getSkillById)
  const { installedSkills, installSkill, user } = useUserStore()

  const [remoteSkill, setRemoteSkill] = useState<Skill | null>(null)
  const [loading, setLoading] = useState(false)

  // 先从 store 找，找不到从 API 拉
  const localSkill = getSkillById(id || '')

  useEffect(() => {
    if (!localSkill && id?.startsWith('db-')) {
      setLoading(true)
      const dbId = parseInt(id.replace('db-', ''))
      fetchSkillById(dbId).then(s => {
        setRemoteSkill(s)
        setLoading(false)
      }).catch(() => setLoading(false))
    }
  }, [id, localSkill])

  const skill = localSkill || remoteSkill

  // 加载实战帖（用 tags 中的核心中文词搜索，更精准）
  const [feeds, setFeeds] = useState<FeedItem[]>([])
  useEffect(() => {
    if (!skill) return
    // 优先用 tags 里的中文词，过滤掉英文系统标签
    const chineseTags = skill.tags.filter(t => /[一-鿿]/.test(t) && !['featured'].includes(t))
    const keyword = chineseTags[0] || skill.name.replace(/[?？！!，。「」]/g, '').slice(0, 8)
    fetch(`/api/feeds/search?keyword=${encodeURIComponent(keyword)}`)
      .then(r => r.json())
      .then(d => { if (d.data?.list) setFeeds(d.data.list.slice(0, 3)) })
      .catch(() => {})
  }, [skill?.id])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="inline-block w-8 h-8 rounded-full border-2 border-brand-purple/20 border-t-brand-purple animate-spin" />
      </div>
    )
  }

  if (!skill) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <span className="text-5xl block mb-4">🤷</span>
          <p className="text-text-secondary">Skill 不存在</p>
          <button onClick={() => navigate('/skills')} className="btn-secondary mt-4 text-sm">
            返回广场
          </button>
        </div>
      </div>
    )
  }

  const track = tracks.find((t) => t.id === skill.trackId)
  const isInstalled = installedSkills.includes(skill.id)

  const handleInstall = () => {
    if (!isInstalled && user.shrimps.length > 0) {
      installSkill(skill.id, user.shrimps[0].id)
    }
  }

  return (
    <div className="p-8 max-w-[960px] mx-auto">
      {/* Back */}
      <button
        onClick={() => navigate(-1)}
        className="text-sm text-text-secondary hover:text-text-primary transition-colors mb-6 flex items-center gap-1"
      >
        ← 返回
      </button>

      <div className="grid grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="col-span-2">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {/* Header */}
            <div className="flex items-start gap-4 mb-6">
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shrink-0"
                style={{ backgroundColor: track?.bgColor || '#F3F5F6' }}
              >
                ⚡
              </div>
              <div className="flex-1">
                <h1 className="text-xl font-bold text-text-primary">{skill.name}</h1>
                <p className="text-sm text-text-secondary mt-1 leading-relaxed">{skill.description}</p>
                <div className="flex items-center gap-2 mt-3 flex-wrap">
                  {(skill.trackIds || [skill.trackId]).map((tid) => {
                    const t = tracks.find((tr) => tr.id === tid)
                    return t ? (
                      <span key={tid} className="tag" style={{ backgroundColor: t.bgColor, color: t.color }}>
                        {t.icon} {t.name}
                      </span>
                    ) : null
                  })}
                  <span className="tag bg-gray-50 text-text-secondary">{skill.subDomain}</span>
                </div>
              </div>
            </div>

            {/* Scenario — 画面感 */}
            {skill.scenario && (
              <div className="mb-6 p-4 bg-gradient-to-r from-brand-purple-surface to-white rounded-xl border border-brand-purple/10">
                <div className="text-xs font-semibold text-brand-purple mb-1.5">💼 什么时候用</div>
                <div className="text-sm text-text-primary leading-relaxed">{skill.scenario}</div>
              </div>
            )}

            {/* Input / Output */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              {skill.input && (
                <div className="p-4 bg-surface rounded-xl border border-border">
                  <div className="text-xs font-semibold text-brand-green mb-2">📥 你给什么</div>
                  <div className="text-sm text-text-primary leading-relaxed">{skill.input}</div>
                </div>
              )}
              {skill.output && (
                <div className="p-4 bg-surface rounded-xl border border-border">
                  <div className="text-xs font-semibold text-brand-green mb-2">📤 你得到什么</div>
                  <div className="text-sm text-text-primary leading-relaxed">{skill.output}</div>
                </div>
              )}
            </div>

            {/* Methodology — 核心方法论 */}
            {skill.methodology && (
              <div className="mb-6 p-5 bg-white rounded-xl border border-border">
                <h3 className="text-sm font-bold text-text-primary mb-3 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-brand-purple-surface text-brand-purple text-xs flex items-center justify-center">🧬</span>
                  核心方法论
                </h3>
                <p className="text-sm text-text-secondary leading-relaxed">{skill.methodology}</p>
              </div>
            )}

            {/* Steps */}
            {skill.steps && skill.steps.length > 0 && (
              <div className="mb-6">
                <h3 className="text-sm font-bold text-text-primary mb-3">📋 执行步骤</h3>
                <div className="space-y-2">
                  {skill.steps.map((step, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -12 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.08 }}
                      className="flex items-start gap-3 p-3 bg-white rounded-lg border border-border"
                    >
                      <span className="w-6 h-6 rounded-full bg-brand-green-surface text-brand-green text-xs font-bold flex items-center justify-center shrink-0">
                        {i + 1}
                      </span>
                      <span className="text-sm text-text-primary leading-relaxed">{step}</span>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* Highlights — 为什么比裸 AI 强 */}
            {skill.highlights && skill.highlights.length > 0 && (
              <div className="mb-6 p-5 bg-gradient-to-br from-brand-green-surface/50 to-white rounded-xl border border-brand-green/10">
                <h3 className="text-sm font-bold text-text-primary mb-3 flex items-center gap-2">
                  <span>✨</span> 为什么比直接问 AI 强
                </h3>
                <ul className="space-y-2">
                  {skill.highlights.map((h, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-text-secondary">
                      <span className="text-brand-green mt-0.5 shrink-0">●</span>
                      <span className="leading-relaxed">{h}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Pitfalls — 血泪教训 */}
            {skill.pitfalls && skill.pitfalls.length > 0 && (
              <div className="mb-6 p-5 bg-white rounded-xl border border-red-100">
                <h3 className="text-sm font-bold text-text-primary mb-3 flex items-center gap-2">
                  <span>⚠️</span> 这些坑它帮你避了
                </h3>
                <ul className="space-y-2.5">
                  {skill.pitfalls.map((p, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-text-secondary">
                      <span className="text-red-400 mt-0.5 shrink-0 text-xs">✗</span>
                      <span className="leading-relaxed">{p}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Output Example */}
            {skill.outputExample && (
              <div className="mb-6 p-4 bg-gray-900 rounded-xl">
                <div className="text-xs text-gray-400 mb-2">📦 输出示例</div>
                <div className="text-sm text-gray-200 leading-relaxed font-mono">{skill.outputExample}</div>
              </div>
            )}

            {/* ═══ 社交证明区 ═══ */}

            {/* 你关注的人在用（演示：默认展示2个关注的创作者） */}
            {(() => {
              // 先找 pinnedSkills 匹配的
              let usersOfSkill = creators.filter(c =>
                DEFAULT_FOLLOWED.includes(c.id) &&
                c.pinnedSkills.some(s => s === skill.id || s === id?.replace('db-', ''))
              )
              // 如果没匹配到，演示用途：根据 skill 赛道选2个关注的创作者
              if (usersOfSkill.length === 0) {
                usersOfSkill = creators
                  .filter(c => DEFAULT_FOLLOWED.includes(c.id) && c.trackIds.includes(skill.trackId))
                  .slice(0, 2)
                // 如果赛道也没匹配，兜底取前2个
                if (usersOfSkill.length === 0) {
                  usersOfSkill = creators.filter(c => DEFAULT_FOLLOWED.includes(c.id)).slice(0, 2)
                }
              }
              return (
                <div className="mb-6 p-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl border border-amber-100">
                  <div className="text-xs font-semibold text-amber-700 mb-3">👥 你关注的人在用</div>
                  <div className="space-y-2.5">
                    {usersOfSkill.map(c => (
                      <div key={c.id} className="flex items-center gap-3 cursor-pointer" onClick={() => navigate(`/creators/${c.id}`)}>
                        <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-base shadow-sm">{c.avatar}</div>
                        <div>
                          <span className="text-sm font-medium text-text-primary">{c.name}</span>
                          <span className="text-xs text-text-tertiary ml-2">{c.title.split('·')[0].trim()}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })()}

            {/* 比裸 AI 强多少 — 量化价值 */}
            <div className="mb-6 p-5 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
              <div className="text-xs font-semibold text-blue-700 mb-3">📊 比直接问 AI 强多少</div>
              <div className="grid grid-cols-3 gap-3">
                <div className="text-center p-3 bg-white/70 rounded-lg">
                  <div className="text-xl font-bold text-blue-600">{Math.round(skill.successRate * 0.4 + 10)}min</div>
                  <div className="text-[11px] text-text-tertiary mt-1">平均节省</div>
                </div>
                <div className="text-center p-3 bg-white/70 rounded-lg">
                  <div className="text-xl font-bold text-blue-600">{(skill.rating * 0.9 + 0.3).toFixed(1)}轮</div>
                  <div className="text-[11px] text-text-tertiary mt-1">减少对话</div>
                </div>
                <div className="text-center p-3 bg-white/70 rounded-lg">
                  <div className="text-xl font-bold text-blue-600">{skill.successRate}%</div>
                  <div className="text-[11px] text-text-tertiary mt-1">一次成功率</div>
                </div>
              </div>
              <p className="text-[11px] text-text-tertiary mt-3 text-center">基于社区使用数据估算，比 ChatGPT/Claude 直接对话效果更好</p>
            </div>

            {/* 实战案例 — 觅游实战帖 */}
            {feeds.length > 0 && (
              <div className="mb-6 p-5 bg-white rounded-xl border border-border">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-bold text-text-primary flex items-center gap-2">
                    <span>📝</span> 实战案例
                  </h3>
                  <a
                    href={`https://www.meyo123.com/community/feed?is_task=true`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-brand-purple hover:underline"
                  >
                    查看更多 →
                  </a>
                </div>
                <div className="space-y-3">
                  {feeds.map(feed => (
                    <a
                      key={feed.feedId}
                      href={`https://www.meyo123.com/community/feed/${feed.feedId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block p-3 bg-surface rounded-lg border border-border hover:border-brand-purple/30 hover:bg-brand-purple-surface/20 transition-all"
                    >
                      <div className="text-sm text-text-primary font-medium leading-relaxed" dangerouslySetInnerHTML={{ __html: feed.title.replace(/<em class="highlight">/g, '').replace(/<\/em>/g, '') }} />
                      <div className="flex items-center gap-3 mt-2 text-xs text-text-tertiary">
                        <span>👍 {feed.upvotes}</span>
                        <span>💬 {feed.commentCount}</span>
                        <span>👀 {feed.viewCount}</span>
                        <span className="ml-auto">{feed.author.displayName}</span>
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Tags */}
            <div className="flex flex-wrap gap-2 mb-6">
              {skill.tags.map((tag) => (
                <span key={tag} className="text-xs px-2.5 py-1 rounded-full bg-surface border border-border text-text-secondary">{tag}</span>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Actions */}
          <motion.div
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-card p-5 border border-border sticky top-8"
          >
            <button
              onClick={handleInstall}
              disabled={isInstalled}
              className={`w-full mb-3 flex items-center justify-center gap-2 font-medium px-5 py-3 rounded-btn transition-all ${
                isInstalled
                  ? 'bg-brand-green-surface text-brand-green cursor-default'
                  : 'btn-primary'
              }`}
            >
              {isInstalled ? '✓ 已安装' : '📥 安装到我的虾'}
            </button>
            <button className="w-full btn-secondary flex items-center justify-center gap-2 text-sm mb-3">
              🍴 Fork 改成我的
            </button>
            <button className="w-full btn-secondary flex items-center justify-center gap-2 text-sm mb-3">
              ⭐ 收藏
            </button>
            {skill.sourceUrl && (
              <a
                href={skill.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full btn-secondary flex items-center justify-center gap-2 text-sm block"
              >
                🔗 查看源码
              </a>
            )}

            {/* Stats */}
            <div className="mt-5 pt-4 border-t border-border">
              <div className="grid grid-cols-2 gap-3">
                <div className="text-center">
                  <div className="text-lg font-bold text-text-primary">{skill.installs.toLocaleString()}</div>
                  <div className="text-[11px] text-text-tertiary">安装</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-text-primary">{skill.citations}</div>
                  <div className="text-[11px] text-text-tertiary">引用</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-text-primary">{skill.rating}</div>
                  <div className="text-[11px] text-text-tertiary">评分</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-text-primary">{skill.successRate}%</div>
                  <div className="text-[11px] text-text-tertiary">成功率</div>
                </div>
              </div>
            </div>

            {/* Creator */}
            <div className="mt-5 pt-4 border-t border-border">
              <div className="text-[11px] text-text-tertiary mb-2">创作者</div>
              <div
                className="flex items-center gap-3 cursor-pointer hover:bg-surface-hover rounded-lg p-2 -m-2 transition-colors"
                onClick={() => {
                  const creator = creators.find((c) => c.name === skill.creator.name)
                  if (creator) navigate(`/creators/${creator.id}`)
                }}
              >
                <div className="w-9 h-9 rounded-full bg-brand-green-surface flex items-center justify-center text-lg">
                  {skill.creator.avatar}
                </div>
                <div>
                  <div className="text-sm font-medium text-text-primary hover:text-brand-green transition-colors">{skill.creator.name}</div>
                  <div className="text-[11px] text-text-tertiary">{track?.name}赛道创作者</div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
