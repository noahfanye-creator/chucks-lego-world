# Chuck's Lego World (chuckfan)

个人站点与报告中心：博客式页面 + 股票复盘报告展示，部署于 [chuckfan.com](https://www.chuckfan.com)。

## 技术栈

- **React 19** + **Vite 5** + **React Router**
- **Tailwind CSS** 样式
- **ECharts** 图表（报告详情 K 线、指标等）

## 功能概览

- **博客**：首页、盘前/盘中/盘后、归档、关于、文章详情
- **报告中心**（`/reports`）：报告列表、复盘详情（多周期 K 线、缠论、资金与筹码、策略建议）、NotebookLM 用 Markdown 链接、AI 摘要纯文本

## 本地开发

```bash
npm install
npm run dev
```

开发时 `/data` 会代理到线上 API（见 `vite.config.js`），报告数据来自 `https://www.chuckfan.com/data/reports/`。

## 构建与部署

- **构建**：`npm run build`，产物在 `dist/`
- **部署**：推送到 `main` 分支后由 **GitHub Actions** 自动部署到服务器（154.17.3.182），覆盖 `/root/projects/chuck/` 并重载 Nginx

所需 Secrets：部署用 SSH 私钥等（见 `.github/workflows/` 内 workflow 说明）。

## 报告数据与脚本

报告列表依赖服务端 **`/data/reports/index.json`**，该文件**不应在管道里手写**，只通过全量扫描脚本更新：

- **Bash**：`scripts/server-build-report-index.sh`（需 `jq`）
- **Python**：`scripts/build_report_index.py`（适合从报告生成管道调用）

详见 **[scripts/REPORT-INDEX.md](scripts/REPORT-INDEX.md)**。

报告生成管道在产出 `review_*.json` / `review_*.md` 后，可调用本仓库脚本生成与前端一致的 Markdown（供 NotebookLM 等使用）：

- **Python**：`scripts/generate_review_md.py`（推荐在 DMIT/stock_report_generator 中调用）
- **Node**：`scripts/generate-review-md.cjs`

详见 **[scripts/GENERATE-REVIEW-MD.md](scripts/GENERATE-REVIEW-MD.md)**。

## 脚本索引

| 脚本 | 用途 |
|------|------|
| `server-build-report-index.sh` | 全量扫描生成 `index.json`（Bash + jq） |
| `build_report_index.py` | 全量扫描生成 `index.json`（Python，可被管道调用） |
| `generate_review_md.py` | 从 `review_*.json` 生成 `review_*.md`（含 PDF 风格文件名选项） |
| `generate-review-md.cjs` | 同上，Node 版 |
| `ai-summary-lib.cjs` | AI 摘要 / Notebook 文本生成逻辑（供 server 或脚本复用） |
| `ai-summary-server.cjs` | 独立 HTTP 服务，提供 `/reports/review/:code/ai-summary` 纯文本 |

## 文档

- [scripts/PIPELINE-INTEGRATION.md](scripts/PIPELINE-INTEGRATION.md) — **管道集成步骤**（删掉写 index 的逻辑，末尾只调全量脚本）
- [scripts/REPORT-INDEX.md](scripts/REPORT-INDEX.md) — 报告列表 index 更新方式与管道集成
- [scripts/GENERATE-REVIEW-MD.md](scripts/GENERATE-REVIEW-MD.md) — 生成 NotebookLM 用 Markdown 的用法
- [scripts/AI-SUMMARY-SERVER.md](scripts/AI-SUMMARY-SERVER.md) — AI 摘要 HTTP 服务说明

## License

Private.
