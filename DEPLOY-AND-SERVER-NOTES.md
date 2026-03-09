# Chuck's Lego World — 服务器 / 网站 / 仓库与部署说明

> 存到 Obsidian 用，方便下次查阅。  
> 最后整理：按当前实际配置整理。

---

## 一、网站与域名

| 项目 | 说明 |
|------|------|
| **站点名称** | Chuck's Lego World |
| **访问地址** | http://chuckfan.com（当前仅 HTTP，未配置 HTTPS） |
| **技术栈** | React + Vite，单页应用 |
| **构建产物** | `npm run build` → `dist/` 目录 |

---

## 二、服务器

| 项目 | 说明 |
|------|------|
| **IP** | `154.17.3.182` |
| **登录用户** | `root` |
| **登录方式** | SSH 密钥（密码可作备用） |
| **SSH 命令示例** | `ssh -i ~/.ssh/id_ed25519 root@154.17.3.182` |

### 部署目录

- **网站根目录**：`/root/projects/chuck/`
- 每次部署会先清空该目录再上传新的 `dist/*` 内容。

### Nginx

- **配置目录**：`/etc/nginx/`
- **当前状态**：仅 HTTP（80 端口），未使用 SSL 证书。
- **站点配置**：`/etc/nginx/sites-enabled/chuckfan-http-only.conf`（仅 80，root 指向 `/root/projects/chuck`）。
- **原 HTTPS 配置**：曾引用 `/etc/letsencrypt/live/chuckfan.com/` 证书，因证书不存在导致 Nginx 无法启动，已移入备份目录。
- **备份目录**：`/root/nginx-backup-*`（按时间戳）。
- **常用命令**：
  - 测试配置：`nginx -t`
  - 启动/重启：`systemctl start nginx`、`systemctl reload nginx`
  - 查看状态：`systemctl status nginx`

---

## 三、Git 与 GitHub 仓库

| 项目 | 说明 |
|------|------|
| **仓库名** | `chucks-lego-world` |
| **所属** | `noahfanye-creator`（GitHub 用户/组织） |
| **克隆地址** | `git@github.com:noahfanye-creator/chucks-lego-world.git` |
| **默认分支** | `main` |

### 本机常用

- 项目路径示例：`/Users/fanye/Documents/Chuck/chuck's-lego-world`（以你本机为准）。
- 推送：`git push origin main`。

---

## 四、部署流程（GitHub Actions）

- **Workflow 文件**：`.github/workflows/deploy-to-server.yml`
- **名称**：Deploy to Server (chuckfan.com)
- **触发**：
  - 推送到 `main` 分支自动运行；
  - 或到 GitHub → Actions → 选择该 workflow → Run workflow 手动触发。

### 流程步骤概要

1. Checkout 代码  
2. Setup Node.js 20，npm cache  
3. Install dependencies：`npm ci` 或 `npm install`  
4. Build：`npm run build`（生成 `dist/`）  
5. 配置 SSH 私钥（来自 Secret）  
6. 将服务器加入 known_hosts  
7. 清空服务器 `/root/projects/chuck/*` 并确保目录存在  
8. 用 scp 上传 `dist/*` 到 `/root/projects/chuck/`  
9. chmod -R 755，然后 `nginx -t && systemctl reload nginx`（失败不导致 job 失败）

### GitHub Secrets（必配）

| Secret 名称 | 用途 | 说明 |
|-------------|------|------|
| **SSH_PRIVATE_KEY** | Actions 用该私钥 SSH 登录服务器 | 必须是 **OpenSSH 格式** 的完整私钥（含 `-----BEGIN OPENSSH PRIVATE KEY-----` 和 `-----END OPENSSH PRIVATE KEY-----` 及中间全部行）。不能是 .ppk；若有 .ppk 需用 puttygen 转为 OpenSSH 再粘贴。 |

- 配置位置：仓库 → **Settings → Secrets and variables → Actions**。  
- 与服务器上的公钥必须成对：服务器 `root` 的 `~/.ssh/authorized_keys` 里要有对应公钥。

---

## 五、本机 SSH 密钥（与 GitHub 部署用同一把）

- **私钥**：`~/.ssh/id_ed25519`（本机登录服务器 + 填到 GitHub `SSH_PRIVATE_KEY` 的那一份）。  
- **公钥**：`~/.ssh/id_ed25519.pub`（已放入服务器 `root` 的 `~/.ssh/authorized_keys`）。  
- **测试登录**：`ssh -i ~/.ssh/id_ed25519 -o StrictHostKeyChecking=no root@154.17.3.182 "echo OK"`（不提示密码即表示密钥生效）。

---

## 六、项目内脚本（可选）

均在仓库 `scripts/` 下，需在本机项目目录执行（或自行改路径）。

| 脚本 | 作用 |
|------|------|
| **run-fix-nginx.sh** | 通过 SSH 在服务器上执行 Nginx 修复：把引用不存在证书的配置移走，并写入仅 HTTP 的 chuckfan 配置，然后启动 Nginx。 |
| **fix-nginx-no-ssl-remote.sh** | 上述操作在服务器上实际执行的脚本（由 run-fix-nginx.sh 上传并执行）。 |
| **run-ssl-setup.sh** | 在服务器上安装 certbot 并尝试为 chuckfan.com 申请 Let's Encrypt 证书（standalone）。若域名经 Cloudflare 等代理，HTTP-01 可能 404，需改用 DNS-01 或临时关闭代理再申请。 |
| **setup-ssl-chuckfan-remote.sh** | 上述证书申请在服务器上执行的脚本。 |

若 Nginx 因证书报错无法启动，可在本机执行：  
`./scripts/run-fix-nginx.sh`（需能无密码 SSH 到服务器）。

---

## 七、HTTPS / 证书（当前未启用）

- **现象**：Nginx 曾配置为使用 `/etc/letsencrypt/live/chuckfan.com/fullchain.pem`，但该路径下无证书，导致 `nginx -t` 失败、Nginx 无法启动。  
- **已做**：将引用该证书的配置移出 `sites-enabled` 到备份目录，改为仅 HTTP 的 `chuckfan-http-only.conf`，站点目前仅通过 http://chuckfan.com 访问。  
- **若以后要上 HTTPS**：  
  - 域名若走 Cloudflare：可用 Cloudflare 的 SSL，或使用 certbot 的 **DNS-01** 校验；  
  - 或临时让 chuckfan.com 的 A 记录直指 `154.17.3.182`、关闭代理后再用 `certbot --nginx -d chuckfan.com` 做 HTTP-01。

---

## 八、快速命令备忘

```bash
# 本机 SSH 登录服务器
ssh -i ~/.ssh/id_ed25519 root@154.17.3.182

# 本机触发部署（空提交）
git commit --allow-empty -m "chore: trigger deploy" && git push origin main

# 在服务器上查看 Nginx 状态
systemctl status nginx
nginx -t

# 在服务器上查看站点目录
ls -la /root/projects/chuck/
```

---

## 九、链接汇总

- 网站：http://chuckfan.com  
- 仓库：https://github.com/noahfanye-creator/chucks-lego-world  
- Actions：https://github.com/noahfanye-creator/chucks-lego-world/actions  

---

## 十、常见问题 / 故障排查

### 若线上白屏并报 main.jsx / MIME 错误，按顺序做：

1. **看 GitHub Actions 是否部署成功**  
   打开 [Actions](https://github.com/noahfanye-creator/chucks-lego-world/actions)，看最近一次 “Deploy to Server” 是否绿色。看 **“Verify deployed index on server”** 步骤里打印的 `index.html`：若出现的是 `src="/assets/index-xxx.js"` 说明服务器上的文件是对的。

2. **若服务器上已是 /assets/，多半是缓存**  
   - 域名若走 **Cloudflare**：在 Cloudflare 控制台 → 该域名 → Caching → **Purge Everything**（或 Purge Cache）。  
   - 再在浏览器无痕模式或强刷（Ctrl+Shift+R）访问 https://chuckfan.com 或 https://www.chuckfan.com。

3. **若 Actions 里显示服务器上的 index 仍是 main.jsx**  
   说明 Nginx 的 root 可能指到了错误目录，或部署没写进当前站点目录。SSH 到服务器执行：  
   `cat /root/projects/chuck/index.html | head -12`  
   若这里已是 `/assets/`，说明部署目录对、但 Nginx 配的 root 不是 `/root/projects/chuck`，需要改 Nginx 配置里的 `root` 并重载。若这里仍是 main.jsx，说明部署没成功，检查 Actions 里 scp 步骤是否有报错。

4. **让之后不再被缓存旧 HTML**  
   在服务器上执行一次 Nginx 修复脚本（会为 index.html 加上不缓存头）：  
   本机运行：`./scripts/run-fix-nginx.sh`

### 1. 报错：main.jsx 返回 MIME 类型 text/html（或 “Expected a JavaScript module script”）

**原因**：浏览器拿到的 `index.html` 仍是旧版，里面对脚本的引用是开发时的 `/src/main.jsx`。部署后构建产物里应是 `/assets/index-xxx.js`，但浏览器或 CDN 缓存了旧的 HTML。

**处理**：
- 已在 Nginx 中为 `index.html` 设置 `Cache-Control: no-store, no-cache`（见 `fix-nginx-no-ssl-remote.sh`），部署后需在服务器上更新该配置并重载 Nginx（或重新执行一次 fix 脚本）。
- 若前面接了 **Cloudflare**：部署完成后在 Cloudflare 控制台对该域名做 **缓存清除（Purge Cache）**，否则边缘节点可能继续返回旧 HTML。
- 用户端：强刷（Ctrl+Shift+R / Cmd+Shift+R）或清除站点缓存后再访问。

### 2. ERR_CONNECTION_CLOSED（如对 main.jsx 或 cloudflareinsights.com）

- **main.jsx**：同上，本质是请求了不存在的路径，服务器用 SPA 回退返回了 HTML，有时会伴随连接异常；解决后不再请求 main.jsx 即可。
- **cloudflareinsights.com/beacon**：多为浏览器扩展（广告/隐私拦截）拦截，或网络问题；不影响本站功能，可忽略。若需统计可检查 Cloudflare 控制台或暂时关闭扩展测试。

### 3. 确认线上是构建产物

在服务器上检查站点根目录应为构建结果（含 `index.html` 和 `assets/`），而不是源码：

```bash
ssh root@154.17.3.182 "ls -la /root/projects/chuck/"
# 应看到 index.html、assets/ 等，且 index.html 内引用的是 /assets/index-xxx.js 而非 /src/main.jsx
```

---

*文档随实际变更记得更新（如换 IP、换目录、上 HTTPS 等）。*
