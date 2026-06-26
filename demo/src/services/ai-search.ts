import { skills } from '../data/skills'

// 构建更丰富的 skills 上下文——让 AI 有足够信息做精准推荐
function buildSkillsContext(): string {
  return skills.map(s => {
    const parts = [`[${s.id}] ${s.name}`]
    parts.push(`  描述: ${s.description}`)
    if (s.scenario) parts.push(`  场景: ${s.scenario}`)
    if (s.input) parts.push(`  输入: ${s.input}`)
    if (s.output) parts.push(`  输出: ${s.output}`)
    if (s.methodology) parts.push(`  方法: ${s.methodology.slice(0, 100)}...`)
    parts.push(`  赛道: ${s.trackIds.join('/')} | 标签: ${s.tags.join(',')}`)
    return parts.join('\n')
  }).join('\n\n')
}

const SEARCH_SYSTEM_PROMPT = `你是「蒸馏广场」的智能推荐引擎。

## 你的能力
用户描述一个工作中的问题或目标，你从蒸馏物库中挑选最相关的 3-5 个，组成一个有逻辑的解决方案。

## 赛道说明
- pm: 产品经理（需求、PRD、评审、数据分析、用户研究）
- engineer: 工程师（开发、测试、Code Review、架构）
- designer: 设计师（视觉、内容、原型）
- ops: 运营（增长、留存、实验、内容）
- hr: HR（招聘、培训）

## 蒸馏物库
${buildSkillsContext()}

## 推荐原则
1. **理解真实意图** — 用户可能说得模糊，你要看透本质（"老板让我做个东西"= 需要 PRD + 评审）
2. **组合要有逻辑** — 不是随便凑数，是有先后顺序、互相补位的工作流
3. **给出理由** — 解释为什么选这几个，为什么这个顺序
4. **判断匹配度** — 如果库里确实没有特别匹配的，诚实说

## 返回格式（严格 JSON，不要多余文字）
\`\`\`json
{
  "description": "整体方案一句话（面向用户，像朋友推荐）",
  "reasoning": "为什么推荐这个组合（1-2句话，解释逻辑）",
  "confidence": "high/medium/low",
  "skills": [
    {
      "id": "skill-id",
      "name": "蒸馏物名称",
      "role": "在方案中的角色（如：第一步理清方向）",
      "why": "为什么选它（一句话，说出它在这里的独特价值）"
    }
  ]
}
\`\`\`

## confidence 判断标准
- high: 库里有 3+ 个高度相关的蒸馏物，组合逻辑清晰
- medium: 有部分相关的蒸馏物，但覆盖不完整
- low: 勉强能找到一些边缘相关的

## 注意
- id 必须是库中真实存在的 id（方括号里的那个）
- 按执行先后顺序排列
- 如果完全无关，返回 {"description":"...", "reasoning":"...", "confidence":"low", "skills":[]}
`

export interface SearchResultSkill {
  id: string
  name: string
  role: string
  why?: string
}

export interface SearchResult {
  description: string
  reasoning?: string
  confidence?: 'high' | 'medium' | 'low'
  skills: SearchResultSkill[]
}

export async function aiSearchSkills(query: string): Promise<SearchResult> {
  const response = await fetch('/api/ai-search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query,
      systemPrompt: SEARCH_SYSTEM_PROMPT,
    }),
  })

  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: 'unknown' }))
    throw new Error(err.error || `API error: ${response.status}`)
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

// ═══════════════════════════════════════════════
// 本地 fallback：更智能的关键词匹配
// ═══════════════════════════════════════════════

export function localSearchSkills(query: string): SearchResult {
  const q = query.toLowerCase()

  // 同义词映射（扩展）
  const synonyms: Record<string, string[]> = {
    '评审': ['review', '评审', '立项', 'PRD', '方案'],
    '数据': ['数据', '分析', '指标', '埋点', 'A/B', '留存', '转化'],
    '调研': ['用户', '访谈', '问卷', '洞察', 'JTBD', '调研', '了解'],
    '汇报': ['演示', 'PPT', '汇报', 'slides', '展示', '讲'],
    '代码': ['代码', '开发', '测试', 'TDD', 'review', 'debug', '重构', '架构'],
    '设计': ['设计', '原型', 'UI', '前端', '页面', '样式'],
    '增长': ['增长', 'onboarding', '激活', '留存', 'A/B', '实验', '优化'],
    '会议': ['会议', '纪要', '复盘', '对齐', '同步'],
    '需求': ['需求', 'PRD', '功能', '优先级', '排期', '规划'],
    '竞品': ['竞品', '市场', '分析', '对比', '调研'],
    '文档': ['文档', '写', '规范', 'RFC', '方案', '文字'],
    '项目': ['项目', '管理', '排期', '拆解', 'issue', '任务'],
  }

  // 打分 — 更精细
  const scored = skills.map(skill => {
    let score = 0

    // 把所有可搜索字段合并
    const searchFields = [
      skill.name,
      skill.description,
      skill.scenario || '',
      skill.input || '',
      skill.output || '',
      skill.methodology || '',
      ...skill.tags,
    ].join(' ').toLowerCase()

    // 完整 query 匹配（最高权重）
    if (searchFields.includes(q)) score += 15

    // 分词匹配
    const words = q.split(/[\s，,。、？?！!""''「」]+/).filter(w => w.length > 0)
    for (const word of words) {
      if (word.length < 2) continue // 跳过单字

      // 直接匹配
      if (searchFields.includes(word)) score += 6

      // name 匹配额外加分
      if (skill.name.toLowerCase().includes(word)) score += 4

      // 同义词匹配
      for (const [, syns] of Object.entries(synonyms)) {
        if (syns.some(s => s.includes(word) || word.includes(s))) {
          if (syns.some(s => searchFields.includes(s.toLowerCase()))) {
            score += 3
            break
          }
        }
      }
    }

    // 热门加分（微调）
    if (score > 0) {
      score += Math.log2(skill.installs + 1) * 0.5
    }

    return { skill, score }
  }).filter(s => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)

  if (scored.length === 0) {
    return {
      description: '暂时没找到匹配的蒸馏物，试试换个描述？',
      confidence: 'low',
      skills: [],
    }
  }

  // 从 skill 自身信息动态生成 role 和 why
  const generateRole = (skill: typeof skills[0], index: number): string => {
    if (index === 0) return skill.scenario ? `切入点：${skill.scenario.slice(0, 20)}` : '核心方案'
    if (skill.output) return `产出：${skill.output.slice(0, 15)}...`
    return skill.subDomain
  }

  const generateWhy = (skill: typeof skills[0]): string => {
    if (skill.methodology) return skill.methodology.slice(0, 40) + '...'
    if (skill.highlights?.[0]) return skill.highlights[0].slice(0, 40) + '...'
    return skill.description.slice(0, 40) + '...'
  }

  // 判断 confidence
  const maxScore = scored[0]?.score || 0
  const confidence: 'high' | 'medium' | 'low' =
    maxScore > 20 && scored.length >= 3 ? 'high' :
    maxScore > 10 ? 'medium' : 'low'

  return {
    description: `为你找到 ${scored.length} 个相关蒸馏物，组合使用效果更佳`,
    reasoning: `基于「${q}」匹配了${scored[0].skill.subDomain}等相关领域的蒸馏物`,
    confidence,
    skills: scored.map((s, i) => ({
      id: s.skill.id,
      name: s.skill.name,
      role: generateRole(s.skill, i),
      why: generateWhy(s.skill),
    })),
  }
}
