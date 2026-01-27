# GitHub 配置和推送指南

## 一、配置 Cursor 使用 GitHub 令牌

### 方法 1：通过 Cursor 设置（推荐）

1. **打开 Cursor 设置**：
   - 按 `Cmd + ,` (Mac) 或 `Ctrl + ,` (Windows/Linux)
   - 或者点击左下角齿轮图标 → Settings

2. **搜索 GitHub**：
   - 在设置搜索框中输入 "GitHub"
   - 找到 "Git: GitHub" 或 "GitHub Authentication" 相关设置

3. **输入令牌**：
   - 找到 "GitHub Token" 或 "Personal Access Token" 字段
   - 粘贴你刚才生成的 GitHub 令牌
   - 保存设置

### 方法 2：通过 Git 凭据存储

在终端中运行以下命令（将 `YOUR_TOKEN` 替换为你的实际令牌）：

```bash
# 配置 Git 使用令牌进行 HTTPS 认证
git config --global credential.helper store

# 或者使用 macOS Keychain（推荐）
git config --global credential.helper osxkeychain
```

当你第一次推送时，Git 会提示输入用户名和密码：
- **用户名**：你的 GitHub 用户名
- **密码**：使用你的 GitHub 令牌（不是 GitHub 密码）

### 方法 3：在 URL 中嵌入令牌（临时方案）

```bash
cd "/Users/felix/Documents/Chuck/chuck's-lego-world "

# 更新远程仓库 URL，嵌入令牌
git remote set-url origin https://YOUR_TOKEN@github.com/YOUR_USERNAME/REPO_NAME.git
```

⚠️ **注意**：这种方法会将令牌存储在 Git 配置中，安全性较低，不推荐长期使用。

---

## 二、将代码推送到 GitHub

### 步骤 1：创建 GitHub 仓库

1. 访问 [GitHub](https://github.com)
2. 点击右上角 **+** → **New repository**
3. 填写仓库信息：
   - **Repository name**: `chucks-lego-world`（或你喜欢的名字）
   - **Description**: Chuck's Lego World - A fun interactive website
   - **Visibility**: Public（GitHub Pages 免费）或 Private
   - **不要**勾选 "Initialize this repository with a README"（因为本地已有代码）
4. 点击 **Create repository**

### 步骤 2：更新远程仓库 URL

将 `YOUR_USERNAME` 和 `REPO_NAME` 替换为你的实际值：

```bash
cd "/Users/felix/Documents/Chuck/chuck's-lego-world "

# 查看当前远程仓库
git remote -v

# 更新为你的新仓库 URL
git remote set-url origin https://github.com/YOUR_USERNAME/REPO_NAME.git

# 验证更新
git remote -v
```

### 步骤 3：添加并提交所有文件

```bash
# 确保在项目目录
cd "/Users/felix/Documents/Chuck/chuck's-lego-world "

# 查看当前状态
git status

# 添加所有文件（.gitignore 会自动排除 node_modules 等）
git add .

# 提交更改
git commit -m "Initial commit: Chuck's Lego World with GitHub Pages support"

# 查看提交历史
git log --oneline
```

### 步骤 4：推送到 GitHub

```bash
# 推送到 main 分支
git push -u origin main
```

如果遇到错误，可能需要：

**错误 1：认证失败**
```bash
# 使用令牌作为密码
# 用户名：你的 GitHub 用户名
# 密码：你的 GitHub 令牌（不是 GitHub 密码）
```

**错误 2：分支名不匹配**
```bash
# 如果远程仓库默认分支是 master
git push -u origin main:master

# 或者重命名本地分支
git branch -M master
git push -u origin master
```

**错误 3：需要强制推送（谨慎使用）**
```bash
# 只在确定要覆盖远程内容时使用
git push -u origin main --force
```

---

## 三、配置 GitHub Secrets（用于自动部署）

推送成功后，需要配置 API Key：

1. **进入仓库页面**：
   - 访问 `https://github.com/YOUR_USERNAME/REPO_NAME`

2. **打开 Settings**：
   - 点击仓库顶部的 **Settings** 标签

3. **添加 Secret**：
   - 左侧菜单找到 **Secrets and variables** → **Actions**
   - 点击 **New repository secret**
   - **Name**: `GEMINI_API_KEY`
   - **Value**: 你的 Google Gemini API Key
   - 点击 **Add secret**

4. **启用 GitHub Pages**：
   - 左侧菜单找到 **Pages**
   - **Source** 选择 **GitHub Actions**（不是 "Deploy from a branch"）
   - 保存

---

## 四、验证部署

1. **查看 Actions**：
   - 在仓库页面点击 **Actions** 标签
   - 应该能看到 "Deploy to GitHub Pages" workflow 正在运行
   - 等待几分钟完成构建和部署

2. **访问网站**：
   - 部署完成后，在 **Settings** → **Pages** 中查看网站地址
   - 通常是：`https://YOUR_USERNAME.github.io/REPO_NAME`
   - 或者如果仓库名是 `YOUR_USERNAME.github.io`，地址是：`https://YOUR_USERNAME.github.io`

---

## 五、后续更新

每次修改代码后：

```bash
cd "/Users/felix/Documents/Chuck/chuck's-lego-world "

# 查看更改
git status

# 添加更改
git add .

# 提交
git commit -m "描述你的更改"

# 推送（会自动触发部署）
git push
```

---

## 常见问题

### Q: 如何查看我的 GitHub 用户名？
A: 登录 GitHub，点击右上角头像，用户名显示在个人资料中。

### Q: 令牌在哪里查看？
A: 生成后只显示一次。如果丢失，需要：
1. 访问 GitHub Settings → Developer settings → Personal access tokens
2. 删除旧令牌
3. 创建新令牌

### Q: 推送时提示 "Permission denied"？
A: 检查：
1. 令牌是否有效（未过期）
2. 令牌是否有 `repo` 权限
3. 远程仓库 URL 是否正确

### Q: GitHub Actions 部署失败？
A: 检查：
1. 是否添加了 `GEMINI_API_KEY` secret
2. 是否在 Pages 设置中选择了 "GitHub Actions"
3. 查看 Actions 标签页中的错误信息

---

## 快速命令参考

```bash
# 查看状态
git status

# 查看远程仓库
git remote -v

# 更新远程 URL
git remote set-url origin https://github.com/USERNAME/REPO.git

# 添加所有文件
git add .

# 提交
git commit -m "提交信息"

# 推送
git push

# 查看提交历史
git log --oneline

# 查看分支
git branch -a
```
