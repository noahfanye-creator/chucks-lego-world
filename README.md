
# 🧱 Chuck 的乐高世界 - 部署指南

恭喜！Chuck 的专属网站已经开发完成。按照以下步骤，你可以将它免费发布到互联网。

## 🚀 部署方式选择

### 方式 1：GitHub Pages（推荐，完全免费）

**最简单的方式，无需额外服务，完全免费！**

详细步骤请查看 [DEPLOY-GITHUB-PAGES.md](./DEPLOY-GITHUB-PAGES.md)

**快速开始：**
1. 将代码推送到 GitHub 仓库
2. 在 GitHub Settings → Secrets 中添加 `GEMINI_API_KEY`
3. 在 Settings → Pages 中启用 GitHub Actions
4. 完成！网站会自动部署到 `username.github.io`

### 方式 2：Vercel（快速部署）

1. **准备代码**：将本项目的所有文件（包含 `package.json`, `App.tsx`, `index.html` 等）上传到你的 [GitHub](https://github.com) 账号下的一个新仓库中。
2. **连接 Vercel**：
   - 访问 [Vercel 官网](https://vercel.com) 并使用 GitHub 账号登录。
   - 点击 **"Add New"** -> **"Project"**。
   - 在列表中选择你刚刚创建的 GitHub 仓库。
3. **设置 API Key**：
   - 在部署配置页面，找到 **Environment Variables** (环境变量) 部分。
   - 添加一个变量：名字叫 `GEMINI_API_KEY`，值填入你的 [Google Gemini API Key](https://aistudio.google.com/app/apikey)。
4. **点击部署**：点击 **"Deploy"** 按钮。
5. **完成！** 几秒钟后，你会得到一个像 `chucks-world.vercel.app` 这样的网址。

### 方式 3：自建服务器（chuckfan.com）

如果你有自己的服务器和域名，可以按照 [DEPLOY-LEGOWORLD.md](../DEPLOY-LEGOWORLD.md) 的说明部署。

## 📱 如何在手机/平板上“安装”？

1. 在手机浏览器（如 Safari 或 Chrome）中打开你部署好的网址。
2. 点击浏览器的“分享”按钮或“选项”菜单。
3. 选择 **“添加到主屏幕” (Add to Home Screen)**。
4. 现在，Chuck 的桌面上就会出现一个乐高图标，点开就是全屏的 App 体验！

## 🛠 功能清单
- **乐高小管家**：由 Gemini AI 驱动的每日鼓励语和科学知识。
- **打飞机游戏**：支持手机触控和计分的互动小游戏。
- **家庭相册**：记录全家人在北海、景山和运动场的美好时光。
- **每日计划**：帮助 Chuck 养成良好的习惯。
