/**
 * 独立 HTTP 服务：对 /reports/review/:code/ai-summary 返回 Content-Type: text/plain。
 * 用法：
 *   node scripts/ai-summary-server.cjs
 * 环境变量（可选）：
 *   PORT=3001
 *   DATA_BASE_URL=https://www.chuckfan.com
 *
 * Nginx 可将该路径反向代理到本服务，例如：
 *   location ~ ^/reports/review/([^/]+)/ai-summary$ {
 *     proxy_pass http://127.0.0.1:3001;
 *     proxy_http_version 1.1;
 *     proxy_set_header Host $host;
 *     proxy_set_header X-Real-IP $remote_addr;
 *     proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
 *     proxy_set_header X-Forwarded-Proto $scheme;
 *   }
 */

const http = require('http');
const { buildReportAiSummaryText } = require('./ai-summary-lib.cjs');

const PORT = Number(process.env.PORT) || 3001;
const DATA_BASE_URL = (process.env.DATA_BASE_URL || 'https://www.chuckfan.com').replace(/\/$/, '');

async function fetchReport(code) {
  const url = `${DATA_BASE_URL}/data/reports/${code}/review_latest.json`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

const server = http.createServer(async (req, res) => {
  const match = req.url && req.url.match(/^\/reports\/review\/([^/]+)\/ai-summary\/?$/);
  if (req.method !== 'GET' || !match) {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Not Found');
    return;
  }

  const code = match[1];
  try {
    const raw = await fetchReport(code);
    const text = buildReportAiSummaryText(raw);
    res.writeHead(200, {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=60',
    });
    res.end(text);
  } catch (e) {
    res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end(e.message || 'Internal Server Error');
  }
});

server.listen(PORT, () => {
  console.log(`AI summary server: http://127.0.0.1:${PORT}/reports/review/:code/ai-summary`);
});
