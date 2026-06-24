// Agent 日报数据 — 模拟 Agent 今天帮用户做了什么
export interface AgentAction {
  id: string
  type: 'executed' | 'discovered' | 'distilled' | 'fetched'
  title: string
  description: string
  time: string
  skillId?: string
  result?: string
}

export interface DistillDraft {
  id: string
  name: string
  description: string
  trigger: string // 什么触发了这个蒸馏
  confidence: number // Agent 对这个蒸馏物的信心（0-100）
  usedCount: number // 已经悄悄帮你用了几次
  communityDemand: number // 社区有多少人在找类似的
  steps: string[]
  status: 'pending' | 'confirmed' | 'shared'
}

export const todayActions: AgentAction[] = [
  {
    id: 'act-1',
    type: 'executed',
    title: '帮你写完了周报初稿',
    description: '基于本周 5 次对话和 3 个已完成任务，自动生成了周报。',
    time: '09:15',
    skillId: 'pm-postmortem',
    result: '周报已生成，等你确认',
  },
  {
    id: 'act-2',
    type: 'fetched',
    title: '从社区找到了一个更好的竞品分析方法',
    description: '你上次做竞品分析用了 2 小时，社区有个 Skill 能帮你缩到 30 分钟。',
    time: '10:30',
    skillId: 'pm-jtbd',
  },
  {
    id: 'act-3',
    type: 'executed',
    title: '自动触发了 PRD 评审',
    description: '检测到你保存了新的 PRD 文档，已用「一个人开完评审会」跑了一遍。发现 2 个 Major 问题。',
    time: '14:20',
    skillId: 'pm-review-board',
    result: '2 个问题需要你处理',
  },
  {
    id: 'act-4',
    type: 'discovered',
    title: '发现你重复做了同一件事',
    description: '你这周第 3 次用同样的格式整理会议纪要了。我准备了一个蒸馏草稿，要不要看看？',
    time: '16:45',
  },
  {
    id: 'act-5',
    type: 'executed',
    title: '帮你预生成了明天评审的演示',
    description: '检测到日历里明天有「Q3 产品评审」，已经用你的方案内容生成了演示初稿。',
    time: '17:30',
    skillId: 'pm-slides',
    result: '演示文稿已就绪',
  },
]

export const distillDrafts: DistillDraft[] = [
  {
    id: 'draft-1',
    name: '会议纪要整理三步法',
    description: '我观察到你整理会议纪要总是这个套路：先提取决策点 → 再列行动项（标注 Owner）→ 最后标注遗留问题。这周你已经用了 3 次。',
    trigger: '本周重复 3 次相同模式',
    confidence: 92,
    usedCount: 3,
    communityDemand: 28,
    steps: [
      '从会议记录中提取所有决策点（用 ✅ 标注）',
      '列出行动项，每条标注 Owner 和 Deadline',
      '标注未决问题和需要下次会议跟进的事项',
    ],
    status: 'pending',
  },
  {
    id: 'draft-2',
    name: '需求邮件秒回模板',
    description: '你回复业务方需求邮件的模式很固定：先确认收到 → 提 2-3 个澄清问题 → 给出初步排期。已经帮你用了 5 次，每次你都没改。',
    trigger: '连续 5 次无修改使用',
    confidence: 96,
    usedCount: 5,
    communityDemand: 45,
    steps: [
      '确认收到需求，表达重视',
      '提出 2-3 个关键澄清问题（优先级/目标用户/成功标准）',
      '给出初步排期评估和下一步行动',
    ],
    status: 'pending',
  },
  {
    id: 'draft-3',
    name: '竞品截图分析流程',
    description: '你分析竞品截图总是：先标注交互差异 → 再推测产品逻辑 → 最后总结可借鉴点。上周做了 4 次。',
    trigger: '上周重复 4 次',
    confidence: 88,
    usedCount: 4,
    communityDemand: 19,
    steps: [
      '标注与我们产品的交互差异点',
      '推测对方的产品逻辑和设计意图',
      '总结 3 个可借鉴的点 + 落地建议',
    ],
    status: 'pending',
  },
]

// AI 搜索推荐的组合方案
export interface SkillCombo {
  id: string
  question: string
  skills: { id: string; name: string; role: string }[]
  description: string
}

export const sampleCombos: SkillCombo[] = [
  {
    id: 'combo-1',
    question: '我要做新产品立项评审',
    skills: [
      { id: 'pm-press-release', name: '先写新闻稿', role: '理清价值主张' },
      { id: 'pm-tam-sam-som', name: '市场规模测算', role: '算清楚盘子多大' },
      { id: 'pm-slides', name: '做一份惊艳的演示', role: '包装成 Deck' },
    ],
    description: '从价值主张到市场验证到包装呈现，一条龙搞定立项。',
  },
  {
    id: 'combo-2',
    question: '新功能上线后数据不好怎么办',
    skills: [
      { id: 'pm-analytics', name: '数据跌了？5分钟定位', role: '先找到问题在哪' },
      { id: 'pm-experiment', name: '设计 A/B 实验', role: '验证优化方案' },
      { id: 'pm-postmortem', name: '项目复盘不走过场', role: '沉淀经验教训' },
    ],
    description: '定位问题 → 实验验证 → 复盘沉淀，形成闭环。',
  },
  {
    id: 'combo-3',
    question: '从零开始做用户调研',
    skills: [
      { id: 'pm-jtbd', name: '搞懂用户到底想要什么', role: '明确研究方向' },
      { id: 'pm-discovery-interview', name: '5次访谈就够了', role: '设计访谈计划' },
      { id: 'pm-survey', name: '设计用户愿意填完的问卷', role: '量化验证' },
    ],
    description: '先定方向 → 深度访谈 → 量化验证，三步做完调研。',
  },
]
