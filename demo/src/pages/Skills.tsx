import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useSkillsStore } from '../stores/skills'
import { tracks } from '../data/tracks'
import { sampleCombos } from '../data/agent-activity'
import { hasApiKey, setApiKey } from '../services/ai'
import { aiSearchSkills, localSearchSkills, type SearchResult } from '../services/ai-search'
import SkillCard from '../components/SkillCard'

export default function Skills() {
  const navigate = useNavigate()
  const {
    filterTrack,
    filterSort,
    setFilterTrack,
    setFilterSort,
    getFilteredSkills,
  } = useSkillsStore()

  const [aiQuery, setAiQuery] = useState('')
  const [searching, setSearching] = useState(false)
  const [searchResult, setSearchResult] = useState<SearchResult | null>(null)
  const [searchError, setSearchError] = useState<string | null>(null)
  const [showKeyInput, setShowKeyInput] = useState(false)
  const [tempKey, setTempKey] = useState('')

  const filteredSkills = getFilteredSkills()

  const handleAiSearch = async (query?: string) => {
    const q = (query || aiQuery).trim()
    if (!q) return

    setSearchError(null)
    setSearchResult(null)

    // 检查 API Key
    if (!hasApiKey()) {
      setShowKeyInput(true)
      return
    }

    setSearching(true)

    try {
      const result = await aiSearchSkills(q)
      setSearchResult(result)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : '搜索失败'
      if (message === 'NO_API_KEY') {
        setShowKeyInput(true)
      } else {
        // Fallback 到本地搜索（静默降级，不提示用户）
        console.warn('AI 搜索失败，使用本地匹配:', message)
        const fallback = localSearchSkills(q)
        setSearchResult(fallback)
      }
    } finally {
      setSearching(false)
    }
  }

  const handleSaveKey = () => {
    if (tempKey.trim()) {
      setApiKey(tempKey.trim())
      setShowKeyInput(false)
      setTempKey('')
      // 保存后自动搜索
      if (aiQuery.trim()) {
        setTimeout(() => handleAiSearch(), 100)
      }
    }
  }

  return (
    <div className="p-8 max-w-[1200px] mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <h1 className="text-2xl font-bold text-text-primary">蒸馏广场</h1>
        <p className="text-sm text-text-secondary mt-1">
          发现优质蒸馏物，或直接描述问题让 AI 帮你推荐组合方案。
        </p>
      </motion.div>

      <div className="flex gap-6">
        {/* Main Content */}
        <div className="flex-1 min-w-0">
          {/* AI Search */}
          <div className="bg-white rounded-card p-5 border border-border mb-5">
            <h3 className="text-sm font-bold text-text-primary mb-3">描述你要解决的问题，AI 帮你推荐蒸馏物组合</h3>
            <div className="flex items-center gap-3">
              <input
                type="text"
                value={aiQuery}
                onChange={(e) => { setAiQuery(e.target.value); if (!e.target.value) { setSearchResult(null); setSearchError(null) } }}
                onKeyDown={(e) => e.key === 'Enter' && handleAiSearch()}
                placeholder="比如：「我要做新产品立项评审」「新功能上线后数据不好怎么办」"
                className="flex-1 px-4 py-3 bg-surface border border-border rounded-xl text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-brand-purple/20 focus:border-brand-purple"
                disabled={searching}
              />
              <button
                onClick={() => handleAiSearch()}
                disabled={searching || !aiQuery.trim()}
                className="btn-purple px-5 py-3 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {searching ? '搜索中...' : '推荐方案'}
              </button>
            </div>
            <div className="flex flex-wrap gap-2 mt-3">
              {sampleCombos.map((combo) => (
                <button
                  key={combo.id}
                  onClick={() => { setAiQuery(combo.question); handleAiSearch(combo.question) }}
                  className="text-xs px-3 py-1.5 rounded-full bg-brand-purple-surface text-brand-purple hover:bg-brand-purple/10 transition-colors"
                  disabled={searching}
                >
                  {combo.question}
                </button>
              ))}
            </div>
          </div>

          {/* API Key Input Modal */}
          <AnimatePresence>
            {showKeyInput && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                className="bg-white rounded-card p-5 border border-amber-200 shadow-card-hover mb-5"
              >
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-lg">🔑</span>
                  <h3 className="text-sm font-bold text-text-primary">需要 DeepSeek API Key</h3>
                  <button onClick={() => setShowKeyInput(false)} className="ml-auto text-xs text-text-tertiary hover:text-text-primary">✕</button>
                </div>
                <p className="text-xs text-text-secondary mb-3">
                  AI 推荐需要调用 DeepSeek API。你的 Key 只存在浏览器本地，不会上传到任何服务器。
                </p>
                <div className="flex gap-2">
                  <input
                    type="password"
                    value={tempKey}
                    onChange={(e) => setTempKey(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSaveKey()}
                    placeholder="sk-..."
                    className="flex-1 px-3 py-2 bg-surface border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-purple/20"
                  />
                  <button onClick={handleSaveKey} className="btn-primary text-sm px-4 py-2">
                    保存
                  </button>
                </div>
                <p className="text-[11px] text-text-tertiary mt-2">
                  前往 <a href="https://platform.deepseek.com" target="_blank" rel="noreferrer" className="text-brand-purple hover:underline">platform.deepseek.com</a> 获取 API Key
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Search Loading */}
          <AnimatePresence>
            {searching && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                className="bg-white rounded-card p-6 border border-brand-purple/20 shadow-card-hover mb-5"
              >
                <div className="flex items-center gap-3">
                  <div className="relative w-8 h-8">
                    <div className="absolute inset-0 rounded-full border-2 border-brand-purple/20" />
                    <div className="absolute inset-0 rounded-full border-2 border-brand-purple border-t-transparent animate-spin" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-text-primary">🧠 正在为你分析...</p>
                    <p className="text-xs text-text-tertiary mt-0.5">从 {filteredSkills.length} 个蒸馏物中匹配最佳方案</p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Search Error Notice */}
          {searchError && (
            <div className="text-xs text-amber-600 bg-amber-50 rounded-lg px-3 py-2 mb-4">
              ⚠️ {searchError}
            </div>
          )}

          {/* Search Result */}
          <AnimatePresence>
            {searchResult && searchResult.skills.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                className="bg-white rounded-card p-6 border border-brand-purple/20 shadow-card-hover mb-5"
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">🧩</span>
                  <h3 className="text-base font-bold text-text-primary">推荐方案</h3>
                  <button onClick={() => setSearchResult(null)} className="ml-auto text-xs text-text-tertiary hover:text-text-primary">✕ 关闭</button>
                </div>
                <p className="text-sm text-text-secondary mb-5">{searchResult.description}</p>
                <div className="relative">
                  <div className="absolute left-6 top-8 bottom-8 w-0.5 bg-gradient-to-b from-brand-purple to-brand-green rounded" />
                  <div className="space-y-4">
                    {searchResult.skills.map((skill, i) => (
                      <motion.div key={skill.id} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 + i * 0.15 }} className="flex items-center gap-4 relative">
                        <div className="w-12 h-12 rounded-full bg-brand-purple-surface flex items-center justify-center text-sm font-bold text-brand-purple z-10 border-2 border-white">{i + 1}</div>
                        <div className="flex-1 p-4 bg-surface rounded-xl border border-border hover:border-brand-purple/30 hover:bg-brand-purple-surface/30 transition-all cursor-pointer" onClick={() => navigate(`/skills/${skill.id}`)}>
                          <div className="text-sm font-semibold text-text-primary">{skill.name}</div>
                          <div className="text-xs text-text-secondary mt-0.5">{skill.role}</div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
                <div className="mt-5 pt-4 border-t border-border flex items-center justify-between">
                  <span className="text-xs text-text-tertiary">Agent 可以按这个顺序自动执行</span>
                  <button className="btn-primary text-sm px-4 py-2">🚀 一键执行全部</button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* No Result */}
          <AnimatePresence>
            {searchResult && searchResult.skills.length === 0 && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                className="bg-white rounded-card p-5 border border-border mb-5 text-center"
              >
                <span className="text-2xl">🤔</span>
                <p className="text-sm text-text-secondary mt-2">{searchResult.description}</p>
                <p className="text-xs text-text-tertiary mt-1">试试描述得更具体一些，比如「我需要做竞品分析报告」</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Track Filter */}
          <div className="flex items-center gap-2 mb-4 flex-wrap">
            <button
              onClick={() => setFilterTrack(null)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                !filterTrack
                  ? 'bg-text-primary text-white'
                  : 'bg-white border border-border text-text-secondary hover:text-text-primary'
              }`}
            >
              全部
            </button>
            {tracks.map((track) => (
              <button
                key={track.id}
                onClick={() => setFilterTrack(track.id === filterTrack ? null : track.id)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                  filterTrack === track.id
                    ? 'text-white'
                    : 'bg-white border border-border text-text-secondary hover:text-text-primary'
                }`}
                style={filterTrack === track.id ? { backgroundColor: track.color } : undefined}
              >
                {track.icon} {track.name}
              </button>
            ))}
          </div>

          {/* Count + Sort */}
          <div className="flex items-center justify-between mb-4">
            <div className="text-xs text-text-tertiary">
              共 {filteredSkills.length} 个蒸馏物
            </div>
            <div className="flex items-center gap-1 bg-white border border-border rounded-btn p-1">
              {[
                { key: 'hot' as const, label: '🔥 热门' },
                { key: 'new' as const, label: '🆕 最新' },
                { key: 'rating' as const, label: '⭐ 评分' },
              ].map((sort) => (
                <button
                  key={sort.key}
                  onClick={() => setFilterSort(sort.key)}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                    filterSort === sort.key
                      ? 'bg-brand-green text-white'
                      : 'text-text-secondary hover:text-text-primary hover:bg-surface-hover'
                  }`}
                >
                  {sort.label}
                </button>
              ))}
            </div>
          </div>

          {/* Skills Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredSkills.map((skill, i) => (
              <SkillCard key={skill.id} skill={skill} index={i} />
            ))}
          </div>

          {filteredSkills.length === 0 && (
            <div className="text-center py-20">
              <span className="text-4xl mb-4 block">🔍</span>
              <p className="text-text-secondary">没有找到匹配的蒸馏物</p>
              <p className="text-xs text-text-tertiary mt-1">试试其他赛道筛选</p>
            </div>
          )}
        </div>

        {/* Sidebar — Plugin Install Guide */}
        <div className="w-[280px] shrink-0 hidden lg:block">
          <div className="sticky top-8 space-y-5">
            {/* Agent Auto-Find Plugin */}
            <div className="bg-gradient-to-br from-brand-green-surface to-white rounded-2xl p-5 border border-brand-green/10">
              <h3 className="text-sm font-bold text-text-primary mb-2">🦐 让 Agent 帮你找</h3>
              <p className="text-[13px] text-text-secondary leading-relaxed mb-4">
                不用自己逛广场。装上 Plugin 后，Agent 在帮你干活时会<strong className="text-text-primary">自动从社区找到更好的方法</strong>，装上就用，你甚至不用知道。
              </p>

              {/* Simulated scenario */}
              <div className="bg-gray-900 rounded-lg p-3 mb-4 font-mono text-[12px] leading-relaxed">
                <div className="text-gray-500">// 你让 Agent 做竞品分析</div>
                <div className="text-gray-300 mt-1">🦐 发现社区有更好的方法...</div>
                <div className="text-green-400 mt-1">✓ 已安装「竞品五维分析」</div>
                <div className="text-green-400">✓ 用新方法帮你完成 ✨</div>
                <div className="text-gray-500 mt-1">// 比你之前的方法快了 4x</div>
              </div>

              {/* Install */}
              <div className="bg-gray-900 rounded-lg p-3 mb-3">
                <code className="text-[11px] text-green-400 font-mono">/plugin install distill@distill-community</code>
              </div>
              <button
                onClick={() => navigator.clipboard.writeText('/plugin install distill@distill-community')}
                className="w-full btn-primary text-sm"
              >
                复制安装命令
              </button>
              <div className="flex flex-wrap gap-1.5 mt-3">
                {['Claude Code', 'OpenClaw', 'Hermes'].map((a) => (
                  <span key={a} className="text-[11px] px-2 py-0.5 rounded-full bg-white border border-border text-text-tertiary">{a}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
