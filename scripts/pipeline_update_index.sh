#!/usr/bin/env bash
# 报告生成管道末尾「唯一」应调用的脚本：用全量扫描更新 index.json，不直接写 index。
# 用法：在写完所有 review_*.json 后执行一次（路径按你实际报告根目录改）
#
#   REPORTS_ROOT=/root/data/reports /path/to/chuck-s-lego-world/scripts/pipeline_update_index.sh
#   或
#   /path/to/chuck-s-lego-world/scripts/pipeline_update_index.sh /root/data/reports
#
set -e
REPORTS_ROOT="${REPORTS_ROOT:-/root/data/reports}"
if [ -n "$1" ]; then
  REPORTS_ROOT="$1"
fi
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
exec python3 "$SCRIPT_DIR/build_report_index.py" "$REPORTS_ROOT"
