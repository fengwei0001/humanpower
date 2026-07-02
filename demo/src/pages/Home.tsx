import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useUserStore } from '../stores/user'
import { todayActions, distillDrafts, type DistillDraft } from '../data/agent-activity'

export default function Home() {
  const navigate = useNavigate()
  const { user } = useUserStore()
  const [drafts, setDrafts] = useState(distillDrafts)
  const [showShareModal, setShowShareModal] = useState<DistillDraft | null>(null)

  const handleConfirmDraft = (draft: DistillDraft) => {
    setDrafts((prev) =>
      prev.map((d) => (d.id === draft.id ? { ...d, status: 'confirmed' as const } : d))
    )
  }

  const handleShareDraft = (draft: DistillDraft) => {
    setShowShareModal(draft)
  }

  const confirmShare = () => {
    if (showShareModal) {
      setDrafts((prev) =>
        prev.map((d) => (d.id === showShareModal.id ? { ...d, status: 'shared' as const } : d))
      )
      setShowShareModal(null)
    }
  }

  const actionIcons = {
    executed: '✅',
    discovered: '💡',
    distilled: '⚗️',
    fetched: '📥',
  }

  return (
    <div className="p-8 max-w-[1100px] mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-2xl font-bold text-text-primary">
          Agent 日报 <span className="text-base font-normal text-text-tertiary">· 今天</span>
        </h1>
        <p className="text-sm text-text-secondary mt-1">
          你的虾兵今天帮你做了 {todayActions.length} 件事，发现了 {drafts.filter((d) => d.status === 'pending').length} 个可提炼的技能。
        </p>
      </motion.div>

      <div className="grid grid-cols-5 gap-6">
        {/* Left: Actions + Drafts */}
        <div className="col-span-3 space-y-6">
          {/* Today's Actions */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-card p-5 border border-border"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-text-primary">🦐 今天帮你做了</h2>
              <span className="text-xs text-text-tertiary">{todayActions.length} 项</span>
            </div>
            <div className="space-y-3">
              {todayActions.map((action, i) => (
                <motion.div
                  key={action.id}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.15 + i * 0.05 }}
                  className="flex items-start gap-3 p-3 rounded-xl hover:bg-surface-hover transition-colors cursor-pointer"
                  onClick={() => action.skillId && navigate(`/skills/${action.skillId}`)}
                >
                  <span className="text-lg mt-0.5">{actionIcons[action.type]}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-text-primary">{action.title}</div>
                    <div className="text-xs text-text-secondary mt-0.5">{action.description}</div>
                    {action.result && (
                      <div className="text-xs text-brand-green font-medium mt-1">→ {action.result}</div>
                    )}
                  </div>
                  <span className="text-[11px] text-text-tertiary shrink-0">{action.time}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Distill Drafts — Agent 推上来的蒸馏草稿 */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-card p-5 border border-border"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-text-primary">⚗️ 待确认技能</h2>
              <span className="text-xs text-text-tertiary">Agent 观察到的模式</span>
            </div>
            <div className="space-y-4">
              {drafts.map((draft, i) => (
                <motion.div
                  key={draft.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.35 + i * 0.08 }}
                  className={`p-4 rounded-xl border transition-all ${
                    draft.status === 'shared'
                      ? 'bg-brand-green-surface border-brand-green/20'
                      : draft.status === 'confirmed'
                      ? 'bg-brand-purple-surface border-brand-purple/20'
                      : 'bg-surface border-border hover:border-border-heavy'
                  }`}
                >
                  {/* Header */}
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="text-sm font-semibold text-text-primary flex items-center gap-2">
                        {draft.name}
                        {draft.status === 'shared' && <span className="tag-green text-[11px]">已分享</span>}
                        {draft.status === 'confirmed' && <span className="tag-purple text-[11px]">已确认</span>}
                      </div>
                      <div className="text-xs text-text-tertiary mt-0.5">
                        💡 {draft.trigger}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-xs text-text-tertiary">信心度</div>
                      <div className="text-sm font-bold text-brand-green">{draft.confidence}%</div>
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-xs text-text-secondary mb-3">{draft.description}</p>

                  {/* Steps preview */}
                  <div className="space-y-1 mb-3">
                    {draft.steps.map((step, si) => (
                      <div key={si} className="flex items-start gap-2 text-xs text-text-secondary">
                        <span className="text-[10px] font-bold text-brand-purple bg-brand-purple-surface w-4 h-4 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                          {si + 1}
                        </span>
                        <span>{step}</span>
                      </div>
                    ))}
                  </div>

                  {/* Stats + Actions */}
                  <div className="flex items-center justify-between pt-3 border-t border-border">
                    <div className="flex items-center gap-4 text-[11px] text-text-tertiary">
                      <span>已帮你用了 <strong className="text-text-primary">{draft.usedCount}</strong> 次</span>
                      <span>社区 <strong className="text-text-primary">{draft.communityDemand}</strong> 人在找</span>
                    </div>
                    {draft.status === 'pending' && (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleConfirmDraft(draft)}
                          className="px-3 py-1.5 text-xs font-medium bg-brand-purple text-white rounded-lg hover:bg-brand-purple/90 transition-all"
                        >
                          ✓ 确认好用
                        </button>
                      </div>
                    )}
                    {draft.status === 'confirmed' && (
                      <button
                        onClick={() => handleShareDraft(draft)}
                        className="px-3 py-1.5 text-xs font-medium bg-brand-green text-white rounded-lg hover:bg-brand-green-dark transition-all"
                      >
                        🚀 分享到社区
                      </button>
                    )}
                    {draft.status === 'shared' && (
                      <span className="text-xs text-brand-green font-medium">声望 +50 🎉</span>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Right Sidebar */}
        <div className="col-span-2 space-y-6">
          {/* User Quick Stats */}
          <motion.div
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-card p-5 border border-border"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-11 h-11 rounded-full bg-brand-green-surface flex items-center justify-center text-2xl">
                {user.avatar}
              </div>
              <div>
                <div className="text-sm font-semibold text-text-primary">{user.name}</div>
                <div className="text-xs text-text-tertiary">Lv.{user.level} · 声望 {user.reputation.toLocaleString()}</div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-brand-gold-light/50 rounded-xl text-center">
                <div className="text-lg font-bold text-text-primary">{user.totalCitations.toLocaleString()}</div>
                <div className="text-[11px] text-text-tertiary">被引用</div>
              </div>
              <div className="p-3 bg-brand-green-surface rounded-xl text-center">
                <div className="text-lg font-bold text-text-primary">{user.skillsCreated}</div>
                <div className="text-[11px] text-text-tertiary">已提炼</div>
              </div>
            </div>
          </motion.div>

          {/* Agent Insight */}
          <motion.div
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-gradient-to-br from-brand-purple-surface to-white rounded-card p-5 border border-brand-purple/10"
          >
            <h3 className="text-sm font-bold text-text-primary mb-2">🧠 Agent 洞察</h3>
            <p className="text-xs text-text-secondary leading-relaxed">
              本周你的工作模式集中在<strong className="text-brand-purple">需求分析</strong>和<strong className="text-brand-purple">项目管理</strong>两个领域。
              我发现了 3 个可提炼的重复模式，已经帮你验证了其中 2 个。
            </p>
            <div className="mt-3 pt-3 border-t border-border">
              <div className="text-[11px] text-text-tertiary mb-1">本周 Agent 活跃度</div>
              <div className="flex items-center gap-1">
                {[4, 3, 5, 2, 4, 3, 1].map((level, i) => (
                  <div
                    key={i}
                    className="flex-1 rounded-sm"
                    style={{
                      height: `${level * 6 + 8}px`,
                      backgroundColor: `rgba(33, 180, 67, ${0.2 + level * 0.15})`,
                    }}
                  />
                ))}
              </div>
              <div className="flex justify-between text-[10px] text-text-tertiary mt-1">
                <span>周一</span><span>周日</span>
              </div>
            </div>
          </motion.div>

        </div>
      </div>

      {/* Share Confirmation Modal */}
      <AnimatePresence>
        {showShareModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
            onClick={() => setShowShareModal(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
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
                <button
                  onClick={() => setShowShareModal(null)}
                  className="flex-1 btn-secondary text-sm"
                >
                  再想想
                </button>
                <button
                  onClick={confirmShare}
                  className="flex-1 btn-primary text-sm"
                >
                  确认分享 🎉
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
