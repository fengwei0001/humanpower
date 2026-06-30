#!/usr/bin/env node
/**
 * Distill Community MCP Server
 *
 * 提供两个工具：
 * 1. distill_search - 搜索社区里最匹配的 Skill
 * 2. distill_install - 获取 Skill 的安装信息
 */
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';

const API_BASE = 'https://humanpower-production.up.railway.app/api';

// ═══════════════════════════════════════════════
// API 调用
// ═══════════════════════════════════════════════

async function searchSkills(query) {
  // 搜索数据库里有优化内容的 skill
  const resp = await fetch(`${API_BASE}/skills?search=${encodeURIComponent(query)}&pageSize=10`);
  if (!resp.ok) throw new Error(`API error: ${resp.status}`);
  const json = await resp.json();
  return json.data.list || [];
}

async function getSearchContext() {
  const resp = await fetch(`${API_BASE}/skills/search-context`);
  if (!resp.ok) throw new Error(`API error: ${resp.status}`);
  const json = await resp.json();
  return json.data || [];
}

async function getSkillDetail(id) {
  const resp = await fetch(`${API_BASE}/skills/${id}`);
  if (!resp.ok) return null;
  const json = await resp.json();
  return json.data;
}

// ═══════════════════════════════════════════════
// MCP Server
// ═══════════════════════════════════════════════

const server = new McpServer({
  name: 'distill-community',
  version: '1.0.0',
});

// Tool 1: AI 智能推荐社区 Skill（语义理解，非关键词匹配）
server.tool(
  'distill_search',
  '从蒸馏社区搜索与当前任务相关的 Skill（方法论）。使用 AI 语义理解匹配，会推荐 3-5 个最相关的 Skill 并说明执行顺序和理由。',
  {
    query: z.string().describe('任务描述，比如"写PRD"、"做竞品分析"、"设计AB实验"、"新功能上线后数据不好怎么办"'),
  },
  async ({ query }) => {
    try {
      const url = `${API_BASE}/skills/ai-recommend?query=${encodeURIComponent(query)}`;
      const resp = await fetch(url);
      if (!resp.ok) throw new Error(`API error: ${resp.status}`);
      const json = await resp.json();
      const data = json.data;

      if (!data || !data.skills || data.skills.length === 0) {
        return {
          content: [{ type: 'text', text: '社区暂时没有找到匹配的 Skill，用你自己的方法继续吧。' }],
        };
      }

      const formatted = data.skills.map((s, i) => {
        const name = s.display_name || s.name || '';
        const desc = s.display_desc || '';
        const downloads = s.download_count || 0;
        const score = s.llm_score || 0;
        const steps = (s.steps || []).map((step, j) => `  ${j + 1}. ${step}`).join('\n');
        const sourceUrl = s.source_url || '';

        let detail = `${i + 1}. 📦 ${name}`;
        if (s.role) detail += ` — ${s.role}`;
        detail += `\n   ${desc}`;
        if (s.why) detail += `\n   💡 ${s.why}`;
        detail += `\n   📊 ${downloads.toLocaleString()} 人安装 · 质量 ${score}分`;
        if (s.input) detail += `\n   📥 输入: ${s.input}`;
        if (s.output) detail += `\n   📤 输出: ${s.output}`;
        if (steps) detail += `\n   📋 步骤:\n${steps}`;
        detail += `\n   🔗 安装: https://humanpower-production.up.railway.app/skills/db-${s.id}`;
        return detail;
      });

      let text = '';
      if (data.description) text += `💬 ${data.description}\n`;
      if (data.reasoning) text += `💡 ${data.reasoning}\n`;
      text += `\n`;
      text += formatted.join('\n\n');
      text += `\n\n────────────────\n`;
      text += `安装方式：把上面的🔗链接告诉用户，让他跟 Agent 说「帮我安装 [名字] [链接]」即可。`;

      return { content: [{ type: 'text', text }] };
    } catch (err) {
      return {
        content: [{ type: 'text', text: `搜索出错: ${err.message}` }],
        isError: true,
      };
    }
  }
);

// Tool 2: 获取单个 Skill 的详情
server.tool(
  'distill_detail',
  '获取某个蒸馏 Skill 的完整详情，包括步骤、输入输出、场景和安装地址。',
  {
    id: z.number().describe('Skill 的数据库 ID（从搜索结果中获取）'),
  },
  async ({ id }) => {
    try {
      const skill = await getSkillDetail(id);
      if (!skill) {
        return { content: [{ type: 'text', text: `Skill #${id} 不存在` }] };
      }

      const name = skill.display_name || skill.alias || skill.name;
      const steps = (skill.steps || []).map((s, i) => `${i + 1}. ${s}`).join('\n');

      let text = `📦 ${name}\n\n`;
      text += `${skill.display_desc || skill.description || ''}\n\n`;
      if (skill.scenario) text += `🎬 场景: ${skill.scenario}\n\n`;
      if (skill.input) text += `📥 输入: ${skill.input}\n`;
      if (skill.output) text += `📤 输出: ${skill.output}\n\n`;
      if (steps) text += `📋 执行步骤:\n${steps}\n\n`;
      if (skill.source_url) text += `🔗 安装来源: ${skill.source_url}\n`;
      text += `\n📊 数据: ${(skill.download_count || 0).toLocaleString()} 人安装, 质量评分 ${skill.llm_score || 0}/100`;

      return { content: [{ type: 'text', text }] };
    } catch (err) {
      return {
        content: [{ type: 'text', text: `获取详情出错: ${err.message}` }],
        isError: true,
      };
    }
  }
);

// Tool 3: 获取推荐（基于赛道）
server.tool(
  'distill_recommend',
  '获取某个赛道下最热门的 Skill 推荐列表。用于用户想浏览"有什么好用的"的场景。',
  {
    track: z.enum(['pm', 'engineer', 'designer', 'ops', 'hr'])
      .describe('赛道：pm=产品经理, engineer=工程师, designer=设计师, ops=运营, hr=HR'),
    limit: z.number().optional().describe('返回数量，默认5'),
  },
  async ({ track, limit = 5 }) => {
    try {
      const resp = await fetch(`${API_BASE}/skills?track=${track}&pageSize=${limit}&sort=hot`);
      if (!resp.ok) throw new Error(`API error: ${resp.status}`);
      const json = await resp.json();
      const skills = json.data.list || [];

      if (skills.length === 0) {
        return { content: [{ type: 'text', text: `${track} 赛道暂时没有推荐的 Skill。` }] };
      }

      const formatted = skills.map((s, i) => {
        const name = s.display_name || s.alias || s.name;
        return `${i + 1}. ${name} — ${s.display_desc || s.description || ''} (${(s.download_count || 0).toLocaleString()} 安装)`;
      });

      return {
        content: [{ type: 'text', text: `🏆 ${track} 赛道热门 Skill：\n\n${formatted.join('\n')}` }],
      };
    } catch (err) {
      return {
        content: [{ type: 'text', text: `获取推荐出错: ${err.message}` }],
        isError: true,
      };
    }
  }
);

// ═══════════════════════════════════════════════
// 启动
// ═══════════════════════════════════════════════

const transport = new StdioServerTransport();
await server.connect(transport);
