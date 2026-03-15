# 报告列表 index.json 更新说明

报告中心页面（`/reports`）依赖 **`/data/reports/index.json`** 显示报告列表。该文件必须由报告生成管道在**每次生成或更新报告后**更新，且**只应通过下面这一种方式**更新，避免被写空或写坏。

---

## 唯一推荐方式：全量扫描脚本

在 DMIT 服务器上，每次生成完各股票的 `review_*.json`（及 html/md 等）之后：

1. **不要**在管道里自己拼 JSON 或直接写 `index.json`（容易覆盖成空或漏掉已有报告）。
2. **只**执行本仓库提供的全量扫描脚本，用当前磁盘上所有 `*/review_latest.json` 重新生成整份 index。

### 执行方式

```bash
# 在报告根目录所在服务器上执行（默认 /root/data/reports）
bash /path/to/chuck-s-lego-world/scripts/server-build-report-index.sh

# 若报告目录不在默认路径，可指定环境变量
REPORTS_ROOT=/var/www/data/reports bash /path/to/scripts/server-build-report-index.sh
```

脚本会：

- 扫描 `REPORTS_ROOT` 下每个子目录（如 `002173/`、`688630/`），读取该目录下的 `review_latest.json`；
- 生成合法的 JSON 数组，先写入 `index.json.tmp`；
- **仅当**新内容非空（至少有一条记录）时，才用 `mv` 覆盖 `index.json`，否则不覆盖并 `exit 1`，避免误把已有列表清空。

### 列表展示逻辑

- **同一天多只股票**：每个 code 一条记录，前端按 `trade_date` 分组，同一日期下会显示多张卡片（如 688630、300442、002173 各一张）。
- **同一天同一只股票多次生成**：当前为覆盖写（同一目录只保留最后一次），列表只显示该股票一张卡片，对应最后一次生成。

---

## 若 index 已坏如何恢复

在服务器上直接跑一次上述脚本即可从当前磁盘上的 `*/review_latest.json` 重建 index，无需数据库或手工编辑。

```bash
cd /root/data/reports   # 或你的 REPORTS_ROOT
bash /path/to/scripts/server-build-report-index.sh
```
