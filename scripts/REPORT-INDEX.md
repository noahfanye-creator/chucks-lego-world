# 报告列表 index.json 更新说明

报告中心页面（`/reports`）依赖 **`/data/reports/index.json`** 显示报告列表。

**→ 管道里要删什么、末尾加什么，按步骤做：见 [PIPELINE-INTEGRATION.md](PIPELINE-INTEGRATION.md)。**  
**→ 生成报告后列表又空了？见 [排查报告列表为空.md](排查报告列表为空.md)。**

---

## 为什么会出现「报告列表为空」？

**每次生成报告后列表就空，说明管道里在「写」或「覆盖」index.json。**  
常见错误做法：

- 生成报告时**先清空再追加**写 index，结果只写了一条或写失败变成空
- 管道里**自己拼 JSON 数组**写 index.json，漏写、格式错或中途出错导致文件为空/损坏
- 生成前**删除或覆盖** index.json

**正确做法：管道内不要直接写 index.json。** 只在**所有** `review_*.json`（以及 html/md 等）都写完后，**唯一**通过下面两种方式之一更新 index。

---

## 唯一推荐方式：全量扫描后写 index

在每次生成/更新完各股票的 `review_latest.json` 之后，用**全量扫描**重新生成整份 index，不要用「当前这条报告」去追加或覆盖 index。

### 方式一：Bash 脚本（服务器上有 jq 时）

```bash
# 在报告根目录执行（默认 /root/data/reports）
bash /path/to/chuck-s-lego-world/scripts/server-build-report-index.sh

# 报告目录不在默认路径时
REPORTS_ROOT=/var/www/data/reports bash /path/to/scripts/server-build-report-index.sh
```

### 方式二：Python 脚本（适合从 stock_report_generator 等管道调用）

```bash
# 命令行
python3 /path/to/chuck-s-lego-world/scripts/build_report_index.py
python3 /path/to/chuck-s-lego-world/scripts/build_report_index.py /root/data/reports
```

或在 **Python 管道末尾**调用（推荐）：

```python
# 在 stock_report_generator 等脚本里，写完 review_*.json 和 review_*.md 之后：
import subprocess
import sys

# 报告根目录，需与当前写入路径一致
REPORTS_ROOT = "/root/data/reports"  # 或你的实际路径
script = "/path/to/chuck-s-lego-world/scripts/build_report_index.py"
subprocess.run([sys.executable, script, REPORTS_ROOT], check=False)
```

或直接调用函数（同一项目内）：

```python
from build_report_index import build_report_index
build_report_index("/root/data/reports")
```

---

## 管道集成检查清单

1. **删除**管道里所有「写 `/data/reports/index.json`」或「更新 index」的自有逻辑（不要自己拼 JSON、不要清空再追加）。
2. **保留**唯一一步：在**所有**报告文件（含 `review_latest.json`）写完后，执行上述 **Bash 或 Python** 脚本一次。
3. 确保脚本有权限读 `REPORTS_ROOT` 下各子目录的 `review_latest.json`，且报告根目录路径与脚本参数/环境变量一致。

---

## 脚本行为说明

- 扫描 `REPORTS_ROOT` 下每个**子目录**（如 `002173/`、`688630/`），读取该目录下的 `review_latest.json`。
- 生成合法 JSON 数组，先写 `index.json.tmp`；**仅当**新内容非空（至少一条记录）时才替换 `index.json`，否则不覆盖，避免把已有列表清空。
- **同一天多只股票**：每个 code 一条记录，前端按 `trade_date` 分组显示。
- **同一天同一只股票多次生成**：同一目录覆盖写，列表只显示该股票一张卡片（最后一次）。

---

## 若 index 已坏如何恢复

在服务器上执行一次上述脚本即可从当前磁盘上的 `*/review_latest.json` 重建 index：

```bash
cd /root/data/reports
python3 /path/to/chuck-s-lego-world/scripts/build_report_index.py
# 或
bash /path/to/chuck-s-lego-world/scripts/server-build-report-index.sh
```
