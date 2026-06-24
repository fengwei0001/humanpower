// 创作者数据 — 社区里的人
export interface Creator {
  id: string
  name: string
  avatar: string
  title: string
  bio: string
  trackIds: string[]
  followers: number
  following: number
  reputation: number
  totalCitations: number
  totalInstalls: number
  skillsCreated: number
  pluginsCreated: number
  rank: number // 全站排名
  badges: Badge[]
  pinnedSkills: string[] // skill IDs
  weeklyActive: boolean
  joinedAt: string
  links?: { type: string; url: string; label: string }[]
  story?: string // 个人故事/定位宣言
}

export interface Badge {
  id: string
  name: string
  icon: string
  description: string
  level?: number
}

export const badges: Record<string, Badge> = {
  'distill-master': { id: 'distill-master', name: '蒸馏大师', icon: '⚗️', description: '创建 10+ 高质量蒸馏物' },
  'citation-king': { id: 'citation-king', name: '引用之王', icon: '🔗', description: '被引用超过 1000 次' },
  'community-star': { id: 'community-star', name: '社区之星', icon: '⭐', description: '连续 30 天活跃贡献' },
  'pioneer': { id: 'pioneer', name: '开拓者', icon: '🚀', description: '最早一批创作者' },
  'mentor': { id: 'mentor', name: '导师', icon: '🎓', description: '帮助 100+ 人装备了你的蒸馏物' },
  'plugin-architect': { id: 'plugin-architect', name: '架构师', icon: '🏗️', description: '发布 3+ 完整 Plugin' },
  'top-track': { id: 'top-track', name: '赛道霸主', icon: '👑', description: '赛道排名 Top 3', level: 1 },
}

export const creators: Creator[] = [
  {
    id: 'creator-zephyr',
    name: 'Zephyr Wang',
    avatar: '🧑‍💼',
    title: '产品总监 · 10年产品老兵',
    bio: '相信好产品来自好方法论的可复制。不会写代码，但我的虾兵比大多数程序员的都能打。',
    trackIds: ['pm'],
    followers: 4520,
    following: 23,
    reputation: 15800,
    totalCitations: 3456,
    totalInstalls: 12340,
    skillsCreated: 32,
    pluginsCreated: 4,
    rank: 1,
    badges: [badges['distill-master'], badges['citation-king'], badges['top-track'], badges['pioneer']],
    pinnedSkills: ['pm-prd-writer', 'pm-review-board', 'pm-analytics', 'pm-experiment'],
    weeklyActive: true,
    joinedAt: '2025-11',
    links: [
      { type: 'twitter', url: '#', label: '@zephyr_pm' },
      { type: 'blog', url: '#', label: 'zephyr.pm' },
    ],
    story: '我做了 10 年产品，最大的感悟是：好的方法论不应该锁在个人脑子里。蒸馏让我把这些年踩过的坑、总结的套路变成了所有人都能用的工具。',
  },
  {
    id: 'creator-jesse',
    name: 'Jesse Vincent',
    avatar: '👨‍💻',
    title: '独立开发者 · TDD 布道师',
    bio: '写代码 20 年，最重要的领悟是：好代码不是写出来的，是测出来的。现在我的虾兵也学会了。',
    trackIds: ['engineer'],
    followers: 3890,
    following: 45,
    reputation: 13200,
    totalCitations: 2890,
    totalInstalls: 9800,
    skillsCreated: 18,
    pluginsCreated: 2,
    rank: 2,
    badges: [badges['distill-master'], badges['citation-king'], badges['pioneer'], badges['plugin-architect']],
    pinnedSkills: ['eng-superpowers', 'eng-tdd', 'eng-debugging', 'eng-architecture'],
    weeklyActive: true,
    joinedAt: '2025-12',
    links: [
      { type: 'github', url: '#', label: 'obra' },
    ],
    story: '我用 superpowers 这套方法论已经 build 了 30+ 个项目。现在它是开源的，任何人的 Agent 都能学会。',
  },
  {
    id: 'creator-zara',
    name: 'Zara Zhang',
    avatar: '👩‍💼',
    title: 'AI tinkerer · 不会写代码的创作者',
    bio: '依然不会写一行代码，但这不妨碍我创造了被 2 万人安装的工具。AI 时代的超能力不是代码，是想法。',
    trackIds: ['pm', 'designer'],
    followers: 9700,
    following: 12,
    reputation: 18500,
    totalCitations: 4980,
    totalInstalls: 22500,
    skillsCreated: 15,
    pluginsCreated: 6,
    rank: 1,
    badges: [badges['distill-master'], badges['citation-king'], badges['community-star'], badges['top-track'], badges['plugin-architect']],
    pinnedSkills: ['pm-slides', 'ops-lark-minutes'],
    weeklyActive: true,
    joinedAt: '2025-11',
    links: [
      { type: 'twitter', url: '#', label: '@zarazhangrui' },
      { type: 'website', url: '#', label: 'zarazhang.com' },
    ],
    story: '我不写代码。但我让 coding agent 替我写了 22k star 的项目。蒸馏让每个有想法的人都能成为 builder。',
  },
  {
    id: 'creator-dean',
    name: 'Dean Peters',
    avatar: '🎯',
    title: 'PM 框架收藏家 · 54 个方法论',
    bio: '把 20 年产品管理的每一个框架都蒸馏成了可执行工具。JTBD、OST、Journey Map... 全都可以让你的虾兵直接跑。',
    trackIds: ['pm'],
    followers: 2340,
    following: 56,
    reputation: 11200,
    totalCitations: 2100,
    totalInstalls: 7800,
    skillsCreated: 54,
    pluginsCreated: 3,
    rank: 4,
    badges: [badges['distill-master'], badges['mentor'], badges['community-star']],
    pinnedSkills: ['pm-jtbd', 'pm-ost', 'pm-journey-map', 'pm-roadmap'],
    weeklyActive: true,
    joinedAt: '2026-01',
    story: '产品管理有无数个框架，但大多数人只是「听过」而不是「用过」。我把每个框架都做成了你的 Agent 能直接执行的工具。',
  },
  {
    id: 'creator-matt',
    name: 'Matt Pocock',
    avatar: '👨‍💻',
    title: 'TypeScript 教育者 · 技能设计师',
    bio: '教 TypeScript 的人那么多，但我想教的是怎么思考。TDD、Debug、架构——这些是方法论，不是知识点。',
    trackIds: ['engineer'],
    followers: 3100,
    following: 34,
    reputation: 10500,
    totalCitations: 1890,
    totalInstalls: 6700,
    skillsCreated: 22,
    pluginsCreated: 1,
    rank: 5,
    badges: [badges['distill-master'], badges['community-star'], badges['mentor']],
    pinnedSkills: ['eng-tdd', 'eng-debugging', 'eng-architecture', 'general-grill'],
    weeklyActive: false,
    joinedAt: '2026-02',
    story: '好的开发者不是知道最多 API 的人，是知道如何系统思考的人。这些 Skill 是我教学生涯的精华。',
  },
  {
    id: 'creator-corey',
    name: 'Corey Haines',
    avatar: '📈',
    title: '增长顾问 · 实验文化传教士',
    bio: '帮助 50+ 团队建立了数据驱动的增长文化。不是做一次 A/B 测试，是让整个团队学会用实验做决策。',
    trackIds: ['ops', 'pm'],
    followers: 1890,
    following: 67,
    reputation: 8900,
    totalCitations: 1678,
    totalInstalls: 5400,
    skillsCreated: 12,
    pluginsCreated: 2,
    rank: 8,
    badges: [badges['distill-master'], badges['mentor']],
    pinnedSkills: ['ops-ab-testing', 'ops-onboarding'],
    weeklyActive: true,
    joinedAt: '2026-03',
    story: '增长不是 hack，是科学方法。每个实验都应该有假设、有对照、有结论。这套体系让你的团队不再「拍脑袋」。',
  },
]
