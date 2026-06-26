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

    // ─── API: 技能列表 ───
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
      const sort = params.sort || 'hot';

      let where = [];
      let queryParams = [];
      let paramIdx = 1;

      if (track) {
        where.push(`(track_id = $${paramIdx} OR $${paramIdx} = ANY(track_ids))`);
        queryParams.push(track);
        paramIdx++;
      }

      if (search) {
        where.push(`(name ILIKE $${paramIdx} OR alias ILIKE $${paramIdx} OR description ILIKE $${paramIdx})`);
        queryParams.push(`%${search}%`);
        paramIdx++;
      }

      const whereClause = where.length > 0 ? `WHERE ${where.join(' AND ')}` : '';

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
