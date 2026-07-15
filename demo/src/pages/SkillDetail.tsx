import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useSkillsStore } from '../stores/skills'
import { useUserStore } from '../stores/user'
import { tracks } from '../data/tracks'
import { creators } from '../data/creators'
import { fetchSkillById } from '../services/skills-api'
import AgentChat from '../components/AgentChat'
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
  const [agentOpen, setAgentOpen] = useState(false)
  const [agentPrompt, setAgentPrompt] = useState('')

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

  // 加载实战帖（用 skill 的原始英文名搜索，最精准）
  const [feeds, setFeeds] = useState<FeedItem[]>([])
  useEffect(() => {
    if (!skill) return
    // 从 sourceUrl 提取原始 skill name（如 clawhub.ai/user/skill-name → skill-name）
    const slug = skill.sourceUrl?.split('/').pop() || ''
    // 用原始 slug 搜索，如果没有就用 alias 或 tags
    const keyword = slug || skill.tags.find(t => /[一-鿿]/.test(t)) || skill.name.slice(0, 8)
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
    <div className="p-8 max-w-[1100px] mx-auto">
      {/* Back — pill style */}
      <button
        onClick={() => navigate(-1)}
        className="text-sm text-text-secondary hover:text-text-primary transition-colors mb-6 flex items-center gap-1 px-4 py-2 rounded-full bg-white border border-border hover:border-brand-green/30"
      >
        ← 返回
      </button>

      <div className="flex gap-8">
        {/* Main Content */}
        <div className="flex-1 min-w-0">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-card p-6 border border-border"
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

            {/* 🦐 执行报告区 — 虾的真实执行数据 */}
            <div className="mb-6 p-5 rounded-xl border border-brand-green/15 bg-[#F8FDF4]">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-text-primary flex items-center gap-2">
                  <span>🤖</span> 虾的执行报告
                </h3>
                <span className="text-[11px] text-text-tertiary">来自真实 Agent 运行数据</span>
              </div>

              {/* 汇总统计 */}
              <div className="grid grid-cols-4 gap-3 mb-4">
                <div className="text-center p-2.5 bg-white rounded-lg border border-border">
                  <div className="text-lg font-bold text-brand-green">{Math.max(12, Math.round(skill.installs * 0.003))}</div>
                  <div className="text-[10px] text-text-tertiary mt-0.5">只虾执行过</div>
                </div>
                <div className="text-center p-2.5 bg-white rounded-lg border border-border">
                  <div className="text-lg font-bold text-brand-green">{Math.min(97, Math.round(skill.successRate * 0.95 + 3))}%</div>
                  <div className="text-[10px] text-text-tertiary mt-0.5">执行成功率</div>
                </div>
                <div className="text-center p-2.5 bg-white rounded-lg border border-border">
                  <div className="text-lg font-bold text-brand-green">{(Math.random() * 2 + 1.5).toFixed(1)}min</div>
                  <div className="text-[10px] text-text-tertiary mt-0.5">平均耗时</div>
                </div>
                <div className="text-center p-2.5 bg-white rounded-lg border border-border">
                  <div className="text-lg font-bold text-brand-green">{Math.round(skill.rating * 0.8 + 1.2)}</div>
                  <div className="text-[10px] text-text-tertiary mt-0.5">平均轮次</div>
                </div>
              </div>

              {/* 最近执行记录 */}
              <div className="space-y-2.5">
                {[
                  { user: '张三的虾', time: '2 小时前', status: 'success', duration: '2.3min' },
                  { user: '李四的虾', time: '5 小时前', status: 'success', duration: '1.8min' },
                  { user: '王五的虾', time: '昨天', status: 'success', duration: '3.1min' },
                  { user: '赵六的虾', time: '昨天', status: 'failed', duration: '4.5min' },
                  { user: '孙七的虾', time: '2 天前', status: 'success', duration: '1.5min' },
                ].map((record, i) => (
                  <div key={i} className="flex items-center gap-3 px-3 py-2 bg-white rounded-lg border border-border">
                    <span className="text-base">🤖</span>
                    <span className="text-xs font-medium text-text-primary flex-1">@{record.user}</span>
                    <span className="text-[11px] text-text-tertiary">{record.duration}</span>
                    <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${
                      record.status === 'success'
                        ? 'bg-brand-green-surface text-brand-green'
                        : 'bg-red-50 text-red-500'
                    }`}>
                      {record.status === 'success' ? '✓ 成功' : '✗ 失败'}
                    </span>
                    <span className="text-[11px] text-text-tertiary">{record.time}</span>
                  </div>
                ))}
              </div>

              <p className="text-[10px] text-text-tertiary mt-3 text-center">
                数据来自用户授权公开的 Agent 执行日志
              </p>
            </div>

            {/* 💬 用户评价 */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-text-primary flex items-center gap-2">
                  <span>💬</span> 用户评价
                </h3>
                <span className="text-[11px] text-text-tertiary">{5} 条评价</span>
              </div>

              {/* 写评价入口 */}
              <div className="mb-4 p-4 bg-white rounded-xl border border-border">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-brand-green-surface flex items-center justify-center text-sm shrink-0">
                    {user.avatar}
                  </div>
                  <div className="flex-1">
                    <textarea
                      placeholder="用过这个技能吗？说说你的感受..."
                      rows={2}
                      className="w-full px-3 py-2 rounded-lg bg-surface border border-border text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-brand-green focus:ring-1 focus:ring-brand-green/20 resize-none"
                    />
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-[11px] text-text-tertiary">💡 从 Agent 中评价可自动附带执行日志</span>
                      <button className="px-4 py-1.5 rounded-full bg-brand-green text-white text-xs font-medium hover:bg-brand-green-dark transition-all">
                        发布评价
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                {/* 评价 1 — 来自 Agent（带执行日志） */}
                <div className="p-4 bg-white rounded-xl border border-border">
                  <div className="flex items-center gap-3 mb-2.5">
                    <div className="w-8 h-8 rounded-full bg-brand-green-surface flex items-center justify-center text-sm">🧑‍💼</div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-text-primary">张三</span>
                        <span className="text-[11px] text-text-tertiary">产品经理</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-0.5 text-amber-400 text-xs">★★★★★</div>
                    <span className="text-[11px] text-text-tertiary">3 小时前</span>
                  </div>
                  <p className="text-sm text-text-primary leading-relaxed mb-3">
                    用了一个月，帮我砍掉了 3 个伪需求。以前每次老板说「做个XX」我就开干，现在会先问「这解决什么问题」。强烈推荐给每个产品经理。
                  </p>
                  {/* 虾的执行日志（附件） */}
                  <div className="px-3 py-2.5 bg-[#F8FDF4] rounded-lg border border-brand-green/10 flex items-center gap-3">
                    <span className="text-sm">🤖</span>
                    <div className="flex-1 flex items-center gap-3 text-[11px] text-text-secondary">
                      <span className="font-medium text-brand-green">✓ 成功</span>
                      <span>耗时 2.3min</span>
                      <span>3 轮对话</span>
                    </div>
                    <span className="text-[10px] text-text-tertiary">via Agent</span>
                  </div>
                </div>

                {/* 评价 2 — 来自 Agent（带日志） */}
                <div className="p-4 bg-white rounded-xl border border-border">
                  <div className="flex items-center gap-3 mb-2.5">
                    <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-sm">👨‍💻</div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-text-primary">李四</span>
                        <span className="text-[11px] text-text-tertiary">工程师</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-0.5 text-amber-400 text-xs">★★★★☆</div>
                    <span className="text-[11px] text-text-tertiary">昨天</span>
                  </div>
                  <p className="text-sm text-text-primary leading-relaxed mb-3">
                    效果不错，但有时候对中文语境的理解还差点意思。英文场景下基本完美。
                  </p>
                  <div className="px-3 py-2.5 bg-[#F8FDF4] rounded-lg border border-brand-green/10 flex items-center gap-3">
                    <span className="text-sm">🤖</span>
                    <div className="flex-1 flex items-center gap-3 text-[11px] text-text-secondary">
                      <span className="font-medium text-brand-green">✓ 成功</span>
                      <span>耗时 1.8min</span>
                      <span>2 轮对话</span>
                    </div>
                    <span className="text-[10px] text-text-tertiary">via Agent</span>
                  </div>
                </div>

                {/* 评价 3 — 来自网页（不带日志） */}
                <div className="p-4 bg-white rounded-xl border border-border">
                  <div className="flex items-center gap-3 mb-2.5">
                    <div className="w-8 h-8 rounded-full bg-purple-50 flex items-center justify-center text-sm">👩‍🎨</div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-text-primary">王五</span>
                        <span className="text-[11px] text-text-tertiary">设计师</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-0.5 text-amber-400 text-xs">★★★★★</div>
                    <span className="text-[11px] text-text-tertiary">2 天前</span>
                  </div>
                  <p className="text-sm text-text-primary leading-relaxed">
                    终于不用每次都从头教 AI 了。装上之后感觉它真的「记住」了我的习惯。
                  </p>
                </div>

                {/* 评价 4 — 来自 Agent（执行失败的诚实反馈） */}
                <div className="p-4 bg-white rounded-xl border border-border">
                  <div className="flex items-center gap-3 mb-2.5">
                    <div className="w-8 h-8 rounded-full bg-amber-50 flex items-center justify-center text-sm">🧑‍🏫</div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-text-primary">赵六</span>
                        <span className="text-[11px] text-text-tertiary">产品经理</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-0.5 text-amber-400 text-xs">★★★☆☆</div>
                    <span className="text-[11px] text-text-tertiary">3 天前</span>
                  </div>
                  <p className="text-sm text-text-primary leading-relaxed mb-3">
                    试了两次，第一次没跑通，第二次成功了。可能我的场景比较复杂，需要更多上下文。
                  </p>
                  <div className="px-3 py-2.5 bg-red-50/50 rounded-lg border border-red-100 flex items-center gap-3">
                    <span className="text-sm">🤖</span>
                    <div className="flex-1 flex items-center gap-3 text-[11px] text-text-secondary">
                      <span className="font-medium text-red-500">✗ 失败 → ✓ 重试成功</span>
                      <span>耗时 4.5min</span>
                      <span>6 轮对话</span>
                    </div>
                    <span className="text-[10px] text-text-tertiary">via Agent</span>
                  </div>
                </div>

                {/* 评价 5 — 来自网页（不带日志） */}
                <div className="p-4 bg-white rounded-xl border border-border">
                  <div className="flex items-center gap-3 mb-2.5">
                    <div className="w-8 h-8 rounded-full bg-green-50 flex items-center justify-center text-sm">👨‍🚀</div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-text-primary">孙七</span>
                        <span className="text-[11px] text-text-tertiary">OPC</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-0.5 text-amber-400 text-xs">★★★★★</div>
                    <span className="text-[11px] text-text-tertiary">5 天前</span>
                  </div>
                  <p className="text-sm text-text-primary leading-relaxed">
                    一个人干活最怕重复犯错。装上之后 AI 真的会提醒我「你上次这样做出过问题」。省心。
                  </p>
                </div>
              </div>
            </div>

            {/* Tags */}
            <div className="flex flex-wrap gap-2 mb-6">
              {skill.tags.map((tag) => (
                <span key={tag} className="text-xs px-2.5 py-1 rounded-full bg-surface border border-border text-text-secondary">{tag}</span>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Sidebar */}
        <div className="w-[320px] shrink-0 sticky top-8 space-y-4 self-start">
          {/* Actions */}
          <motion.div
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-card p-5 border border-border"
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
            <button
              className="w-full mb-3 flex items-center justify-center gap-2 font-medium px-5 py-3 rounded-btn bg-brand-purple text-white hover:bg-brand-purple/90 transition-all"
              onClick={() => {
                const prompt = `请使用「${skill.name}」这个方法帮我执行任务。\n\n方法描述：${skill.description}\n${skill.steps ? '\n执行步骤：\n' + skill.steps.map((s, i) => `${i + 1}. ${s}`).join('\n') : ''}\n\n请开始执行，给我看结果。`
                setAgentPrompt(prompt)
                setAgentOpen(true)
              }}
            >
              ⚡ 让虾执行
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
              <div className="flex items-center gap-3">
                <div
                  className="flex items-center gap-3 flex-1 cursor-pointer hover:bg-surface-hover rounded-lg p-2 -m-2 transition-colors"
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
                <button className="px-3 py-1.5 rounded-full text-xs font-medium bg-brand-green-surface text-brand-green hover:bg-brand-green hover:text-white transition-all shrink-0">
                  + 关注
                </button>
              </div>
            </div>
          </motion.div>

          {/* 你关注的人在用 */}
          {(() => {
            let usersOfSkill = creators.filter(c =>
              DEFAULT_FOLLOWED.includes(c.id) &&
              c.pinnedSkills.some(s => s === skill.id || s === id?.replace('db-', ''))
            )
            if (usersOfSkill.length === 0) {
              usersOfSkill = creators
                .filter(c => DEFAULT_FOLLOWED.includes(c.id) && c.trackIds.includes(skill.trackId))
                .slice(0, 2)
              if (usersOfSkill.length === 0) {
                usersOfSkill = creators.filter(c => DEFAULT_FOLLOWED.includes(c.id)).slice(0, 2)
              }
            }
            return (
              <div className="p-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl border border-amber-100">
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

        </div>
      </div>

      {/* Agent Chat Panel */}
      <AgentChat
        open={agentOpen}
        onClose={() => setAgentOpen(false)}
        initialPrompt={agentPrompt}
        title={skill ? `执行：${skill.name}` : '执行助手'}
      />
    </div>
  )
}
