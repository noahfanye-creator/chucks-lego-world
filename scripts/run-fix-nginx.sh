#!/bin/bash
# 本机执行：在服务器上临时改为仅 HTTP，使 Nginx 能启动
set -e
SERVER="root@154.17.3.182"
KEY="${SSH_KEY:-$HOME/.ssh/id_ed25519}"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REMOTE_SCRIPT="/tmp/fix-nginx-no-ssl-remote.sh"

echo "上传并在服务器上执行 Nginx 修复脚本..."
scp -i "$KEY" -o StrictHostKeyChecking=no "$SCRIPT_DIR/fix-nginx-no-ssl-remote.sh" "$SERVER:$REMOTE_SCRIPT"
ssh -i "$KEY" -o StrictHostKeyChecking=no "$SERVER" "chmod +x $REMOTE_SCRIPT && $REMOTE_SCRIPT"
echo "完成。站点应已恢复为 http://chuckfan.com（无 HTTPS）。"
