#!/usr/bin/env node

/**
 * 新建文章脚本
 * 用法: node scripts/new-post.js <标题> <日期> <类型>
 * 例: node scripts/new-post.js "盘中总结" 2026-03-09 intraday
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const [,, title, date, type] = process.argv;

if (!title || !date || !type) {
  console.log('用法: node scripts/new-post.js <标题> <日期> <类型>');
  console.log('类型: premarket, intraday, postmarket, weekly');
  console.log('例: node scripts/new-post.js "盘中总结" 2026-03-09 intraday');
  process.exit(1);
}

const slug = `${date}-${type}`;
const filePath = path.join(__dirname, `../src/content/posts/${slug}.md`);

const template = `---
title: ${title}
date: ${date}
time: ${type === 'premarket' ? '07:30' : type === 'postmarket' ? '15:30' : '11:35'}
type: ${type}
tags: [${type === 'premarket' ? '盘前' : type === 'postmarket' ? '盘后' : '盘中'}, 市场观察]
summary: 一句话摘要
draft: true
---

# ${title}

## 一句话结论
> 

---

## 今日盘面

### 指数表现

### 板块表现

---

## 盘面解读

---

## 明日观察

`;

fs.writeFileSync(filePath, template);
console.log(`✅ 已创建: ${filePath}`);
