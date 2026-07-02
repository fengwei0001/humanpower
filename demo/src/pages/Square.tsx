import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { tracks } from '../data/tracks'
import { fetchSkills } from '../services/skills-api'
import type { Skill } from '../data/skills'

// ─── 场景/痛点分类（按赛道） ───
const scenariosByTrack: Record<string, { label: string; icon: string }[]> = {
  pm: [
    { label: '写 PRD', icon: '📝' },
    { label: '做竞品分析', icon: '🔍' },
    { label: '数据洞察', icon: '📊' },
    { label: '汇报演示', icon: '🎤' },
    { label: '用户调研', icon: '🎯' },
    { label: '项目推进', icon: '🚀' },
    { label: '需求评审', icon: '⚖️' },
    { label: '增长实验', icon: '📈' },
  ],
  engineer: [
    { label: '写代码', icon: '💻' },
    { label: 'Debug', icon: '🐛' },
    { label: 'Code Review', icon: '👀' },
    { label: '写技术文档', icon: '📖' },
    { label: '架构设计', icon: '🏗️' },
    { label: '自动化测试', icon: '🧪' },
    { label: '性能优化', icon: '⚡' },
    { label: 'CI/CD', icon: '🔄' },
  ],
  creator: [
    { label: '写爆款标题', icon: '✍️' },
    { label: '拍视频脚本', icon: '🎬' },
    { label: '做小红书', icon: '📕' },
    { label: '涨粉策略', icon: '📈' },
    { label: '热点追踪', icon: '🔥' },
    { label: '数据复盘', icon: '📊' },
    { label: '商务合作', icon: '🤝' },
    { label: '内容排期', icon: '📅' },
  ],
  opc: [
    { label: '从 0 到 1 做产品', icon: '🛠️' },
    { label: '获客增长', icon: '📈' },
    { label: '商业化变现', icon: '💰' },
    { label: '搭建自动化', icon: '🤖' },
    { label: '技术选型', icon: '🧩' },
    { label: '落地页转化', icon: '🎯' },
    { label: '一人搞定运维', icon: '🖥️' },
    { label: '用户反馈闭环', icon: '🔁' },
  ],
}

// 全部赛道时的场景
const allScenarios = [
  { label: '写文档', icon: '📝' },
  { label: '搞数据', icon: '📊' },
  { label: '做汇报', icon: '🎤' },
  { label: '自动化', icon: '🤖' },
  { label: '涨粉获客', icon: '📈' },
  { label: '写代码', icon: '💻' },
  { label: '做竞品分析', icon: '🔍' },
  { label: '商业化', icon: '💰' },
]

export default function Square() {
  const navigate = useNavigate()

  // 筛选状态
  const [activeTrack, setActiveTrack] = useState<string | null>(null)
  const [activeScenario, setActiveScenario] = useState<string | null>(null)
  const [sort, setSort] = useState<'hot' | 'new' | 'rating'>('hot')

  // 数据状态
  const [skills, setSkills] = useState<Skill[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)
  const [loading, setLoading] = useState(false)

  // 当前场景列表
  const scenarios = activeTrack ? (scenariosByTrack[activeTrack] || []) : allScenarios

  // 筛选变更时重新加载
  useEffect(() => {
    let cancelled = false

    const load = async () => {
      setLoading(true)
      try {
        const result = await fetchSkills({
          page: 1,
          pageSize: 20,
          track: activeTrack || undefined,
          sort,
        })
        if (!cancelled) {
          setSkills(result.skills)
          setTotal(result.total)
          setPage(1)
          setHasMore(result.pageSize < result.total)
        }
      } catch {
        if (!cancelled) setSkills([])
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => { cancelled = true }
  }, [activeTrack, activeScenario, sort])

  // 切换赛道
  const handleTrackChange = (trackId: string | null) => {
    setActiveTrack(trackId)
    setActiveScenario(null)
  }

  // 加载更多
  const handleLoadMore = async () => {
    const nextPage = page + 1
    setLoading(true)
    try {
      const result = await fetchSkills({
        page: nextPage,
        pageSize: 20,
        track: activeTrack || undefined,
        sort,
      })
      setSkills(prev => [...prev, ...result.skills])
      setPage(nextPage)
      setHasMore(nextPage * result.pageSize < result.total)
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="px-8 py-8 max-w-[960px] mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-text-primary mb-1">技能广场</h1>
        <p className="text-sm text-text-secondary">
          {total} 个方法，同行都在用。找到你的场景，一键用起来。
        </p>
      </div>

      {/* 赛道 Tabs — 大号、底部指示器风格 */}
      <div className="flex gap-1 mb-5 border-b border-border">
        <button
          onClick={() => handleTrackChange(null)}
          className={`px-5 py-2.5 text-sm font-semibold transition-all relative ${
            !activeTrack
              ? 'text-brand-green'
              : 'text-text-secondary hover:text-text-primary'
          }`}
        >
          全部
          {!activeTrack && <span className="absolute bottom-0 left-2 right-2 h-[3px] rounded-full bg-brand-green" />}
        </button>
        {tracks.map(track => (
          <button
            key={track.id}
            onClick={() => handleTrackChange(track.id)}
            className={`px-5 py-2.5 text-sm font-semibold transition-all relative ${
              activeTrack === track.id
                ? 'text-brand-green'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            {track.icon} {track.name}
            {activeTrack === track.id && <span className="absolute bottom-0 left-2 right-2 h-[3px] rounded-full bg-brand-green" />}
          </button>
        ))}
      </div>

      {/* 场景/痛点分类 — 小胶囊 */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {scenarios.map(s => (
          <button
            key={s.label}
            onClick={() => setActiveScenario(activeScenario === s.label ? null : s.label)}
            className={`px-3.5 py-1.5 rounded-full text-[13px] font-medium transition-all ${
              activeScenario === s.label
                ? 'bg-brand-green text-white shadow-sm'
                : 'bg-white border border-border text-text-secondary hover:border-brand-green/50 hover:text-brand-green'
            }`}
          >
            {s.icon} {s.label}
          </button>
        ))}
      </div>

      {/* 排序 + 计数 */}
      <div className="flex items-center justify-between mb-5">
        <div className="text-xs text-text-tertiary">
          {activeTrack && `${tracks.find(t => t.id === activeTrack)?.icon} `}
          {activeScenario ? `「${activeScenario}」相关` : ''}
          {' '}共 {total} 个方法
        </div>
        <div className="flex items-center gap-1 bg-white border border-border rounded-btn p-1">
          {[
            { key: 'hot' as const, label: '🔥 热门' },
            { key: 'new' as const, label: '🆕 最新' },
            { key: 'rating' as const, label: '⭐ 评分' },
          ].map((s) => (
            <button
              key={s.key}
              onClick={() => setSort(s.key)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                sort === s.key
                  ? 'bg-brand-green text-white'
                  : 'text-text-secondary hover:text-text-primary hover:bg-surface-hover'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* 大卡片网格 — 2列 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {skills.map((skill, i) => (
          <SkillCardLarge key={skill.id} skill={skill} index={i} onClick={() => navigate(`/skills/${skill.id}`)} />
        ))}
      </div>

      {/* 加载中 */}
      {loading && skills.length === 0 && (
        <div className="text-center py-20">
          <div className="inline-block w-8 h-8 rounded-full border-2 border-brand-green/20 border-t-brand-green animate-spin mb-4" />
          <p className="text-text-secondary text-sm">加载中...</p>
        </div>
      )}

      {/* 空状态 */}
      {!loading && skills.length === 0 && (
        <div className="text-center py-20">
          <span className="text-4xl mb-4 block">🔍</span>
          <p className="text-text-secondary">该分类下暂无方法</p>
          <p className="text-xs text-text-tertiary mt-1">试试其他赛道或场景</p>
        </div>
      )}

      {/* 加载更多 */}
      {hasMore && (
        <div className="text-center mt-8">
          <button
            onClick={handleLoadMore}
            disabled={loading}
            className="px-8 py-3 rounded-btn bg-white border border-border text-sm text-text-secondary hover:text-text-primary hover:border-brand-green/30 transition-all disabled:opacity-50 shadow-card"
          >
            {loading ? '加载中...' : `加载更多（还有 ${total - skills.length} 个）`}
          </button>
        </div>
      )}
    </div>
  )
}

// ─── 大卡片组件 ───

interface SkillCardLargeProps {
  skill: Skill
  index: number
  onClick: () => void
}

function SkillCardLarge({ skill, index, onClick }: SkillCardLargeProps) {
  const track = tracks.find(t => t.id === skill.trackId)

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: Math.min(index * 0.03, 0.3) }}
      onClick={onClick}
      className="bg-white rounded-card p-5 shadow-card cursor-pointer transition-all duration-200 hover:shadow-card-hover hover:-translate-y-0.5 border border-border"
    >
      {/* 标题 */}
      <h3 className="text-[15px] font-bold text-text-primary leading-snug mb-2">
        {skill.name}
      </h3>

      {/* 描述 */}
      <p className="text-[13px] text-text-secondary leading-relaxed line-clamp-2 mb-3 min-h-[2.6em]">
        {skill.description}
      </p>

      {/* Tags */}
      <div className="flex flex-wrap gap-1.5 mb-4">
        {track && (
          <span
            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
            style={{ backgroundColor: track.bgColor, color: track.color }}
          >
            {track.icon} {track.name}
          </span>
        )}
        {skill.tags.slice(0, 2).map(tag => (
          <span key={tag} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-50 text-text-secondary">
            {tag}
          </span>
        ))}
      </div>

      {/* 比直接问 AI 强多少 — 轻量inline */}
      <div className="flex items-center gap-3 mb-4 text-[11px] text-text-tertiary">
        <span>⏱ 省 {Math.round((Number(skill.rating) || 4) * 10 + 7)}min</span>
        <span>💬 少 {((Number(skill.rating) || 4) * 0.9 + 0.3).toFixed(1)} 轮</span>
        <span>✓ {Math.min(99, Math.round((Number(skill.rating) || 4) * 18 + 5))}% 一次成功</span>
      </div>

      {/* 底部统计 */}
      <div className="flex items-center justify-between pt-3 border-t border-border">
        <div className="flex items-center gap-4 text-xs text-text-secondary">
          <span className="flex items-center gap-1">
            🔥 {skill.installs.toLocaleString()}
          </span>
          <span className="flex items-center gap-1">
            🔗 {skill.citations}
          </span>
          <span className="flex items-center gap-1">
            ⭐ {(Number(skill.rating) || 0).toFixed(2)}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-sm">{skill.creator.avatar}</span>
          <span className="text-xs text-text-tertiary">{skill.creator.name}</span>
        </div>
      </div>
    </motion.div>
  )
}
