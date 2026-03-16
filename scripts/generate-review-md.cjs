#!/usr/bin/env node
/**
 * 根据 review_*.json 生成 review_{report_date}.md
 * 供报告生成管道（如 stock_report_generator.py）在生成 JSON 后调用，产出 NotebookLM 可读的完整 Markdown。
 *
 * 用法：
 *   node scripts/generate-review-md.cjs <path-to-review.json>   # 输出到同目录 review_YYYY-MM-DD.md
 *   node scripts/generate-review-md.cjs <path-to-review.json> -o <out.md>
 *   cat review_latest.json | node scripts/generate-review-md.cjs   # 从 stdin 读，输出到 stdout
 */

const fs = require('fs');
const path = require('path');
const { buildReportNotebookText } = require('./ai-summary-lib.cjs');

function getReportDate(payload) {
  const raw = payload.report_date;
  if (!raw) return null;
  const s = String(raw).trim().replace(/\s.*/, '');
  return s.slice(0, 10);
}

/** 与 PDF 命名一致：代码_月日_A复盘_名称.md */
function pdfStyleBasename(payload, reportDate) {
  const code = (payload.stock_code || payload.code || '').trim();
  let name = (payload.stock_name || '未命名').trim().replace(/[\\/*?:"<>|]/g, '');
  let mmdd = (reportDate || '').replace(/-/g, '').replace(/\s/g, '');
  if (mmdd.length >= 8) mmdd = mmdd.slice(-4);
  else if (mmdd.length >= 4) mmdd = mmdd.slice(-4).padStart(4, '0');
  else mmdd = '0101';
  return `${code}_${mmdd}_A复盘_${name}.md`;
}

async function main() {
  let jsonPath = null;
  let outPath = null;
  let pdfName = false;
  const args = process.argv.slice(2);
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '-o' && args[i + 1]) {
      outPath = args[++i];
    } else if (args[i] === '--pdf-name') {
      pdfName = true;
    } else if (!args[i].startsWith('-')) {
      jsonPath = args[i];
    }
  }

  let raw;
  if (jsonPath) {
    try {
      raw = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
    } catch (e) {
      console.error('Failed to read JSON:', jsonPath, e.message);
      process.exit(1);
    }
  } else {
    const chunks = [];
    for await (const chunk of process.stdin) chunks.push(chunk);
    const text = Buffer.concat(chunks).toString('utf8');
    if (!text.trim()) {
      console.error('No JSON input (stdin empty). Usage: node generate-review-md.cjs <path-to-review.json>');
      process.exit(1);
    }
    try {
      raw = JSON.parse(text);
    } catch (e) {
      console.error('Invalid JSON from stdin:', e.message);
      process.exit(1);
    }
  }

  const md = buildReportNotebookText(raw);
  const payload = raw?.data || raw?.payload || raw?.report || raw;
  const reportDate = getReportDate(payload);

  if (outPath) {
    fs.writeFileSync(outPath, md, 'utf8');
    console.error('Wrote:', outPath);
  } else if (jsonPath && reportDate) {
    const dir = path.dirname(path.resolve(jsonPath));
    const outFile = path.join(dir, `review_${reportDate}.md`);
    fs.writeFileSync(outFile, md, 'utf8');
    console.error('Wrote:', outFile);
    if (pdfName && payload) {
      const pdfFile = path.join(dir, pdfStyleBasename(payload, reportDate));
      fs.writeFileSync(pdfFile, md, 'utf8');
      console.error('Wrote:', pdfFile);
    }
  } else {
    process.stdout.write(md);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
