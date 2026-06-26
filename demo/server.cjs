const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;
const DIST = path.join(__dirname, 'dist');
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY || '';

const MIME = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
};

// 读取请求 body
function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (chunk) => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks).toString()));
    req.on('error', reject);
  });
}

// 调用 DeepSeek API
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

http.createServer(async (req, res) => {
  // API: AI 搜索
  if (req.method === 'POST' && req.url === '/api/ai-search') {
    res.setHeader('Content-Type', 'application/json');

    if (!DEEPSEEK_API_KEY) {
      res.writeHead(500);
      res.end(JSON.stringify({ error: 'DEEPSEEK_API_KEY not configured' }));
      return;
    }

    try {
      const body = JSON.parse(await readBody(req));
      const { query, systemPrompt } = body;

      if (!query) {
        res.writeHead(400);
        res.end(JSON.stringify({ error: 'query is required' }));
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

      res.writeHead(200);
      res.end(JSON.stringify(result));
    } catch (err) {
      console.error('AI search error:', err.message);
      res.writeHead(502);
      res.end(JSON.stringify({ error: err.message }));
    }
    return;
  }

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
