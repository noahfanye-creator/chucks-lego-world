#!/usr/bin/env python3
"""
在报告根目录下扫描各 code/review_latest.json，生成 /data/reports/index.json。
报告生成管道在写完 review_*.json 后必须调用本脚本（或 server-build-report-index.sh）更新 index，
且管道内不要直接写入 index.json，否则容易把列表写空。

用法：
  在报告根目录执行：
    python3 scripts/build_report_index.py
    python3 scripts/build_report_index.py /root/data/reports
  
  或在 Python 管道中调用：
    from build_report_index import build_report_index
    build_report_index("/root/data/reports")
"""
from __future__ import annotations

import json
import os
import sys


def build_report_index(reports_root: str | None = None) -> int:
    """
    扫描 reports_root 下各子目录的 review_latest.json，生成 index.json。
    返回写入的报告条数；若为 0 则不覆盖原 index.json。
    """
    root = (reports_root or os.environ.get("REPORTS_ROOT") or "/root/data/reports").rstrip("/")
    if not os.path.isdir(root):
        print(f"REPORT_INDEX: 目录不存在 {root}", file=sys.stderr)
        return 0

    out: list[dict] = []
    for name in sorted(os.listdir(root)):
        if name == "index.json" or name.startswith("."):
            continue
        code_dir = os.path.join(root, name)
        if not os.path.isdir(code_dir):
            continue
        latest_path = os.path.join(code_dir, "review_latest.json")
        if not os.path.isfile(latest_path):
            continue
        try:
            with open(latest_path, "r", encoding="utf-8") as f:
                raw = json.load(f)
        except Exception:
            continue
        payload = raw.get("data") or raw.get("payload") or raw.get("report") or raw
        if not isinstance(payload, dict):
            continue
        item = {
            "type": "review",
            "code": name,
            "name": payload.get("stock_name") or "",
            "trade_date": payload.get("report_date") or "",
            "date": payload.get("report_date") or "",
            "generated_at": payload.get("generated_at") or "",
            "url": f"/reports/review/{name}",
        }
        out.append(item)

    if not out:
        print("REPORT_INDEX: 未发现任何 review_latest.json，不覆盖 index.json", file=sys.stderr)
        return 0

    tmp_path = os.path.join(root, "index.json.tmp")
    out_path = os.path.join(root, "index.json")
    with open(tmp_path, "w", encoding="utf-8") as f:
        json.dump(out, f, ensure_ascii=False)
    os.replace(tmp_path, out_path)
    print(f"REPORT_INDEX: OK, {len(out)} reports -> {out_path}", file=sys.stderr)
    return len(out)


if __name__ == "__main__":
    root = sys.argv[1] if len(sys.argv) > 1 else None
    n = build_report_index(root)
    sys.exit(0 if n > 0 else 1)
