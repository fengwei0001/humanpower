# 🧪 Distill Community Plugin

让你的 Agent 自动从社区找到更好的方法。

## 它做什么

装上之后，你的 Agent 在帮你干活时会**自动搜索社区里经过验证的 Skill**——如果有人已经用更好的方法做过同样的事，你的 Agent 会找到它、告诉你、然后用那个方法帮你完成任务。

## 安装

### Claude Code

```bash
/plugin install distill@distill-community
```

### 本地开发测试

```bash
cd plugin/distill-community
npm install
claude --plugin-dir .
```

## 提供的工具

| 工具 | 说明 |
|------|------|
| `distill_search` | 搜索社区里与当前任务相关的 Skill |
| `distill_detail` | 获取某个 Skill 的完整详情（步骤、输入输出等） |
| `distill_recommend` | 按赛道浏览热门 Skill |

## 使用示例

装完 plugin 后，正常跟 Agent 对话就行：

```
你：帮我写个 PRD
Agent：我先搜搜社区有没有更好的方法...
      找到了！「30分钟搞定PRD」这个 Skill 有 2834 人用过，成功率 94%。
      它的方法是：先收集碎片信息 → 按评审标准生成 → 自动补异常流程 → 输出确认清单。
      要用这个方法来帮你写吗？
你：好的
Agent：（按照 Skill 的步骤执行...）
```

## 支持的赛道

- 🎯 **pm** — 产品经理（PRD、评审、数据分析、用户研究）
- ⚡ **engineer** — 工程师（开发、测试、Code Review、架构）
- 🎨 **designer** — 设计师（视觉、内容、原型）
- 📈 **ops** — 运营（增长、留存、实验、内容）
- 🤝 **hr** — HR（招聘、培训）

## API

Plugin 连接的后端 API：
- 搜索: `GET https://humanpower-production.up.railway.app/api/skills?search=xxx`
- 详情: `GET https://humanpower-production.up.railway.app/api/skills/:id`
- 推荐: `GET https://humanpower-production.up.railway.app/api/skills?track=xxx`
