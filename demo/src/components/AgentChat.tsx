import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

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
  const scrollRef = useRef<HTMLDivElement>(null)
  const hasSentInitial = useRef(false)

  // 自动滚动到底部
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, streamingContent])

  // 打开时自动发送初始 prompt
  useEffect(() => {
    if (open && initialPrompt && !hasSentInitial.current) {
      hasSentInitial.current = true
      sendMessage(initialPrompt)
    }
  }, [open, initialPrompt])

  // 关闭时重置
  useEffect(() => {
    if (!open) {
      hasSentInitial.current = false
      setMessages([])
      setStreamingContent('')
      setInput('')
    }
  }, [open])

  const sendMessage = async (content: string) => {
    const userMsg: Message = { role: 'user', content }
    const newMessages = [...messages, userMsg]
    setMessages(newMessages)
    setInput('')
    setLoading(true)
    setStreamingContent('')

    try {
      const resp = await fetch('/api/agent/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages.map(m => ({ role: m.role, content: m.content })),
          stream: true,
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
              // ignore parse errors for incomplete chunks
            }
          }
        }
      }

      // 流结束，将累积内容加入消息列表
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
          initial={{ opacity: 0, x: 400 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 400 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="fixed right-0 top-0 bottom-0 w-[420px] bg-white border-l border-border shadow-xl z-50 flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <div>
              <h3 className="text-sm font-bold text-text-primary flex items-center gap-2">
                🤖 {title || '觅游执行助手'}
              </h3>
              <p className="text-[11px] text-text-tertiary mt-0.5">yunAgent · DeepSeek</p>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full flex items-center justify-center text-text-tertiary hover:text-text-primary hover:bg-surface-hover transition-colors"
            >
              ✕
            </button>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                  msg.role === 'user'
                    ? 'bg-brand-green text-white rounded-br-md'
                    : 'bg-surface border border-border text-text-primary rounded-bl-md'
                }`}>
                  {msg.content}
                </div>
              </div>
            ))}

            {/* Streaming content */}
            {streamingContent && (
              <div className="flex justify-start">
                <div className="max-w-[85%] px-4 py-3 rounded-2xl rounded-bl-md bg-surface border border-border text-sm text-text-primary leading-relaxed whitespace-pre-wrap">
                  {streamingContent}
                  <span className="inline-block w-1.5 h-4 bg-brand-green ml-0.5 animate-pulse" />
                </div>
              </div>
            )}

            {/* Loading indicator */}
            {loading && !streamingContent && (
              <div className="flex justify-start">
                <div className="px-4 py-3 rounded-2xl rounded-bl-md bg-surface border border-border">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-brand-green animate-bounce" />
                    <div className="w-2 h-2 rounded-full bg-brand-green animate-bounce" style={{ animationDelay: '0.1s' }} />
                    <div className="w-2 h-2 rounded-full bg-brand-green animate-bounce" style={{ animationDelay: '0.2s' }} />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <form onSubmit={handleSubmit} className="px-5 py-4 border-t border-border">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder="输入你的需求..."
                disabled={loading}
                className="flex-1 px-4 py-2.5 rounded-full bg-surface border border-border text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-brand-green focus:ring-1 focus:ring-brand-green/20 disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="w-10 h-10 rounded-full bg-brand-green text-white flex items-center justify-center hover:bg-brand-green-dark transition-all disabled:opacity-40 shrink-0"
              >
                ↑
              </button>
            </div>
          </form>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
