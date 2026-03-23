#!/usr/bin/env bash
# 直连 DMIT 服务器上传 tournament（不经过 GitHub）。
# 默认目标为文档中的站点机：root@154.17.3.182，目录 /root/projects/tournament
#
# 用法（在项目根目录）：
#   ./scripts/deploy-tournament.sh
#
# 若本机登录 DMIT 用的不是默认密钥：
#   SSH_KEY=~/.ssh/你的私钥 ./scripts/deploy-tournament.sh
#
# 若 Nginx root 不是默认路径，先 SSH 上机执行：grep -r tournament /etc/nginx
# 再指定：
#   TOURNAMENT_REMOTE_DIR=/实际/web根目录 ./scripts/deploy-tournament.sh
#
# 可选：上传后重载 Nginx
#   SSH_RELOAD_NGINX=1 ./scripts/deploy-tournament.sh
set -euo pipefail

SERVER="${TOURNAMENT_SERVER:-root@154.17.3.182}"
KEY="${SSH_KEY:-$HOME/.ssh/id_ed25519}"
REMOTE_DIR="${TOURNAMENT_REMOTE_DIR:-/root/projects/tournament}"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SRC="$ROOT/tournament"

if [[ ! -d "$SRC" ]]; then
  echo "错误：找不到 $SRC"
  exit 1
fi

if [[ ! -f "$KEY" ]]; then
  echo "错误：找不到私钥文件: $KEY"
  echo "请设置 SSH_KEY 指向能登录 DMIT 的私钥，例如："
  echo "  SSH_KEY=~/.ssh/id_ed25519 ./scripts/deploy-tournament.sh"
  exit 1
fi

echo "DMIT 目标：$SERVER:$REMOTE_DIR"
echo "使用密钥：$KEY"
ssh -i "$KEY" -o StrictHostKeyChecking=no "$SERVER" "mkdir -p '$REMOTE_DIR'"
scp -i "$KEY" -o StrictHostKeyChecking=no -r "$SRC"/* "$SERVER:$REMOTE_DIR/"
ssh -i "$KEY" -o StrictHostKeyChecking=no "$SERVER" "chmod -R 755 '$REMOTE_DIR'"

if [[ "${SSH_RELOAD_NGINX:-}" == "1" ]]; then
  ssh -i "$KEY" -o StrictHostKeyChecking=no "$SERVER" "nginx -t && systemctl reload nginx" || true
fi

echo "上传完成。"
