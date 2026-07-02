import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'

export default function PublishGithub() {
  const navigate = useNavigate()
  const [repoUrl, setRepoUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [imported, setImported] = useState(false)

  const handleImport = (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    // 模拟导入
    setTimeout(() => {
      setLoading(false)
      setImported(true)
    }, 2000)
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

        <h1 className="text-2xl font-bold text-text-primary mb-2">🐙 从 GitHub 导入</h1>
        <p className="text-sm text-text-secondary mb-8">
          填入你的 GitHub 仓库地址，自动解析 SKILL.md 文件并导入为技能。
        </p>
      </motion.div>

      {!imported ? (
        <form onSubmit={handleImport} className="space-y-6">
          {/* URL Input */}
          <div>
            <label className="text-sm font-medium text-text-primary block mb-1.5">仓库地址 *</label>
            <input
              type="url"
              required
              value={repoUrl}
              onChange={e => setRepoUrl(e.target.value)}
              placeholder="https://github.com/username/repo/blob/main/skills/my-skill/SKILL.md"
              className="w-full px-4 py-3 rounded-xl bg-white border border-border text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-brand-green focus:ring-2 focus:ring-brand-green/20"
            />
            <p className="text-[11px] text-text-tertiary mt-1.5">
              支持格式：仓库根目录、skills 子目录、或直接指向 SKILL.md 文件
            </p>
          </div>

          {/* 说明 */}
          <div className="p-4 bg-gray-50 rounded-xl border border-border">
            <h3 className="text-sm font-medium text-text-primary mb-2">📋 SKILL.md 格式要求</h3>
            <div className="text-xs text-text-secondary space-y-1 leading-relaxed">
              <p>文件需要包含以下内容（Markdown 格式）：</p>
              <ul className="list-disc list-inside space-y-0.5 ml-2">
                <li><code className="bg-white px-1 rounded text-brand-purple">## 名称</code> — 技能名称</li>
                <li><code className="bg-white px-1 rounded text-brand-purple">## 描述</code> — 一句话说明</li>
                <li><code className="bg-white px-1 rounded text-brand-purple">## 步骤</code> — 执行步骤列表</li>
                <li><code className="bg-white px-1 rounded text-brand-purple">## 输入</code> / <code className="bg-white px-1 rounded text-brand-purple">## 输出</code> — 可选</li>
              </ul>
            </div>
          </div>

          {/* 示例 */}
          <div className="p-4 bg-gray-900 rounded-xl">
            <div className="text-[11px] text-gray-400 mb-2">示例 SKILL.md</div>
            <pre className="text-xs text-gray-300 leading-relaxed font-mono whitespace-pre-wrap">{`## 30 分钟搞定 PRD

再也不用对着空白文档发呆了。把老板那句话丢进来，出来的就是能直接拉评审的完整 PRD。

## 步骤
1. 收集需求碎片
2. AI 帮你整理成结构化大纲
3. 自动补全异常流程和边界 case
4. 生成评审可用的完整 PRD

## 输入
老板的那句话、群聊记录、竞品截图

## 输出
一份完整的 PRD 文档 + 待确认清单`}</pre>
          </div>

          {/* 提交 */}
          <div className="pt-2 flex items-center gap-3">
            <button type="submit" disabled={loading} className="btn-primary px-8 py-3 text-sm disabled:opacity-50">
              {loading ? '🔄 解析中...' : '📥 导入技能'}
            </button>
            <button type="button" onClick={() => navigate('/publish')} className="btn-secondary px-6 py-3 text-sm">
              取消
            </button>
          </div>
        </form>
      ) : (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center py-12"
        >
          <span className="text-5xl block mb-4">🎉</span>
          <h2 className="text-lg font-bold text-text-primary mb-2">导入成功！</h2>
          <p className="text-sm text-text-secondary mb-6">
            技能已解析并发布到技能广场（Demo 模式，暂未实际保存）
          </p>
          <div className="flex justify-center gap-3">
            <button onClick={() => navigate('/square')} className="btn-primary px-6 py-2.5 text-sm">
              去广场看看
            </button>
            <button onClick={() => { setImported(false); setRepoUrl('') }} className="btn-secondary px-6 py-2.5 text-sm">
              继续导入
            </button>
          </div>
        </motion.div>
      )}
    </div>
  )
}
