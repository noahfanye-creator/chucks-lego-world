#!/bin/bash
# 在服务器上运行：根据 REPORTS_ROOT 下各 code 目录的 review_latest.json 全量扫描生成 index.json
#
# 重要：报告生成管道在写完各 code 的 review_*.json 后，只调用本脚本更新 index，不要用其他逻辑覆盖 index.json。
# 同一天多只股票：每个 code 一条记录，前端按 trade_date 分组，同一日期下会显示多张卡片。
# 同一天同一只股票多次生成：当前为覆盖写，只保留最后一次，列表只显示一张该股票卡片。
#
set -e
REPORTS_ROOT="${REPORTS_ROOT:-/root/data/reports}"
cd "$REPORTS_ROOT"
OUT="$REPORTS_ROOT/index.json.tmp"
echo -n "[" > "$OUT"
first=1
for dir in */; do
  code="${dir%/}"
  [ "$code" = "index.json" ] && continue
  [ ! -f "$code/review_latest.json" ] && continue
  item=$(jq -c --arg code "$code" '
    . as $root |
    ($root.data // $root) as $p |
    {
      type: "review",
      code: $code,
      name: ($p.stock_name // ""),
      trade_date: ($p.report_date // ""),
      date: ($p.report_date // ""),
      generated_at: ($p.generated_at // ""),
      url: ("/reports/review/" + $code)
    }
  ' "$code/review_latest.json" 2>/dev/null) || continue
  [ -z "$item" ] && continue
  if [ "$first" -eq 1 ]; then first=0; else echo -n "," >> "$OUT"; fi
  echo -n "$item" >> "$OUT"
done
echo "]" >> "$OUT"

# 安全覆盖：只有新内容非空（至少有一个有效条目，即 size > 2 的 "[]"）才替换，避免误把 index 写空
size=$(wc -c < "$OUT")
if [ "$size" -gt 2 ]; then
  mv "$OUT" "$REPORTS_ROOT/index.json"
  count=$(grep -o '"code"' "$REPORTS_ROOT/index.json" | wc -l | tr -d ' ')
  echo "OK: $size bytes, $count reports"
else
  rm -f "$OUT"
  echo "SKIP: no valid reports, index.json unchanged" 1>&2
  exit 1
fi
