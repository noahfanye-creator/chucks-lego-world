# chuckfan.com · App

React + Vite 站点，部署到 https://chuckfan.com

## 开发

```bash
npm install
npm run dev
```

## 部署

- **GitHub Actions**：推送到 `main` 后自动构建并部署到 154.17.3.182
- **本地**：在 Chuck 项目根目录执行 `./deploy-legoworld.sh`

## Secrets

在仓库 **Settings → Secrets and variables → Actions** 配置 **`SSH_PRIVATE_KEY`**（OpenSSH 格式私钥，用于登录服务器）。若遇 `error in libcrypto`，见 [GITHUB-SSH-KEY.md](./GITHUB-SSH-KEY.md)。
