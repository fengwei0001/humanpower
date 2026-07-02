import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import {
  streamChat,
  parseSkillFromResponse,
  hasApiKey,
  setApiKey,
  getApiKey,
  type ChatMessage,
} from '../services/ai'
import { useSkillsStore } from '../stores/skills'
import { useUserStore } from '../stores/user'
import { distillDrafts, type DistillDraft } from '../data/agent-activity'

function DistillDraftsSection({ startManualMode }: { startManualMode: () => void }) {
  const [drafts, setDrafts] = useState<DistillDraft[]>(distillDrafts.map(d => ({ ...d })))
  const [showShareModal, setShowShareModal] = useState<DistillDraft | null>(null)

  const handleConfirm = (id: string) => {
    setDrafts(prev => prev.map(d => d.id === id ? { ...d, status: 'confirmed' as const } : d))
  }

  const handleShare = (draft: DistillDraft) => {
    setShowShareModal(draft)
  }

  const confirmShare = () => {
    if (showShareModal) {
      setDrafts(prev => prev.map(d => d.id === showShareModal.id ? { ...d, status: 'shared' as const } : d))
      setShowShareModal(null)
    }
  }

  return (
    <>
      <div className="bg-white rounded-card p-5 border border-border mb-5">
        <h3 className="text-base font-bold text-text-primary mb-4">⚗️ Agent 蒸馏的草稿</h3>
        <div className="space-y-3">
          {drafts.map((draft) => (
            <div key={draft.id} className={`p-4 rounded-xl border transition-all ${
              draft.status === 'shared' ? 'bg-brand-green-surface border-brand-green/20' :
              draft.status === 'confirmed' ? 'bg-brand-purple-surface border-brand-purple/20' :
              'bg-surface border-border'
            }`}>
              <div className="flex items-start justify-between mb-2">
                <div>
                  <div className="text-sm font-semibold text-text-primary flex items-center gap-2">
                    {draft.name}
                    {draft.status === 'shared' && <span className="text-[11px] px-2 py-0.5 rounded-full bg-brand-green/10 text-brand-green font-medium">已分享 🎉</span>}
                    {draft.status === 'confirmed' && <span className="text-[11px] px-2 py-0.5 rounded-full bg-brand-purple/10 text-brand-purple font-medium">已确认 ✓</span>}
                  </div>
                  <div className="text-xs text-text-tertiary mt-0.5">💡 {draft.trigger} · 信心度 {draft.confidence}%</div>
                </div>
                <span className="text-xs text-brand-green font-medium shrink-0">已用 {draft.usedCount} 次</span>
              </div>
              <p className="text-xs text-text-secondary mb-3">{draft.description}</p>
              <div className="flex items-center gap-2">
                {draft.status === 'pending' && (
                  <button onClick={() => handleConfirm(draft.id)} className="px-3 py-1.5 text-xs font-medium bg-brand-purple text-white rounded-lg hover:bg-brand-purple/90 transition-all">
                    ✓ 确认好用
                  </button>
                )}
                {draft.status === 'confirmed' && (
                  <button onClick={() => handleShare(draft)} className="px-3 py-1.5 text-xs font-medium bg-brand-green text-white rounded-lg hover:bg-brand-green-dark transition-all">
                    🚀 分享到社区
                  </button>
                )}
                {draft.status === 'shared' && (
                  <span className="text-xs text-brand-green font-medium">声望 +50</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Share Modal */}
      <AnimatePresence>
        {showShareModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setShowShareModal(null)}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl" onClick={e => e.stopPropagation()}>
              <div className="text-center mb-5">
                <span className="text-4xl block mb-3">🚀</span>
                <h2 className="text-lg font-bold text-text-primary">分享到觅游社区？</h2>
              </div>
              <div className="bg-surface rounded-xl p-4 mb-4">
                <div className="text-sm font-semibold text-text-primary mb-1">{showShareModal.name}</div>
                <div className="text-xs text-text-secondary">{showShareModal.description}</div>
              </div>
              <div className="grid grid-cols-3 gap-3 mb-5">
                <div className="text-center p-3 bg-brand-green-surface rounded-xl">
                  <div className="text-lg font-bold text-brand-green">{showShareModal.usedCount}</div>
                  <div className="text-[11px] text-text-tertiary">已验证次数</div>
                </div>
                <div className="text-center p-3 bg-brand-purple-surface rounded-xl">
                  <div className="text-lg font-bold text-brand-purple">{showShareModal.communityDemand}</div>
                  <div className="text-[11px] text-text-tertiary">社区需求</div>
                </div>
                <div className="text-center p-3 bg-brand-gold-light rounded-xl">
                  <div className="text-lg font-bold text-amber-600">+50</div>
                  <div className="text-[11px] text-text-tertiary">预估声望</div>
                </div>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setShowShareModal(null)} className="flex-1 btn-secondary text-sm">再想想</button>
                <button onClick={confirmShare} className="flex-1 btn-primary text-sm">确认分享 🎉</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

export default function Distill() {
  const navigate = useNavigate()
  const addSkill = useSkillsStore((s) => s.addSkill)
  const user = useUserStore((s) => s.user)
  const [pluginInstalled, setPluginInstalled] = useState(false)
  const [showManualMode, setShowManualMode] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const [generatedSkill, setGeneratedSkill] = useState<Record<string, unknown> | null>(null)
  const [showApiKeyModal, setShowApiKeyModal] = useState(false)
  const [apiKeyInput, setApiKeyInput] = useState(getApiKey())
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const startManualMode = () => {
    if (!hasApiKey()) {
      setShowApiKeyModal(true)
      return
    }
    setShowManualMode(true)
    if (messages.length === 0) {
      setMessages([{
        id: 'greeting',
        role: 'assistant',
        content: '⚗️ 你好！我是蒸馏师。\n\n告诉我你最擅长什么，或者同事经常找你帮忙处理什么问题？我帮你把这些经验提炼成可执行的蒸馏物。',
        timestamp: new Date(),
      }])
    }
  }

  const handleSend = async () => {
    if (!input.trim() || isStreaming) return
    const userMessage: Message = { id: `msg-${Date.now()}`, role: 'user', content: input.trim(), timestamp: new Date() }
    setMessages((prev) => [...prev, userMessage])
    setInput('')
    setIsStreaming(true)

    const chatHistory: ChatMessage[] = messages.filter((m) => m.id !== 'greeting').map((m) => ({ role: m.role, content: m.content }))
    chatHistory.push({ role: 'user', content: userMessage.content })

    const assistantId = `msg-${Date.now()}-ai`
    setMessages((prev) => [...prev, { id: assistantId, role: 'assistant', content: '', timestamp: new Date() }])

    try {
      let fullContent = ''
      for await (const chunk of streamChat(chatHistory)) {
        fullContent += chunk
        setMessages((prev) => prev.map((m) => (m.id === assistantId ? { ...m, content: fullContent } : m)))
        const skill = parseSkillFromResponse(fullContent)
        if (skill) setGeneratedSkill(skill)
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : '未知错误'
      setMessages((prev) => prev.map((m) => m.id === assistantId ? { ...m, content: `❌ 出错了：${errorMsg}` } : m))
    } finally {
      setIsStreaming(false)
    }
  }

  const handlePublishSkill = () => {
    if (!generatedSkill) return
    addSkill({
      id: `skill-${Date.now()}`, name: (generatedSkill.name as string) || '未命名', description: (generatedSkill.description as string) || '',
      trackId: user.trackId, trackIds: [user.trackId], subDomain: '', creator: { name: user.name, avatar: user.avatar },
      installs: 0, citations: 0, rating: 0, successRate: 0, tags: (generatedSkill.tags as string[]) || [],
      createdAt: new Date().toISOString().split('T')[0], steps: (generatedSkill.steps as string[]) || [],
      input: (generatedSkill.input as string) || '', output: (generatedSkill.output as string) || '', scenario: (generatedSkill.scenario as string) || '',
    })
    navigate('/skills')
  }

  const saveApiKey = () => {
    if (apiKeyInput.trim()) { setApiKey(apiKeyInput.trim()); setShowApiKeyModal(false); startManualMode() }
  }

  return (
    <div className="h-full overflow-y-auto">
      {/* API Key Modal */}
      <AnimatePresence>
        {showApiKeyModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl">
              <div className="text-center mb-6">
                <span className="text-4xl block mb-3">⚗️</span>
                <h2 className="text-xl font-bold text-text-primary">启动蒸馏引擎</h2>
                <p className="text-sm text-text-secondary mt-2">输入 DeepSeek API Key 开始手动蒸馏</p>
              </div>
              <input type="password" value={apiKeyInput} onChange={(e) => setApiKeyInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && saveApiKey()} placeholder="sk-..." className="w-full px-4 py-3 bg-surface border border-border rounded-btn text-sm font-mono focus:outline-none focus:ring-2 focus:ring-brand-purple/30 focus:border-brand-purple" />
              <p className="text-[11px] text-text-tertiary mt-2">Key 仅存储在浏览器本地。获取：<a href="https://platform.deepseek.com/api_keys" target="_blank" className="text-brand-purple hover:underline">platform.deepseek.com</a></p>
              <button onClick={saveApiKey} className="w-full btn-purple text-sm mt-4">开始蒸馏 →</button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {!showManualMode ? (
        /* ═══════════════════════════════════════════════ */
        /* Plugin Install Guide (Primary) */
        /* ═══════════════════════════════════════════════ */
        <div className="p-8 max-w-[1100px] mx-auto">
          {/* Main CTA — Install Plugin */}
          {!pluginInstalled ? (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="mb-8">
              {/* Hero */}
              <div className="mb-8">
                <h1 className="text-2xl font-bold text-text-primary mb-2">自动蒸馏：Agent 主动"抢"着帮你干</h1>
                <p className="text-base text-text-secondary leading-relaxed">
                  它在日常中默默观察你的工作方式，学会之后主动来帮你分担。你不需要教它——它自己会悟。
                </p>
              </div>

              <div className="flex gap-6">
                {/* Left: 4-Step Vertical List */}
                <div className="flex-1 space-y-5">
                  {/* Step 1 */}
                  <motion.div initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 }} className="bg-white rounded-2xl p-5 border border-border">
                    <div className="flex items-center gap-3 mb-3">
                      <span className="w-8 h-8 rounded-full bg-brand-purple-surface text-brand-purple text-sm font-bold flex items-center justify-center">1</span>
                      <span className="text-base font-bold text-text-primary">默默观察 👁️</span>
                      <span className="text-xs text-text-tertiary">— Agent 在后台分析你的工作模式</span>
                    </div>
                    <div className="bg-gray-900 rounded-lg p-4 font-mono text-[13px] leading-relaxed">
                      <div className="text-gray-500 mb-1">// Agent 后台日志</div>
                      <div className="text-green-400">✓ 检测到重复模式</div>
                      <div className="text-gray-300 mt-1">用户本周第 <span className="text-yellow-300">3</span> 次用相同方式整理会议纪要：</div>
                      <div className="text-gray-400 ml-3 mt-1">→ 提取决策点</div>
                      <div className="text-gray-400 ml-3">→ 列行动项 + Owner</div>
                      <div className="text-gray-400 ml-3">→ 标注遗留问题</div>
                      <div className="text-green-400 mt-2">⚗️ 触发蒸馏...</div>
                    </div>
                  </motion.div>

                  {/* Step 2 */}
                  <motion.div initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.25 }} className="bg-white rounded-2xl p-5 border border-border">
                    <div className="flex items-center gap-3 mb-3">
                      <span className="w-8 h-8 rounded-full bg-brand-purple-surface text-brand-purple text-sm font-bold flex items-center justify-center">2</span>
                      <span className="text-base font-bold text-text-primary">自动蒸馏 ⚗️</span>
                      <span className="text-xs text-text-tertiary">— 把你的方法论提炼为结构化蒸馏物</span>
                    </div>
                    <div className="bg-gray-900 rounded-lg p-4 font-mono text-[13px] leading-relaxed">
                      <div className="text-gray-500 mb-1">// Agent 自动生成</div>
                      <div className="text-purple-400">⚗️ 蒸馏完成：</div>
                      <div className="text-white mt-1 font-semibold">"会议纪要整理三步法"</div>
                      <div className="text-gray-400 mt-2">步骤 1: 提取所有决策点（✅ 标注）</div>
                      <div className="text-gray-400">步骤 2: 列行动项，标注 Owner + Deadline</div>
                      <div className="text-gray-400">步骤 3: 标注未决问题，设置跟进节点</div>
                      <div className="text-gray-500 mt-2">信心度: <span className="text-green-400">92%</span></div>
                    </div>
                  </motion.div>

                  {/* Step 3 */}
                  <motion.div initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.35 }} className="bg-white rounded-2xl p-5 border border-border">
                    <div className="flex items-center gap-3 mb-3">
                      <span className="w-8 h-8 rounded-full bg-brand-green-surface text-brand-green text-sm font-bold flex items-center justify-center">3</span>
                      <span className="text-base font-bold text-text-primary">悄悄验证 ✅</span>
                      <span className="text-xs text-text-tertiary">— 先帮你跑几次，确认真的好用</span>
                    </div>
                    <div className="bg-gray-900 rounded-lg p-4 font-mono text-[13px] leading-relaxed">
                      <div className="text-gray-500 mb-1">// 下次你开完会...</div>
                      <div className="text-blue-400">📋 检测到新会议纪要</div>
                      <div className="text-gray-300 mt-1">自动执行「会议纪要整理三步法」</div>
                      <div className="text-green-400 mt-2">✓ 执行成功 (第 3/3 次)</div>
                      <div className="text-green-400">✓ 用户未修改结果</div>
                      <div className="text-yellow-300 mt-1">→ 质量已验证，准备推荐分享</div>
                    </div>
                  </motion.div>

                  {/* Step 4 */}
                  <motion.div initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.45 }} className="bg-white rounded-2xl p-5 border border-border">
                    <div className="flex items-center gap-3 mb-3">
                      <span className="w-8 h-8 rounded-full bg-brand-green-surface text-brand-green text-sm font-bold flex items-center justify-center">4</span>
                      <span className="text-base font-bold text-text-primary">邀你分享 🎉</span>
                      <span className="text-xs text-text-tertiary">— 验证好用了才问你</span>
                    </div>
                    <div className="bg-gray-900 rounded-lg p-4 font-mono text-[13px] leading-relaxed">
                      <div className="text-gray-500 mb-1">// Agent 跟你说</div>
                      <div className="text-white">🦐 「老板，这个<span className="text-green-400">会议纪要三步法</span></div>
                      <div className="text-white ml-4">我已经帮你用了 5 次了，每次你都没改。</div>
                      <div className="text-white mt-1 ml-4">社区有 <span className="text-yellow-300">28 人</span> 在找类似的，</div>
                      <div className="text-white ml-4">分享出去帮帮他们？声望 <span className="text-green-400">+50</span>」</div>
                      <div className="text-gray-500 mt-2">[确认分享] [再等等]</div>
                    </div>
                  </motion.div>
                </div>

                {/* Right Sidebar — Sticky */}
                <div className="w-[300px] shrink-0">
                  <div className="sticky top-8 space-y-5">
                    {/* Install Command */}
                    <div className="bg-white rounded-2xl p-5 border border-border">
                      <h3 className="text-sm font-bold text-text-primary mb-1">一行命令，开启自动蒸馏</h3>
                      <p className="text-xs text-text-secondary mb-4">安装后 Agent 在后台默默工作，你什么都不用做。</p>
                      <div className="bg-gray-900 rounded-lg p-3 mb-3">
                        <div className="text-[11px] text-gray-500 mb-1 font-mono">在 Agent 终端执行：</div>
                        <code className="text-xs text-green-400 font-mono">/plugin install distill@distill-community</code>
                      </div>
                      <button
                        onClick={() => { navigator.clipboard.writeText('/plugin install distill@distill-community'); }}
                        className="w-full btn-purple text-sm mb-3"
                      >
                        复制安装命令
                      </button>
                      <div className="flex flex-wrap gap-1.5">
                        {['Claude Code', 'OpenClaw', 'Hermes'].map((agent) => (
                          <span key={agent} className="text-[11px] px-2 py-0.5 rounded-full bg-surface border border-border text-text-tertiary">{agent}</span>
                        ))}
                      </div>
                      {/* Simulate */}
                      <div className="mt-4 pt-3 border-t border-border">
                        <button onClick={() => setPluginInstalled(true)} className="w-full text-xs text-brand-purple hover:underline">
                          模拟安装完成 →
                        </button>
                      </div>
                    </div>

                    {/* Manual Distill */}
                    <div className="bg-white rounded-2xl p-5 border border-border">
                      <h3 className="text-sm font-bold text-text-primary mb-1">💬 手动蒸馏</h3>
                      <p className="text-xs text-text-secondary mb-3">现在就有想蒸馏的经验？跟蒸馏师聊聊。</p>
                      <button onClick={startManualMode} className="w-full btn-secondary text-sm">
                        开始对话 →
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ) : (
            /* Plugin Installed — Status Dashboard */
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
              {/* Title */}
              <div className="mb-6">
                <h1 className="text-2xl font-bold text-text-primary mb-2">自动蒸馏运行中</h1>
                <p className="text-base text-text-secondary">你只管干活，重复的事 Agent 会接手。已经帮你省下了大量重复劳动。</p>
              </div>

              <div className="flex gap-6">
                {/* Left: Status + Drafts + Completed */}
                <div className="flex-1">
                  {/* Status Banner */}
                  <div className="bg-brand-green-surface rounded-2xl p-5 border border-brand-green/20 flex items-center gap-4 mb-5">
                    <div className="w-12 h-12 rounded-full bg-brand-green/10 flex items-center justify-center">
                      <span className="w-3 h-3 rounded-full bg-brand-green animate-pulse" />
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-bold text-text-primary flex items-center gap-2">
                        蒸馏 Plugin 运行中
                        <span className="text-xs font-normal text-brand-green">· 已连接 Claude Code</span>
                      </div>
                      <div className="text-xs text-text-secondary mt-0.5">后台观察中 · 每 6 小时扫描一次 · 本周已发现 3 个模式</div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-brand-green">3</div>
                      <div className="text-[11px] text-text-tertiary">本周发现</div>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-4 mb-5">
                    <div className="bg-white rounded-card p-4 border border-border text-center">
                      <div className="text-2xl font-bold text-text-primary">47</div>
                      <div className="text-xs text-text-tertiary">累计扫描次数</div>
                    </div>
                    <div className="bg-white rounded-card p-4 border border-border text-center">
                      <div className="text-2xl font-bold text-brand-purple">8</div>
                      <div className="text-xs text-text-tertiary">已蒸馏</div>
                    </div>
                    <div className="bg-white rounded-card p-4 border border-border text-center">
                      <div className="text-2xl font-bold text-brand-green">5</div>
                      <div className="text-xs text-text-tertiary">已分享到社区</div>
                    </div>
                  </div>

                  {/* Pending Drafts from Agent */}
                  <DistillDraftsSection startManualMode={() => {}} />

                  {/* Completed Skills */}
                  <div className="bg-white rounded-card p-5 border border-border mt-5">
                    <h3 className="text-base font-bold text-text-primary mb-4">✅ 已形成的蒸馏物</h3>
                    <div className="space-y-2">
                      {[
                        { name: '需求邮件秒回模板', type: 'Skill', shared: true, installs: 234, citations: 45 },
                        { name: '每周站会总结生成器', type: 'Skill', shared: true, installs: 189, citations: 32 },
                        { name: '竞品截图分析流程', type: 'Skill', shared: false, installs: 0, citations: 0 },
                        { name: '产品经理日常工作包', type: 'Plugin', shared: true, installs: 567, citations: 89 },
                        { name: '数据异动排查 SOP', type: 'Skill', shared: false, installs: 0, citations: 0 },
                      ].map((item) => (
                        <div key={item.name} className="flex items-center justify-between p-3 rounded-xl hover:bg-surface-hover transition-colors">
                          <div className="flex items-center gap-3">
                            <span className="text-sm">{item.type === 'Plugin' ? '📦' : '⚡'}</span>
                            <div>
                              <div className="text-sm font-medium text-text-primary">{item.name}</div>
                              <div className="text-[11px] text-text-tertiary">{item.type}</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            {item.shared ? (
                              <div className="flex items-center gap-2 text-xs text-text-tertiary">
                                <span>📥 {item.installs}</span>
                                <span>🔗 {item.citations}</span>
                                <span className="text-[11px] px-2 py-0.5 rounded-full bg-brand-green-surface text-brand-green font-medium">已分享</span>
                              </div>
                            ) : (
                              <button className="text-[11px] px-3 py-1 rounded-full bg-brand-green text-white font-medium hover:bg-brand-green-dark transition-all">
                                分享到社区
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Right Sidebar — Sticky */}
                <div className="w-[280px] shrink-0">
                  <div className="sticky top-8 space-y-5">
                    {/* Manual Distill */}
                    <div className="bg-white rounded-2xl p-5 border border-border">
                      <h3 className="text-sm font-bold text-text-primary mb-1">💬 手动蒸馏</h3>
                      <p className="text-xs text-text-secondary mb-3">现在就有想蒸馏的经验？跟蒸馏师聊聊。</p>
                      <button onClick={startManualMode} className="w-full btn-secondary text-sm">开始对话 →</button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

        </div>
      ) : (
        /* ═══════════════════════════════════════════════ */
        /* Manual Distill Chat Mode */
        /* ═══════════════════════════════════════════════ */
        <div className="h-full flex">
          {/* Chat Area */}
          <div className="flex-1 flex flex-col min-w-0">
            <div className="px-6 py-4 border-b border-border bg-white/80 backdrop-blur-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <button onClick={() => setShowManualMode(false)} className="text-sm text-text-tertiary hover:text-text-primary">← 返回</button>
                  <div className="w-8 h-8 rounded-full bg-brand-purple-surface flex items-center justify-center text-lg">⚗️</div>
                  <div>
                    <h2 className="text-sm font-bold text-text-primary">手动蒸馏</h2>
                    <p className="text-[11px] text-text-tertiary">描述你的经验，蒸馏师帮你提炼</p>
                  </div>
                </div>
                <button onClick={() => setShowApiKeyModal(true)} className="text-xs text-text-tertiary hover:text-text-primary">⚙️ API</button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-6 space-y-4">
              {messages.map((msg) => (
                <motion.div key={msg.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className="max-w-[75%]">
                    {msg.role === 'assistant' && (
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="text-sm">⚗️</span>
                        <span className="text-[11px] text-text-tertiary font-medium">蒸馏师</span>
                      </div>
                    )}
                    <div className={msg.role === 'user' ? 'chat-bubble-user' : 'chat-bubble-ai'}>
                      <div className="text-sm leading-relaxed whitespace-pre-wrap">
                        {msg.content || (isStreaming && msg.role === 'assistant' ? <span className="typing-cursor">思考中</span> : '')}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            <div className="px-6 py-4 border-t border-border bg-white">
              <div className="flex items-end gap-3">
                <textarea
                  value={input} onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }}
                  placeholder="描述你想蒸馏的经验..." rows={1}
                  className="flex-1 px-4 py-3 bg-surface border border-border rounded-xl text-sm placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-brand-purple/20 resize-none"
                  disabled={isStreaming}
                />
                <button onClick={handleSend} disabled={!input.trim() || isStreaming} className="btn-purple px-4 py-3 disabled:opacity-40">
                  {isStreaming ? '⏳' : '↑'}
                </button>
              </div>
            </div>
          </div>

          {/* Skill Preview Panel */}
          <div className="w-[340px] border-l border-border bg-white shrink-0 flex flex-col">
            <div className="px-5 py-4 border-b border-border">
              <h3 className="text-sm font-bold text-text-primary">蒸馏物预览</h3>
              <p className="text-[11px] text-text-tertiary mt-0.5">对话中实时成型</p>
            </div>
            <div className="flex-1 overflow-y-auto p-5">
              {generatedSkill ? (
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-4">
                  <div className="bg-gradient-to-br from-brand-purple-surface to-white rounded-xl p-5 border border-brand-purple/20">
                    <h4 className="text-base font-bold text-text-primary mb-2">{generatedSkill.name as string}</h4>
                    <p className="text-sm text-text-secondary mb-3">{generatedSkill.description as string}</p>
                    {(generatedSkill.steps as string[])?.length > 0 && (
                      <div className="space-y-1.5">
                        {(generatedSkill.steps as string[]).map((step, i) => (
                          <div key={i} className="flex items-start gap-2">
                            <span className="text-[11px] font-bold text-brand-purple bg-brand-purple-surface w-5 h-5 rounded-full flex items-center justify-center shrink-0">{i + 1}</span>
                            <span className="text-xs text-text-secondary">{step}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    {(generatedSkill.tags as string[])?.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-3">
                        {(generatedSkill.tags as string[]).map((tag) => (<span key={tag} className="tag-purple text-[11px]">{tag}</span>))}
                      </div>
                    )}
                  </div>
                  <button onClick={handlePublishSkill} className="w-full btn-primary">🚀 发布到广场</button>
                </motion.div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <span className="text-5xl mb-4 opacity-30">⚗️</span>
                  <p className="text-sm text-text-tertiary">蒸馏物会在对话中逐步成型</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
