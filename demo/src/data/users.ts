export interface User {
  id: string
  name: string
  avatar: string
  title: string
  trackId: string
  level: number
  reputation: number
  totalCitations: number
  totalInstalls: number
  skillsCreated: number
  trackRank: number
  bio: string
  joinedAt: string
  shrimps: Shrimp[]
  heatmapData: number[] // 52 weeks × 7 days = 364 cells
  milestones: Milestone[]
}

export interface Shrimp {
  id: string
  name: string
  avatar: string
  specialty: string
  level: number
  skills: string[] // skill IDs
  status: 'working' | 'idle' | 'training'
}

export interface Milestone {
  date: string
  title: string
  description: string
}

// Generate heatmap data (simulated)
function generateHeatmap(): number[] {
  const data: number[] = []
  for (let i = 0; i < 364; i++) {
    const rand = Math.random()
    if (rand < 0.3) data.push(0)
    else if (rand < 0.55) data.push(1)
    else if (rand < 0.75) data.push(2)
    else if (rand < 0.9) data.push(3)
    else data.push(4)
  }
  return data
}

export const currentUser: User = {
  id: 'user-001',
  name: '凤尾',
  avatar: '🦊',
  title: '高级产品经理',
  trackId: 'pm',
  level: 42,
  reputation: 8750,
  totalCitations: 2341,
  totalInstalls: 5672,
  skillsCreated: 18,
  trackRank: 3,
  bio: '专注于 AI 产品设计，相信 AI Native 是下一个十年的主旋律',
  joinedAt: '2025-12-01',
  shrimps: [
    {
      id: 'shrimp-001',
      name: '小P',
      avatar: '🦐',
      specialty: 'PRD写作 & 需求分析',
      level: 35,
      skills: ['pm-prd-writer', 'pm-review-board', 'pm-survey'],
      status: 'working',
    },
    {
      id: 'shrimp-002',
      name: '小D',
      avatar: '🦞',
      specialty: '数据分析 & 实验设计',
      level: 28,
      skills: ['pm-analytics', 'pm-experiment', 'pm-tracking'],
      status: 'idle',
    },
    {
      id: 'shrimp-003',
      name: '小C',
      avatar: '🦀',
      specialty: 'Code Review & 架构设计',
      level: 22,
      skills: ['eng-superpowers', 'eng-tdd'],
      status: 'training',
    },
  ],
  heatmapData: generateHeatmap(),
  milestones: [
    { date: '2026-06', title: '声望突破 8000', description: '产品赛道排名升至 Top 3' },
    { date: '2026-05', title: '「PRD结构化写作」被引用 400+', description: '成为赛道最热门 Skill' },
    { date: '2026-04', title: '创建第 15 个 Skill', description: '解锁「蒸馏大师」称号' },
    { date: '2026-03', title: '加入蒸馏平台', description: '选择产品经理赛道，开始蒸馏之旅' },
  ],
}

export const mockUsers: Omit<User, 'heatmapData' | 'milestones' | 'shrimps'>[] = [
  {
    id: 'user-002',
    name: '张明远',
    avatar: '🧑‍💼',
    title: '产品总监',
    trackId: 'pm',
    level: 58,
    reputation: 12450,
    totalCitations: 3456,
    totalInstalls: 8234,
    skillsCreated: 32,
    trackRank: 1,
    bio: '10年产品老兵，相信好产品来自好方法论的可复制',
    joinedAt: '2025-11-01',
  },
  {
    id: 'user-003',
    name: '李浩然',
    avatar: '👨‍💻',
    title: '架构师',
    trackId: 'engineer',
    level: 52,
    reputation: 10890,
    totalCitations: 2890,
    totalInstalls: 7123,
    skillsCreated: 27,
    trackRank: 1,
    bio: '系统设计爱好者，能把复杂系统讲成故事',
    joinedAt: '2025-11-15',
  },
  {
    id: 'user-004',
    name: '王艺涵',
    avatar: '👩‍🎨',
    title: '设计负责人',
    trackId: 'designer',
    level: 47,
    reputation: 9230,
    totalCitations: 1456,
    totalInstalls: 5670,
    skillsCreated: 38,
    trackRank: 1,
    bio: '设计系统践行者，让每个像素都有意义',
    joinedAt: '2025-12-01',
  },
  {
    id: 'user-005',
    name: '赵思琪',
    avatar: '👩‍💼',
    title: '增长负责人',
    trackId: 'ops',
    level: 45,
    reputation: 8900,
    totalCitations: 1678,
    totalInstalls: 6234,
    skillsCreated: 24,
    trackRank: 1,
    bio: '数据驱动的增长黑客，让增长有方法可循',
    joinedAt: '2025-12-10',
  },
]
