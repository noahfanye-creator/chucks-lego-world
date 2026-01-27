# GitHub Pages 部署指南

这个项目可以通过 GitHub Pages 免费托管。按照以下步骤操作：

## 📋 前置条件

1. 拥有 GitHub 账号
2. 已获取 [Google Gemini API Key](https://aistudio.google.com/app/apikey)

## 🚀 部署步骤

### 1. 创建 GitHub 仓库

1. 在 GitHub 上创建一个新仓库（可以是公开或私有）
2. 仓库名建议：
   - 如果想部署到 `username.github.io`（根路径），仓库名必须是 `username.github.io`
   - 如果想部署到子路径（如 `username.github.io/chucks-lego-world`），可以用任意仓库名

### 2. 上传代码到 GitHub

```bash
cd "/Users/felix/Documents/Chuck/chuck's-lego-world "

# 初始化 git（如果还没有）
git init

# 添加所有文件
git add .

# 提交
git commit -m "Initial commit: Chuck's Lego World"

# 添加远程仓库（替换 YOUR_USERNAME 和 REPO_NAME）
git remote add origin https://github.com/YOUR_USERNAME/REPO_NAME.git

# 推送到 GitHub
git branch -M main
git push -u origin main
```

### 3. 配置 GitHub Secrets（API Key）

1. 进入你的 GitHub 仓库
2. 点击 **Settings** → **Secrets and variables** → **Actions**
3. 点击 **New repository secret**
4. 添加以下 secret：
   - **Name**: `GEMINI_API_KEY`
   - **Value**: 你的 Google Gemini API Key
5. 点击 **Add secret**

### 4. 启用 GitHub Pages

1. 进入仓库的 **Settings** → **Pages**
2. 在 **Source** 部分：
   - 选择 **GitHub Actions**（不是 "Deploy from a branch"）
3. 保存设置

### 5. 触发部署

有两种方式：

**方式 A：自动部署**
- 每次推送到 `main` 分支时，GitHub Actions 会自动构建和部署

**方式 B：手动触发**
- 进入仓库的 **Actions** 标签页
- 选择 **Deploy to GitHub Pages** workflow
- 点击 **Run workflow** → **Run workflow**

### 6. 访问网站

部署完成后，你的网站地址将是：

- 如果仓库名是 `username.github.io`：
  - `https://username.github.io`

- 如果仓库名是其他名称（如 `chucks-lego-world`）：
  - `https://username.github.io/chucks-lego-world`

## ⚙️ 配置说明

### Base Path 配置

如果你的仓库名**不是** `username.github.io`，需要设置 base path：

1. 编辑 `.github/workflows/deploy.yml`
2. 找到 `GITHUB_REPOSITORY_NAME` 环境变量
3. 如果自动检测不正确，可以手动设置：
   ```yaml
   GITHUB_REPOSITORY_NAME: chucks-lego-world  # 替换为你的仓库名
   ```

### 自定义域名（可选）

如果你想使用自己的域名（如 `chuckfan.com`）：

1. 在仓库的 **Settings** → **Pages** 中，添加你的自定义域名
2. 在你的域名 DNS 设置中添加 CNAME 记录：
   ```
   CNAME  @  username.github.io
   ```
3. 等待 DNS 生效（可能需要几分钟到几小时）

## 🔄 更新网站

每次更新代码后：

```bash
git add .
git commit -m "更新描述"
git push
```

GitHub Actions 会自动重新构建和部署，通常几分钟内完成。

## 🐛 常见问题

### 1. 部署失败：找不到 GEMINI_API_KEY

- 检查是否在 GitHub Secrets 中正确添加了 `GEMINI_API_KEY`
- 确保 secret 名称完全匹配（区分大小写）

### 2. 网站显示 404

- 检查 base path 配置是否正确
- 如果仓库名不是 `username.github.io`，确保设置了正确的 `GITHUB_REPOSITORY_NAME`

### 3. API 调用失败

- 检查 Gemini API Key 是否正确
- 检查 API Key 是否有足够的配额
- 查看浏览器控制台的错误信息

### 4. 样式或资源加载失败

- 检查 `vite.config.ts` 中的 `base` 配置
- 确保所有资源路径使用相对路径或正确的 base path

## 📝 注意事项

1. **API Key 安全**：API Key 存储在 GitHub Secrets 中，不会暴露在代码中
2. **构建时间**：每次部署需要几分钟时间构建
3. **免费额度**：GitHub Pages 对公开仓库完全免费，私有仓库有使用限制
4. **HTTPS**：GitHub Pages 自动提供 HTTPS 支持

## 🆚 GitHub Pages vs 自建服务器

| 特性 | GitHub Pages | 自建服务器 (chuckfan.com) |
|------|-------------|------------------------|
| 成本 | 免费 | 需要服务器费用 |
| 部署速度 | 几分钟 | 即时 |
| 自定义域名 | 支持 | 支持 |
| SSL 证书 | 自动 | 需要配置 |
| 维护 | 无需维护 | 需要维护服务器 |
| 构建 | 自动 | 需要手动构建 |

选择哪种方式取决于你的需求：
- **GitHub Pages**：适合快速部署、免费托管、自动化部署
- **自建服务器**：适合需要更多控制、自定义配置、即时更新
