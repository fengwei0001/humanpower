import { fetchSearchContext, type SearchContextSkill } from './skills-api'

// 缓存搜索上下文（避免每次搜索都请求）
let cachedContext: SearchContextSkill[] | null = null
let cacheTime = 0
const CACHE_TTL = 5 * 60 * 1000 // 5 分钟缓存

export async function getSearchContext(): Promise<SearchContextSkill[]> {
  const now = Date.now()
  if (cachedContext && now - cacheTime < CACHE_TTL) {
    return cachedContext
  }

  cachedContext = await fetchSearchContext()
  cacheTime = now
  return cachedContext
}

function buildSkillsContext(skills: SearchContextSkill[]): string {
  return skills.map(s => {
    const parts = [`[db-${s.id}] ${s.display_name}`]
    parts.push(`  描述: ${s.display_desc}`)
    if (s.scenario) parts.push(`  场景: ${s.scenario}`)
    if (s.input) parts.push(`  输入: ${s.input}`)
    if (s.output) parts.push(`  输出: ${s.output}`)
    parts.push(`  赛道: ${(s.track_ids || [s.track_id]).join('/')} | 标签: ${(s.tags || []).slice(0, 5).join(',')}`)
    return parts.join('\n')
  }).join('\n\n')
}

function buildSystemPrompt(skillsContext: string): string {
  return `你是「蒸馏广场」的智能推荐引擎。

## 你的能力
用户描述一个工作中的问题或目标，你从蒸馏物库中挑选最相关的 3-5 个，组成一个有逻辑的解决方案。

## 赛道说明
- pm: 产品经理（需求、PRD、评审、数据分析、用户研究）
- engineer: 工程师（开发、测试、Code Review、架构）
- designer: 设计师（视觉、内容、原型）
- ops: 运营（增长、留存、实验、内容）
- hr: HR（招聘、培训）

## 蒸馏物库
${skillsContext}

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
}

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
  // 先获取搜索上下文（从数据库）
  const context = await getSearchContext()
  const skillsContext = buildSkillsContext(context)
  const systemPrompt = buildSystemPrompt(skillsContext)

  const response = await fetch('/api/ai-search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, systemPrompt }),
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
  const validIds = new Set(context.map(s => `db-${s.id}`))
  result.skills = result.skills.filter(s => validIds.has(s.id))

  return result
}

// ═══════════════════════════════════════════════
// 本地 fallback：关键词匹配（用数据库数据）
// ═══════════════════════════════════════════════

export async function localSearchSkills(query: string): Promise<SearchResult> {
  const context = await getSearchContext()
  const q = query.toLowerCase()

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
    '文档': ['文档', '写', '规范', 'RFC', '方案', '文字'],
    '项目': ['项目', '管理', '排期', '拆解', 'issue', '任务'],
  }

  const scored = context.map(skill => {
    let score = 0
    const searchFields = [
      skill.display_name,
      skill.display_desc,
      skill.scenario || '',
      skill.input || '',
      skill.output || '',
      ...(skill.tags || []),
    ].join(' ').toLowerCase()

    if (searchFields.includes(q)) score += 15

    const words = q.split(/[\s，,。、？?！!""''「」]+/).filter(w => w.length > 1)
    for (const word of words) {
      if (searchFields.includes(word)) score += 6
      if (skill.display_name.toLowerCase().includes(word)) score += 4
      for (const [, syns] of Object.entries(synonyms)) {
        if (syns.some(s => s.includes(word) || word.includes(s))) {
          if (syns.some(s => searchFields.includes(s.toLowerCase()))) {
            score += 3
            break
          }
        }
      }
    }

    if (score > 0) score += Math.log2(skill.download_count + 1) * 0.5

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

  const maxScore = scored[0]?.score || 0
  const confidence: 'high' | 'medium' | 'low' =
    maxScore > 20 && scored.length >= 3 ? 'high' :
    maxScore > 10 ? 'medium' : 'low'

  return {
    description: `为你找到 ${scored.length} 个相关蒸馏物，组合使用效果更佳`,
    reasoning: `基于「${q}」匹配了相关领域的蒸馏物`,
    confidence,
    skills: scored.map((s, i) => ({
      id: `db-${s.skill.id}`,
      name: s.skill.display_name,
      role: i === 0 ? '核心方案' : (s.skill.output ? `产出：${s.skill.output.slice(0, 15)}...` : s.skill.sub_domain || ''),
      why: s.skill.display_desc.slice(0, 40) + '...',
    })),
  }
}
