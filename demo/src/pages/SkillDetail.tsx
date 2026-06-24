import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useSkillsStore } from '../stores/skills'
import { useUserStore } from '../stores/user'
import { tracks } from '../data/tracks'
import { creators } from '../data/creators'

export default function SkillDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const getSkillById = useSkillsStore((s) => s.getSkillById)
  const { installedSkills, installSkill, user } = useUserStore()

  const skill = getSkillById(id || '')
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
    <div className="p-8 max-w-[900px] mx-auto">
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
                <p className="text-sm text-text-secondary mt-1">{skill.description}</p>
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
                  {skill.tags.map((tag) => (
                    <span key={tag} className="tag bg-gray-50 text-text-secondary">{tag}</span>
                  ))}
                </div>
              </div>
            </div>

            {/* Scenario */}
            {skill.scenario && (
              <div className="mb-6 p-4 bg-brand-purple-surface rounded-xl">
                <div className="text-xs font-semibold text-brand-purple mb-1">💼 适用场景</div>
                <div className="text-sm text-text-primary">{skill.scenario}</div>
              </div>
            )}

            {/* Input / Output */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              {skill.input && (
                <div className="p-4 bg-surface rounded-xl border border-border">
                  <div className="text-xs font-semibold text-text-tertiary mb-2">📥 输入</div>
                  <div className="text-sm text-text-primary">{skill.input}</div>
                </div>
              )}
              {skill.output && (
                <div className="p-4 bg-surface rounded-xl border border-border">
                  <div className="text-xs font-semibold text-text-tertiary mb-2">📤 输出</div>
                  <div className="text-sm text-text-primary">{skill.output}</div>
                </div>
              )}
            </div>

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
                      <span className="text-sm text-text-primary">{step}</span>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
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
            <button className="w-full btn-secondary flex items-center justify-center gap-2 text-sm mb-3">
              🍴 Fork
            </button>
            <button className="w-full btn-secondary flex items-center justify-center gap-2 text-sm mb-3">
              ⭐ 收藏
            </button>
            {skill.sourceUrl && (
              <a
                href={skill.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full btn-secondary flex items-center justify-center gap-2 text-sm"
              >
                🔗 查看源码
              </a>
            )}
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-card p-5 border border-border"
          >
            <h3 className="text-xs font-semibold text-text-tertiary mb-3">数据</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="stat-number">{skill.installs.toLocaleString()}</div>
                <div className="stat-label">安装数</div>
              </div>
              <div>
                <div className="stat-number">{skill.citations}</div>
                <div className="stat-label">引用数</div>
              </div>
              <div>
                <div className="stat-number">{skill.rating}</div>
                <div className="stat-label">评分</div>
              </div>
              <div>
                <div className="stat-number">{skill.successRate}%</div>
                <div className="stat-label">成功率</div>
              </div>
            </div>
          </motion.div>

          {/* Creator */}
          <motion.div
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white rounded-card p-5 border border-border"
          >
            <h3 className="text-xs font-semibold text-text-tertiary mb-3">创作者</h3>
            <div
              className="flex items-center gap-3 cursor-pointer hover:bg-surface-hover rounded-lg p-2 -m-2 transition-colors"
              onClick={() => {
                const creator = creators.find((c) => c.name === skill.creator.name)
                if (creator) navigate(`/creators/${creator.id}`)
              }}
            >
              <div className="w-10 h-10 rounded-full bg-brand-green-surface flex items-center justify-center text-xl">
                {skill.creator.avatar}
              </div>
              <div>
                <div className="text-sm font-medium text-text-primary hover:text-brand-green transition-colors">{skill.creator.name}</div>
                <div className="text-xs text-text-tertiary">{track?.name}赛道创作者</div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
