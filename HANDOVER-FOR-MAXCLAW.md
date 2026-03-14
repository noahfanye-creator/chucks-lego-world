# Chuck's Lego World — 维护交接（给 MaxClaw）

> 本文档提供项目结构、部署方式与已知问题的必要信息，便于后续维护。

---

## 一、项目概览

| 项目 | 说明 |
|------|------|
| **站点** | Chuck's Lego World（市场观察 / 笔记站） |
| **线上** | https://chuckfan.com、https://www.chuckfan.com |
| **仓库** | https://github.com/noahfanye-creator/chucks-lego-world |
| **技术栈** | React 19 + Vite 5，单页应用；文章为 Markdown + 自写 frontmatter 解析 |

---

## 二、本地与构建

```bash
# 安装依赖
npm install

# 开发（默认 http://localhost:5173）
npm run dev

# 构建产物（输出到 dist/）
npm run build

# 本地预览构建结果
npm run preview
```

- **入口**：`index.html` → `src/main.jsx` → `src/App.jsx`
- **路由**：首页 `/`，分类 `/premarket`、`/intraday`、`/postmarket`，归档 `/archive`，文章 `/post/:slug`
- **文章数据**：`src/content/posts/*.md`，由 `src/hooks/usePosts.js` 通过 `import.meta.glob(..., { query: '?raw', import: 'default', eager: true })` 读入，并用**自写 frontmatter 解析**（见下）提取元数据

---

## 三、重要技术决策（维护时勿轻易改回）

1. **不用 gray-matter**  
   曾用 gray-matter 解析 frontmatter，会带来：  
   - 浏览器端依赖 Node 的 `Buffer`（需 polyfill）；  
   - 依赖里含 `eval()`，在严格 CSP 下会报错。  
   已改为 **自写简易 frontmatter 解析**（在 `src/hooks/usePosts.js` 里的 `parseFrontMatter`），仅做字符串/数组/布尔解析，**不引入 Date 对象**，避免 React 报错 #31（Objects are not valid as a React child）。

2. **date / time 必须为字符串**  
   `usePosts.js` 里对 `date`、`time` 做了 `toDateString` / `toTimeString`，保证传给组件的永远是字符串，不在 JSX 里渲染 Date 对象。

3. **index.html 不缓存**  
   Nginx 配置里对 `location = /index.html` 设置了 `Cache-Control: no-store, no-cache`，避免 CDN/浏览器长期缓存旧 HTML 导致继续请求已不存在的 `/src/main.jsx`（从而出现 MIME 或白屏问题）。

---

## 四、部署方式

- **触发**：推送到 `main` 分支会触发 GitHub Actions 部署；也可在 [Actions 页](https://github.com/noahfanye-creator/chucks-lego-world/actions) 手动 Run workflow。
- **流程**：`.github/workflows/deploy-to-server.yml`  
  Checkout → Node 20 → `npm ci` → `npm run build` → 用 SSH 清空服务器目录 → scp 上传 `dist/*` → 重载 Nginx。
- **服务器**：`154.17.3.182`，用户 `root`，站点根目录 `/root/projects/chuck/`。
- **Nginx**：配置在 `/etc/nginx/sites-enabled/chuckfan-http-only.conf`（当前仅 80，未用 HTTPS 证书）。

**GitHub Secret 必配**：  
- `SSH_PRIVATE_KEY`：OpenSSH 格式私钥，用于 Actions 登录服务器；公钥需在服务器 `root` 的 `~/.ssh/authorized_keys` 中。

**本机触发一次部署（不改代码）**：  
```bash
git commit --allow-empty -m "chore: trigger deploy" && git push origin main
```

---

## 五、关键文件与脚本

| 路径 | 说明 |
|------|------|
| `DEPLOY-AND-SERVER-NOTES.md` | **部署与服务器详细说明**（Nginx、HTTPS、故障排查、脚本说明等），维护时优先查阅 |
| `src/hooks/usePosts.js` | 文章列表/单篇逻辑；含 frontmatter 解析与 date/time 字符串化，勿改回 gray-matter |
| `src/content/posts/*.md` | 文章 Markdown，frontmatter 格式：`title`、`date`、`time`、`type`、`tags`、`summary`、`draft` |
| `scripts/fix-nginx-no-ssl-remote.sh` | 在服务器上执行的 Nginx 修复脚本（含 index 不缓存、root 指向等） |
| `scripts/run-fix-nginx.sh` | 本机执行，把上面脚本传到服务器并执行 |

若 Nginx 因证书或配置起不来，可在本机执行：  
`./scripts/run-fix-nginx.sh`（需能无密码 SSH 到服务器）。

---

## 六、常见问题速查

- **白屏 / main.jsx 报 MIME 或 404**  
  多为旧版 index 被缓存。处理：  
  1）看 [Actions](https://github.com/noahfanye-creator/chucks-lego-world/actions) 最近一次部署是否成功；  
  2）看 “Verify deployed index on server” 里服务器上的 index 是否已引用 `/assets/xxx.js`；  
  3）若已是 /assets/，在 **Cloudflare 做 Purge Everything**（若用了 Cloudflare），再强刷或无痕访问。

- **React #31（Objects are not valid as a React child）**  
  说明某处把对象（如 Date）当 React 子节点渲染。本项目中已通过 frontmatter 只输出字符串 + `toDateString`/`toTimeString` 规避；若再出现，检查是否把 `post.date`/`post.time` 或其它对象直接放进 JSX。

- **CSP 报错禁止 eval**  
  不要重新引入依赖 `eval` 的库（例如 gray-matter 的某些引擎）；当前自写解析无 eval。

- **v8c78df7c... / cloudflareinsights.com ERR_CONNECTION_CLOSED**  
  多为 Cloudflare 统计脚本被扩展或网络拦截，不影响站点功能，可忽略。

更多细节（HTTPS、证书、脚本说明、快速命令）见 **`DEPLOY-AND-SERVER-NOTES.md`**。

---

## 七、链接汇总

- 网站：https://chuckfan.com  
- 仓库：https://github.com/noahfanye-creator/chucks-lego-world  
- Actions：https://github.com/noahfanye-creator/chucks-lego-world/actions  

---

*交接文档。后续维护请优先阅读本文 + `DEPLOY-AND-SERVER-NOTES.md`。*
