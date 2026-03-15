# 生成 review_{date}.md 说明

报告详情页的「NotebookLM 视图」会跳转到：

`https://www.chuckfan.com/data/reports/{code}/review_{yyyy-MM-DD}.md`

该 `.md` 文件需由**报告生成管道**在生成 `review_{trade_date}.json` 后一并生成，并放到同一目录（如 `/data/reports/{code}/`），与 `review_latest.json`、`review_2026-03-15.json` 等并列。

## 方式一：Python 脚本（适合 DMIT + stock_report_generator.py）

本仓库提供 **Python** 脚本，与 Node 版输出一致，可直接在生成 JSON 后写同目录的 `review_{date}.md` 和 `review_latest.md`：

```bash
# 指定 JSON 路径 → 在同目录生成 review_2026-03-15.md 和 review_latest.md
python3 scripts/generate_review_md.py /root/data/reports/603092/review_2026-03-15.json

# 额外生成与 PDF 报告同名的 MD（与 stock_report_generator 的 get_review_report_filename 一致）：代码_月日_A复盘_名称.md
python3 scripts/generate_review_md.py /root/data/reports/603092/review_2026-03-15.json --pdf-name
# 例：sz300474_0315_A复盘_景嘉微.md

# 只生成带日期的文件，不写 review_latest.md
python3 scripts/generate_review_md.py /root/data/reports/603092/review_2026-03-15.json --no-latest

# 指定输出文件
python3 scripts/generate_review_md.py /path/to/review_latest.json -o /path/to/review_2026-03-15.md

# 从 stdin 读 JSON（无路径时写入当前目录）
cat review_2026-03-15.json | python3 scripts/generate_review_md.py
```

**在 stock_report_generator.py 里调用**：写完 `review_{trade_date}.json` 和 `review_latest.json` 后，用同一份数据生成 MD：

```python
# 假设 report_data 即要写入 review_2026-03-15.json 的 dict，out_dir = /root/data/reports/603092/
from generate_review_md import build_report_notebook_text, get_report_date, extract_payload

md = build_report_notebook_text(report_data)  # 或 build_report_notebook_text({"data": report_data})
report_date = get_report_date(extract_payload(report_data))  # 如 "2026-03-15"
if report_date:
    with open(f"{out_dir}/review_{report_date}.md", "w", encoding="utf-8") as f:
        f.write(md)
with open(f"{out_dir}/review_latest.md", "w", encoding="utf-8") as f:
    f.write(md)
```

或直接子进程调用脚本（无需改 Python 路径）：

```bash
python3 /path/to/chuck-s-lego-world/scripts/generate_review_md.py /root/data/reports/603092/review_2026-03-15.json
```

## 方式二：Node 脚本

若 DMIT 环境已安装 Node，可用本仓库 Node 脚本根据同一份 report JSON 生成内容一致的 Markdown：

```bash
# 在项目根目录执行
node scripts/generate-review-md.cjs /path/to/review_2026-03-15.json
# 会在同目录生成 review_2026-03-15.md（报告日期从 JSON 的 report_date 读取）

# 指定输出路径
node scripts/generate-review-md.cjs /path/to/review_latest.json -o /path/to/review_2026-03-15.md

# 从 stdin 读 JSON，输出到 stdout
cat /path/to/review_latest.json | node scripts/generate-review-md.cjs > review_2026-03-15.md
```

**在 DMIT 服务器 / Python 管道中**：生成完 `review_{trade_date}.json` 后，调用一次上述 Node 命令即可得到 `review_{trade_date}.md`。若同一目录下同时维护 `review_latest.json`（与当日 `review_{date}.json` 内容一致），可对 `review_latest.json` 执行脚本，输出到 `review_{trade_date}.md`，例如：

```bash
node /path/to/chuck-s-lego-world/scripts/generate-review-md.cjs /data/reports/002173/review_latest.json
# 生成 /data/reports/002173/review_2026-03-15.md（日期来自 JSON 内 report_date）
```

## 方式三：与前端逻辑一致

Markdown 内容与前端「报告详情页」+「Notebook 视图」一致，由 `src/sections/ReportDetail.tsx` 的 `buildReportNotebookText` 定义；Node 端复用在 `scripts/ai-summary-lib.cjs` 的 `buildReportNotebookText`。若你用其他语言重写管道，需按相同结构生成：当日概览、资金与筹码、近20日行情、日线技术指标、六周期摘要与 K 线、缠论结构、操作策略等。

## 文件命名约定

- `review_latest.json` / `review_latest.md`：始终为「最近一次」报告，便于固定 URL。
- `review_2026-03-15.json` / `review_2026-03-15.md`：按交易日的报告，内容在生成时与当日 `review_latest` 一致。

NotebookLM 建议使用**带日期的 URL**（如 `review_2026-03-15.md`），以便区分不同日期的报告。

**MD 与 PDF 同名**：脚本支持 `--pdf-name`，会额外写出与 **stock_report_generator** 中 `get_review_report_filename` 相同规则的文件名：`代码_月日_A复盘_名称.md`（如 `sz300474_0315_A复盘_景嘉微.md`），与 PDF 的 `代码_月日_A复盘_名称.pdf` 一一对应，便于一起给 NotebookLM。
