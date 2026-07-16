import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

interface SharedChatData {
  title: string
  messages: Message[]
  created_at: string
}

export default function SharedChat() {
  const { id } = useParams()
  const [chat, setChat] = useState<SharedChatData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch(`/api/shared-chat/${id}`)
      .then(r => r.json())
      .then(data => {
        if (data.code === 200) {
          setChat(data.data)
        } else {
          setError('对话记录不存在')
        }
      })
      .catch(() => setError('加载失败'))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="inline-block w-8 h-8 rounded-full border-2 border-brand-green/20 border-t-brand-green animate-spin" />
      </div>
    )
  }

  if (error || !chat) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <span className="text-4xl block mb-4">🔗</span>
          <p className="text-text-secondary">{error || '对话记录不存在'}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#fafafa] flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-border px-6 py-4">
        <div className="max-w-[700px] mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-brand-purple to-brand-purple/80 flex items-center justify-center">
              <span className="text-white text-sm">⚡</span>
            </div>
            <div>
              <h1 className="text-sm font-bold text-text-primary">{chat.title}</h1>
              <p className="text-[11px] text-text-tertiary">觅游执行助手 · {new Date(chat.created_at).toLocaleString('zh-CN')}</p>
            </div>
          </div>
          <a
            href="https://humanpower-production.up.railway.app/skills"
            className="px-5 py-2.5 rounded-btn bg-brand-green text-white text-sm font-medium hover:bg-brand-green-dark transition-all shadow-sm"
          >
            ⚡ 我也要试试
          </a>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-5">
        <div className="max-w-[700px] mx-auto space-y-4">
          {chat.messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-brand-green text-white rounded-tr-sm'
                  : 'bg-white border border-border text-text-primary rounded-tl-sm shadow-sm'
              }`}>
                {msg.role === 'user' ? (
                  <div className="whitespace-pre-wrap text-left">{msg.content}</div>
                ) : (
                  <div className="prose prose-sm prose-neutral max-w-none break-words overflow-hidden [&>*:first-child]:mt-0 [&>*:last-child]:mb-0 [&_p]:my-1.5 [&_ul]:my-1.5 [&_ol]:my-1.5 [&_li]:my-0.5 [&_code]:text-brand-purple [&_code]:bg-brand-purple-surface [&_code]:px-1 [&_code]:rounded [&_code]:break-all [&_pre]:bg-gray-900 [&_pre]:text-gray-200 [&_pre]:rounded-lg [&_pre]:p-3 [&_pre]:whitespace-pre-wrap [&_pre]:break-words [&_strong]:text-text-primary [&_table]:w-full [&_table]:text-xs [&_table]:border-collapse [&_table]:my-2 [&_table]:block [&_table]:overflow-x-auto [&_th]:bg-gray-50 [&_th]:px-2 [&_th]:py-1.5 [&_th]:border [&_th]:border-gray-200 [&_th]:text-left [&_th]:font-medium [&_th]:whitespace-nowrap [&_td]:px-2 [&_td]:py-1.5 [&_td]:border [&_td]:border-gray-200 [&_td]:whitespace-normal">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="bg-white border-t border-border px-6 py-3 text-center">
        <p className="text-xs text-text-tertiary">
          来自 <a href="/" className="text-brand-green hover:underline">觅游</a> · AI 方法即时执行平台
        </p>
      </div>
    </div>
  )
}
