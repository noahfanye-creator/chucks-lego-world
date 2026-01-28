# 细胞工厂大挑战 · chuckfan.com

静态 HTML 游戏站点，部署到 https://chuckfan.com

## 部署

- **GitHub Actions**：推送到 `main` 分支后自动部署到服务器 154.17.3.182
- **本地部署**：在 Chuck 项目根目录执行 `./deploy-legoworld.sh`

## 所需 Secrets

在 GitHub 仓库 Settings → Secrets and variables → Actions 中配置：

- `SSH_PRIVATE_KEY`：登录服务器的 SSH 私钥（完整内容，含 `-----BEGIN ... -----`）
