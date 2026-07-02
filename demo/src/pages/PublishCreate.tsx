import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'

export default function PublishCreate() {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    name: '',
    description: '',
    scenario: '',
    input: '',
    output: '',
    steps: '',
    tags: '',
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // TODO: 实际提交到后端
    alert('🎉 技能已发布！（Demo 模式，暂未实际保存）')
    navigate('/square')
  }

  return (
    <div className="p-8 max-w-[700px] mx-auto">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <button
          onClick={() => navigate('/publish')}
          className="text-sm text-text-secondary hover:text-text-primary transition-colors mb-6 flex items-center gap-1 px-4 py-2 rounded-full bg-white border border-border hover:border-brand-green/30"
        >
          ← 返回
        </button>

        <h1 className="text-2xl font-bold text-text-primary mb-2">📝 手动创建技能</h1>
        <p className="text-sm text-text-secondary mb-8">
          填写你的方法论，让别人也能一键用上。
        </p>
      </motion.div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* 名称 */}
        <div>
          <label className="text-sm font-medium text-text-primary block mb-1.5">技能名称 *</label>
          <input
            type="text"
            required
            value={form.name}
            onChange={e => setForm({ ...form, name: e.target.value })}
            placeholder="从用户痛点出发，比如「30 分钟搞定 PRD」"
            className="w-full px-4 py-3 rounded-xl bg-white border border-border text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-brand-green focus:ring-2 focus:ring-brand-green/20"
          />
        </div>

        {/* 描述 */}
        <div>
          <label className="text-sm font-medium text-text-primary block mb-1.5">一句话描述 *</label>
          <textarea
            required
            value={form.description}
            onChange={e => setForm({ ...form, description: e.target.value })}
            placeholder="用大白话说清楚这个技能帮人解决什么问题"
            rows={2}
            className="w-full px-4 py-3 rounded-xl bg-white border border-border text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-brand-green focus:ring-2 focus:ring-brand-green/20 resize-none"
          />
        </div>

        {/* 什么时候用 */}
        <div>
          <label className="text-sm font-medium text-text-primary block mb-1.5">什么时候用</label>
          <textarea
            value={form.scenario}
            onChange={e => setForm({ ...form, scenario: e.target.value })}
            placeholder="描述一个具体场景，让人一看就知道这是不是自己要的"
            rows={2}
            className="w-full px-4 py-3 rounded-xl bg-white border border-border text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-brand-green focus:ring-2 focus:ring-brand-green/20 resize-none"
          />
        </div>

        {/* 输入 / 输出 */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-text-primary block mb-1.5">用户给什么</label>
            <textarea
              value={form.input}
              onChange={e => setForm({ ...form, input: e.target.value })}
              placeholder="需要准备的材料"
              rows={2}
              className="w-full px-4 py-3 rounded-xl bg-white border border-border text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-brand-green focus:ring-2 focus:ring-brand-green/20 resize-none"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-text-primary block mb-1.5">用户得到什么</label>
            <textarea
              value={form.output}
              onChange={e => setForm({ ...form, output: e.target.value })}
              placeholder="最终的交付物"
              rows={2}
              className="w-full px-4 py-3 rounded-xl bg-white border border-border text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-brand-green focus:ring-2 focus:ring-brand-green/20 resize-none"
            />
          </div>
        </div>

        {/* 执行步骤 */}
        <div>
          <label className="text-sm font-medium text-text-primary block mb-1.5">执行步骤</label>
          <textarea
            value={form.steps}
            onChange={e => setForm({ ...form, steps: e.target.value })}
            placeholder="一行一步，比如：&#10;1. 收集需求碎片&#10;2. 整理成结构化大纲&#10;3. 生成完整文档"
            rows={4}
            className="w-full px-4 py-3 rounded-xl bg-white border border-border text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-brand-green focus:ring-2 focus:ring-brand-green/20 resize-none"
          />
        </div>

        {/* 标签 */}
        <div>
          <label className="text-sm font-medium text-text-primary block mb-1.5">标签</label>
          <input
            type="text"
            value={form.tags}
            onChange={e => setForm({ ...form, tags: e.target.value })}
            placeholder="用逗号分隔，如：PRD, 产品经理, 需求文档"
            className="w-full px-4 py-3 rounded-xl bg-white border border-border text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-brand-green focus:ring-2 focus:ring-brand-green/20"
          />
        </div>

        {/* 提交 */}
        <div className="pt-4 flex items-center gap-3">
          <button type="submit" className="btn-primary px-8 py-3 text-sm">
            🚀 发布技能
          </button>
          <button type="button" onClick={() => navigate('/publish')} className="btn-secondary px-6 py-3 text-sm">
            取消
          </button>
        </div>
      </form>
    </div>
  )
}
