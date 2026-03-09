#!/bin/bash
# 在服务器上执行：临时去掉对不存在证书的引用，让 Nginx 仅用 80 端口启动
set -e
NGINX_SITES="/etc/nginx/sites-enabled"
NGINX_CONFD="/etc/nginx/conf.d"
BACKUP_DIR="/root/nginx-backup-$(date +%Y%m%d-%H%M%S)"

echo "备份 Nginx 配置到 $BACKUP_DIR"
mkdir -p "$BACKUP_DIR"
cp -r /etc/nginx/sites-enabled "$BACKUP_DIR/" 2>/dev/null || true
cp -r /etc/nginx/conf.d "$BACKUP_DIR/" 2>/dev/null || true
[ -f /etc/nginx/nginx.conf ] && cp /etc/nginx/nginx.conf "$BACKUP_DIR/"

# 禁用引用 chuckfan.com 证书的配置（移到备份目录，避免 include * 仍加载到）
for dir in "$NGINX_SITES" "$NGINX_CONFD"; do
  [ -d "$dir" ] || continue
  for f in "$dir"/*; do
    [ -f "$f" ] || continue
    if grep -q "letsencrypt.*chuckfan\|fullchain.pem\|privkey.pem" "$f" 2>/dev/null; then
      echo "禁用: $f -> $BACKUP_DIR/"
      mv "$f" "$BACKUP_DIR/"
    fi
  done
done

# 新建仅 HTTP 的 chuckfan.com 配置
CHUCK_HTTP="/etc/nginx/sites-enabled/chuckfan-http-only.conf"
if [ -d /etc/nginx/conf.d ] && [ ! -d /etc/nginx/sites-enabled ]; then
  CHUCK_HTTP="/etc/nginx/conf.d/chuckfan-http-only.conf"
fi
mkdir -p "$(dirname "$CHUCK_HTTP")"

cat > "$CHUCK_HTTP" << 'NGINX_EOF'
server {
    listen 80;
    server_name chuckfan.com www.chuckfan.com;
    root /root/projects/chuck;
    index index.html;
    # 禁止缓存 index.html，确保每次部署后用户拿到最新的入口（避免拿到旧 HTML 仍请求 /src/main.jsx 导致 MIME 错误）
    location = /index.html {
        add_header Cache-Control "no-store, no-cache, must-revalidate";
        try_files $uri =404;
    }
    location / {
        try_files $uri $uri/ /index.html;
    }
}
NGINX_EOF

echo "已写入 $CHUCK_HTTP"
nginx -t && systemctl start nginx && echo "Nginx 已启动（仅 HTTP）。" || (echo "Nginx 启动失败，请执行: journalctl -xe"; exit 1)
