import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'

const publishOptions = [
  {
    icon: '📝',
    title: '手动创建',
    desc: '填写技能名称、描述、步骤等信息，直接发布',
    path: '/publish/create',
    color: 'from-brand-green-surface to-white',
    borderColor: 'border-brand-green/20',
  },
  {
    icon: '🐙',
    title: 'GitHub 导入',
    desc: '从你的 GitHub 仓库导入已有的 SKILL.md 文件',
    path: '/publish/github',
    color: 'from-gray-50 to-white',
    borderColor: 'border-gray-200',
  },
  {
    icon: '⚗️',
    title: '自动蒸馏',
    desc: '粘贴一段对话记录，AI 自动提取方法论生成技能',
    path: '/distill',
    color: 'from-brand-purple-surface to-white',
    borderColor: 'border-brand-purple/20',
  },
]

export default function Publish() {
  const navigate = useNavigate()

  return (
    <div className="p-8 max-w-[640px] mx-auto">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-text-primary mb-2">发布技能</h1>
        <p className="text-sm text-text-secondary mb-8">
          把你的方法论分享出来，让同行也能用上。选择一种方式开始：
        </p>
      </motion.div>

      <div className="space-y-4">
        {publishOptions.map((opt, i) => (
          <motion.div
            key={opt.path}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            onClick={() => navigate(opt.path)}
            className={`p-6 rounded-2xl bg-gradient-to-r ${opt.color} border ${opt.borderColor} cursor-pointer hover:-translate-y-0.5 hover:shadow-md transition-all`}
          >
            <div className="flex items-center gap-4">
              <span className="text-3xl">{opt.icon}</span>
              <div>
                <h3 className="text-base font-bold text-text-primary">{opt.title}</h3>
                <p className="text-sm text-text-secondary mt-0.5">{opt.desc}</p>
              </div>
              <span className="ml-auto text-text-tertiary text-lg">→</span>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
