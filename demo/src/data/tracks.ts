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
    id: 'creator',
    name: '自媒体',
    icon: '📹',
    color: '#E46509',
    bgColor: '#FFF4EB',
    description: '内容创作、视频剪辑、自媒体运营全流程',
    subDomains: ['视频创作', '文案写作', '内容策划', '数据分析', '粉丝运营', '变现策略'],
    skillCount: 89,
    topPlayer: { name: '中书令', avatar: '📹', citations: 1534 },
  },
  {
    id: 'opc',
    name: 'OPC',
    icon: '🚀',
    color: '#21B443',
    bgColor: '#E9FBED',
    description: '独立开发者 / 一人公司，从 0 到 1 构建产品',
    subDomains: ['产品构建', '增长获客', '技术选型', '商业化', '自动化', '效率工具'],
    skillCount: 156,
    topPlayer: { name: 'Zara Zhang', avatar: '👩‍💼', citations: 4980 },
  },
]
