# 🚀 GitHub Pages 部署 - 一步一步指南

## 📋 准备工作清单

在开始之前，请确保你有：
- ✅ GitHub 账号（如果没有，去 https://github.com/signup 注册）
- ✅ GitHub 个人访问令牌（Personal Access Token）
- ✅ Google Gemini API Key（用于网站功能）

---

## 第一步：创建 GitHub 仓库

### 1.1 打开 GitHub 创建仓库页面

1. 打开浏览器，访问：**https://github.com/new**
2. 如果没有登录，先登录你的 GitHub 账号

### 1.2 填写仓库信息

在创建仓库页面填写：

- **Repository name**（仓库名）：
  - 输入：`chucks-lego-world`
  - 或者你喜欢的名字，比如：`chuck-lego`、`lego-world` 等
  
- **Description**（描述，可选）：
  - 输入：`Chuck's Lego World - Interactive website`

- **Visibility**（可见性）：
  - ✅ 选择 **Public**（公开）- GitHub Pages 免费
  - 或 **Private**（私有）- 需要 GitHub Pro（付费）

- **重要**：❌ **不要**勾选以下选项：
  - ❌ Add a README file
  - ❌ Add .gitignore
  - ❌ Choose a license

### 1.3 创建仓库

点击页面底部的绿色按钮：**"Create repository"**

### 1.4 记录仓库信息

创建成功后，你会看到一个页面，上面有仓库的 URL，类似：
```
https://github.com/YOUR_USERNAME/chucks-lego-world
```

**请记录下：**
- 你的 GitHub 用户名：`_____________`
- 仓库名称：`_____________`
- 完整 URL：`https://github.com/_____________/_____________`

---

## 第二步：配置 Git 使用令牌

### 2.1 配置 Git 凭据存储（macOS）

打开终端（Terminal），运行：

```bash
git config --global credential.helper osxkeychain
```

这个命令会让 Git 将你的凭据保存在 macOS 的钥匙串中。

### 2.2 更新远程仓库 URL

在终端中运行以下命令（**替换 YOUR_USERNAME 和 REPO_NAME**）：

```bash
cd "/Users/felix/Documents/Chuck/chuck's-lego-world "
git remote set-url origin https://github.com/YOUR_USERNAME/REPO_NAME.git
```

**示例**（如果你的用户名是 `felix`，仓库名是 `chucks-lego-world`）：
```bash
git remote set-url origin https://github.com/felix/chucks-lego-world.git
```

### 2.3 验证远程仓库

运行以下命令确认 URL 已更新：

```bash
git remote -v
```

应该显示你的新仓库 URL。

---

## 第三步：添加并提交所有文件

### 3.1 查看当前状态

```bash
cd "/Users/felix/Documents/Chuck/chuck's-lego-world "
git status
```

### 3.2 添加所有文件

```bash
git add .
```

### 3.3 提交更改

```bash
git commit -m "Initial commit: Chuck's Lego World with GitHub Pages support"
```

---

## 第四步：推送到 GitHub

### 4.1 推送代码

```bash
git push -u origin main
```

### 4.2 输入凭据

第一次推送时，Git 会提示你输入：

1. **Username（用户名）**：
   - 输入你的 GitHub 用户名
   - 按 Enter

2. **Password（密码）**：
   - ⚠️ **重要**：这里要输入你的 **GitHub 个人访问令牌**（不是 GitHub 密码）
   - 粘贴你之前生成的令牌
   - 按 Enter

### 4.3 验证推送成功

如果看到类似这样的输出，说明成功了：
```
Enumerating objects: XX, done.
Counting objects: 100% (XX/XX), done.
...
To https://github.com/YOUR_USERNAME/REPO_NAME.git
 * [new branch]      main -> main
Branch 'main' set up to track remote branch 'main' from 'origin'.
```

### 4.4 在浏览器中查看

打开你的 GitHub 仓库页面，应该能看到所有文件已经上传了！

---

## 第五步：配置 GitHub Secrets（API Key）

### 5.1 进入仓库设置

1. 在你的 GitHub 仓库页面
2. 点击顶部的 **"Settings"** 标签

### 5.2 打开 Secrets 设置

1. 在左侧菜单中找到 **"Secrets and variables"**
2. 点击展开，选择 **"Actions"**

### 5.3 添加新的 Secret

1. 点击 **"New repository secret"** 按钮
2. 填写：
   - **Name**：`GEMINI_API_KEY`（必须完全一致，区分大小写）
   - **Value**：粘贴你的 Google Gemini API Key
3. 点击 **"Add secret"**

### 5.4 验证 Secret 已添加

你应该能在列表中看到 `GEMINI_API_KEY`。

---

## 第六步：启用 GitHub Pages

### 6.1 打开 Pages 设置

1. 在仓库的 **Settings** 页面
2. 左侧菜单找到 **"Pages"**，点击

### 6.2 配置 Pages 源

1. 在 **"Source"** 部分
2. 选择 **"GitHub Actions"**（不是 "Deploy from a branch"）
3. 页面会自动保存

---

## 第七步：触发首次部署

### 7.1 查看 Actions

1. 在仓库页面，点击顶部的 **"Actions"** 标签
2. 你应该能看到一个 workflow 叫做 **"Deploy to GitHub Pages"**

### 7.2 手动触发（如果需要）

如果 workflow 没有自动运行：

1. 点击 **"Deploy to GitHub Pages"** workflow
2. 点击右侧的 **"Run workflow"** 按钮
3. 选择 **"main"** 分支
4. 点击绿色的 **"Run workflow"** 按钮

### 7.3 查看部署进度

1. 在 Actions 页面，点击正在运行的 workflow
2. 你可以看到构建和部署的实时进度
3. 等待完成（通常 2-5 分钟）

### 7.4 查看部署结果

部署完成后：

1. 回到 **Settings** → **Pages**
2. 在页面顶部会显示你的网站地址，类似：
   - `https://YOUR_USERNAME.github.io/chucks-lego-world`
   - 或者如果仓库名是 `YOUR_USERNAME.github.io`，地址是：`https://YOUR_USERNAME.github.io`

---

## 第八步：访问你的网站

### 8.1 打开网站

在浏览器中访问你的 GitHub Pages 地址。

### 8.2 测试功能

- 检查页面是否正常加载
- 测试 AI 功能（需要 API Key 配置正确）
- 测试游戏功能
- 检查移动端显示

---

## 🎉 完成！

现在你的网站已经部署到 GitHub Pages 了！

---

## 📝 后续更新网站

每次修改代码后，只需要：

```bash
cd "/Users/felix/Documents/Chuck/chuck's-lego-world "

# 1. 查看更改
git status

# 2. 添加更改
git add .

# 3. 提交
git commit -m "描述你的更改"

# 4. 推送（会自动触发部署）
git push
```

几分钟后，网站就会自动更新！

---

## ❓ 遇到问题？

### 问题 1：推送时提示 "Permission denied"

**解决方案**：
- 检查令牌是否有效（未过期）
- 确认令牌有 `repo` 权限
- 重新生成令牌并重试

### 问题 2：GitHub Actions 部署失败

**解决方案**：
- 检查是否添加了 `GEMINI_API_KEY` secret
- 确认 secret 名称完全一致（区分大小写）
- 查看 Actions 页面的错误信息

### 问题 3：网站显示 404

**解决方案**：
- 确认在 Pages 设置中选择了 "GitHub Actions"
- 等待几分钟让部署完成
- 检查仓库名是否正确

### 问题 4：找不到我的 GitHub 用户名

**解决方案**：
- 登录 GitHub
- 点击右上角头像
- 用户名显示在个人资料中

---

## 📞 需要帮助？

如果遇到任何问题，可以：
1. 查看 GitHub Actions 的错误日志
2. 检查 GitHub Pages 设置
3. 确认所有步骤都已完成

祝你部署顺利！🎊
