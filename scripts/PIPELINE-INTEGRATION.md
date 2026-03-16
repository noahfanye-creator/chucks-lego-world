# 报告管道集成：index 只由全量脚本更新

按下面做一次，报告列表就不会再被写空。

---

## 第一步：在管道里删掉这些

在报告生成管道（如 `stock_report_generator.py`、Telegram Bot 回调、cron 脚本等）中：

- [ ] **删除**：任何「写入 `/data/reports/index.json`」或「更新报告列表」的代码  
  例如：`open('.../index.json', 'w')`、`json.dump(..., index.json)`、先读再 append 再写回、单独维护一个 index 数组再写文件等。
- [ ] **删除**：生成报告前「清空 index」或「删除 index.json」的逻辑。
- [ ] **保留**：写 `review_*.json`、`review_*.md`、`review_*.html` 到各 `{code}/` 目录的逻辑不变。

---

## 第二步：在管道末尾只加这一句

在**所有**当次要写的 `review_latest.json`（及 md/html）都写完之后，**只**用下面三种方式之一更新 index（任选其一）。

### 方式 A：Bash 一行（推荐在 shell/cron 里）

```bash
# 把 /path/to/chuck-s-lego-world 换成你仓库在服务器上的实际路径
# 把 /root/data/reports 换成你的报告根目录（若不是默认）
REPORTS_ROOT=/root/data/reports /path/to/chuck-s-lego-world/scripts/pipeline_update_index.sh
```

或带参数：

```bash
/path/to/chuck-s-lego-world/scripts/pipeline_update_index.sh /root/data/reports
```

### 方式 B：Python 管道里调用（推荐在 stock_report_generator 等末尾）

```python
# 在写完所有 review_*.json 和 review_*.md 之后执行一次
import subprocess
import sys

REPORTS_ROOT = "/root/data/reports"  # 改成你的报告根目录
SCRIPT = "/path/to/chuck-s-lego-world/scripts/build_report_index.py"  # 改成脚本实际路径

subprocess.run([sys.executable, SCRIPT, REPORTS_ROOT], check=False)
```

### 方式 C：用 Bash 脚本（需 jq）

```bash
REPORTS_ROOT=/root/data/reports bash /path/to/chuck-s-lego-world/scripts/server-build-report-index.sh
```

---

## 路径说明

| 占位符 | 说明 |
|--------|------|
| `/root/data/reports` | 报告根目录，即其下有 `002173/`、`688630/` 等子目录，每个子目录里有 `review_latest.json`。若你的不是此路径，改成实际路径。 |
| `/path/to/chuck-s-lego-world` | 本仓库在服务器上的路径，例如 `/root/chuck-s-lego-world` 或 `/opt/chuck-s-lego-world`。 |

---

## 检查是否生效

1. 管道里已无任何写 `index.json` 的代码。
2. 管道末尾有且仅有上述「更新 index」的其中一种调用。
3. 生成一份新报告后，访问 https://www.chuckfan.com/reports ，列表应包含所有已有报告且包含刚生成的那条。

若仍为空，在服务器上手动执行一次（把路径换成你的）：

```bash
python3 /path/to/chuck-s-lego-world/scripts/build_report_index.py /root/data/reports
```

然后刷新 /reports 页面。若此时列表正常，说明管道里仍 somewhere 在覆盖 index，请再排查并删除。
