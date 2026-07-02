const SYSTEM_PROMPT = `你是「觅游助手」，专门帮助用户将他们的职业经验提炼为结构化的 Skill。

你的工作流程：
1. 先了解用户想提炼什么领域的经验
2. 通过 3-5 个精准问题挖掘用户的方法论
3. 将方法论结构化为一个 Skill

最终输出的 Skill 结构应包含：
- name: Skill 名称（简洁有力）
- description: 一句话描述
- scenario: 适用场景
- input: 需要什么输入
- output: 产出什么结果
- steps: 具体步骤（3-7步）
- tags: 标签（2-4个）

风格要求：
- 专业但亲切，像一个资深的知识管理顾问
- 每次只问 1-2 个问题，不要一次问太多
- 用 emoji 增加可读性
- 当你觉得信息足够时，主动总结并生成 Skill

重要：当你准备好输出最终 Skill 时，用以下 JSON 格式包裹在代码块中：
\`\`\`skill
{
  "name": "...",
  "description": "...",
  "scenario": "...",
  "input": "...",
  "output": "...",
  "steps": ["...", "..."],
  "tags": ["...", "..."]
}
\`\`\`
`

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
}

// DeepSeek API configuration
let apiKey = localStorage.getItem('deepseek_api_key') || ''

export function setApiKey(key: string) {
  apiKey = key
  localStorage.setItem('deepseek_api_key', key)
}

export function getApiKey(): string {
  return apiKey
}

export function hasApiKey(): boolean {
  return apiKey.length > 0
}

export async function* streamChat(messages: ChatMessage[]): AsyncGenerator<string> {
  if (!apiKey) {
    throw new Error('请先设置 DeepSeek API Key')
  }

  const response = await fetch('https://api.deepseek.com/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        ...messages,
      ],
      stream: true,
      temperature: 0.7,
      max_tokens: 2000,
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`API 调用失败: ${response.status} - ${error}`)
  }

  const reader = response.body?.getReader()
  if (!reader) throw new Error('无法读取响应流')

  const decoder = new TextDecoder()

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    const chunk = decoder.decode(value, { stream: true })
    const lines = chunk.split('\n')

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const data = line.slice(6)
        if (data === '[DONE]') return

        try {
          const json = JSON.parse(data)
          const content = json.choices?.[0]?.delta?.content
          if (content) {
            yield content
          }
        } catch {
          // skip malformed JSON
        }
      }
    }
  }
}

// Parse skill from AI response
export function parseSkillFromResponse(content: string): Record<string, unknown> | null {
  const match = content.match(/```skill\s*\n([\s\S]*?)\n```/)
  if (!match) return null

  try {
    return JSON.parse(match[1])
  } catch {
    return null
  }
}

// Fallback mock responses for when no API key is set
export const mockResponses = [
  '👋 你好！我是你的觅游助手。\n\n我的工作是帮你把那些「你知道但说不清楚」的经验，提炼成结构化的、可执行的 Skill。\n\n来，告诉我：**你最擅长什么？** 或者说，同事经常来找你帮忙处理什么类型的问题？',
  '很棒！这听起来是一个非常有价值的能力。让我再深入了解一下：\n\n🔍 **当你做这件事的时候，你通常的第一步是什么？** 有什么是你觉得「这一步很多人会忽略但其实很关键」的？',
  '非常清晰！我已经能看到方法论的轮廓了。最后确认几个细节：\n\n📋 **这个方法最适合在什么场景下使用？** 有什么前置条件或者适用边界吗？',
  '太好了，信息足够了！让我来帮你把这些经验提炼成一个 Skill ⚗️\n\n我正在结构化你的方法论...',
]
