import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { getProfileId } from '../services/user-token'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

interface AgentChatProps {
  open: boolean
  onClose: () => void
  initialPrompt?: string
  title?: string
}

export default function AgentChat({ open, onClose, initialPrompt, title }: AgentChatProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [streamingContent, setStreamingContent] = useState('')
  const [shareUrl, setShareUrl] = useState('')
  const scrollRef = useRef<HTMLDivElement>(null)
  const hasSentInitial = useRef(false)
  const userScrolledUp = useRef(false)
  // 每次打开面板生成唯一 sessionId，隔离不同对话
  const sessionId = useRef(crypto.randomUUID())

  // 只在用户没有手动上滑时自动滚动到底部
  useEffect(() => {
    if (scrollRef.current && !userScrolledUp.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  // 检测用户是否手动滚动
  const handleScroll = () => {
    if (!scrollRef.current) return
    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current
    // 距离底部超过 100px 认为用户在浏览历史
    userScrolledUp.current = scrollHeight - scrollTop - clientHeight > 100
  }

  useEffect(() => {
    if (open && initialPrompt && !hasSentInitial.current) {
      hasSentInitial.current = true
      sendMessage(initialPrompt)
    }
  }, [open, initialPrompt])

  useEffect(() => {
    if (!open) {
      hasSentInitial.current = false
      userScrolledUp.current = false
      sessionId.current = crypto.randomUUID() // 关闭时重置 session，下次打开是新对话
      setMessages([])
      setStreamingContent('')
      setInput('')
      setShareUrl('')
    }
  }, [open])

  const handleShare = async () => {
    if (messages.length === 0) return
    try {
      const resp = await fetch('/api/shared-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages, title: title || '对话记录' }),
      })
      const data = await resp.json()
      if (data.data?.url) {
        const fullUrl = `${window.location.origin}${data.data.url}`
        setShareUrl(fullUrl)
        navigator.clipboard?.writeText(fullUrl)
      }
    } catch {
      // ignore
    }
  }

  const sendMessage = async (content: string) => {
    const userMsg: Message = { role: 'user', content }
    const newMessages = [...messages, userMsg]
    setMessages(newMessages)
    setInput('')
    setLoading(true)
    setStreamingContent('')
    userScrolledUp.current = false

    try {
      const resp = await fetch('/api/agent/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages.map(m => ({ role: m.role, content: m.content })),
          stream: true,
          profile: getProfileId(),
          sessionId: sessionId.current,
        }),
      })

      if (!resp.ok) {
        throw new Error(`API error: ${resp.status}`)
      }

      const reader = resp.body?.getReader()
      if (!reader) throw new Error('No response body')

      const decoder = new TextDecoder()
      let accumulated = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value, { stream: true })
        const lines = chunk.split('\n')

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6)
            if (data === '[DONE]') continue
            try {
              const parsed = JSON.parse(data)
              const delta = parsed.choices?.[0]?.delta?.content || ''
              accumulated += delta
              setStreamingContent(accumulated)
            } catch {
              // ignore
            }
          }
        }
      }

      if (accumulated) {
        setMessages(prev => [...prev, { role: 'assistant', content: accumulated }])
      }
      setStreamingContent('')
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : 'Unknown error'
      setMessages(prev => [...prev, { role: 'assistant', content: `⚠️ 执行出错：${errMsg}` }])
    } finally {
      setLoading(false)
    }
  }


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || loading) return
    sendMessage(input.trim())
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0, x: 560 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 560 }}
          transition={{ type: 'spring', damping: 28, stiffness: 320 }}
          className="fixed right-0 top-0 bottom-0 w-[560px] bg-[#fafafa] border-l border-border shadow-2xl z-50 flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-border">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-brand-purple to-brand-purple/80 flex items-center justify-center">
                <span className="text-white text-sm">⚡</span>
              </div>
              <div>
                <h3 className="text-sm font-bold text-text-primary">{title || '觅游执行助手'}</h3>
                <p className="text-[11px] text-text-tertiary">yunAgent · DeepSeek</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {messages.length > 0 && (
                <button
                  onClick={handleShare}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium text-text-secondary hover:text-brand-green hover:bg-brand-green-surface transition-colors"
                  title="分享对话"
                >
                  {shareUrl ? '✓ 已复制链接' : '🔗 分享'}
                </button>
              )}
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-text-tertiary hover:text-text-primary hover:bg-gray-100 transition-colors text-lg"
              >
                ×
              </button>
            </div>
          </div>

          {/* Messages */}
          <div ref={scrollRef} onScroll={handleScroll} className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-brand-green text-white rounded-tr-sm'
                    : 'bg-white border border-border text-text-primary rounded-tl-sm shadow-sm'
                }`}>
                  {msg.role === 'user' ? (
                    <div className="whitespace-pre-wrap text-left">{msg.content}</div>
                  ) : (
                    <div className="prose prose-sm prose-neutral max-w-none break-words overflow-hidden [&>*:first-child]:mt-0 [&>*:last-child]:mb-0 [&_p]:my-1.5 [&_ul]:my-1.5 [&_ol]:my-1.5 [&_li]:my-0.5 [&_code]:text-brand-purple [&_code]:bg-brand-purple-surface [&_code]:px-1 [&_code]:rounded [&_code]:break-all [&_pre]:bg-gray-900 [&_pre]:text-gray-200 [&_pre]:rounded-lg [&_pre]:p-3 [&_pre]:whitespace-pre-wrap [&_pre]:break-words [&_h1]:text-base [&_h2]:text-sm [&_h3]:text-sm [&_strong]:text-text-primary [&_table]:w-full [&_table]:text-xs [&_table]:border-collapse [&_table]:my-2 [&_table]:block [&_table]:overflow-x-auto [&_th]:bg-gray-50 [&_th]:px-2 [&_th]:py-1.5 [&_th]:border [&_th]:border-gray-200 [&_th]:text-left [&_th]:font-medium [&_th]:whitespace-nowrap [&_td]:px-2 [&_td]:py-1.5 [&_td]:border [&_td]:border-gray-200 [&_td]:whitespace-normal">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* Streaming */}
            {streamingContent && (
              <div className="flex justify-start">
                <div className="max-w-[85%] px-4 py-3 rounded-2xl rounded-tl-sm bg-white border border-border text-sm text-text-primary shadow-sm">
                  <div className="prose prose-sm prose-neutral max-w-none break-words overflow-hidden [&>*:first-child]:mt-0 [&>*:last-child]:mb-0 [&_p]:my-1.5 [&_ul]:my-1.5 [&_ol]:my-1.5 [&_li]:my-0.5 [&_code]:text-brand-purple [&_code]:bg-brand-purple-surface [&_code]:px-1 [&_code]:rounded [&_code]:break-all [&_pre]:bg-gray-900 [&_pre]:text-gray-200 [&_pre]:rounded-lg [&_pre]:p-3 [&_pre]:whitespace-pre-wrap [&_pre]:break-words [&_strong]:text-text-primary [&_table]:w-full [&_table]:text-xs [&_table]:border-collapse [&_table]:my-2 [&_table]:block [&_table]:overflow-x-auto [&_th]:bg-gray-50 [&_th]:px-2 [&_th]:py-1.5 [&_th]:border [&_th]:border-gray-200 [&_th]:text-left [&_th]:font-medium [&_th]:whitespace-nowrap [&_td]:px-2 [&_td]:py-1.5 [&_td]:border [&_td]:border-gray-200 [&_td]:whitespace-normal">
                    <ReactMarkdown>{streamingContent}</ReactMarkdown>
                  </div>
                  <span className="inline-block w-1.5 h-4 bg-brand-green rounded-sm ml-0.5 animate-pulse align-middle" />
                </div>
              </div>
            )}

            {/* Loading */}
            {loading && !streamingContent && (
              <div className="flex justify-start">
                <div className="px-4 py-3 rounded-2xl rounded-tl-sm bg-white border border-border shadow-sm">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-brand-green/60 animate-bounce" />
                    <div className="w-2 h-2 rounded-full bg-brand-green/60 animate-bounce [animation-delay:0.15s]" />
                    <div className="w-2 h-2 rounded-full bg-brand-green/60 animate-bounce [animation-delay:0.3s]" />
                  </div>
                </div>
              </div>
            )}
          </div>


          {/* Input */}
          <form onSubmit={handleSubmit} className="px-6 py-4 bg-white border-t border-border">
            <div className="flex items-center gap-3">
              <input
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder="继续对话..."
                disabled={loading}
                className="flex-1 px-4 py-3 rounded-xl bg-[#f5f5f5] border border-transparent text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-brand-green focus:bg-white focus:ring-1 focus:ring-brand-green/20 disabled:opacity-50 transition-all"
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="w-10 h-10 rounded-xl bg-brand-green text-white flex items-center justify-center hover:bg-brand-green-dark transition-all disabled:opacity-30 shrink-0 shadow-sm"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 12V4M8 4L4 8M8 4L12 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </button>
            </div>
          </form>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
