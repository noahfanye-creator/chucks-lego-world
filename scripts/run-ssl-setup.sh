#!/bin/bash
# 在本机执行：通过 SSH 在服务器上安装证书（需先能无密码 SSH 登录）
# 若证书申请失败（如域名经 Cloudflare 代理导致 HTTP-01 校验 404），
# 请先执行：ssh -i ~/.ssh/id_ed25519 root@154.17.3.182 "systemctl start nginx"
# 以恢复站点，再考虑用 DNS-01 或临时关闭 HTTPS。
set -e
SERVER="root@154.17.3.182"
KEY="${SSH_KEY:-$HOME/.ssh/id_ed25519}"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REMOTE_SCRIPT="/tmp/setup-ssl-chuckfan-remote.sh"

echo "上传并在服务器上执行 SSL 安装脚本..."
scp -i "$KEY" -o StrictHostKeyChecking=no "$SCRIPT_DIR/setup-ssl-chuckfan-remote.sh" "$SERVER:$REMOTE_SCRIPT"
ssh -i "$KEY" -o StrictHostKeyChecking=no "$SERVER" "chmod +x $REMOTE_SCRIPT && $REMOTE_SCRIPT"
echo "完成。请再触发一次部署或访问 https://chuckfan.com 验证。"
