import { skills } from '../data/skills'
import { getApiKey, hasApiKey } from './ai'

// 构建 skills 摘要给 AI 做匹配
function buildSkillsContext(): string {
  return skills.map(s => ({
    id: s.id,
    name: s.name,
    description: s.description,
    scenario: s.scenario || '',
    tags: s.tags,
    trackId: s.trackId,
  })).map(s =>
    `[${s.id}] ${s.name} — ${s.description} 场景: ${s.scenario} 标签: ${s.tags.join(',')}`
  ).join('\n')
}

const SEARCH_SYSTEM_PROMPT = `你是「蒸馏广场」的智能推荐引擎。用户会描述一个工作中的问题或目标，你要从蒸馏物库中选出最相关的 3-5 个，组成一个可执行的解决方案。

## 蒸馏物库：
${buildSkillsContext()}

## 你的任务：
1. 理解用户的真实意图（可能表达不精确，你要看透本质需求）
2. 从库里挑 3-5 个最相关的蒸馏物，按执行顺序排列
3. 给每个蒸馏物标注它在方案中的角色（一句简短说明）
4. 给整体方案一句描述

## 返回格式（严格 JSON，不要多余文字）：
\`\`\`json
{
  "description": "整体方案一句话描述",
  "skills": [
    { "id": "skill-id", "name": "蒸馏物名称", "role": "在方案中的角色" }
  ]
}
\`\`\`

注意：
- id 必须是库中真实存在的 id
- 按执行先后顺序排列
- 如果用户问题跟库里所有蒸馏物都不相关，返回 {"description": "暂时没找到匹配的蒸馏物", "skills": []}
`

export interface SearchResult {
  description: string
  skills: { id: string; name: string; role: string }[]
}

export async function aiSearchSkills(query: string): Promise<SearchResult> {
  if (!hasApiKey()) {
    throw new Error('NO_API_KEY')
  }

  const response = await fetch('https://api.deepseek.com/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${getApiKey()}`,
    },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages: [
        { role: 'system', content: SEARCH_SYSTEM_PROMPT },
        { role: 'user', content: query },
      ],
      temperature: 0.3,
      max_tokens: 1000,
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`API 调用失败: ${response.status} - ${error}`)
  }

  const data = await response.json()
  const content = data.choices?.[0]?.message?.content || ''

  // 解析 JSON（可能被包裹在 ```json ``` 中）
  const jsonMatch = content.match(/```json\s*\n?([\s\S]*?)\n?```/) || content.match(/\{[\s\S]*\}/)
  if (!jsonMatch) {
    throw new Error('AI 返回格式异常')
  }

  const jsonStr = jsonMatch[1] || jsonMatch[0]
  const result: SearchResult = JSON.parse(jsonStr)

  // 验证返回的 skill id 是否真实存在
  result.skills = result.skills.filter(s => skills.some(sk => sk.id === s.id))

  return result
}

// 前端 fallback：关键词匹配
export function localSearchSkills(query: string): SearchResult {
  const q = query.toLowerCase()

  // 同义词映射
  const synonyms: Record<string, string[]> = {
    '评审': ['review', '评审', '立项', 'PRD'],
    '数据': ['数据', '分析', '指标', '埋点', 'A/B'],
    '调研': ['用户', '访谈', '问卷', '洞察', 'JTBD'],
    '汇报': ['演示', 'PPT', '汇报', 'slides'],
    '代码': ['代码', '开发', '测试', 'TDD', 'review', 'debug'],
    '设计': ['设计', '原型', 'UI', '前端'],
    '增长': ['增长', 'onboarding', '激活', '留存', 'A/B'],
    '会议': ['会议', '纪要', '复盘', '对齐'],
    '需求': ['需求', 'PRD', '功能', '优先级'],
    '竞品': ['竞品', '市场', '分析'],
  }

  // 打分
  const scored = skills.map(skill => {
    let score = 0
    const searchFields = [skill.name, skill.description, skill.scenario || '', ...skill.tags].join(' ').toLowerCase()

    // 直接匹配
    if (searchFields.includes(q)) score += 10

    // 分词匹配
    const words = q.split(/[\s，,。、？?！!]+/).filter(w => w.length > 0)
    for (const word of words) {
      if (searchFields.includes(word)) score += 5

      // 同义词匹配
      for (const [, syns] of Object.entries(synonyms)) {
        if (syns.some(s => s.includes(word) || word.includes(s))) {
          if (syns.some(s => searchFields.includes(s.toLowerCase()))) {
            score += 3
          }
        }
      }
    }

    return { skill, score }
  }).filter(s => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 4)

  if (scored.length === 0) {
    return { description: '暂时没找到匹配的蒸馏物，试试换个描述？', skills: [] }
  }

  return {
    description: `为你找到 ${scored.length} 个相关蒸馏物`,
    skills: scored.map((s, i) => ({
      id: s.skill.id,
      name: s.skill.name,
      role: i === 0 ? '核心方案' : '辅助参考',
    })),
  }
}
