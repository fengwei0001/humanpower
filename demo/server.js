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
// PostgreSQL 连接
// ═══════════════════════════════════════════════

let pool = null;

if (DATABASE_URL) {
  const { Pool } = require('pg');
  pool = new Pool({
    connectionString: DATABASE_URL,
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
  });
  pool.on('error', (err) => console.error('DB pool error:', err.message));
  console.log('PostgreSQL: configured ✓');
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
  const url = new URL(urlStr, 'http://localhost');
  const params = {};
  url.searchParams.forEach((val, key) => { params[key] = val; });
  return { pathname: url.pathname, params };
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
// API 路由处理
// ═══════════════════════════════════════════════

async function handleAPI(req, res) {
  const { pathname, params } = parseQuery(req.url);

  // CORS preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    });
    res.end();
    return true;
  }

  // POST /api/ai-search (existing)
  if (req.method === 'POST' && pathname === '/api/ai-search') {
    if (!DEEPSEEK_API_KEY) {
      sendJSON(res, 500, { error: 'DEEPSEEK_API_KEY not configured' });
      return true;
    }

    try {
      const body = JSON.parse(await readBody(req));
      const { query, systemPrompt } = body;

      if (!query) {
        sendJSON(res, 400, { error: 'query is required' });
        return true;
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
    } catch (err) {
      console.error('AI search error:', err.message);
      sendJSON(res, 502, { error: err.message });
    }
    return true;
  }

  // GET /api/skills - 分页查询技能列表
  if (req.method === 'GET' && pathname === '/api/skills') {
    if (!pool) {
      sendJSON(res, 503, { error: 'Database not configured' });
      return true;
    }

    try {
      const page = Math.max(1, parseInt(params.page) || 1);
      const pageSize = Math.min(50, Math.max(1, parseInt(params.pageSize) || 20));
      const offset = (page - 1) * pageSize;
      const track = params.track || null;
      const search = params.search || null;
      const sort = params.sort || 'hot'; // hot | new | rating

      let where = [];
      let queryParams = [];
      let paramIdx = 1;

      if (track) {
        where.push(`(track_id = $${paramIdx} OR $${paramIdx} = ANY(track_ids))`);
        queryParams.push(track);
        paramIdx++;
      }

      if (search) {
        where.push(`(
          name ILIKE $${paramIdx} OR
          alias ILIKE $${paramIdx} OR
          description ILIKE $${paramIdx} OR
          EXISTS (SELECT 1 FROM unnest(tags) t WHERE t ILIKE $${paramIdx})
        )`);
        queryParams.push(`%${search}%`);
        paramIdx++;
      }

      const whereClause = where.length > 0 ? `WHERE ${where.join(' AND ')}` : '';

      // 排序
      let orderBy;
      switch (sort) {
        case 'new': orderBy = 'updated_at DESC NULLS LAST, created_at DESC'; break;
        case 'rating': orderBy = 'llm_score DESC, download_count DESC'; break;
        case 'hot':
        default: orderBy = 'download_count DESC'; break;
      }

      // 总数查询
      const countSql = `SELECT COUNT(*) FROM skills ${whereClause}`;
      const { rows: [{ count: total }] } = await pool.query(countSql, queryParams);

      // 数据查询
      const dataSql = `
        SELECT id, source_id, name, alias, description, display_name, display_desc,
               track_id, track_ids, sub_domain, tags, source_url, creator,
               download_count, rating, llm_score, latest_version, verified,
               comment_count, use_case_count, input, output, scenario, steps,
               created_at, updated_at
        FROM skills
        ${whereClause}
        ORDER BY ${orderBy}
        LIMIT $${paramIdx} OFFSET $${paramIdx + 1}
      `;
      queryParams.push(pageSize, offset);

      const { rows } = await pool.query(dataSql, queryParams);

      sendJSON(res, 200, {
        code: 200,
        data: {
          total: parseInt(total),
          page,
          pageSize,
          list: rows,
        },
      });
    } catch (err) {
      console.error('Skills query error:', err.message);
      sendJSON(res, 500, { error: err.message });
    }
    return true;
  }

  // GET /api/skills/:id - 单个技能详情
  if (req.method === 'GET' && pathname.match(/^\/api\/skills\/\d+$/)) {
    if (!pool) {
      sendJSON(res, 503, { error: 'Database not configured' });
      return true;
    }

    try {
      const id = pathname.split('/').pop();
      const { rows } = await pool.query('SELECT * FROM skills WHERE id = $1', [id]);

      if (rows.length === 0) {
        sendJSON(res, 404, { error: 'Skill not found' });
      } else {
        sendJSON(res, 200, { code: 200, data: rows[0] });
      }
    } catch (err) {
      console.error('Skill detail error:', err.message);
      sendJSON(res, 500, { error: err.message });
    }
    return true;
  }

  // GET /api/tracks/stats - 各赛道统计
  if (req.method === 'GET' && pathname === '/api/tracks/stats') {
    if (!pool) {
      sendJSON(res, 503, { error: 'Database not configured' });
      return true;
    }

    try {
      const { rows } = await pool.query(`
        SELECT
          track_id,
          COUNT(*) as skill_count,
          SUM(download_count) as total_downloads,
          AVG(llm_score) as avg_score
        FROM skills
        WHERE track_id IS NOT NULL
        GROUP BY track_id
        ORDER BY skill_count DESC
      `);

      sendJSON(res, 200, { code: 200, data: rows });
    } catch (err) {
      console.error('Tracks stats error:', err.message);
      sendJSON(res, 500, { error: err.message });
    }
    return true;
  }

  return false; // 不是 API 请求
}

// ═══════════════════════════════════════════════
// HTTP 服务器
// ═══════════════════════════════════════════════

http.createServer(async (req, res) => {
  // 尝试处理 API 请求
  if (req.url.startsWith('/api/')) {
    const handled = await handleAPI(req, res);
    if (handled) return;
  }

  // 静态文件服务
  const urlPath = req.url.split('?')[0];
  let filePath = path.join(DIST, urlPath === '/' ? 'index.html' : urlPath);

  // SPA fallback: if file doesn't exist, serve index.html
  if (!fs.existsSync(filePath)) {
    filePath = path.join(DIST, 'index.html');
  }

  const ext = path.extname(filePath);
  const contentType = MIME[ext] || 'application/octet-stream';

  try {
    const content = fs.readFileSync(filePath);
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(content);
  } catch {
    res.writeHead(404);
    res.end('Not Found');
  }
}).listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`DeepSeek API: ${DEEPSEEK_API_KEY ? 'configured ✓' : 'NOT configured'}`);
});
