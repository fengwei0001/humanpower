const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');

const PORT = process.env.PORT || 3000;
const DIST = path.join(__dirname, 'dist');
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY || '';
const DATABASE_URL = process.env.DATABASE_URL || '';

// ═══════════════════════════════════════════════
// PostgreSQL 连接（lazy + safe）
// ═══════════════════════════════════════════════

let pool = null;

if (DATABASE_URL) {
  try {
    const { Pool } = require('pg');
    pool = new Pool({
      connectionString: DATABASE_URL,
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
      ssl: DATABASE_URL.includes('railway') ? { rejectUnauthorized: false } : undefined,
    });
    pool.on('error', (err) => console.error('DB pool error:', err.message));
    console.log('PostgreSQL: configured ✓');
  } catch (err) {
    console.warn('PostgreSQL: failed to load pg module:', err.message);
    pool = null;
  }
} else {
  console.log('PostgreSQL: NOT configured (no DATABASE_URL)');
}

// ═══════════════════════════════════════════════
// 工具函数
// ═══════════════════════════════════════════════

const MIME = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
};

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (chunk) => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks).toString()));
    req.on('error', reject);
  });
}

function sendJSON(res, statusCode, data) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
  });
  res.end(JSON.stringify(data));
}

function parseQuery(urlStr) {
  try {
    const url = new URL(urlStr, 'http://localhost');
    const params = {};
    url.searchParams.forEach((val, key) => { params[key] = val; });
    return { pathname: url.pathname, params };
  } catch {
    return { pathname: urlStr.split('?')[0], params: {} };
  }
}

// ═══════════════════════════════════════════════
// DeepSeek AI 调用
// ═══════════════════════════════════════════════

function callDeepSeek(body) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const options = {
      hostname: 'api.deepseek.com',
      path: '/chat/completions',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
        'Content-Length': Buffer.byteLength(data),
      },
    };

    const apiReq = https.request(options, (apiRes) => {
      const chunks = [];
      apiRes.on('data', (chunk) => chunks.push(chunk));
      apiRes.on('end', () => {
        const responseBody = Buffer.concat(chunks).toString();
        if (apiRes.statusCode >= 200 && apiRes.statusCode < 300) {
          resolve(JSON.parse(responseBody));
        } else {
          reject(new Error(`DeepSeek API ${apiRes.statusCode}: ${responseBody}`));
        }
      });
    });

    apiReq.on('error', reject);
    apiReq.write(data);
    apiReq.end();
  });
}

// ═══════════════════════════════════════════════
// HTTP 服务器
// ═══════════════════════════════════════════════

const server = http.createServer(async (req, res) => {
  try {
    const { pathname, params } = parseQuery(req.url);

    // CORS preflight
    if (req.method === 'OPTIONS') {
      res.writeHead(204, {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      });
      res.end();
      return;
    }

    // ─── API: AI 搜索 ───
    if (req.method === 'POST' && pathname === '/api/ai-search') {
      if (!DEEPSEEK_API_KEY) {
        sendJSON(res, 500, { error: 'DEEPSEEK_API_KEY not configured' });
        return;
      }

      const body = JSON.parse(await readBody(req));
      const { query, systemPrompt } = body;

      if (!query) {
        sendJSON(res, 400, { error: 'query is required' });
        return;
      }

      const result = await callDeepSeek({
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: query },
        ],
        temperature: 0.3,
        max_tokens: 1000,
      });

      sendJSON(res, 200, result);
      return;
    }

    // ─── API: AI 推荐（MCP 工具 + 外部调用） ───
    if (req.method === 'GET' && pathname === '/api/skills/ai-recommend') {
      if (!DEEPSEEK_API_KEY) {
        sendJSON(res, 500, { error: 'DEEPSEEK_API_KEY not configured' });
        return;
      }
      if (!pool) {
        sendJSON(res, 503, { error: 'Database not configured' });
        return;
      }

      const query = params.query || '';
      if (!query) {
        sendJSON(res, 400, { error: 'query is required' });
        return;
      }

      // 拉搜索上下文（精品优先）
      const { rows: contextSkills } = await pool.query(`
        SELECT id, name, display_name, display_desc, scenario, input, output,
               tags, track_id, sub_domain, download_count, source_url
        FROM skills
        WHERE display_name IS NOT NULL AND display_name != ''
        ORDER BY verified DESC, download_count DESC
        LIMIT 300
      `);

      // 构建上下文
      const skillsContext = contextSkills.map(s => {
        const parts = [`[${s.id}] ${s.display_name}`];
        parts.push(`  描述: ${s.display_desc}`);
        if (s.scenario) parts.push(`  场景: ${s.scenario}`);
        if (s.input) parts.push(`  输入: ${s.input}`);
        if (s.output) parts.push(`  输出: ${s.output}`);
        parts.push(`  链接: https://humanpower-production.up.railway.app/skills/db-${s.id}`);
        parts.push(`  赛道: ${s.track_id || ''} | 标签: ${(s.tags || []).slice(0, 4).join(',')}`);
        return parts.join('\n');
      }).join('\n\n');

      const systemPrompt = `你是「蒸馏广场」的智能推荐引擎。

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
{
  "description": "整体方案一句话（面向用户，像朋友推荐，说人话）",
  "reasoning": "为什么推荐这个组合（1-2句话，解释逻辑）",
  "skills": [
    {
      "id": 数字ID,
      "name": "蒸馏物名称",
      "role": "在方案中的角色（如：第一步搜集信息）",
      "why": "为什么选它（一句话，说出它在这里的独特价值）"
    }
  ]
}

## 注意
- id 必须是库中真实存在的 id（方括号里的数字）
- 按执行先后顺序排列
- 如果完全无关，返回 {"description":"...", "reasoning":"...", "skills":[]}
- description 和 reasoning 要说人话，像朋友推荐，不要官腔`;

      const aiResult = await callDeepSeek({
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: query },
        ],
        temperature: 0.3,
        max_tokens: 1000,
      });

      // 解析 AI 返回
      const content = aiResult.choices?.[0]?.message?.content || '';
      let parsed = { description: '', skills: [] };
      try {
        const jsonMatch = content.match(/```json\s*\n?([\s\S]*?)\n?```/) || content.match(/\{[\s\S]*\}/);
        const jsonStr = jsonMatch?.[1] || jsonMatch?.[0] || content;
        parsed = JSON.parse(jsonStr);
      } catch {}

      // 补全 skill 详情（source_url 等）
      if (parsed.skills && parsed.skills.length > 0) {
        const ids = parsed.skills.map(s => s.id).filter(Boolean);
        if (ids.length > 0) {
          const { rows: details } = await pool.query(
            `SELECT id, display_name, display_desc, source_url, input, output, scenario, steps, download_count, llm_score
             FROM skills WHERE id = ANY($1)`, [ids]
          );
          const detailMap = Object.fromEntries(details.map(d => [d.id, d]));
          parsed.skills = parsed.skills.map(s => {
            const d = detailMap[s.id];
            if (d) {
              return { ...s, ...d, name: s.name || d.display_name };
            }
            return s;
          });
        }
      }

      sendJSON(res, 200, { code: 200, data: parsed });
      return;
    }

    // ─── API: 技能列表（只返回有优化内容的） ───
    if (req.method === 'GET' && pathname === '/api/skills') {
      if (!pool) {
        sendJSON(res, 503, { error: 'Database not configured' });
        return;
      }

      const page = Math.max(1, parseInt(params.page) || 1);
      const pageSize = Math.min(50, Math.max(1, parseInt(params.pageSize) || 20));
      const offset = (page - 1) * pageSize;
      const track = params.track || null;
      const search = params.search || null;
      const tag = params.tag || null;
      const sort = params.sort || 'hot';

      // 只展示有优化内容的 skill
      let where = ["display_name IS NOT NULL AND display_name != ''"];
      let queryParams = [];
      let paramIdx = 1;

      if (track) {
        where.push(`(track_id = $${paramIdx} OR $${paramIdx} = ANY(track_ids))`);
        queryParams.push(track);
        paramIdx++;
      }

      if (tag) {
        where.push(`$${paramIdx} = ANY(tags)`);
        queryParams.push(tag);
        paramIdx++;
      }

      if (search) {
        where.push(`(display_name ILIKE $${paramIdx} OR display_desc ILIKE $${paramIdx} OR alias ILIKE $${paramIdx} OR name ILIKE $${paramIdx})`);
        queryParams.push(`%${search}%`);
        paramIdx++;
      }

      const whereClause = `WHERE ${where.join(' AND ')}`;

      let orderBy;
      switch (sort) {
        case 'new': orderBy = 'created_at DESC'; break;
        case 'rating': orderBy = 'llm_score DESC, download_count DESC'; break;
        default: orderBy = 'download_count DESC'; break;
      }

      const countSql = `SELECT COUNT(*) FROM skills ${whereClause}`;
      const { rows: [{ count: total }] } = await pool.query(countSql, queryParams);

      const dataSql = `
        SELECT * FROM skills
        ${whereClause}
        ORDER BY ${orderBy}
        LIMIT $${paramIdx} OFFSET $${paramIdx + 1}
      `;
      queryParams.push(pageSize, offset);
      const { rows } = await pool.query(dataSql, queryParams);

      sendJSON(res, 200, {
        code: 200,
        data: { total: parseInt(total), page, pageSize, list: rows },
      });
      return;
    }

    // ─── API: 标签聚合（按赛道统计高频 tags） ───
    if (req.method === 'GET' && pathname === '/api/skills/tags') {
      if (!pool) {
        sendJSON(res, 503, { error: 'Database not configured' });
        return;
      }

      const track = params.track || null;
      let sql, sqlParams;

      if (track) {
        sql = `
          SELECT unnest(tags) AS tag, COUNT(*) AS cnt
          FROM skills
          WHERE display_name IS NOT NULL AND display_name != ''
            AND (track_id = $1 OR $1 = ANY(track_ids))
          GROUP BY tag
          HAVING COUNT(*) >= 2
          ORDER BY cnt DESC
          LIMIT 20
        `;
        sqlParams = [track];
      } else {
        sql = `
          SELECT unnest(tags) AS tag, COUNT(*) AS cnt
          FROM skills
          WHERE display_name IS NOT NULL AND display_name != ''
          GROUP BY tag
          HAVING COUNT(*) >= 3
          ORDER BY cnt DESC
          LIMIT 20
        `;
        sqlParams = [];
      }

      const { rows } = await pool.query(sql, sqlParams);
      sendJSON(res, 200, { code: 200, data: rows });
      return;
    }

    // ─── API: AI 搜索上下文（返回所有有优化内容的 skill 摘要） ───
    if (req.method === 'GET' && pathname === '/api/skills/search-context') {
      if (!pool) {
        sendJSON(res, 503, { error: 'Database not configured' });
        return;
      }

      // 精品 skill（verified）永远排在前面，其余按下载量排
      const { rows } = await pool.query(`
        SELECT id, name, display_name, display_desc, scenario, input, output,
               tags, track_id, track_ids, sub_domain, download_count, source_url
        FROM skills
        WHERE display_name IS NOT NULL AND display_name != ''
        ORDER BY verified DESC, download_count DESC
        LIMIT 500
      `);

      sendJSON(res, 200, { code: 200, data: rows });
      return;
    }

    // ─── API: 单个技能详情 ───
    if (req.method === 'GET' && pathname.match(/^\/api\/skills\/\d+$/)) {
      if (!pool) {
        sendJSON(res, 503, { error: 'Database not configured' });
        return;
      }

      const id = pathname.split('/').pop();
      const { rows } = await pool.query('SELECT * FROM skills WHERE id = $1', [id]);

      if (rows.length === 0) {
        sendJSON(res, 404, { error: 'Skill not found' });
      } else {
        sendJSON(res, 200, { code: 200, data: rows[0] });
      }
      return;
    }

    // ─── API: 赛道统计 ───
    if (req.method === 'GET' && pathname === '/api/tracks/stats') {
      if (!pool) {
        sendJSON(res, 503, { error: 'Database not configured' });
        return;
      }

      const { rows } = await pool.query(`
        SELECT track_id, COUNT(*) as skill_count,
               SUM(download_count) as total_downloads,
               ROUND(AVG(llm_score)) as avg_score
        FROM skills WHERE track_id IS NOT NULL
        GROUP BY track_id ORDER BY skill_count DESC
      `);

      sendJSON(res, 200, { code: 200, data: rows });
      return;
    }

    // ─── API: 觅游实战帖搜索代理 ───
    if (req.method === 'GET' && pathname === '/api/feeds/search') {
      const keyword = params.keyword || '';
      if (!keyword) {
        sendJSON(res, 400, { error: 'keyword is required' });
        return;
      }

      try {
        const meyoUrl = `https://www.meyo123.com/api/v1/feeds?is_task=true&keyword=${encodeURIComponent(keyword)}&limit=3&page=1`;
        const meyoResp = await new Promise((resolve, reject) => {
          https.get(meyoUrl, (r) => {
            const chunks = [];
            r.on('data', c => chunks.push(c));
            r.on('end', () => resolve(Buffer.concat(chunks).toString()));
            r.on('error', reject);
          }).on('error', reject);
        });
        const meyoData = JSON.parse(meyoResp);
        sendJSON(res, 200, meyoData);
      } catch (err) {
        sendJSON(res, 502, { error: 'Failed to fetch feeds: ' + err.message });
      }
      return;
    }

    // ─── API: 分享对话 — 保存 ───
    if (req.method === 'POST' && pathname === '/api/shared-chat') {
      const body = JSON.parse(await readBody(req));
      const { messages, title } = body;
      if (!messages || !Array.isArray(messages)) {
        sendJSON(res, 400, { error: 'messages is required' });
        return;
      }

      // 生成短 ID
      const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

      // 存到数据库（如果有）或内存
      if (pool) {
        await pool.query(
          `CREATE TABLE IF NOT EXISTS shared_chats (id TEXT PRIMARY KEY, title TEXT, messages JSONB, created_at TIMESTAMPTZ DEFAULT NOW())`
        );
        await pool.query(
          `INSERT INTO shared_chats (id, title, messages) VALUES ($1, $2, $3)`,
          [id, title || '对话记录', JSON.stringify(messages)]
        );
      } else {
        // 内存兜底（重启会丢失）
        if (!global._sharedChats) global._sharedChats = {};
        global._sharedChats[id] = { title: title || '对话记录', messages, created_at: new Date().toISOString() };
      }

      sendJSON(res, 200, { code: 200, data: { id, url: `/shared/${id}` } });
      return;
    }

    // ─── API: 分享对话 — 读取 ───
    if (req.method === 'GET' && pathname.match(/^\/api\/shared-chat\/[a-z0-9]+$/)) {
      const id = pathname.split('/').pop();

      let chat = null;
      if (pool) {
        const { rows } = await pool.query('SELECT * FROM shared_chats WHERE id = $1', [id]);
        if (rows.length > 0) chat = rows[0];
      } else if (global._sharedChats) {
        chat = global._sharedChats[id];
      }

      if (!chat) {
        sendJSON(res, 404, { error: 'Chat not found' });
      } else {
        sendJSON(res, 200, { code: 200, data: chat });
      }
      return;
    }

    // ─── API: Agent 执行代理（转发到 yunAgent 内网） ───
    if (req.method === 'POST' && pathname === '/api/agent/chat') {
      const body = await readBody(req);
      const YUNAGENT_URL = process.env.YUNAGENT_URL || 'https://yunagent-production.up.railway.app';
      const YUNAGENT_KEY = process.env.YUNAGENT_KEY || 'meyo-yunagent-2026';

      try {
        const parsed = JSON.parse(body);
        const profileId = parsed.profile || 'default';
        const payload = JSON.stringify({
          model: parsed.model || 'deepseek-chat',
          messages: parsed.messages || [],
          stream: parsed.stream !== false,
          user: profileId,
        });

        // 选择 http 或 https 模块
        const proxyLib = YUNAGENT_URL.startsWith('https') ? https : http;

        // 流式转发
        if (parsed.stream !== false) {
          const proxyReq = proxyLib.request(`${YUNAGENT_URL}/v1/chat/completions`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${YUNAGENT_KEY}`,
              'Content-Length': Buffer.byteLength(payload),
            },
          }, (proxyRes) => {
            res.writeHead(proxyRes.statusCode || 200, {
              'Content-Type': proxyRes.headers['content-type'] || 'text/event-stream',
              'Cache-Control': 'no-cache',
              'Connection': 'keep-alive',
              'Access-Control-Allow-Origin': '*',
            });
            proxyRes.pipe(res);
          });

          proxyReq.on('error', (err) => {
            console.error('yunAgent proxy error:', err.message);
            if (!res.headersSent) {
              sendJSON(res, 502, { error: 'Agent service unavailable: ' + err.message });
            }
          });

          proxyReq.write(payload);
          proxyReq.end();
        } else {
          // 非流式
          const proxyResp = await new Promise((resolve, reject) => {
            const proxyReq = proxyLib.request(`${YUNAGENT_URL}/v1/chat/completions`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${YUNAGENT_KEY}`,
                'Content-Length': Buffer.byteLength(payload),
              },
            }, (proxyRes) => {
              const chunks = [];
              proxyRes.on('data', c => chunks.push(c));
              proxyRes.on('end', () => resolve(Buffer.concat(chunks).toString()));
              proxyRes.on('error', reject);
            });
            proxyReq.on('error', reject);
            proxyReq.write(payload);
            proxyReq.end();
          });

          sendJSON(res, 200, JSON.parse(proxyResp));
        }
      } catch (err) {
        console.error('Agent chat error:', err.message);
        sendJSON(res, 500, { error: 'Agent chat failed: ' + err.message });
      }
      return;
    }

    // ─── 静态文件服务 ───
    const urlPath = pathname;
    let filePath = path.join(DIST, urlPath === '/' ? 'index.html' : urlPath);

    if (!fs.existsSync(filePath)) {
      filePath = path.join(DIST, 'index.html');
    }

    const ext = path.extname(filePath);
    const contentType = MIME[ext] || 'application/octet-stream';

    const content = fs.readFileSync(filePath);
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(content);

  } catch (err) {
    // 全局错误兜底 —— 防止 async handler 未捕获异常导致进程崩溃
    console.error('Request error:', err.message);
    if (!res.headersSent) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Internal server error' }));
    }
  }
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`DeepSeek API: ${DEEPSEEK_API_KEY ? 'configured ✓' : 'NOT configured'}`);
  console.log(`PostgreSQL: ${pool ? 'connected ✓' : 'not available'}`);
});
