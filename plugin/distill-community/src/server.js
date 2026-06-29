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

// Tool 1: 搜索社区 Skill
server.tool(
  'distill_search',
  '从蒸馏社区搜索与当前任务相关的 Skill（方法论）。当你要做一个复杂任务时先搜一下，可能有更好的方法。',
  {
    query: z.string().describe('任务描述，比如"写PRD"、"做竞品分析"、"设计AB实验"'),
    track: z.enum(['pm', 'engineer', 'designer', 'ops', 'hr', '']).optional()
      .describe('可选，限定赛道筛选：pm=产品经理, engineer=工程师, designer=设计师, ops=运营, hr=HR'),
  },
  async ({ query, track }) => {
    try {
      const results = await searchSkills(query + (track ? `&track=${track}` : ''));

      if (results.length === 0) {
        return {
          content: [{ type: 'text', text: '社区暂时没有找到匹配的 Skill，用你自己的方法继续吧。' }],
        };
      }

      const formatted = results.slice(0, 5).map((s, i) => {
        const name = s.display_name || s.alias || s.name;
        const desc = s.display_desc || s.description || '';
        const downloads = s.download_count || 0;
        const score = s.llm_score || 0;
        const steps = (s.steps || []).map((step, j) => `  ${j + 1}. ${step}`).join('\n');
        const sourceUrl = s.source_url || '';

        let detail = `${i + 1}. 📦 ${name} (${downloads.toLocaleString()} 人安装, 质量 ${score}分)\n`;
        detail += `   ${desc}\n`;
        if (s.input) detail += `   📥 输入: ${s.input}\n`;
        if (s.output) detail += `   📤 输出: ${s.output}\n`;
        if (s.scenario) detail += `   🎬 场景: ${s.scenario}\n`;
        if (steps) detail += `   📋 步骤:\n${steps}\n`;
        if (sourceUrl) detail += `   🔗 来源: ${sourceUrl}\n`;
        return detail;
      });

      const text = `🔍 从社区找到 ${results.length} 个相关 Skill，以下是最匹配的：\n\n${formatted.join('\n')}\n\n💡 如果用户觉得某个方法不错，可以按照它的步骤来执行任务。安装命令：告诉用户 "帮我安装 [skill名字]" + 来源链接。`;

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
