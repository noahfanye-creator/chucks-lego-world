/**
 * Node 端复用的 AI 摘要生成逻辑，与 ReportDetail.tsx 中 buildAiText 输出一致。
 * 供 ai-summary-server.cjs 使用，返回 Content-Type: text/plain。
 */

const TABS = [
  { key: 'daily', label: '日线', field: 'kline' },
  { key: 'weekly', label: '周线', field: 'kline_week' },
  { key: 'monthly', label: '月线', field: 'kline_month' },
  { key: 'm30', label: '30分钟', field: 'kline_30m' },
  { key: 'm5', label: '5分钟', field: 'kline_5m' },
  { key: 'm1', label: '1分钟', field: 'kline_1m' },
];
const TABS_NOTEBOOK = TABS.filter((t) => t.key !== 'm1');

function toNum(v) {
  const n = typeof v === 'number' ? v : typeof v === 'string' ? Number(v) : NaN;
  return Number.isFinite(n) ? n : undefined;
}

function fmt(v, d = 2) {
  const n = toNum(v);
  return n == null ? '-' : n.toFixed(d);
}

function pickDateKey(sample) {
  if (sample && typeof sample === 'object') {
    const s = sample;
    if (typeof s.time === 'string' && s.time) return 'time';
    if (typeof s.trade_date === 'string' && s.trade_date) return 'trade_date';
    if (typeof s.date === 'string' && s.date) return 'date';
  }
  return 'time';
}

function normalizeKline(raw) {
  if (!Array.isArray(raw)) return [];
  const dk = pickDateKey(raw[0]);
  const result = raw.flatMap((d) => {
    if (!d || typeof d !== 'object') return [];
    const r = d;
    const date = String(r[dk] ?? r.time ?? r.date ?? r.trade_date ?? '');
    const open = toNum(r.open);
    const high = toNum(r.high);
    const low = toNum(r.low);
    const close = toNum(r.close);
    const volume = toNum(r.volume);
    if (!date || open == null || high == null || low == null || close == null || volume == null) return [];
    return [{ date, open, high, low, close, volume }];
  });
  return result.sort((a, b) => {
    const ta = new Date(a.date).getTime();
    const tb = new Date(b.date).getTime();
    if (!isNaN(ta) && !isNaN(tb)) return ta - tb;
    return a.date.localeCompare(b.date);
  });
}

function extractPayload(json) {
  const r = json || {};
  if (r.data && typeof r.data === 'object') return r.data;
  if (r.payload && typeof r.payload === 'object') return r.payload;
  if (r.report && typeof r.report === 'object') return r.report;
  return r;
}

function calcMA(closes, len) {
  return closes.map((_, i) => {
    if (i < len - 1) return null;
    let s = 0;
    for (let j = 0; j < len; j++) s += closes[i - j];
    return s / len;
  });
}

function calcEMA(vals, span) {
  const a = 2 / (span + 1);
  let prev = vals[0] ?? 0;
  return vals.map((v, i) => {
    const x = i === 0 ? v : a * v + (1 - a) * prev;
    prev = x;
    return x;
  });
}

function calcBOLL(closes, len = 20, k = 2) {
  const mid = calcMA(closes, len);
  const upper = closes.map((_, i) => {
    const m = mid[i];
    if (m == null) return null;
    let v = 0;
    for (let j = 0; j < len; j++) {
      const d = closes[i - j] - m;
      v += d * d;
    }
    return m + k * Math.sqrt(v / len);
  });
  const lower = closes.map((_, i) => {
    const m = mid[i];
    if (m == null) return null;
    let v = 0;
    for (let j = 0; j < len; j++) {
      const d = closes[i - j] - m;
      v += d * d;
    }
    return m - k * Math.sqrt(v / len);
  });
  return { upper, mid, lower };
}

function calcMACD(closes) {
  const e12 = calcEMA(closes, 12);
  const e26 = calcEMA(closes, 26);
  const dif = closes.map((_, i) => e12[i] - e26[i]);
  const dea = calcEMA(dif, 9);
  const macd = dif.map((d, i) => (d - dea[i]) * 2);
  return { dif, dea, macd };
}

function calcRSI(closes, period = 14) {
  const out = Array(closes.length).fill(null);
  if (closes.length < period + 1) return out;
  let gain = 0, loss = 0;
  for (let i = 1; i <= period; i++) {
    const c = closes[i] - closes[i - 1];
    if (c >= 0) gain += c;
    else loss -= c;
  }
  gain /= period;
  loss /= period;
  out[period] = loss === 0 ? 100 : 100 - 100 / (1 + gain / loss);
  for (let i = period + 1; i < closes.length; i++) {
    const c = closes[i] - closes[i - 1];
    gain = (gain * (period - 1) + (c > 0 ? c : 0)) / period;
    loss = (loss * (period - 1) + (c < 0 ? -c : 0)) / period;
    out[i] = loss === 0 ? 100 : 100 - 100 / (1 + gain / loss);
  }
  return out;
}

function nv(v) {
  return v != null ? v : undefined;
}

function buildAiText(kline, label, ind) {
  if (!kline.length) return `▌ ${label} | 暂无数据\n`;
  const closes = kline.map((d) => d.close);
  const n = kline.length - 1;

  const ma5arr = calcMA(closes, 5);
  const ma10arr = calcMA(closes, 10);
  const ma20arr = calcMA(closes, 20);
  const ma60arr = calcMA(closes, 60);
  const bollArr = calcBOLL(closes);
  const macdArr = calcMACD(closes);
  const rsi14arr = calcRSI(closes, 14);

  const ma5v = toNum(ind?.MA5) ?? nv(ma5arr[n]);
  const ma10v = toNum(ind?.MA10) ?? nv(ma10arr[n]);
  const ma20v = toNum(ind?.MA20) ?? nv(ma20arr[n]);
  const ma60v = toNum(ind?.MA60) ?? nv(ma60arr[n]);
  const difv = toNum(ind?.MACD_DIF) ?? macdArr.dif[n];
  const deav = toNum(ind?.MACD_DEA) ?? macdArr.dea[n];
  const macdv = toNum(ind?.MACD) ?? macdArr.macd[n];
  const rsi14v = toNum(ind?.RSI14) ?? nv(rsi14arr[n]);
  const bbU = toNum(ind?.BB_Upper) ?? nv(bollArr.upper[n]);
  const bbM = toNum(ind?.BB_Middle) ?? nv(bollArr.mid[n]);
  const bbL = toNum(ind?.BB_Lower) ?? nv(bollArr.lower[n]);
  const kdjK = toNum(ind?.KDJ_K);
  const kdjD = toNum(ind?.KDJ_D);
  const kdjJ = toNum(ind?.KDJ_J);

  const last = kline[n];

  const recent20 = kline.slice(-20);
  const offset = kline.length - recent20.length;
  let klineLines = '  日期          开盘    最高    最低    收盘    涨跌幅    成交量\n';
  for (let i = recent20.length - 1; i >= 0; i--) {
    const d = recent20[i];
    const origIdx = offset + i;
    const prevClose = origIdx > 0 ? kline[origIdx - 1].close : undefined;
    const pct = prevClose != null && prevClose !== 0
      ? ((d.close - prevClose) / prevClose * 100).toFixed(2) + '%' : '-';
    klineLines += `  ${d.date}  ${d.open.toFixed(2)}  ${d.high.toFixed(2)}  ${d.low.toFixed(2)}  ${d.close.toFixed(2)}  ${pct.padStart(7)}  ${d.volume}\n`;
  }

  const indLine1 = `MA5=${fmt(ma5v)} MA10=${fmt(ma10v)} MA20=${fmt(ma20v)} MA60=${fmt(ma60v)}`;
  const indLine2 = `RSI14=${fmt(rsi14v)} | DIF=${fmt(difv, 3)} DEA=${fmt(deav, 3)} MACD柱=${fmt(macdv, 3)}`;
  const indLine3 = ind
    ? `KDJ K=${fmt(kdjK)} D=${fmt(kdjD)} J=${fmt(kdjJ)}`
    : `KDJ K=${fmt(nv(undefined))} D=- J=-（需日线indicators数据）`;
  const indLine4 = `布林带 上轨=${fmt(bbU)} 中轨=${fmt(bbM)} 下轨=${fmt(bbL)}`;

  let maDesc = '-';
  if (ma5v != null && ma20v != null && ma60v != null) {
    const posMA5 = last.close >= ma5v ? '在MA5上方' : '在MA5下方';
    const arr = ma5v > ma20v && ma20v > ma60v ? '多头排列(MA5>MA20>MA60)'
      : ma5v < ma20v && ma20v < ma60v ? '空头排列(MA5<MA20<MA60)'
      : '均线交叉整理中';
    maDesc = `价格${posMA5}，${arr}，MA20=${fmt(ma20v)}`;
  }

  let bollDesc = '-';
  if (bbU != null && bbM != null && bbL != null) {
    const pos = last.close > bbU ? '突破上轨（超买风险）'
      : last.close < bbL ? '跌破下轨（超卖风险）'
      : last.close > bbM ? '中轨上方（偏强）'
      : '中轨下方（偏弱）';
    const bw = bbU - bbL;
    const bwPct = bbM > 0 ? (bw / bbM * 100).toFixed(2) + '%' : '-';
    bollDesc = `价格${pos}，带宽${bwPct}`;
  }

  let macdDesc = '-';
  if (difv != null && deav != null) {
    const signal = difv > deav ? '金叉状态' : '死叉状态';
    const hist = macdv != null ? (macdv >= 0 ? '柱子为正(多方)' : '柱子为负(空方)') : '';
    macdDesc = `${signal}，DIF=${fmt(difv, 3)} DEA=${fmt(deav, 3)}${hist ? '，' + hist : ''}`;
  }

  let rsiDesc = '-';
  if (rsi14v != null) {
    const zone = rsi14v > 70 ? '超买区间(>70)' : rsi14v < 30 ? '超卖区间(<30)' : '正常区间';
    rsiDesc = `RSI14=${fmt(rsi14v)}，${zone}`;
  }

  let volDesc = '-';
  if (kline.length >= 3) {
    const v1 = kline[n].volume, v2 = kline[n - 1].volume, v3 = kline[n - 2].volume;
    const trend = v1 > v2 && v2 > v3 ? '连续放量'
      : v1 < v2 && v2 < v3 ? '连续缩量'
      : v1 > v2 * 1.3 ? '最新K线放量'
      : v1 < v2 * 0.7 ? '最新K线缩量'
      : '成交量基本持平';
    volDesc = `${v3}→${v2}→${v1}，${trend}`;
  }

  return [
    `▌ ${label} | 共${kline.length}根K线 | 最新日期${last.date} | 收盘${fmt(last.close)} 开${fmt(last.open)} 高${fmt(last.high)} 低${fmt(last.low)} 量${last.volume}`,
    '',
    '  ① 近20根K线数据（时间倒序，最新在上）：',
    klineLines.trimEnd(),
    '',
    '  ② 技术指标当前值：',
    `     ${indLine1}`,
    `     ${indLine2}`,
    `     ${indLine3}`,
    `     ${indLine4}`,
    '',
    '  ③ 趋势结构描述：',
    `     均线排列：${maDesc}`,
    `     布林带  ：${bollDesc}`,
    `     MACD    ：${macdDesc}`,
    `     RSI     ：${rsiDesc}`,
    `     量价关系：${volDesc}`,
  ].join('\n');
}

function buildSummary(kline, label) {
  if (!kline.length) return `【${label}摘要】暂无数据。`;
  const last = kline[kline.length - 1];
  const prev = kline.length >= 2 ? kline[kline.length - 2] : null;
  const closes = kline.map((d) => d.close);
  const ma5 = calcMA(closes, 5);
  const ma10 = calcMA(closes, 10);
  const ma20 = calcMA(closes, 20);
  const ma60 = calcMA(closes, 60);
  const boll = calcBOLL(closes);
  const macdRes = calcMACD(closes);
  const rsi14 = calcRSI(closes, 14);
  const n = kline.length - 1;
  const chgPct = prev ? (last.close - prev.close) / prev.close * 100 : undefined;
  const avgVol = closes.length >= 5 ? kline.slice(-5).reduce((s, d) => s + d.volume, 0) / 5 : last.volume;
  const volDesc = last.volume > avgVol * 1.3 ? '明显放量' : last.volume < avgVol * 0.7 ? '明显缩量' : '与均量持平';
  const rsiVal = rsi14[n];
  const rsiDesc = rsiVal == null ? '数据不足' : rsiVal > 70 ? '超买区间' : rsiVal < 30 ? '超卖区间' : '正常区间';
  const difVal = macdRes.dif[n];
  const deaVal = macdRes.dea[n];
  const macdSignal = difVal > deaVal ? 'MACD金叉' : 'MACD死叉';
  const bUpper = boll.upper[n];
  const bMid = boll.mid[n];
  const bLower = boll.lower[n];
  const bollDesc = bUpper != null && bMid != null && bLower != null
    ? (last.close > bUpper ? '布林上轨上方（超买）' : last.close < bLower ? '布林下轨下方（超卖）' : last.close > bMid ? '布林中轨上方' : '布林中轨下方')
    : '布林数据不足';
  return `【${label}摘要】当前收盘价${fmt(last.close)}，较前日${chgPct == null ? '-' : chgPct.toFixed(2)}%。` +
    `MA5=${fmt(ma5[n])}，MA10=${fmt(ma10[n])}，MA20=${fmt(ma20[n])}，MA60=${fmt(ma60[n])}。` +
    `布林带上轨${fmt(bUpper)}，中轨${fmt(bMid)}，下轨${fmt(bLower)}，价格位于${bollDesc}。` +
    `MACD：DIF=${fmt(difVal, 3)}，DEA=${fmt(deaVal, 3)}，${macdSignal}信号。` +
    `RSI(14)=${fmt(rsiVal)}，${rsiDesc}。` +
    `成交量${(last.volume / 10000).toFixed(2)}万手，${volDesc}。`;
}

/** 生成完整 Notebook 用 Markdown（与 ReportDetail.buildReportNotebookText 一致） */
function buildReportNotebookText(raw) {
  const payload = extractPayload(raw);
  const klineMap = {
    daily: normalizeKline(payload.kline),
    weekly: normalizeKline(payload.kline_week),
    monthly: normalizeKline(payload.kline_month),
    m30: normalizeKline(payload.kline_30m),
    m5: normalizeKline(payload.kline_5m),
    m1: normalizeKline(payload.kline_1m),
  };
  const ind = payload.indicators;
  const meta = payload.meta || {};
  const plan = meta.strategic_plan;
  const chan = meta.chan;
  const lines = [];

  lines.push(`# ${payload.stock_name ?? '-'}（${payload.stock_code ?? '-'}）`);
  lines.push(`报告日期：${payload.report_date ?? '-'}  生成时间：${payload.generated_at ?? '-'}`);
  lines.push('');

  const kline = klineMap.daily;
  const latest = kline[kline.length - 1];
  const prev = kline[kline.length - 2];
  const headerClose = toNum(meta.actual_close) ?? latest?.close;
  const headerPrev = toNum(meta.actual_prev_close) ?? prev?.close;
  const headerChgPct = toNum(meta.actual_change_pct) ??
    (headerClose != null && headerPrev != null && headerPrev !== 0 ? (headerClose - headerPrev) / headerPrev * 100 : undefined);
  lines.push('## 当日概览');
  lines.push(`收盘价 ${fmt(headerClose)}，涨跌 ${headerChgPct != null ? (headerChgPct >= 0 ? '+' : '') + headerChgPct.toFixed(2) + '%' : '-'}。`);
  if (latest) {
    lines.push(`开盘 ${fmt(latest.open)} 最高 ${fmt(latest.high)} 最低 ${fmt(latest.low)} 成交量 ${(latest.volume / 10000).toFixed(2)} 万手。`);
  }
  lines.push('');

  const moneyFlow = Array.isArray(payload.money_flow) ? payload.money_flow : [];
  const chip = meta.chip;
  if (moneyFlow.length > 0 || meta.margin || chip || meta.northbound || meta.sentiment) {
    lines.push('## 资金与筹码');
    if (moneyFlow.length > 0) {
      lines.push('### 主力资金流向（近10日）');
      lines.push('| 日期 | 主力流入 | 主力流出 | 主力净额 | 散户净额 |');
      lines.push('|------|----------|----------|----------|----------|');
      let mfMain = 0, mfRetail = 0;
      moneyFlow.forEach((row) => {
        const d = row.date ?? row.trade_date ?? '-';
        const mainIn = toNum(row.main_in);
        const mainOut = toNum(row.main_out);
        const mainNet = toNum(row.main_net);
        const retailNet = mainNet != null ? -mainNet : undefined;
        if (mainNet != null) mfMain += mainNet;
        if (retailNet != null) mfRetail += retailNet;
        lines.push(`| ${d} | ${fmt(mainIn)} | ${fmt(mainOut)} | ${fmt(mainNet)} | ${fmt(retailNet)} |`);
      });
      lines.push(`| 累计 | - | - | ${mfMain.toFixed(2)} | ${mfRetail.toFixed(2)} |`);
      lines.push('单位：万元');
      lines.push('');
    }
    if (meta.margin) {
      lines.push('### 融资融券');
      lines.push(`融资余额 ${fmt(meta.margin.balance)}  融资买入 ${fmt(meta.margin.buy)}  融资偿还 ${fmt(meta.margin.repay)}  融券余额 ${fmt(meta.margin.short_balance)}`);
      lines.push('');
    }
    if (chip) {
      lines.push('### 筹码分布');
      lines.push(`获利比例 ${chip.profit_ratio != null ? (chip.profit_ratio * 100).toFixed(2) + '%' : '-'}  平均成本 ${fmt(chip.avg_cost)}  集中度 ${chip.concentration != null ? (chip.concentration * 100).toFixed(2) + '%' : '-'}`);
      lines.push('');
    }
    if (meta.northbound) {
      lines.push('### 北向资金');
      lines.push(`持仓数量 ${meta.northbound.shares ?? '-'}  持仓比例 ${meta.northbound.ratio != null ? fmt(meta.northbound.ratio) + '%' : '-'}  增减 ${meta.northbound.change ?? '-'}`);
      lines.push('');
    }
    if (meta.sentiment) {
      lines.push('### 市场情绪');
      lines.push(`得分 ${Number(meta.sentiment.score).toFixed(2)}  ${meta.sentiment.verdict}  ${meta.sentiment.hint ?? ''}`);
      lines.push('');
    }
    lines.push('---');
    lines.push('');
  }

  const last100 = kline.slice(-100).reverse();
  if (last100.length > 0) {
    lines.push('## 近100日行情数据');
    lines.push('| 交易日 | 开盘 | 最高 | 最低 | 收盘 | 涨跌幅 | 成交量(手) | 成交额(亿) |');
    lines.push('|--------|------|------|------|------|--------|------------|------------|');
    last100.forEach((d, i) => {
      const origIdx = kline.length - 1 - i;
      const prevClose = origIdx > 0 ? kline[origIdx - 1]?.close : undefined;
      const pct = prevClose != null && prevClose !== 0 ? (d.close - prevClose) / prevClose * 100 : undefined;
      const turnover = (d.close * d.volume) / 100000000;
      const pctStr = pct == null ? '-' : (pct >= 0 ? '+' : '') + pct.toFixed(2) + '%';
      lines.push(`| ${d.date} | ${d.open.toFixed(2)} | ${d.high.toFixed(2)} | ${d.low.toFixed(2)} | ${d.close.toFixed(2)} | ${pctStr} | ${d.volume.toLocaleString()} | ${turnover.toFixed(2)} |`);
    });
    lines.push('');
    lines.push('---');
    lines.push('');
  }

  if (ind) {
    lines.push('## 日线技术指标');
    const indEntries = [
      ['MA5', ind.MA5], ['MA10', ind.MA10], ['MA20', ind.MA20], ['MA30', ind.MA30], ['MA60', ind.MA60], ['MA120', ind.MA120], ['MA250', ind.MA250],
      ['EMA12', ind.EMA12], ['EMA26', ind.EMA26],
      ['RSI6', ind.RSI6], ['RSI12', ind.RSI12], ['RSI14', ind.RSI14], ['RSI24', ind.RSI24],
      ['MACD', ind.MACD], ['MACD_DIF', ind.MACD_DIF], ['MACD_DEA', ind.MACD_DEA],
      ['KDJ_K', ind.KDJ_K], ['KDJ_D', ind.KDJ_D], ['KDJ_J', ind.KDJ_J],
      ['BB_Upper', ind.BB_Upper], ['BB_Middle', ind.BB_Middle], ['BB_Lower', ind.BB_Lower],
      ['ATR14', ind.ATR14], ['CCI20', ind.CCI20],
    ].filter(([, v]) => v != null);
    indEntries.forEach(([label, val]) => lines.push(`${label}: ${fmt(val, (label === 'MACD' || label === 'MACD_DIF' || label === 'MACD_DEA') ? 3 : 2)}`));
    lines.push('');
    lines.push('---');
    lines.push('');
  }

  for (const tab of TABS_NOTEBOOK) {
    const data = klineMap[tab.key] || [];
    const indForTab = tab.key === 'daily' ? ind : undefined;
    lines.push(`## ${tab.label}`);
    lines.push(buildSummary(data, tab.label));
    lines.push('');
    lines.push(buildAiText(data, tab.label, indForTab));
    const recentK = data.slice(-100);
    if (recentK.length > 0) {
      lines.push('');
      lines.push(`### ${tab.label} 最近${recentK.length}根K线`);
      lines.push('| 日期 | 开 | 高 | 低 | 收 | 量(手) |');
      lines.push('|------|-----|-----|-----|-----|--------|');
      recentK.reverse().forEach((d) => {
        lines.push(`| ${d.date} | ${d.open.toFixed(2)} | ${d.high.toFixed(2)} | ${d.low.toFixed(2)} | ${d.close.toFixed(2)} | ${d.volume.toLocaleString()} |`);
      });
    }
    lines.push('');
    lines.push('---');
    lines.push('');
  }

  if (chan) {
    lines.push('## 缠论结构');
    const fractalList = chan.fractals ?? chan.fenxing ?? [];
    let bis = chan.bis ?? chan.bi ?? [];
    const hasValidBis = bis.some((b) => {
      const sd = b.start_date ?? b.start_trade_date ?? '';
      const ed = b.end_date ?? b.end_trade_date ?? '';
      return (sd && sd !== '-') || (ed && ed !== '-');
    });
    if (!hasValidBis && fractalList.length >= 2) {
      bis = fractalList.slice(0, -1).map((fx, i) => {
        const next = fractalList[i + 1];
        const startTs = fx.timestamp ?? fx.date ?? fx.trade_date ?? '';
        const endTs = next.timestamp ?? next.date ?? next.trade_date ?? '';
        const startDate = startTs.length >= 10 ? startTs.slice(0, 10) : startTs || '-';
        const endDate = endTs.length >= 10 ? endTs.slice(0, 10) : endTs || '-';
        const startType = fx.fractal_type ?? fx.type ?? '';
        const direction = startType === 'bottom' ? 'up' : 'down';
        const pStart = toNum(fx.price);
        const pEnd = toNum(next.price);
        const changePct = pStart != null && pEnd != null && pStart !== 0 ? (pEnd - pStart) / pStart * 100 : undefined;
        return { direction, start_date: startDate, end_date: endDate, change_pct: changePct };
      });
    }
    lines.push(`共 ${fractalList.length} 个分型，${bis.length} 笔。`);
    if (chan.zhongshu) {
      lines.push(`中枢区间：${fmt(chan.zhongshu.low)} ~ ${fmt(chan.zhongshu.high)}`);
    }
    lines.push('');
    if (fractalList.length > 0) {
      lines.push('### 分型列表');
      fractalList.forEach((fx) => {
        const rawTs = fx.timestamp ?? fx.date ?? fx.trade_date ?? '-';
        const d = rawTs.length >= 10 ? rawTs.slice(0, 10) : rawTs;
        const ft = fx.fractal_type ?? fx.type ?? '-';
        const t = ft === 'top' ? '顶分型' : ft === 'bottom' ? '底分型' : ft;
        lines.push(`- ${t}  ${d}  价格 ${fmt(fx.price)}`);
      });
      lines.push('');
    }
    if (bis.length > 0) {
      lines.push('### 笔列表');
      bis.forEach((b) => {
        const dir = b.direction === 'up' ? '向上笔' : b.direction === 'down' ? '向下笔' : String(b.direction ?? '-');
        const sd = b.start_date ?? b.start_trade_date ?? '-';
        const ed = b.end_date ?? b.end_trade_date ?? '-';
        const cp = b.change_pct != null ? (b.change_pct >= 0 ? '+' : '') + b.change_pct.toFixed(2) + '%' : '-';
        lines.push(`- ${dir}  ${sd} → ${ed}  涨跌幅 ${cp}`);
      });
    }
    lines.push('');
    lines.push('---');
    lines.push('');
  }

  if (plan) {
    lines.push('## 操作策略建议');
    const biasMap = { Bullish: '看多', Bearish: '看空', Neutral: '中性' };
    const trendBias = plan.scenarios?.trend_bias ? (biasMap[plan.scenarios.trend_bias] ?? plan.scenarios.trend_bias) : null;
    if (trendBias) lines.push(`趋势判断：${trendBias}`);
    if (plan.scenarios?.action_plan) lines.push(`操作建议：${plan.scenarios.action_plan}`);
    if (plan.grid) {
      const g = plan.grid;
      if (g.attack_line_ma5 != null && g.attack_line_ma5 !== '') lines.push(`攻击线(MA5)：${g.attack_line_ma5}`);
      if (g.defense_line_ma20 != null && g.defense_line_ma20 !== '') lines.push(`防守线(MA20)：${g.defense_line_ma20}`);
      if (g.support != null && g.support !== '') lines.push(`支撑位：${g.support}`);
      if (g.resistance != null && g.resistance !== '') lines.push(`阻力位：${g.resistance}`);
    }
    if (plan.sector_context?.related_index || plan.sector_context?.note) {
      lines.push(`板块参考：${plan.sector_context.related_index ?? ''} ${plan.sector_context.note ?? ''}`.trim());
    }
    lines.push('');
    lines.push('---');
    lines.push('');
  }

  lines.push(`数据来源：chuckfan.com  报告日期：${payload.report_date ?? '-'}。`);
  lines.push('本报告仅供参考，不构成任何投资建议。投资有风险，决策须谨慎。');
  return lines.join('\n');
}

function buildReportAiSummaryText(raw) {
  const payload = extractPayload(raw);
  const klineMap = {
    daily: normalizeKline(payload.kline),
    weekly: normalizeKline(payload.kline_week),
    monthly: normalizeKline(payload.kline_month),
    m30: normalizeKline(payload.kline_30m),
    m5: normalizeKline(payload.kline_5m),
    m1: normalizeKline(payload.kline_1m),
  };
  const ind = payload.indicators;
  return TABS.map((tab) => {
    const data = klineMap[tab.key] || [];
    const indForTab = tab.key === 'daily' ? ind : undefined;
    return buildAiText(data, tab.label, indForTab);
  }).join('\n\n---\n\n');
}

module.exports = { buildReportAiSummaryText, buildReportNotebookText };
