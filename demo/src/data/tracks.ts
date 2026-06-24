export interface Track {
  id: string
  name: string
  icon: string
  color: string
  bgColor: string
  description: string
  subDomains: string[]
  skillCount: number
  topPlayer: { name: string; avatar: string; citations: number }
}

export const tracks: Track[] = [
  {
    id: 'pm',
    name: '产品经理',
    icon: '🎯',
    color: '#882EFF',
    bgColor: '#F4F0F7',
    description: '从需求洞察到产品落地，全链路产品能力',
    subDomains: ['PRD写作', '需求分析', '数据分析', '增长实验', '用户增长', '用户洞察', '原型设计', '汇报演示', '项目管理'],
    skillCount: 127,
    topPlayer: { name: 'Zephyr Wang', avatar: '🧑‍💼', citations: 3245 },
  },
  {
    id: 'engineer',
    name: '工程师',
    icon: '⚡',
    color: '#468DFB',
    bgColor: '#EBF4FF',
    description: '从架构设计到性能优化，硬核技术能力',
    subDomains: ['架构设计', 'Code Review', '前端开发', 'Debug', '项目管理', 'TDD'],
    skillCount: 203,
    topPlayer: { name: 'Jesse Vincent', avatar: '👨‍💻', citations: 2890 },
  },
  {
    id: 'designer',
    name: '设计师',
    icon: '🎨',
    color: '#E46509',
    bgColor: '#FFF4EB',
    description: '从视觉表达到体验设计，创意与系统并重',
    subDomains: ['视觉设计', '内容设计', '交互设计', '设计系统', '动效设计', '品牌设计'],
    skillCount: 89,
    topPlayer: { name: 'Anthropic', avatar: '🤖', citations: 1534 },
  },
  {
    id: 'ops',
    name: '运营',
    icon: '📈',
    color: '#21B443',
    bgColor: '#E9FBED',
    description: '从增长策略到用户运营，数据驱动增长',
    subDomains: ['用户增长', '效率提升', '活动策划', '社群运营', '数据运营', '内容策略'],
    skillCount: 156,
    topPlayer: { name: 'Corey Haines', avatar: '📈', citations: 1678 },
  },
  {
    id: 'hr',
    name: 'HR',
    icon: '🤝',
    color: '#F5C800',
    bgColor: '#FFFBEB',
    description: '从人才甄选到组织发展，人才是核心竞争力',
    subDomains: ['人才画像', '面试评估', '绩效设计', '团队文化', '组织诊断', '招聘策略'],
    skillCount: 72,
    topPlayer: { name: '陈雨桐', avatar: '🧑‍🏫', citations: 934 },
  },
]
