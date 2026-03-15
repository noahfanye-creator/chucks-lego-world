# AI 摘要纯文本服务 (Content-Type: text/plain)

路径 `/reports/review/:code/ai-summary` 由本服务返回纯文本，便于爬虫或工具以 `text/plain` 获取内容。

## 1. 运行服务（Node 18+）

```bash
# 在项目根目录或 scripts 同级
node scripts/ai-summary-server.cjs
```

可选环境变量：

- `PORT`：监听端口，默认 `3001`
- `DATA_BASE_URL`：报告数据源，默认 `https://www.chuckfan.com`

示例：

```bash
PORT=3001 DATA_BASE_URL=https://www.chuckfan.com node scripts/ai-summary-server.cjs
```

## 2. Nginx 反向代理（与现有 SPA 共存）

在现有 `server { ... }` 里增加一个 `location`，**优先于** 前端 SPA 的 fallback（即放在 `location /` 之前），使该路径走本服务：

```nginx
# 将 /reports/review/:code/ai-summary 转给本机 3001 端口
location ~ ^/reports/review/([^/]+)/ai-summary$ {
    proxy_pass http://127.0.0.1:3001;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

确保 ai-summary 服务已在本机 3001 端口常驻（如用 systemd 或 pm2）。

## 3. 验证

```bash
curl -i "https://www.chuckfan.com/reports/review/002173/ai-summary"
```

响应头中应有：`Content-Type: text/plain; charset=utf-8`，正文为 buildAiText 的完整输出。
