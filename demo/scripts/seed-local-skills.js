/**
 * 将本地精品 skill（src/data/skills.ts 中的 28 个）导入 PostgreSQL
 * 这些 skill 符合 content-standard，有 display_name/display_desc/steps 等字段
 *
 * 用法:
 *   DATABASE_URL=postgresql://... node scripts/seed-local-skills.js
 */
import pg from 'pg';

const { Pool } = pg;

// 从 src/data/skills.ts 中提取的 28 个精品 skill
const LOCAL_SKILLS = [
  {
    id: 'pm-prd-writer',
    name: '30 分钟搞定 PRD',
    description: '再也不用对着空白文档发呆了。把老板那句话丢进来，出来的就是能直接拉评审的完整 PRD。',
    trackId: 'pm',
    trackIds: ['pm'],
    subDomain: 'PRD写作',
    creator: 'Zephyr Wang',
    installs: 2834,
    rating: 4.9,
    tags: ['PRD', '需求文档', '产品设计'],
    sourceUrl: 'https://github.com/zephyrwang6/pm-skills/blob/main/pm-prd-writer/SKILL.md',
    input: '老板那句话、群里的聊天记录、会上的只言片语、竞品截图——越碎越好',
    output: '评审直接过的 PRD + 一份「这些点你得去确认」的清单',
    scenario: '周一早上老板扔来一句「做个XX功能」，周三要评审，你慌不慌？',
    steps: [
      '把你脑子里那坨混沌想法倒出来，我帮你理清楚哪些是已知、哪些还缺',
      '按照能过评审的标准写出来——背景、用户故事、功能清单、流程图、数据字典一步到位',
      '自动补上你肯定会漏的：异常情况、边界条件、埋点需求',
      '给你一份能直接丢到评审群的成品，和一份「这几个问题你得找人确认」的清单',
    ],
  },
  {
    id: 'pm-review-board',
    name: '一个人开完评审会',
    description: '不用再凑齐 6 个人的时间了。PM、研发、QA、设计、运营、法务同时帮你挑刺，5 分钟出结果。',
    trackId: 'pm', trackIds: ['pm', 'engineer'], subDomain: '需求分析',
    creator: 'Zephyr Wang', installs: 1956, rating: 4.8,
    tags: ['评审', '多角色', '质量把控'],
    sourceUrl: 'https://github.com/zephyrwang6/pm-skills/blob/main/pm-review-board/SKILL.md',
    input: '你写好的 PRD、画好的原型截图',
    output: '通过/有条件通过/打回 + 每个角色的具体意见 + 严重程度分级',
    scenario: '评审会老约不上，或者你想提前知道会被挑什么刺',
    steps: ['6 个角色同时看你的文档，各自从专业视角找问题', '研发会问「这个怎么实现」，QA 会问「这个边界怎么测」，法务会问「这个合规吗」', '把重复的问题合并，矛盾的意见拉出来标明', '给你一个明确的结论：能过 / 改完这几点就能过 / 别交了先改'],
  },
  {
    id: 'pm-analytics',
    name: '数据跌了？5 分钟定位原因',
    description: '老板问「为什么这个数掉了」的时候，你不用再慌了。丢进数据，出来的是带图表的分析报告和行动建议。',
    trackId: 'pm', trackIds: ['pm', 'ops'], subDomain: '数据分析',
    creator: 'Zephyr Wang', installs: 1678, rating: 4.7,
    tags: ['数据分析', '指标拆解', '决策'],
    sourceUrl: 'https://github.com/zephyrwang6/pm-skills/blob/main/pm-analytics/SKILL.md',
    input: '你的数据（Excel/CSV/SQL 截图都行）+ 「哪个数不对劲了」',
    output: '可交互的可视化分析报告 + 「建议你下一步这样做」',
    scenario: '周一数据周会，留存掉了 3 个点，老板要你给个说法',
    steps: ['先搞清楚你到底要回答什么问题', '检查数据有没有坑（采集出错了？样本量够吗？）', '像剥洋葱一样拆指标——到底是哪个环节、哪群人出了问题', '给你明确的行动建议：先做什么、后做什么、怎么验证效果'],
  },
  {
    id: 'pm-experiment',
    name: '设计一个靠谱的 A/B 实验',
    description: '不再「拍脑袋上线看看」了。帮你设计严谨的实验，跑完数据能直接说服老板。',
    trackId: 'pm', trackIds: ['pm', 'ops'], subDomain: '增长实验',
    creator: 'Zephyr Wang', installs: 1234, rating: 4.8,
    tags: ['A/B测试', '实验', '增长'],
    sourceUrl: 'https://github.com/zephyrwang6/pm-skills/blob/main/pm-experiment-designer/SKILL.md',
    input: '你想验证什么 + 现在有多少流量 + 能跑多久',
    output: '一份连数据同学都挑不出毛病的实验方案',
    scenario: '你觉得改个按钮颜色能提升转化，但不知道怎么证明',
    steps: ['把「我觉得」变成可验证的假设——预期提升多少、怎么算成功', '设计对照组和实验组，搞清楚要跑多少样本', '定好看什么指标——不只是主指标，还有护栏指标防止顾此失彼', '提前定好「什么情况下叫停」——不让烂实验浪费流量'],
  },
  {
    id: 'pm-tracking',
    name: '再也不返工的埋点方案',
    description: '上线之后才发现「这个数据没埋」的痛，一次都不想再经历了。从 PRD 直接生成完整埋点方案。',
    trackId: 'pm', trackIds: ['pm', 'engineer'], subDomain: '数据分析',
    creator: 'Zephyr Wang', installs: 1089, rating: 4.6,
    tags: ['埋点', '数据采集', '规范'],
    sourceUrl: 'https://github.com/zephyrwang6/pm-skills/blob/main/pm-tracking-spec-writer/SKILL.md',
    input: '你的 PRD 或者用户流程描述',
    output: '事件表 + 字段字典 + 命名规范检查 + QA 验证 SQL（开发直接能用）',
    scenario: '新功能下周提测，数据同学问你「埋点方案呢？」',
    steps: ['把用户操作路径捋一遍，标出每个关键行为节点', '自动拆解出该埋哪些事件（页面/曝光/点击/业务事件）', '每个事件配好字段——类型、枚举值、是否必填，严丝合缝', '自动查重命名冲突 + 给 QA 同学生成验证用的 SQL'],
  },
  {
    id: 'pm-survey',
    name: '设计一份用户愿意填完的问卷',
    description: '问卷发出去 200 份回收 20 份？不是用户懒，是问卷设计有问题。帮你设计高回收率的调研问卷。',
    trackId: 'pm', trackIds: ['pm'], subDomain: '用户洞察',
    creator: 'Zephyr Wang', installs: 876, rating: 4.5,
    tags: ['问卷', '用户研究', '调研'],
    sourceUrl: 'https://github.com/zephyrwang6/pm-skills/blob/main/pm-survey-designer/SKILL.md',
    input: '你想搞清楚什么 + 目标人群是谁 + 怎么发放',
    output: '一份精心设计的问卷 + 偏差检查报告 + 分析框架',
    scenario: '要做用户满意度调研，但不想问出一堆没用的数据',
    steps: ['把调研目标拆成具体要验证的假设', '设计题目——每道题都有明确目的，15-25 题不贪多', '帮你检查有没有诱导性问题、双重含义、让人不舒服的措辞', '连分析怎么做都帮你想好了——交叉分析矩阵、成功判定标准'],
  },
  {
    id: 'pm-postmortem',
    name: '项目复盘不再走过场',
    description: '复盘会不是追责大会。帮你写出有数据、有根因、有 Action 的复盘报告，让团队真正学到东西。',
    trackId: 'pm', trackIds: ['pm', 'ops'], subDomain: '项目管理',
    creator: 'Zephyr Wang', installs: 934, rating: 4.6,
    tags: ['复盘', '根因分析', 'Action Item'],
    sourceUrl: 'https://github.com/zephyrwang6/pm-skills/blob/main/pm-postmortem-writer/SKILL.md',
    input: '当初定的目标 + 实际数据 + 过程中遇到的坑',
    output: '量化对比报告 + 5-Why 根因分析 + 谁什么时候做什么的 Action List',
    scenario: '项目上线两周了，该复盘了，但不想写那种「大家辛苦了」的废话报告',
    steps: ['逐项对比当初说的目标和实际结果——差了多少，为什么', '追问 5 个 Why 挖到根因——是需求没想清楚？还是排期太紧？还是沟通出了问题？', '总结方法论——下次该坚持什么、停止什么', '每条 Action 都钉死：谁做、什么时候做完、怎么验证做到了'],
  },
  {
    id: 'pm-image2proto',
    name: '截图秒变可点击原型',
    description: '发一张 UI 截图或者手画的线框，几秒出一个能点击跳转的 HTML 原型。再也不用等设计排期了。',
    trackId: 'pm', trackIds: ['pm', 'designer'], subDomain: '原型设计',
    creator: 'Zephyr Wang', installs: 1567, rating: 4.8,
    tags: ['原型', '截图还原', 'HTML'],
    sourceUrl: 'https://github.com/zephyrwang6/pm-skills/blob/main/space-image2proto/SKILL.md',
    input: '截图、设计稿、甚至纸上画的草图',
    output: '一个能在浏览器里点的 HTML 原型，打开就能演示',
    scenario: '评审前想快速出个原型验证想法，但设计同学排不开',
    steps: ['拍一张你想要的样子（参考 App 截图、草图都行）', '自动识别布局、颜色、组件，还原成真实 HTML', '按钮能点、Tab 能切、弹窗能弹——不只是静态图', '要改？说一句话就行，比如「把按钮改成绿色」'],
  },
  {
    id: 'pm-slides',
    name: '做一份惊艳的演示',
    description: '不用纠结 PPT 模板了。描述你要讲什么，直接出一份设计感拉满的演示文稿，双击就能开讲。',
    trackId: 'pm', trackIds: ['pm', 'designer'], subDomain: '汇报演示',
    creator: 'Zara Zhang', installs: 2156, rating: 4.9,
    tags: ['演示', '汇报', 'Slides', '设计'],
    sourceUrl: 'https://github.com/zarazhangrui/frontend-slides',
    input: '你要讲的内容大纲，或者一份现有的 PPT',
    output: '一份设计感在线的 HTML 演示文稿，双击打开就能上台',
    scenario: '明天要给 VP 汇报，PPT 还没影子',
    steps: ['告诉我你要讲什么、给谁讲', '给你 3 套视觉风格让你选——不用纠结审美，看图选就行', '一键生成完整演示，40+ 专业模板随意换', '零依赖单文件，双击打开就能开讲，还能分享链接给同事'],
  },
  {
    id: 'pm-jtbd',
    name: '搞懂用户到底想要什么',
    description: '用户说「我想要一匹更快的马」？别被表面需求骗了。JTBD 帮你挖到用户真正在「雇佣」你解决的问题。',
    trackId: 'pm', trackIds: ['pm'], subDomain: '用户洞察',
    creator: 'Dean Peters', installs: 1678, rating: 4.8,
    tags: ['JTBD', '用户需求', '洞察'],
    sourceUrl: 'https://github.com/deanpeters/Product-Manager-Skills/tree/main/skills/jobs-to-be-done',
    input: '你的产品/功能 + 目标用户群',
    output: '用户的真实 Job（功能性/社交性/情感性）+ 痛点 + 期望',
    scenario: '做了个功能没人用，想搞懂用户到底在乎什么',
    steps: ['别问用户「想要什么功能」——问他们在生活中想完成什么任务', '挖三层：要做什么事（功能）、想被别人怎么看（社交）、想要什么感受（情感）', '找出哪些痛点现有方案没解决好', '最重要的：发现你的真正竞争对手——可能是 Excel、微信群、甚至纸笔'],
  },
  {
    id: 'pm-ost',
    name: '别急着做功能，先想清楚问题',
    description: '老板说「我们要做XX」？先别动手。用机会解决方案树把「要做什么」变成「该解决什么问题」，避免成为功能工厂。',
    trackId: 'pm', trackIds: ['pm'], subDomain: '需求分析',
    creator: 'Dean Peters', installs: 1534, rating: 4.7,
    tags: ['OST', 'Discovery', '产品发现'],
    sourceUrl: 'https://github.com/deanpeters/Product-Manager-Skills/tree/main/skills/opportunity-solution-tree',
    input: '老板/业务方丢过来的需求或方向',
    output: '一棵清晰的决策树：目标 → 用户问题 → 可能的方案 → 验证实验',
    scenario: '业务方说「做个积分商城」，你心里犯嘀咕「真的需要吗？」',
    steps: ['从对方的请求里提炼出真正的业务目标（不是功能，是结果）', '列出能达到这个目标的用户问题/机会（通常不止一个！）', '为每个机会设计 2-3 种解法——积分商城可能只是其中之一', '选出最值得先试的，设计一个小实验验证'],
  },
  {
    id: 'pm-journey-map',
    name: '画出用户的完整体验地图',
    description: '用户在哪一步流失的？体验在哪里断裂的？一张旅程地图让全团队看到同一幅图景，不再盲人摸象。',
    trackId: 'pm', trackIds: ['pm', 'designer', 'ops'], subDomain: '用户洞察',
    creator: 'Dean Peters', installs: 1423, rating: 4.7,
    tags: ['旅程地图', '体验设计', '触点'],
    sourceUrl: 'https://github.com/deanpeters/Product-Manager-Skills/tree/main/skills/customer-journey-map',
    input: '你的产品 + 目标用户 + 想重点看哪段旅程',
    output: '一张全景旅程地图（每个阶段的行为、触点、情绪、数据、负责人）',
    scenario: '新用户注册后留存很差，但不知道到底是哪一步出了问题',
    steps: ['从「第一次听说你」到「成为忠实用户」，把每个阶段标出来', '在每个阶段记录：用户做了什么、在哪接触你、心情怎么样', '标出情绪的高峰和低谷——低谷就是你的机会', '给每个阶段配上数据指标和负责团队，变成可执行的行动地图'],
  },
  {
    id: 'pm-roadmap',
    name: '做一份老板点头的路线图',
    description: '15 个需求抢资源，你只能排 5 个。帮你理清优先级、对齐干系人、产出一份有战略逻辑的路线图。',
    trackId: 'pm', trackIds: ['pm'], subDomain: '项目管理',
    creator: 'Dean Peters', installs: 1890, rating: 4.8,
    tags: ['路线图', '策略', '排期'],
    sourceUrl: 'https://github.com/deanpeters/Product-Manager-Skills/tree/main/skills/roadmap-planning',
    input: '一堆竞争性需求 + 战略方向 + 团队能力',
    output: '一份讲得出为什么这么排的路线图（不是功能列表！）',
    scenario: 'Q3 规划，5 个业务方都说自己的最重要',
    steps: ['用多维度框架打分排序——不再「谁嗓门大谁优先」', '把零碎需求聚合成有意义的 Epic', '把关键干系人拉对齐——不是通知，是共创共识', '产出一份「为什么先做这个」的故事，而不只是甘特图'],
  },
  {
    id: 'pm-stakeholder-map',
    name: '搞定所有利益相关方',
    description: '项目推不动？不是方案不好，是利益相关方没搞定。帮你看清谁有权力、谁受影响、该跟谁怎么聊。',
    trackId: 'pm', trackIds: ['pm', 'ops'], subDomain: '项目管理',
    creator: 'Dean Peters', installs: 987, rating: 4.5,
    tags: ['干系人', '沟通', '策略'],
    sourceUrl: 'https://github.com/deanpeters/Product-Manager-Skills/tree/main/skills/stakeholder-mapping',
    input: '项目背景 + 涉及到的人',
    output: '干系人地图 + 每个人该怎么沟通的策略 + 你可能忽略了谁',
    scenario: '跨部门项目启动，不知道该优先搞定谁',
    steps: ['画出「谁有决策权 × 谁真的在乎」的矩阵', '再画出「谁会受影响 × 谁说了算」的矩阵', '对比两张图——发现那些被忽略的、该有话语权却没被听到的人', '给每个人定一个沟通策略：高管要简报、执行层要细节、沉默方要主动拉'],
  },
  {
    id: 'pm-press-release',
    name: '先写新闻稿，再写代码',
    description: 'Amazon 的秘密武器：先假装产品做完了、写一篇新闻稿。如果写不出让人兴奋的稿子，说明产品本身有问题。',
    trackId: 'pm', trackIds: ['pm', 'ops'], subDomain: '需求分析',
    creator: 'Dean Peters', installs: 1234, rating: 4.6,
    tags: ['逆向工作法', 'Amazon', '愿景'],
    sourceUrl: 'https://github.com/deanpeters/Product-Manager-Skills/tree/main/skills/press-release',
    input: '你想做的产品/功能 + 为谁做的',
    output: '一篇假装产品已经发布的新闻稿——如果你自己都不兴奋，就别做了',
    scenario: '新产品想法太多，不知道哪个真的值得投入',
    steps: ['想象产品已经上线了——第一句话你怎么介绍给世界？', '用客户的嘴说——他们之前有多痛苦、现在有多爽', '如果写出来你自己都觉得平淡，那说明这个产品没想清楚', '写出来的新闻稿就是你的北极星——后面所有工作对照着做'],
  },
  {
    id: 'pm-discovery-interview',
    name: '5 次访谈就够了（如果问对问题）',
    description: '用户访谈不是聊天。帮你准备一份精心设计的访谈计划，5 次对话就能挖到别人 20 次都挖不到的洞察。',
    trackId: 'pm', trackIds: ['pm', 'designer'], subDomain: '用户洞察',
    creator: 'Dean Peters', installs: 1123, rating: 4.6,
    tags: ['访谈', '用户研究', 'Discovery'],
    sourceUrl: 'https://github.com/deanpeters/Product-Manager-Skills/tree/main/skills/discovery-interview-prep',
    input: '你想验证什么 + 能约到什么样的用户 + 有多少时间',
    output: '完整的访谈剧本（目标、问题清单、追问策略、偏差防护）',
    scenario: '约了 5 个客户下周聊，但不想聊完发现啥有用的都没问到',
    steps: ['先想清楚这次访谈要验证什么假设（不是「聊聊」）', '设计问题——每个问题都有策略，不问是非题，只问开放题', '准备追问路径——用户说「还行吧」的时候你怎么继续挖', '给你一份偏差清单——避免不自觉地诱导用户说你想听的话'],
  },
  {
    id: 'pm-tam-sam-som',
    name: '算出你的市场有多大',
    description: '投资人问「你的市场有多大」不能答「很大」。帮你做一份有数据、有逻辑、经得起追问的市场规模测算。',
    trackId: 'pm', trackIds: ['pm', 'ops'], subDomain: '增长实验',
    creator: 'Dean Peters', installs: 1045, rating: 4.5,
    tags: ['市场规模', 'TAM', '商业分析'],
    sourceUrl: 'https://github.com/deanpeters/Product-Manager-Skills/tree/main/skills/tam-sam-som-calculator',
    input: '你的产品想法 + 目标市场 + 你已知的数据',
    output: '三层市场规模（总量/可服务/可获取）+ 每个数字的计算逻辑和来源',
    scenario: '要写 BP、要过立项评审、要说服老板投资源',
    steps: ['先算天花板——整个行业/品类的总盘子有多大', '再收窄——你的产品能服务到其中多大一块', '最后落地——你明年能吃下多少', '每个数字都标明来源和假设，经得起被挑战'],
  },
  {
    id: 'eng-superpowers',
    name: '让 AI 帮你写出生产级代码',
    description: '不是那种「能跑就行」的代码。从设计讨论到 TDD 到自动 Code Review，出来的代码你敢直接合到 main。',
    trackId: 'engineer', trackIds: ['engineer'], subDomain: '架构设计',
    creator: 'Jesse Vincent', installs: 3456, rating: 4.9,
    tags: ['开发方法论', 'TDD', 'Agent'],
    sourceUrl: 'https://github.com/obra/superpowers',
    input: '一个功能需求或技术任务',
    output: '测试全绿、Review 通过、可直接合并的代码',
    scenario: '接到一个中等复杂度的功能，想高质量交付而不是后面一堆 bug fix',
    steps: ['先聊清楚要做什么——不写一行代码之前先想明白', '把任务拆成 2-5 分钟的小块，每块都有验证标准', '严格 TDD：先写测试、再写实现、最后重构', '自动 Code Review 帮你兜底，从安全到性能到可读性全覆盖'],
  },
  {
    id: 'eng-web-builder',
    name: '一句话变成一个 Web 应用',
    description: '描述你想要什么，直接出一个完整的 React 应用——带 40+ 组件、能交互、能分享。像变魔术一样。',
    trackId: 'engineer', trackIds: ['engineer', 'designer'], subDomain: '前端开发',
    creator: 'Anthropic', installs: 2890, rating: 4.8,
    tags: ['React', 'Web开发', 'shadcn/ui'],
    sourceUrl: 'https://github.com/anthropics/skills/blob/main/skills/web-artifacts-builder/SKILL.md',
    input: '你想做个什么样的应用/工具/页面',
    output: '一个完整的单文件 Web 应用，发给任何人双击就能用',
    scenario: '想快速做个内部工具、数据看板、或者给同事演示个 idea',
    steps: ['用人话描述你想做什么（「一个能拖拽排序的看板」就够了）', 'React + TypeScript + Tailwind + shadcn/ui 全家桶自动配好', '交互逻辑、组件样式、响应式布局一步到位', '打包成单个 HTML 文件——分享链接或者双击打开，零门槛'],
  },
  {
    id: 'eng-tdd',
    name: '写完代码心里有底',
    description: '不再祈祷代码没 bug 了。先写测试再写代码，每一步都有保护网，重构的时候再也不慌。',
    trackId: 'engineer', trackIds: ['engineer'], subDomain: 'Code Review',
    creator: 'Matt Pocock', installs: 2134, rating: 4.7,
    tags: ['TDD', '测试', '代码质量'],
    sourceUrl: 'https://github.com/mattpocock/skills',
    input: '要实现的功能或要修的 bug',
    output: '有完整测试覆盖的实现——改了什么破了什么，一跑就知道',
    scenario: '改一个地方怕影响别处，不敢重构，代码越来越烂',
    steps: ['🔴 先写一个测试——描述你期望的行为（这时候它会失败）', '🟢 写最少的代码让它通过', '🔵 放心大胆重构——测试会告诉你有没有改坏', '循环往复，每一步都有安全网兜着你'],
  },
  {
    id: 'eng-debugging',
    name: '不再「试试改这里看看」',
    description: '面对玄学 bug 不再到处乱改了。用系统化方法：复现 → 缩小范围 → 形成假设 → 验证 → 一击修复。',
    trackId: 'engineer', trackIds: ['engineer'], subDomain: 'Debug',
    creator: 'Matt Pocock', installs: 1823, rating: 4.8,
    tags: ['Debug', '诊断', '方法论'],
    sourceUrl: 'https://github.com/mattpocock/skills',
    input: 'Bug 现象、错误日志、复现步骤（能有多少就多少）',
    output: '根因定位 + 修复代码 + 回归测试（确保不会再犯）',
    scenario: '线上有个偶现 bug，已经在「试试改这里」上浪费了 2 天',
    steps: ['先稳定复现——不能复现的 bug 是鬼故事', '缩小范围——从整个系统缩到一个最小的失败案例', '形成假设——「我猜是因为 XX」，然后用证据验证', '确认根因后一次性修对，补上测试确保不会复发'],
  },
  {
    id: 'eng-architecture',
    name: '给乱成麻的代码理出头绪',
    description: '代码库变大了，改一处牵一发。帮你扫描出最值得重构的地方，输出可视化报告和具体建议。',
    trackId: 'engineer', trackIds: ['engineer'], subDomain: '架构设计',
    creator: 'Matt Pocock', installs: 1456, rating: 4.7,
    tags: ['架构', '重构', '代码质量'],
    sourceUrl: 'https://github.com/mattpocock/skills',
    input: '指定一个代码库路径或模块',
    output: '可视化 HTML 报告：哪里最乱、改哪里收益最大、怎么改',
    scenario: '新人进来说「这代码没法看」，你也知道该还技术债了',
    steps: ['扫描模块依赖关系——谁调了谁，耦合在哪', '找出那些「接口小但承担太多」或「接口大但做的事简单」的地方', '评估改动的收益和风险——先改哪里 ROI 最高', '给出具体重构步骤——不是空洞建议，是实际的代码移动方案'],
  },
  {
    id: 'eng-frontend-design',
    name: '写出有设计感的前端页面',
    description: '程序员也能做出不像「程序员审美」的页面。专业的设计思维指导你做配色、排版、动效，出来的东西同事以为请了设计师。',
    trackId: 'engineer', trackIds: ['engineer', 'designer'], subDomain: '前端开发',
    creator: 'Anthropic', installs: 2567, rating: 4.9,
    tags: ['设计', '前端', 'UI', '审美'],
    sourceUrl: 'https://github.com/anthropics/skills/tree/main/skills/frontend-design',
    input: '你要做什么页面 + 面向谁 + 想要什么感觉',
    output: '有独特视觉风格的前端页面——不是那种一看就是 AI 生成的模板感',
    scenario: '要做个内部工具/落地页/Demo，不想出来的东西像十年前的 Bootstrap 模板',
    steps: ['先搞清楚这个页面是给谁看的、要传达什么——设计从「为什么」开始', '定下设计方案：4-6 个颜色、2-3 个字体角色、布局概念、一个记忆点', '自我批判——如果换个主题你也会做出差不多的东西，说明你在用默认审美，改掉', '一个页面只冒一次险——把大胆留给一个亮点，其他保持克制和专业'],
  },
  {
    id: 'eng-code-review',
    name: 'AI 帮你做 Code Review',
    description: '阿里内部 2 年验证、服务数万开发者的 AI Code Review。精度远超通用 AI，token 消耗只有 1/9，不放过真正的问题。',
    trackId: 'engineer', trackIds: ['engineer'], subDomain: 'Code Review',
    creator: 'Alibaba', installs: 3890, rating: 4.9,
    tags: ['Code Review', '代码质量', 'CI'],
    sourceUrl: 'https://github.com/alibaba/open-code-review',
    input: 'Git diff / Pull Request',
    output: '精准到行的审查意见——每条都是真问题，不是噪音',
    scenario: 'PR 提了没人 Review，或者 Review 质量全靠运气（看谁有空看）',
    steps: ['读取 Git diff，精确判断哪些文件需要审查（不会漏文件）', '把相关文件智能分组一起看——改了 en.properties 会同时看 zh.properties', '深度审查而不是表面扫描——能搜索代码库、查看完整文件、理解改动上下文', '输出行级精准定位的问题——比通用 AI 精度高一倍、误报少一半'],
  },
  {
    id: 'des-pptx',
    name: '做出专业级 PPT',
    description: '告别丑 PPT。10 套精选配色方案、专业排版、自动视觉质检——做出来的演示连设计师都说好看。',
    trackId: 'designer', trackIds: ['designer', 'pm'], subDomain: '视觉设计',
    creator: 'Anthropic', installs: 2345, rating: 4.8,
    tags: ['PPT', '演示', '视觉设计'],
    sourceUrl: 'https://github.com/anthropics/skills/blob/main/skills/pptx/SKILL.md',
    input: '你的内容（现有 PPT / 大纲 / 简报）',
    output: '设计精美的 .pptx 文件，打开就能上台讲',
    scenario: '明天要给客户提案，自己做的 PPT 实在拿不出手',
    steps: ['分析你的内容，理解要传达的故事线', '从 10 套精选配色里挑一套最搭的风格', '生成内容——遵循排版黄金法则，绝不犯设计大忌', '自动质检——AI 检查每一页有没有文字溢出、对齐错误、视觉不一致'],
  },
  {
    id: 'des-doc-coauthoring',
    name: '写出别人愿意读完的文档',
    description: '好文档不是你写完扔出去就行。三阶段打磨：先把你脑子掏空 → 逐段精修 → 请一个「读者」来挑刺。',
    trackId: 'designer', trackIds: ['designer', 'pm', 'ops'], subDomain: '内容设计',
    creator: 'Anthropic', installs: 1890, rating: 4.9,
    tags: ['文档', '写作', '协同'],
    sourceUrl: 'https://github.com/anthropics/skills/blob/main/skills/doc-coauthoring/SKILL.md',
    input: '你脑子里的想法、参考材料、已有草稿',
    output: '一份读者会读完、而且读完就懂的文档',
    scenario: '要写一份设计规范/技术方案/决策文档，但怎么写都觉得别人看不懂',
    steps: ['先把你知道的全倒出来——不用管结构，先把信息搬出来', '逐段打磨——每段给你 5-20 个表达选项，你选最顺的', '最关键的一步：让一个全新的「读者」来看——它没有你的上下文，看不懂的地方就是你的盲点'],
  },
  {
    id: 'ops-ab-testing',
    name: '建立团队的实验文化',
    description: '不只是做一次 A/B 测试。帮你建起一整套持续实验的体系——优先级怎么排、节奏怎么定、胜出模式怎么积累。',
    trackId: 'pm', trackIds: ['pm', 'ops'], subDomain: '用户增长',
    creator: 'Corey Haines', installs: 1678, rating: 4.7,
    tags: ['A/B测试', '增长', '实验'],
    sourceUrl: 'https://github.com/coreyhaines31/marketingskills/tree/main/skills/ab-testing',
    input: '你想优化什么 + 现在的基线数据 + 有多少流量',
    output: '实验方案 + 长期可执行的实验体系（不是一锤子买卖）',
    scenario: '老板说「我们要有数据驱动的文化」，但团队不知道从哪开始',
    steps: ['把「我觉得」写成结构化假设——观察了什么、相信改什么、预期什么结果', '设计实验并算好样本量——别跑了 3 天就急着看结果', '用 ICE 框架排优先级——Impact × Confidence × Ease', '建立节奏——每月 4-8 个实验，把胜出模式沉淀下来变成团队知识'],
  },
  {
    id: 'ops-onboarding',
    name: '让新用户 3 分钟爱上你的产品',
    description: '用户注册了但不用？问题出在 Onboarding。帮你找到 Aha Moment、设计引导流程、把激活率翻倍。',
    trackId: 'pm', trackIds: ['pm', 'ops'], subDomain: '用户增长',
    creator: 'Corey Haines', installs: 1345, rating: 4.6,
    tags: ['Onboarding', '激活', '留存'],
    sourceUrl: 'https://github.com/coreyhaines31/marketingskills/tree/main/skills/onboarding',
    input: '你的产品 + 当前注册后流程 + 哪一步流失最严重',
    output: '完整的 Onboarding 优化方案（流程 + 邮件序列 + 指标体系）',
    scenario: '注册转化率还行，但 D7 留存惨不忍睹',
    steps: ['找到 Aha Moment——用户做了什么动作之后就留下来了？那就是你要引导到的终点', '设计最短路径让新用户到达那个时刻——3-7 步 Checklist', '配合邮件/推送——注册第 1/3/7 天分别推什么', '对沉默用户启动召回——别放弃他们，有策略地拉一把'],
  },
  {
    id: 'ops-lark-minutes',
    name: '开完会待办自动干',
    description: '会开完了，纪要里的 TODO 谁来跟？不用了。直接读取会议记录，帮你约会、发消息、建文档。',
    trackId: 'pm', trackIds: ['pm', 'ops', 'engineer'], subDomain: '项目管理',
    creator: 'Zara Zhang', installs: 1123, rating: 4.5,
    tags: ['会议', '飞书', '自动化'],
    sourceUrl: 'https://github.com/zarazhangrui/lark-minutes-tasks/tree/main',
    input: '飞书会议纪要的链接',
    output: '行动项已执行：该约的会约了、该发的消息发了、该建的文档建了',
    scenario: '每天 3 个会，散落在纪要里的 TODO 根本跟不完',
    steps: ['读取会议记录，把所有 TODO 提取出来（包括你自己都没注意到的隐含任务）', '列出来让你确认哪些要执行', '选好了就自动干——发消息、约日历、建文档、创建任务', '再也不会出现「上次会说了要做，结果忘了」的情况'],
  },
  {
    id: 'general-grill',
    name: '在动手之前，先让人把你问倒',
    description: '方案想好了？别急。让我用苏格拉底式追问帮你发现盲点——你没想到的问题，发布后别人一定会问到。',
    trackId: 'pm', trackIds: ['pm', 'engineer', 'designer', 'ops'], subDomain: '需求分析',
    creator: 'Matt Pocock', installs: 1890, rating: 4.8,
    tags: ['思维', '拷问', '盲点发现'],
    sourceUrl: 'https://github.com/mattpocock/skills',
    input: '你的想法、方案、或者正在犹豫的决策',
    output: '被打磨过的方案 + 你之前没想到的问题清单',
    scenario: '方案要提交了，但总觉得哪里不对又说不出来',
    steps: ['不断追问 Why / What if / How——直到你自己都觉得「靠，这个没想到」', '把你的隐含假设翻出来——你以为理所当然的，可能是最大的风险', '从各个角度攻击你的方案——如果我是用户呢？如果竞品先做了呢？如果数据假设不成立呢？', '把经过考验的方案沉淀下来——比原来好了不止一个层级'],
  },
  {
    id: 'general-to-issues',
    name: '把大方案拆成能干活的任务',
    description: 'PRD 写完了，然后呢？帮你拆成一条条能抓的 Issue——每条都能独立开发、独立测试、独立上线。',
    trackId: 'engineer', trackIds: ['engineer', 'pm'], subDomain: '项目管理',
    creator: 'Matt Pocock', installs: 1567, rating: 4.7,
    tags: ['Issue', '拆解', '敏捷'],
    sourceUrl: 'https://github.com/mattpocock/skills',
    input: 'PRD、技术方案、或者任何「大块要做的事」',
    output: '一组独立可执行的 Issue（每条都有描述、验收标准、依赖关系）',
    scenario: '方案已经过了评审，下一步要拆到 Sprint 里让团队领任务',
    steps: ['理解整个方案的全貌——核心流程是什么', '找到最小的「能独立交付价值」的切片', '每条 Issue 写清楚：做什么、怎么算做完了、依赖谁', '考虑依赖关系排出顺序——谁先做不卡别人'],
  },
];

async function main() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.error('❌ 请设置 DATABASE_URL 环境变量');
    process.exit(1);
  }

  const pool = new Pool({
    connectionString: dbUrl,
    ssl: dbUrl.includes('railway') ? { rejectUnauthorized: false } : undefined,
  });

  try {
    console.log(`📦 准备导入 ${LOCAL_SKILLS.length} 个精品 skill...\n`);

    let inserted = 0;
    for (const skill of LOCAL_SKILLS) {
      const sql = `
        INSERT INTO skills (
          name, alias, description, display_name, display_desc,
          track_id, track_ids, sub_domain, tags, source_url, creator,
          download_count, rating, llm_score, verified,
          input, output, scenario, steps
        ) VALUES (
          $1, $2, $3, $4, $5,
          $6, $7, $8, $9, $10, $11,
          $12, $13, $14, $15,
          $16, $17, $18, $19
        )
        ON CONFLICT (name) DO UPDATE SET
          display_name = EXCLUDED.display_name,
          display_desc = EXCLUDED.display_desc,
          track_id = EXCLUDED.track_id,
          track_ids = EXCLUDED.track_ids,
          sub_domain = EXCLUDED.sub_domain,
          input = EXCLUDED.input,
          output = EXCLUDED.output,
          scenario = EXCLUDED.scenario,
          steps = EXCLUDED.steps,
          rating = EXCLUDED.rating
      `;

      await pool.query(sql, [
        skill.id,                    // name (唯一标识)
        skill.name,                  // alias (中文展示名)
        skill.description,           // description
        skill.name,                  // display_name (已优化的名字)
        skill.description,           // display_desc (已优化的描述)
        skill.trackId,               // track_id
        skill.trackIds,              // track_ids
        skill.subDomain,             // sub_domain
        skill.tags,                  // tags
        skill.sourceUrl || null,     // source_url
        skill.creator,               // creator
        skill.installs,              // download_count
        skill.rating,                // rating
        Math.round(skill.rating * 20), // llm_score (rating × 20)
        true,                        // verified (精品标记)
        skill.input || null,         // input
        skill.output || null,        // output
        skill.scenario || null,      // scenario
        skill.steps || [],           // steps
      ]);

      inserted++;
      process.stdout.write(`\r  导入进度: ${inserted}/${LOCAL_SKILLS.length}`);
    }

    console.log('\n');

    // 统计
    const { rows: [{ count }] } = await pool.query('SELECT COUNT(*) FROM skills');
    const { rows: [{ count: verified }] } = await pool.query('SELECT COUNT(*) FROM skills WHERE verified = true');
    console.log(`✅ 导入完成! 精品 skill: ${verified} 个, 总计: ${count} 个`);

  } finally {
    await pool.end();
  }
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
