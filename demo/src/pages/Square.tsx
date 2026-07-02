import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { tracks } from '../data/tracks'
import { fetchSkills, fetchTags, type TagItem, type FetchSkillsResponse } from '../services/skills-api'
import type { Skill } from '../data/skills'

export default function Square() {
  const navigate = useNavigate()

  // 筛选状态
  const [activeTrack, setActiveTrack] = useState<string | null>(null)
  const [activeTag, setActiveTag] = useState<string | null>(null)
  const [sort, setSort] = useState<'hot' | 'new' | 'rating'>('hot')

  // 数据状态
  const [skills, setSkills] = useState<Skill[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)
  const [loading, setLoading] = useState(false)
  const [tags, setTags] = useState<TagItem[]>([])
  const [tagsLoading, setTagsLoading] = useState(false)

  // 加载标签
  const loadTags = async (track?: string) => {
    setTagsLoading(true)
    try {
      const result = await fetchTags(track || undefined)
      setTags(result)
    } catch {
      setTags([])
    } finally {
      setTagsLoading(false)
    }
  }

  // 加载技能列表
  const loadSkills = async (p = 1, append = false) => {
    setLoading(true)
    try {
      const result: FetchSkillsResponse = await fetchSkills({
        page: p,
        pageSize: 20,
        track: activeTrack || undefined,
        tag: activeTag || undefined,
        sort,
      })
      if (append) {
        setSkills(prev => [...prev, ...result.skills])
      } else {
        setSkills(result.skills)
      }
      setTotal(result.total)
      setPage(p)
      setHasMore(p * result.pageSize < result.total)
    } catch {
      if (!append) setSkills([])
    } finally {
      setLoading(false)
    }
  }

  // 筛选变更时重新加载
  useEffect(() => {
    loadSkills(1)
    loadTags(activeTrack || undefined)
  }, [activeTrack, activeTag, sort]) // eslint-disable-line react-hooks/exhaustive-deps

  // 切换赛道
  const handleTrackChange = (trackId: string | null) => {
    setActiveTrack(trackId)
    setActiveTag(null) // 切赛道时重置标签
    loadTags(trackId || undefined)
  }

  // 加载更多
  const handleLoadMore = () => {
    loadSkills(page + 1, true)
  }

  return (
    <div className="px-8 py-8 max-w-[960px] mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-text-primary mb-1">技能广场</h1>
        <p className="text-sm text-text-secondary">
          {total} 个方法，同行都在用。按场景找，更快找到你要的。
        </p>
      </div>

      {/* 赛道 Tabs — 全部 + 4赛道 */}
      <div className="flex gap-2 mb-4 flex-wrap">
        <button
          onClick={() => handleTrackChange(null)}
          className={`px-4 py-2 rounded-btn text-sm font-medium transition-all ${
            !activeTrack
              ? 'bg-brand-green text-white'
              : 'bg-white border border-border text-text-secondary hover:border-brand-green hover:text-brand-green'
          }`}
        >
          全部
        </button>
        {tracks.map(track => (
          <button
            key={track.id}
            onClick={() => handleTrackChange(track.id)}
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

      {/* 标签筛选 */}
      <AnimatePresence mode="wait">
        {tags.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="flex gap-2 mb-6 flex-wrap"
          >
            {tags.map(t => (
              <button
                key={t.tag}
                onClick={() => setActiveTag(activeTag === t.tag ? null : t.tag)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                  activeTag === t.tag
                    ? 'bg-brand-green text-white'
                    : 'bg-white border border-border text-text-secondary hover:border-brand-green/50 hover:text-brand-green'
                }`}
              >
                {t.tag}
                <span className="ml-1 opacity-60">{t.cnt}</span>
              </button>
            ))}
            {activeTag && (
              <button
                onClick={() => setActiveTag(null)}
                className="px-3 py-1.5 rounded-full text-xs font-medium text-text-tertiary hover:text-text-primary transition-colors"
              >
                ✕ 清除
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* 排序 + 计数 */}
      <div className="flex items-center justify-between mb-5">
        <div className="text-xs text-text-tertiary">
          {activeTrack && `${tracks.find(t => t.id === activeTrack)?.icon} `}
          {activeTag ? `「${activeTag}」` : ''}
          共 {total} 个方法
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
          <p className="text-xs text-text-tertiary mt-1">试试其他赛道或标签</p>
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

// ─── 大卡片组件（对标觅游截图样式） ───

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
            ⭐ {skill.rating.toFixed(2)}
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
