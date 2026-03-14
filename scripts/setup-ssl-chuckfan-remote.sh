#!/bin/bash
# 在服务器 154.17.3.182 上执行：安装 certbot 并申请 chuckfan.com 的 SSL 证书
set -e
export DEBIAN_FRONTEND=noninteractive
apt-get update -qq
apt-get install -y certbot
echo "停止 Nginx，以便 certbot 使用 80 端口验证域名..."
systemctl stop nginx || true
certbot certonly --standalone -d chuckfan.com --non-interactive --agree-tos --email noahfanye@gmail.com
echo "启动 Nginx..."
systemctl start nginx
nginx -t && echo "Nginx 配置检查通过。"
echo "证书已就绪: /etc/letsencrypt/live/chuckfan.com/"
