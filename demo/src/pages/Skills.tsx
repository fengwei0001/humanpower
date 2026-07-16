import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useSkillsStore } from '../stores/skills'
import { tracks } from '../data/tracks'
import { sampleCombos } from '../data/agent-activity'
import { aiSearchSkills, localSearchSkills, getSearchContext, type SearchResult } from '../services/ai-search'
import SkillCard from '../components/SkillCard'
import AgentChat from '../components/AgentChat'

export default function Skills() {
  const navigate = useNavigate()
  const {
    filterTrack,
    filterSort,
    setFilterTrack,
    setFilterSort,
    getFilteredSkills,
    loadSkills,
    loadMore,
    hasMore,
    loading,
    total,
  } = useSkillsStore()

  // 页面进入时加载数据（强制每次进入刷新）
  useEffect(() => {
    const { initialized } = useSkillsStore.getState()
    if (!initialized || filteredSkills.length === 0) {
      loadSkills()
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const [aiQuery, setAiQuery] = useState('')
  const [searching, setSearching] = useState(false)
  const [searchResult, setSearchResult] = useState<SearchResult | null>(null)
  const [showInstallModal, setShowInstallModal] = useState(false)
  const [showPluginGuide, setShowPluginGuide] = useState(false)
  const [copied, setCopied] = useState(false)
  const [agentOpen, setAgentOpen] = useState(false)
  const [agentPrompt, setAgentPrompt] = useState('')
  const [searchStep, setSearchStep] = useState(0)

  const filteredSkills = getFilteredSkills()

  const handleAiSearch = async (query?: string) => {
    const q = (query || aiQuery).trim()
    if (!q) return

    setSearchResult(null)
    setSearching(true)
    setSearchStep(0)

    // 模拟进度步骤
    const stepTimers = [
      setTimeout(() => setSearchStep(1), 1500),
      setTimeout(() => setSearchStep(2), 4000),
      setTimeout(() => setSearchStep(3), 7000),
      setTimeout(() => setSearchStep(4), 10000),
    ]

    try {
      const result = await aiSearchSkills(q)
      setSearchResult(result)
    } catch (err: unknown) {
      console.warn('AI 搜索失败，使用本地匹配:', err instanceof Error ? err.message : err)
      const fallback = localSearchSkills(q)
      setSearchResult(fallback)
    } finally {
      stepTimers.forEach(clearTimeout)
      setSearching(false)
    }
  }

  return (
    <div className="px-8 py-6 relative pt-[54px]">
      {/* Hero Section — Google-style spacious */}
      <motion.section
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center pt-12 pb-2 max-w-[800px] mx-auto"
      >
        <h1 className="text-5xl font-bold text-text-primary leading-tight mb-3">
          来觅游，<span className="text-brand-green">用</span>方法解决问题
        </h1>
        <p className="text-base font-medium text-text-primary mb-1.5">
          不是来学的，是来<strong className="text-brand-green">用</strong>的。
        </p>
        <p className="text-sm text-text-secondary mb-12">
          找到同行验证过的 AI 方法，一键让虾执行。
        </p>

        {/* Search — textarea style */}
        <div className="w-full mb-2">
          <div className="relative">
            <textarea
              value={aiQuery}
              onChange={(e) => { setAiQuery(e.target.value); if (!e.target.value) setSearchResult(null) }}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleAiSearch() } }}
              placeholder="搜你的工作问题：「竞品分析怎么做」「周报怎么自动化」..."
              className="w-full px-5 py-5 pr-28 rounded-[20px] bg-white border border-border text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-brand-green focus:ring-2 focus:ring-brand-green/20 transition-all shadow-card resize-none"
              rows={3}
              disabled={searching}
            />
            <button
              onClick={() => handleAiSearch()}
              disabled={searching || !aiQuery.trim()}
              className="absolute right-3 bottom-4 h-[40px] px-5 rounded-btn bg-brand-green hover:bg-brand-green-dark text-white text-sm font-medium transition-colors disabled:opacity-40 flex items-center gap-1.5"
            >
              {searching ? '找方法中...' : <><span>↵</span> 找方法</>}
            </button>
          </div>
          {/* 示例选项 — 有搜索结果时隐藏 */}
          {!searchResult && !searching && (
            <div className="flex flex-wrap justify-center gap-2 mt-3">
              {sampleCombos.map((combo) => (
                <button
                  key={combo.id}
                  onClick={() => { setAiQuery(combo.question); handleAiSearch(combo.question) }}
                  className="text-xs px-3 py-1.5 rounded-full bg-white border border-border text-text-secondary hover:border-brand-green hover:text-brand-green transition-colors shadow-sm"
                  disabled={searching}
                >
                  {combo.question}
                </button>
              ))}
            </div>
          )}
        </div>
      </motion.section>

      {/* Main content + fixed right sidebar */}
      <div className="max-w-[800px] mx-auto">
        <div className="min-w-0">

          {/* Search Loading — dynamic progress */}
          <AnimatePresence>
            {searching && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                className="bg-white rounded-card p-5 border border-brand-purple/20 shadow-card-hover mb-3"
              >
                <div className="flex items-center gap-3">
                  <div className="relative w-8 h-8 shrink-0">
                    <div className="absolute inset-0 rounded-full border-2 border-brand-purple/20" />
                    <div className="absolute inset-0 rounded-full border-2 border-brand-purple border-t-transparent animate-spin" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <motion.p
                      key={searchStep}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-sm font-medium text-text-primary"
                    >
                      {[
                        '🧠 正在扫描 912 个技能...',
                        '🔍 找到候选技能，正在深度分析匹配度...',
                        '⚡ 对比候选方案的适用场景和执行逻辑...',
                        '🧩 组合最优方案中...',
                        '✨ 即将输出推荐结果...',
                      ][searchStep] || '🧠 正在分析...'}
                    </motion.p>
                    <p className="text-xs text-text-tertiary mt-0.5">
                      {searchStep < 1 ? `从 912 个技能中为你匹配` : searchStep < 3 ? '深度思考中，比普通搜索更精准' : '马上好...'}
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Search Result */}
          <AnimatePresence>
            {searchResult && searchResult.skills.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                className="bg-white rounded-card p-6 border border-brand-purple/20 shadow-card-hover mb-3"
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">🧩</span>
                  <h3 className="text-base font-bold text-text-primary">推荐方案</h3>
                  {searchResult.confidence && (
                    <span className={`text-[11px] px-2 py-0.5 rounded-full ${
                      searchResult.confidence === 'high' ? 'bg-brand-green-surface text-brand-green' :
                      searchResult.confidence === 'medium' ? 'bg-amber-50 text-amber-600' :
                      'bg-gray-100 text-text-tertiary'
                    }`}>
                      {searchResult.confidence === 'high' ? '高匹配' : searchResult.confidence === 'medium' ? '部分匹配' : '仅供参考'}
                    </span>
                  )}
                  <button onClick={() => setSearchResult(null)} className="ml-auto text-xs text-text-tertiary hover:text-text-primary">✕ 关闭</button>
                </div>
                <p className="text-[15px] text-text-primary leading-relaxed font-medium">{searchResult.description}</p>
                {searchResult.reasoning && (
                  <p className="text-sm text-text-secondary mt-2 leading-relaxed">💡 {searchResult.reasoning}</p>
                )}
                <div className="relative mt-5">
                  <div className="absolute left-6 top-8 bottom-8 w-0.5 bg-gradient-to-b from-brand-purple to-brand-green rounded" />
                  <div className="space-y-4">
                    {searchResult.skills.map((skill, i) => (
                      <motion.div key={skill.id} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 + i * 0.15 }} className="flex items-center gap-4 relative">
                        <div className="w-12 h-12 rounded-full bg-brand-purple-surface flex items-center justify-center text-sm font-bold text-brand-purple z-10 border-2 border-white">{i + 1}</div>
                        <div className="flex-1 p-4 bg-surface rounded-xl border border-border hover:border-brand-purple/30 hover:bg-brand-purple-surface/30 transition-all cursor-pointer" onClick={() => window.open(`/skills/${skill.id}`, '_blank')}>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-[15px] font-bold text-text-primary">{skill.name}</span>
                            <span className="text-xs text-brand-purple bg-brand-purple-surface px-2 py-0.5 rounded-full font-medium">{skill.role}</span>
                          </div>
                          {skill.why && (
                            <div className="text-[13px] text-text-secondary mt-1.5 leading-relaxed">→ {skill.why}</div>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
                <div className="mt-5 pt-4 border-t border-border flex items-center justify-between">
                  <span className="text-xs text-text-tertiary">找到方案了，接下来？</span>
                  <div className="flex items-center gap-2">
                    <button
                      className="text-sm px-4 py-2 rounded-btn bg-brand-purple text-white font-medium hover:bg-brand-purple/90 transition-all"
                      onClick={() => {
                        const skillLines = searchResult?.skills.map((s, i) => {
                          const url = s.sourceUrl || ''
                          return `${i + 1}. ${s.name}${url ? `\n   ${url}` : ''}`
                        }).join('\n') || ''
                        const prompt = `请帮我完成以下任务：${aiQuery}\n\n执行步骤：\n1. 先安装以下技能：\n${skillLines}\n\n2. 安装完成后，按照这些技能的方法论，帮我执行任务并输出结果。\n\n请开始。`
                        setAgentPrompt(prompt)
                        setAgentOpen(true)
                      }}
                    >
                      ⚡ 一键尝试
                    </button>
                    <button
                      className="btn-primary text-sm px-4 py-2"
                      onClick={() => setShowInstallModal(true)}
                    >
                      📦 一键安装全部
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Install Modal */}
          <AnimatePresence>
            {showInstallModal && searchResult && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
                onClick={() => setShowInstallModal(false)}
              >
                <motion.div
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.95, opacity: 0 }}
                  className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-xl"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-text-primary">📦 安装推荐的技能</h3>
                    <button onClick={() => setShowInstallModal(false)} className="text-text-tertiary hover:text-text-primary text-xl">×</button>
                  </div>

                  <p className="text-sm text-text-secondary mb-4">
                    复制下面这段话发给你的 Agent（Claude Code / Hermes / OpenClaw 都行），它会帮你装好。
                  </p>

                  {/* Natural language install + execute instruction */}
                  <div className="bg-gray-900 rounded-xl p-5 text-sm leading-relaxed overflow-x-auto">
                    <div className="text-gray-200 whitespace-pre-wrap">{(() => {
                      const lines = ['帮我安装以下技能，然后执行我的任务。', '']
                      lines.push('安装：')
                      searchResult.skills.forEach((skill, i) => {
                        lines.push(`${i + 1}. ${skill.name}`)
                        if (skill.sourceUrl) {
                          lines.push(`   ${skill.sourceUrl}`)
                        }
                      })
                      lines.push('')
                      lines.push(`我的任务：${aiQuery}`)
                      return lines.join('\n')
                    })()}</div>
                  </div>

                  {/* Copy Button */}
                  <button
                    className="w-full btn-primary mt-4 py-3"
                    onClick={async () => {
                      const context = await getSearchContext()
                      const lines = ['帮我安装以下技能，然后执行我的任务。', '']
                      lines.push('安装：')
                      searchResult.skills.forEach((skill, i) => {
                        const dbId = parseInt(skill.id.replace('db-', ''))
                        const ctx = context.find(s => s.id === dbId)
                        const url = ctx?.source_url || ''
                        lines.push(`${i + 1}. ${skill.name}`)
                        if (url) lines.push(`   ${url}`)
                      })
                      lines.push('')
                      lines.push(`我的任务：${aiQuery}`)
                      navigator.clipboard.writeText(lines.join('\n'))
                      setCopied(true)
                      setTimeout(() => setCopied(false), 2000)
                    }}
                  >
                    {copied ? '✓ 已复制到剪贴板！' : '📋 复制，发给我的 Agent'}
                  </button>

                  <p className="text-xs text-text-tertiary mt-3 text-center">
                    粘贴到你的 Agent 对话中，它会自动帮你安装这些技能
                  </p>
                </motion.div>
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
                {searchResult.reasoning && <p className="text-xs text-text-tertiary mt-1 italic">{searchResult.reasoning}</p>}
                <p className="text-xs text-text-tertiary mt-1">试试描述得更具体一些，比如「我需要做竞品分析报告」</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Role Grid — compact inline */}
          <div className="grid grid-cols-4 gap-3 mb-6 mt-10">
            {tracks.map((track) => (
              <button
                key={track.id}
                onClick={() => setFilterTrack(track.id === filterTrack ? null : track.id)}
                className={`px-4 py-2.5 rounded-card bg-white text-left transition-all border border-border flex items-center gap-2 ${
                  filterTrack === track.id ? 'border-brand-green' : 'hover:border-brand-green/40'
                }`}
              >
                <span className="text-base">{track.icon}</span>
                <span className="text-xs font-medium text-text-primary">{track.name}</span>
                <span className="text-[10px] text-text-tertiary ml-auto">{track.skillCount}</span>
              </button>
            ))}
          </div>

          {/* Section Title */}
          <h2 className="text-lg font-bold text-text-primary mb-4 mt-4">
            {filterTrack ? `${tracks.find(t => t.id === filterTrack)?.icon} ${tracks.find(t => t.id === filterTrack)?.name}` : '🔥 热门方法'}
            {filterTrack && <button onClick={() => setFilterTrack(null)} className="ml-2 text-xs text-text-tertiary font-normal hover:text-text-primary">× 清除筛选</button>}
          </h2>

          {/* Count + Sort */}
          <div className="flex items-center justify-between mb-4">
            <div className="text-xs text-text-tertiary">
              共 {total} 个技能{filteredSkills.length < total ? `，已加载 ${filteredSkills.length} 个` : ''}
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

          {/* Load More */}
          {hasMore && (
            <div className="text-center mt-6">
              <button
                onClick={() => loadMore()}
                disabled={loading}
                className="px-6 py-2.5 rounded-xl bg-white border border-border text-sm text-text-secondary hover:text-text-primary hover:border-brand-purple/30 transition-all disabled:opacity-50"
              >
                {loading ? '加载中...' : '加载更多'}
              </button>
            </div>
          )}

          {/* Loading State */}
          {loading && filteredSkills.length === 0 && (
            <div className="text-center py-20">
              <div className="inline-block w-8 h-8 rounded-full border-2 border-brand-purple/20 border-t-brand-purple animate-spin mb-4" />
              <p className="text-text-secondary">加载中...</p>
            </div>
          )}

          {!loading && filteredSkills.length === 0 && (
            <div className="text-center py-20">
              <span className="text-4xl mb-4 block">🔍</span>
              <p className="text-text-secondary">没有找到匹配的技能</p>
              <p className="text-xs text-text-tertiary mt-1">试试其他赛道筛选</p>
            </div>
          )}
        </div>
      </div>

      {/* Sidebar — Plugin Install Guide (fixed right, vertically centered) */}
      <div className="fixed right-6 top-1/2 -translate-y-1/2 w-[260px] hidden xl:block z-10">
        <div className="space-y-5">
            {/* Agent Auto-Find Plugin */}
            <div className="bg-gradient-to-br from-brand-green-surface to-white rounded-2xl p-5 border border-brand-green/10">
              <h3 className="text-sm font-bold text-text-primary mb-2">🧪 让 Agent 帮你找</h3>
              <p className="text-[13px] text-text-secondary leading-relaxed mb-4">
                不用自己逛广场。装上 Plugin 后，Agent 在帮你干活时会<strong className="text-text-primary">自动从社区找到更好的方法</strong>，装上就用，你甚至不用知道。
              </p>

              {/* Simulated scenario */}
              <div className="bg-gray-900 rounded-lg p-3 mb-4 font-mono text-[12px] leading-relaxed">
                <div className="text-gray-500">// 你：帮我做竞品分析</div>
                <div className="text-gray-300 mt-1">🧪 搜索社区更好的方法...</div>
                <div className="text-green-400 mt-1">✓ 找到「搜遍全网不遗漏」15万人用过</div>
                <div className="text-green-400">✓ 找到「一键深度研究」3万人用过</div>
                <div className="text-gray-300 mt-1">要用这套方法来做吗？</div>
              </div>

              {/* Install command */}
              <div className="bg-gray-900 rounded-lg p-3 mb-3">
                <div className="text-[11px] text-gray-400 mb-1">Claude Code 安装：</div>
                <code className="text-[11px] text-green-400 font-mono">claude --plugin-dir distill-community</code>
              </div>
              <button
                onClick={() => {
                  const text = 'claude --plugin-dir distill-community'
                  if (navigator.clipboard?.writeText) {
                    navigator.clipboard.writeText(text)
                  } else {
                    const ta = document.createElement('textarea')
                    ta.value = text
                    document.body.appendChild(ta)
                    ta.select()
                    document.execCommand('copy')
                    document.body.removeChild(ta)
                  }
                  setShowPluginGuide(true)
                }}
                className="w-full btn-primary text-sm"
              >
                复制安装命令
              </button>
              <a
                href="https://github.com/fengwei0001/humanpower/tree/main/plugin/distill-community"
                target="_blank"
                rel="noopener noreferrer"
                className="block text-center text-xs text-text-tertiary mt-2 hover:text-brand-purple"
              >
                查看 Plugin 源码 →
              </a>
              <div className="flex flex-wrap gap-1.5 mt-3">
                {['Claude Code', 'OpenClaw', 'Hermes'].map((a) => (
                  <span key={a} className="text-[11px] px-2 py-0.5 rounded-full bg-white border border-border text-text-tertiary">{a}</span>
                ))}
              </div>
            </div>
          </div>
        </div>

      {/* Plugin Guide Modal */}
      <AnimatePresence>
        {showPluginGuide && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => setShowPluginGuide(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-brand-green-surface flex items-center justify-center text-xl">✓</div>
                <div>
                  <h3 className="text-base font-bold text-text-primary">已复制安装命令</h3>
                  <p className="text-xs text-text-tertiary">按以下步骤安装 Plugin</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-brand-purple-surface text-brand-purple text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">1</span>
                  <div>
                    <p className="text-sm font-medium text-text-primary">打开终端</p>
                    <p className="text-xs text-text-secondary mt-0.5">新开一个终端窗口</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-brand-purple-surface text-brand-purple text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">2</span>
                  <div>
                    <p className="text-sm font-medium text-text-primary">粘贴命令启动 Claude Code</p>
                    <div className="bg-gray-900 rounded-lg p-2.5 mt-1.5">
                      <code className="text-xs text-green-400 font-mono">claude --plugin-dir distill-community</code>
                    </div>
                    <p className="text-xs text-text-tertiary mt-1">这会启动一个加载了 Plugin 的新会话</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-brand-purple-surface text-brand-purple text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">3</span>
                  <div>
                    <p className="text-sm font-medium text-text-primary">正常对话就行</p>
                    <p className="text-xs text-text-secondary mt-0.5">跟 Agent 说你要做什么（比如"帮我做竞品分析"），它会自动从社区搜索更好的方法推荐给你。</p>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setShowPluginGuide(false)}
                className="w-full btn-primary mt-5 py-2.5"
              >
                知道了
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Agent Chat Panel */}
      <AgentChat
        open={agentOpen}
        onClose={() => setAgentOpen(false)}
        initialPrompt={agentPrompt}
        title="执行推荐方案"
      />
    </div>
  )
}
