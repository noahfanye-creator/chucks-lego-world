import { useEffect, useMemo, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import ReactECharts from 'echarts-for-react';
import type { EChartsOption } from 'echarts';
import { ArrowLeft } from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

type KP = { date: string; open: number; high: number; low: number; close: number; volume: number };

type RawIndicators = {
  MA5?: number; MA10?: number; MA20?: number; MA30?: number; MA60?: number;
  MA120?: number; MA250?: number; EMA12?: number; EMA26?: number;
  RSI6?: number; RSI12?: number; RSI14?: number; RSI24?: number;
  MACD?: number; MACD_DIF?: number; MACD_DEA?: number;
  KDJ_K?: number; KDJ_D?: number; KDJ_J?: number;
  BB_Upper?: number; BB_Middle?: number; BB_Lower?: number;
  ATR14?: number; CCI20?: number;
  [k: string]: number | undefined;
};

type Fractal = {
  fractal_type?: string; type?: string;            // "top" / "bottom"
  timestamp?: string; date?: string; trade_date?: string;
  price?: number; position?: number; is_valid?: boolean;
};

type Chan = {
  fractals?: Fractal[];
  fenxing?: Fractal[];
  bis?: Array<{ direction?: string; start_date?: string; end_date?: string; change_pct?: number }>;
  bi?: Array<{ direction?: string; start_date?: string; start_trade_date?: string; end_date?: string; end_trade_date?: string; change_pct?: number }>;
  zhongshu?: { low?: number; high?: number };
};

type Meta = {
  actual_close?: number;
  actual_prev_close?: number;
  actual_change_pct?: number;
  sentiment?: { score: number; verdict: string; hint: string };
  chip?: { profit_ratio?: number; avg_cost?: number; concentration?: number };
  strategic_plan?: {
    grid?: {
      attack_line_ma5?: number | string;
      defense_line_ma20?: number | string;
      pivot_point?: number | string;
      resistance?: number | string;
      support?: number | string;
    };
    scenarios?: { trend_bias?: string; action_plan?: string };
    sector_context?: { related_index?: string; note?: string };
  };
  chan?: Chan;
  margin?: { balance?: number; buy?: number; repay?: number; short_balance?: number };
  northbound?: { shares?: number; ratio?: number; change?: number };
  fibonacci?: { high?: number; low?: number };
  [k: string]: unknown;
};

type MoneyFlowRow = {
  date?: string; trade_date?: string;
  main_in?: number; main_out?: number; main_net?: number; retail_net?: number;
};

type Payload = {
  stock_code?: string; stock_name?: string;
  report_date?: string; generated_at?: string;
  kline?: unknown[];
  kline_week?: unknown[]; kline_month?: unknown[];
  kline_30m?: unknown[]; kline_5m?: unknown[]; kline_1m?: unknown[];
  indicators?: RawIndicators;
  meta?: Meta;
  money_flow?: MoneyFlowRow[];
};

// ─── Constants ────────────────────────────────────────────────────────────────

const RED = '#ef4444';
const GREEN = '#22c55e';
const MA_COLORS = { ma5: '#facc15', ma10: '#3b82f6', ma20: '#a855f7', ma60: '#f97316' };
const TABS = [
  { key: 'daily',   label: '日线',    field: 'kline' },
  { key: 'weekly',  label: '周线',    field: 'kline_week' },
  { key: 'monthly', label: '月线',    field: 'kline_month' },
  { key: 'm30',     label: '30分钟',  field: 'kline_30m' },
  { key: 'm5',      label: '5分钟',   field: 'kline_5m' },
  { key: 'm1',      label: '1分钟',   field: 'kline_1m' },
] as const;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toNum(v: unknown): number | undefined {
  const n = typeof v === 'number' ? v : typeof v === 'string' ? Number(v) : NaN;
  return Number.isFinite(n) ? n : undefined;
}

function fmt(v: unknown, d = 2): string {
  const n = toNum(v);
  return n == null ? '-' : n.toFixed(d);
}

function fmtPct(v: unknown, d = 2): string {
  const n = toNum(v);
  return n == null ? '-' : `${n.toFixed(d)}%`;
}

function fmtWan(v: unknown): string {
  const n = toNum(v);
  return n == null ? '-' : (n / 10000).toFixed(2);
}

function fmtYi(v: unknown): string {
  const n = toNum(v);
  return n == null ? '-' : (n / 100000000).toFixed(2);
}

function clr(v: number | undefined, prefix = '') {
  if (v == null) return 'text-slate-900';
  return prefix + (v >= 0 ? 'text-[#ef4444]' : 'text-[#22c55e]');
}

function pickDateKey(sample: unknown): string {
  if (sample && typeof sample === 'object') {
    const s = sample as Record<string, unknown>;
    if (typeof s.time === 'string' && s.time) return 'time';
    if (typeof s.trade_date === 'string' && s.trade_date) return 'trade_date';
    if (typeof s.date === 'string' && s.date) return 'date';
  }
  return 'time';
}

function normalizeKline(raw: unknown): KP[] {
  if (!Array.isArray(raw)) return [];
  const dk = pickDateKey(raw[0]);
  const result = raw.flatMap((d: unknown) => {
    if (!d || typeof d !== 'object') return [];
    const r = d as Record<string, unknown>;
    const date = String(r[dk] ?? r.time ?? r.date ?? r.trade_date ?? '');
    const open = toNum(r.open); const high = toNum(r.high);
    const low = toNum(r.low);   const close = toNum(r.close);
    const volume = toNum(r.volume);
    if (!date || open == null || high == null || low == null || close == null || volume == null) return [];
    return [{ date, open, high, low, close, volume }];
  });
  // 保证升序（最新数据在最后），兼容日期字符串和时间戳字符串
  return result.sort((a, b) => {
    const ta = new Date(a.date).getTime();
    const tb = new Date(b.date).getTime();
    if (!isNaN(ta) && !isNaN(tb)) return ta - tb;
    return a.date.localeCompare(b.date);
  });
}

function extractPayload(json: unknown): Payload {
  const r = json as Record<string, unknown>;
  if (r?.data && typeof r.data === 'object') return r.data as Payload;
  if (r?.payload && typeof r.payload === 'object') return r.payload as Payload;
  if (r?.report && typeof r.report === 'object') return r.report as Payload;
  return r as Payload;
}

// ─── Indicator Calculations ───────────────────────────────────────────────────

function calcMA(closes: number[], len: number): (number | null)[] {
  return closes.map((_, i) => {
    if (i < len - 1) return null;
    let s = 0; for (let j = 0; j < len; j++) s += closes[i - j];
    return s / len;
  });
}

function calcEMA(vals: number[], span: number): number[] {
  const a = 2 / (span + 1);
  let prev = vals[0] ?? 0;
  return vals.map((v, i) => {
    const x = i === 0 ? v : a * v + (1 - a) * prev;
    prev = x; return x;
  });
}

function calcBOLL(closes: number[], len = 20, k = 2) {
  const mid = calcMA(closes, len);
  const upper = closes.map((_, i) => {
    const m = mid[i]; if (m == null) return null;
    let v = 0; for (let j = 0; j < len; j++) { const d = closes[i - j] - m; v += d * d; }
    return m + k * Math.sqrt(v / len);
  });
  const lower = closes.map((_, i) => {
    const m = mid[i]; if (m == null) return null;
    let v = 0; for (let j = 0; j < len; j++) { const d = closes[i - j] - m; v += d * d; }
    return m - k * Math.sqrt(v / len);
  });
  return { upper, mid, lower };
}

function calcMACD(closes: number[]) {
  const e12 = calcEMA(closes, 12), e26 = calcEMA(closes, 26);
  const dif = closes.map((_, i) => e12[i] - e26[i]);
  const dea = calcEMA(dif, 9);
  const macd = dif.map((d, i) => (d - dea[i]) * 2);
  return { dif, dea, macd };
}

function calcRSI(closes: number[], period = 14): (number | null)[] {
  const out: (number | null)[] = Array(closes.length).fill(null);
  if (closes.length < period + 1) return out;
  let gain = 0, loss = 0;
  for (let i = 1; i <= period; i++) {
    const c = closes[i] - closes[i - 1];
    if (c >= 0) gain += c; else loss -= c;
  }
  gain /= period; loss /= period;
  out[period] = loss === 0 ? 100 : 100 - 100 / (1 + gain / loss);
  for (let i = period + 1; i < closes.length; i++) {
    const c = closes[i] - closes[i - 1];
    gain = (gain * (period - 1) + (c > 0 ? c : 0)) / period;
    loss = (loss * (period - 1) + (c < 0 ? -c : 0)) / period;
    out[i] = loss === 0 ? 100 : 100 - 100 / (1 + gain / loss);
  }
  return out;
}

// ─── Chart Option Builder ─────────────────────────────────────────────────────

function buildChartOption(kline: KP[]): EChartsOption {
  const closes = kline.map(d => d.close);
  const dates = kline.map(d => d.date);
  const candles = kline.map(d => [d.open, d.close, d.low, d.high]);
  const ma5 = calcMA(closes, 5);
  const ma10 = calcMA(closes, 10);
  const ma20 = calcMA(closes, 20);
  const ma60 = calcMA(closes, 60);
  const boll = calcBOLL(closes);
  const macdRes = calcMACD(closes);
  const rsi14 = calcRSI(closes, 14);
  const volumes = kline.map((d, i) => [i, d.volume, i > 0 && d.close >= kline[i - 1].close ? 1 : -1]);
  const total = kline.length || 1;
  const start = Math.max(0, 100 - (60 / total) * 100);

  const tooltipFmt = (params: unknown) => {
    const arr = Array.isArray(params) ? params : [params as object];
    if (!arr.length) return '';
    const idx = (arr[0] as { dataIndex?: number }).dataIndex ?? 0;
    const k = kline[idx]; if (!k) return '';
    const chg = idx > 0 && kline[idx - 1]?.close
      ? ((k.close - kline[idx - 1].close) / kline[idx - 1].close * 100) : undefined;
    const row = (label: string, val: string) =>
      `<div style="display:flex;justify-content:space-between;gap:12px"><span style="color:#94a3b8">${label}</span><span style="color:#e5e7eb">${val}</span></div>`;
    return `<div style="min-width:220px;font-size:11px">
      <div style="font-weight:600;margin-bottom:6px;color:#f1f5f9">${k.date}</div>
      ${row('开盘', k.open.toFixed(2))}${row('收盘', k.close.toFixed(2))}
      ${row('最高', k.high.toFixed(2))}${row('最低', k.low.toFixed(2))}
      ${row('涨跌幅', chg == null ? '-' : `${chg.toFixed(2)}%`)}
      ${row('成交量(万手)', (k.volume / 10000).toFixed(2))}
      <div style="margin:5px 0;height:1px;background:rgba(148,163,184,0.2)"></div>
      ${row('MA5/10/20/60', [ma5[idx], ma10[idx], ma20[idx], ma60[idx]].map(v => v == null ? '-' : (v as number).toFixed(2)).join(' / '))}
      ${row('BOLL上/中/下', [boll.upper[idx], boll.mid[idx], boll.lower[idx]].map(v => v == null ? '-' : (v as number).toFixed(2)).join(' / '))}
      ${row('MACD DIF/DEA', `${macdRes.dif[idx]?.toFixed(3) ?? '-'} / ${macdRes.dea[idx]?.toFixed(3) ?? '-'}`)}
      ${row('RSI(14)', rsi14[idx] == null ? '-' : (rsi14[idx] as number).toFixed(2))}
    </div>`;
  };

  return {
    backgroundColor: '#ffffff',
    animation: false,
    tooltip: {
      trigger: 'axis', axisPointer: { type: 'cross' },
      backgroundColor: '#0f172a', borderWidth: 0,
      textStyle: { color: '#e5e7eb', fontSize: 11 },
      formatter: tooltipFmt,
      extraCssText: 'box-shadow:0 12px 40px rgba(15,23,42,.35);border-radius:10px;padding:10px',
    },
    axisPointer: { link: [{ xAxisIndex: 'all' }], label: { backgroundColor: '#64748b' } },
    legend: {
      top: 4, left: 60, itemWidth: 14, itemHeight: 2,
      textStyle: { fontSize: 10, color: '#64748b' },
      data: ['MA5', 'MA10', 'MA20', 'MA60', '布林带'],
    },
    grid: [
      { left: 52, right: 12, top: 28, height: 270 },
      { left: 52, right: 12, top: 308, height: 78 },
      { left: 52, right: 12, top: 396, height: 62 },
      { left: 52, right: 12, top: 468, height: 52 },
    ],
    xAxis: [0, 1, 2, 3].map(gi => ({
      type: 'category' as const, gridIndex: gi, data: dates,
      scale: true, boundaryGap: true,
      axisLabel: { show: gi === 3, color: '#64748b', fontSize: 10 },
      axisTick: { show: false },
      axisLine: { lineStyle: { color: '#e2e8f0' } },
    })),
    yAxis: [
      { scale: true, position: 'right', axisLabel: { color: '#64748b', fontSize: 10 }, splitLine: { lineStyle: { color: '#f1f5f9', type: 'dashed' } } },
      { gridIndex: 1, scale: true, position: 'right', axisLabel: { show: false }, splitLine: { show: false } },
      { gridIndex: 2, scale: true, position: 'right', axisLabel: { color: '#64748b', fontSize: 9 }, splitLine: { show: false } },
      { gridIndex: 3, scale: true, position: 'right', min: 0, max: 100, axisLabel: { color: '#64748b', fontSize: 9 }, splitLine: { lineStyle: { color: '#f1f5f9' } } },
    ],
    dataZoom: [
      { type: 'inside', xAxisIndex: [0, 1, 2, 3], start, end: 100 },
      { show: true, xAxisIndex: [0, 1, 2, 3], type: 'slider', bottom: 2, height: 16, borderColor: 'transparent', backgroundColor: '#f1f5f9', fillerColor: 'rgba(148,163,184,0.25)', handleStyle: { color: '#94a3b8' }, textStyle: { color: '#94a3b8', fontSize: 9 } },
    ],
    series: [
      { name: 'K线', type: 'candlestick', data: candles, itemStyle: { color: RED, color0: GREEN, borderColor: RED, borderColor0: GREEN } },
      { name: 'MA5', type: 'line', data: ma5, smooth: true, symbol: 'none', lineStyle: { width: 1, color: MA_COLORS.ma5 } },
      { name: 'MA10', type: 'line', data: ma10, smooth: true, symbol: 'none', lineStyle: { width: 1, color: MA_COLORS.ma10 } },
      { name: 'MA20', type: 'line', data: ma20, smooth: true, symbol: 'none', lineStyle: { width: 1, color: MA_COLORS.ma20 } },
      { name: 'MA60', type: 'line', data: ma60, smooth: true, symbol: 'none', lineStyle: { width: 1, color: MA_COLORS.ma60 } },
      { name: '布林带', type: 'line', data: boll.upper, smooth: true, symbol: 'none', lineStyle: { width: 1, color: '#94a3b8', type: 'dashed' } },
      { type: 'line', data: boll.mid, smooth: true, symbol: 'none', lineStyle: { width: 1, color: '#94a3b8', type: 'dashed' } },
      { type: 'line', data: boll.lower, smooth: true, symbol: 'none', lineStyle: { width: 1, color: '#94a3b8', type: 'dashed' } },
      { name: '成交量', type: 'bar', xAxisIndex: 1, yAxisIndex: 1, data: volumes, itemStyle: { color: (p: { data: number[] }) => p.data[2] >= 0 ? RED : GREEN } },
      { name: 'MACD', type: 'bar', xAxisIndex: 2, yAxisIndex: 2, data: macdRes.macd, itemStyle: { color: (p: { data: number }) => (p.data ?? 0) >= 0 ? RED : GREEN } },
      { name: 'DIF', type: 'line', xAxisIndex: 2, yAxisIndex: 2, data: macdRes.dif, smooth: true, symbol: 'none', lineStyle: { width: 1, color: MA_COLORS.ma5 } },
      { name: 'DEA', type: 'line', xAxisIndex: 2, yAxisIndex: 2, data: macdRes.dea, smooth: true, symbol: 'none', lineStyle: { width: 1, color: '#ffffff' } },
      {
        name: 'RSI14', type: 'line', xAxisIndex: 3, yAxisIndex: 3,
        data: rsi14, smooth: true, symbol: 'none',
        lineStyle: { width: 1.5, color: '#6366f1' },
        markLine: {
          silent: true, lineStyle: { type: 'dashed', width: 1 },
          data: [
            { yAxis: 70, lineStyle: { color: RED }, label: { formatter: '70', color: '#94a3b8', fontSize: 9 } },
            { yAxis: 30, lineStyle: { color: GREEN }, label: { formatter: '30', color: '#94a3b8', fontSize: 9 } },
          ],
        },
      },
    ],
  };
}

// ─── Chart Summary ────────────────────────────────────────────────────────────

function buildSummary(kline: KP[], label: string): string {
  if (!kline.length) return `【${label}摘要】暂无数据。`;
  const last = kline[kline.length - 1];
  const prev = kline.length >= 2 ? kline[kline.length - 2] : null;
  const closes = kline.map(d => d.close);
  const ma5 = calcMA(closes, 5);
  const ma10 = calcMA(closes, 10);
  const ma20 = calcMA(closes, 20);
  const ma60 = calcMA(closes, 60);
  const boll = calcBOLL(closes);
  const macdRes = calcMACD(closes);
  const rsi14 = calcRSI(closes, 14);
  const n = kline.length - 1;
  const chgPct = prev ? ((last.close - prev.close) / prev.close * 100) : undefined;
  const avgVol = closes.length >= 5 ? kline.slice(-5).reduce((s, d) => s + d.volume, 0) / 5 : last.volume;
  const volDesc = last.volume > avgVol * 1.3 ? '明显放量' : last.volume < avgVol * 0.7 ? '明显缩量' : '与均量持平';
  const rsiVal = rsi14[n] as number | null;
  const rsiDesc = rsiVal == null ? '数据不足' : rsiVal > 70 ? '超买区间' : rsiVal < 30 ? '超卖区间' : '正常区间';
  const difVal = macdRes.dif[n]; const deaVal = macdRes.dea[n];
  const macdSignal = difVal > deaVal ? 'MACD金叉' : 'MACD死叉';
  const bUpper = boll.upper[n]; const bMid = boll.mid[n]; const bLower = boll.lower[n];
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

// ─── AI Readable Text Builder ─────────────────────────────────────────────────

function nv(v: number | null | undefined): number | undefined {
  return v != null ? v : undefined;
}

function buildAiText(kline: KP[], label: string, ind?: RawIndicators): string {
  if (!kline.length) return `▌ ${label} | 暂无数据\n`;
  const closes = kline.map(d => d.close);
  const n = kline.length - 1;

  // Calculate indicators from kline data
  const ma5arr  = calcMA(closes, 5);
  const ma10arr = calcMA(closes, 10);
  const ma20arr = calcMA(closes, 20);
  const ma60arr = calcMA(closes, 60);
  const bollArr  = calcBOLL(closes);
  const macdArr  = calcMACD(closes);
  const rsi14arr = calcRSI(closes, 14);

  // Prefer server indicators (daily only), fall back to calculated
  const ma5v  = toNum(ind?.MA5)       ?? nv(ma5arr[n]);
  const ma10v = toNum(ind?.MA10)      ?? nv(ma10arr[n]);
  const ma20v = toNum(ind?.MA20)      ?? nv(ma20arr[n]);
  const ma60v = toNum(ind?.MA60)      ?? nv(ma60arr[n]);
  const difv  = toNum(ind?.MACD_DIF)  ?? macdArr.dif[n];
  const deav  = toNum(ind?.MACD_DEA)  ?? macdArr.dea[n];
  const macdv = toNum(ind?.MACD)      ?? macdArr.macd[n];
  const rsi14v = toNum(ind?.RSI14)    ?? nv(rsi14arr[n] as number | null);
  const bbU   = toNum(ind?.BB_Upper)  ?? nv(bollArr.upper[n]);
  const bbM   = toNum(ind?.BB_Middle) ?? nv(bollArr.mid[n]);
  const bbL   = toNum(ind?.BB_Lower)  ?? nv(bollArr.lower[n]);
  const kdjK  = toNum(ind?.KDJ_K);
  const kdjD  = toNum(ind?.KDJ_D);
  const kdjJ  = toNum(ind?.KDJ_J);

  const last = kline[n];

  // ① Recent 20 klines (newest first)
  const recent20 = kline.slice(-20);
  const offset   = kline.length - recent20.length; // index offset in original kline
  let klineLines = '  日期          开盘    最高    最低    收盘    涨跌幅    成交量\n';
  for (let i = recent20.length - 1; i >= 0; i--) {
    const d = recent20[i];
    const origIdx = offset + i;
    const prevClose = origIdx > 0 ? kline[origIdx - 1].close : undefined;
    const pct = prevClose != null && prevClose !== 0
      ? ((d.close - prevClose) / prevClose * 100).toFixed(2) + '%' : '-';
    klineLines += `  ${d.date}  ${d.open.toFixed(2)}  ${d.high.toFixed(2)}  ${d.low.toFixed(2)}  ${d.close.toFixed(2)}  ${pct.padStart(7)}  ${d.volume}\n`;
  }

  // ② Indicator values
  const indLine1 = `MA5=${fmt(ma5v)} MA10=${fmt(ma10v)} MA20=${fmt(ma20v)} MA60=${fmt(ma60v)}`;
  const indLine2 = `RSI14=${fmt(rsi14v)} | DIF=${fmt(difv,3)} DEA=${fmt(deav,3)} MACD柱=${fmt(macdv,3)}`;
  const indLine3 = ind
    ? `KDJ K=${fmt(kdjK)} D=${fmt(kdjD)} J=${fmt(kdjJ)}`
    : `KDJ K=${fmt(nv(undefined))} D=- J=-（需日线indicators数据）`;
  const indLine4 = `布林带 上轨=${fmt(bbU)} 中轨=${fmt(bbM)} 下轨=${fmt(bbL)}`;

  // ③ Trend description
  // MA排列
  let maDesc = '-';
  if (ma5v != null && ma20v != null && ma60v != null) {
    const posMA5 = last.close >= ma5v ? '在MA5上方' : '在MA5下方';
    const arr = ma5v > ma20v && ma20v > ma60v ? '多头排列(MA5>MA20>MA60)'
      : ma5v < ma20v && ma20v < ma60v ? '空头排列(MA5<MA20<MA60)'
      : '均线交叉整理中';
    maDesc = `价格${posMA5}，${arr}`;
    if (ma20v != null) maDesc += `，MA20=${fmt(ma20v)}`;
  }

  // 布林带
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

  // MACD
  let macdDesc = '-';
  if (difv != null && deav != null) {
    const signal = difv > deav ? '金叉状态' : '死叉状态';
    const hist = macdv != null ? (macdv >= 0 ? '柱子为正(多方)' : '柱子为负(空方)') : '';
    macdDesc = `${signal}，DIF=${fmt(difv,3)} DEA=${fmt(deav,3)}${hist ? '，' + hist : ''}`;
  }

  // RSI
  let rsiDesc = '-';
  if (rsi14v != null) {
    const zone = rsi14v > 70 ? '超买区间(>70)' : rsi14v < 30 ? '超卖区间(<30)' : '正常区间';
    rsiDesc = `RSI14=${fmt(rsi14v)}，${zone}`;
  }

  // 量价关系（近3根）
  let volDesc = '-';
  if (kline.length >= 3) {
    const v1 = kline[n].volume, v2 = kline[n-1].volume, v3 = kline[n-2].volume;
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

/** 根据原始 API 数据生成 NotebookLM 友好版纯文本（供 /reports/review/:code/notebook 使用） */
export function buildReportNotebookText(raw: unknown): string {
  const payload = extractPayload(raw) as Payload;
  const klineMap = {
    daily:   normalizeKline(payload.kline),
    weekly:  normalizeKline(payload.kline_week),
    monthly: normalizeKline(payload.kline_month),
    m30:     normalizeKline(payload.kline_30m),
    m5:      normalizeKline(payload.kline_5m),
    m1:      normalizeKline(payload.kline_1m),
  };
  const ind = payload.indicators;
  const meta = payload.meta;
  const plan = meta?.strategic_plan;
  const chan = meta?.chan;
  const lines: string[] = [];

  lines.push(`# ${payload.stock_name ?? '-'}（${payload.stock_code ?? '-'}）`);
  lines.push(`报告日期：${payload.report_date ?? '-'}  生成时间：${payload.generated_at ?? '-'}`);
  lines.push('');

  const latest = klineMap.daily[klineMap.daily.length - 1];
  const prev = klineMap.daily[klineMap.daily.length - 2];
  const headerClose = toNum(meta?.actual_close) ?? latest?.close;
  const headerPrev = toNum(meta?.actual_prev_close) ?? prev?.close;
  const headerChgPct = toNum(meta?.actual_change_pct) ??
    (headerClose != null && headerPrev != null && headerPrev !== 0 ? (headerClose - headerPrev) / headerPrev * 100 : undefined);
  lines.push('## 当日概览');
  lines.push(`收盘价 ${fmt(headerClose)}，涨跌 ${headerChgPct != null ? (headerChgPct >= 0 ? '+' : '') + headerChgPct.toFixed(2) + '%' : '-'}。`);
  if (latest) {
    lines.push(`开盘 ${fmt(latest.open)} 最高 ${fmt(latest.high)} 最低 ${fmt(latest.low)} 成交量 ${(latest.volume / 10000).toFixed(2)} 万手。`);
  }
  lines.push('');

  for (const tab of TABS) {
    const data = klineMap[tab.key as keyof typeof klineMap];
    const indForTab = tab.key === 'daily' ? ind : undefined;
    lines.push(`## ${tab.label}`);
    lines.push(buildSummary(data, tab.label));
    lines.push('');
    lines.push(buildAiText(data, tab.label, indForTab));
    lines.push('');
    lines.push('---');
    lines.push('');
  }

  if (chan) {
    lines.push('## 缠论结构摘要');
    const fractalList = chan.fractals ?? chan.fenxing ?? [];
    const bisFromFractals = fractalList.length >= 2 ? fractalList.slice(1).map((fx, i) => {
      const prevFx = fractalList[i];
      const startTs = prevFx.timestamp ?? prevFx.date ?? prevFx.trade_date ?? '';
      const endTs = fx.timestamp ?? fx.date ?? fx.trade_date ?? '';
      const startDate = startTs.length >= 10 ? startTs.slice(0, 10) : (startTs || '-');
      const endDate = endTs.length >= 10 ? endTs.slice(0, 10) : (endTs || '-');
      const startType = prevFx.fractal_type ?? prevFx.type ?? '';
      const dir = startType === 'bottom' ? '向上笔' : '向下笔';
      return `${dir} ${startDate} → ${endDate}`;
    }) : [];
    lines.push(`共 ${fractalList.length} 个分型，${bisFromFractals.length} 笔。`);
    if (chan.zhongshu) {
      lines.push(`中枢区间：${fmt(chan.zhongshu.low)} ~ ${fmt(chan.zhongshu.high)}。`);
    }
    if (bisFromFractals.length > 0) {
      lines.push('最近笔：' + bisFromFractals.slice(-5).reverse().join('；'));
    }
    lines.push('');
    lines.push('---');
    lines.push('');
  }

  if (plan) {
    lines.push('## 操作策略建议');
    const biasMap = { Bullish: '看多', Bearish: '看空', Neutral: '中性' };
    const trendBias = plan.scenarios?.trend_bias ? (biasMap[plan.scenarios.trend_bias as keyof typeof biasMap] ?? plan.scenarios.trend_bias) : null;
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

/** 仅生成 buildAiText 的完整输出（供 /reports/review/:code/ai-summary 使用） */
export function buildReportAiSummaryText(raw: unknown): string {
  const payload = extractPayload(raw) as Payload;
  const klineMap = {
    daily:   normalizeKline(payload.kline),
    weekly:  normalizeKline(payload.kline_week),
    monthly: normalizeKline(payload.kline_month),
    m30:     normalizeKline(payload.kline_30m),
    m5:      normalizeKline(payload.kline_5m),
    m1:      normalizeKline(payload.kline_1m),
  };
  const ind = payload.indicators;
  return TABS.map(tab => {
    const data = klineMap[tab.key as keyof typeof klineMap];
    const indForTab = tab.key === 'daily' ? ind : undefined;
    return buildAiText(data, tab.label, indForTab);
  }).join('\n\n---\n\n');
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function Card({ label, value, unit, valueClass }: { label: string; value: string; unit?: string; valueClass?: string }) {
  return (
    <div className="rounded border border-slate-200 bg-slate-50 px-3 py-2.5">
      <div className="text-[10px] uppercase tracking-widest text-slate-500">{label}</div>
      <div className={`mt-1 text-sm font-semibold ${valueClass ?? 'text-slate-900'}`}>
        {value}{unit ? <span className="ml-1 text-[10px] font-normal text-slate-400">{unit}</span> : null}
      </div>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="mb-3 text-sm font-semibold text-slate-800">{children}</h2>;
}

function IndRow({ label, value, note, noteClass }: { label: string; value: string; note?: string; noteClass?: string }) {
  return (
    <div className="flex items-center justify-between py-1 border-b border-slate-100 last:border-0">
      <span className="text-[11px] text-slate-500">{label}</span>
      <span className="text-[11px] font-semibold text-slate-900 tabular-nums">{value}</span>
      {note ? <span className={`text-[10px] ${noteClass ?? 'text-slate-400'}`}>{note}</span> : null}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ReportDetailSection() {
  const { code } = useParams<{ code: string }>();
  const [searchParams] = useSearchParams();
  const date = searchParams.get('date');
  const [raw, setRaw] = useState<unknown>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>('daily');

  useEffect(() => {
    if (!code) return;
    setLoading(true); setError(null);
    const jsonUrl = date
      ? `/data/reports/${code}/review_${date}.json`
      : `/data/reports/${code}/review_latest.json`;
    fetch(jsonUrl)
      .then(r => { if (!r.ok) throw new Error('加载报告失败'); return r.json(); })
      .then(j => {
        setRaw(j);
      })
      .catch((e: unknown) => setError(e instanceof Error ? e.message : '加载失败'))
      .finally(() => setLoading(false));
  }, [code, date]);

  const payload = useMemo(() => raw ? extractPayload(raw) : ({} as Payload), [raw]);

  // Kline data for each timeframe
  const klineMap = useMemo(() => ({
    daily:   normalizeKline(payload.kline),
    weekly:  normalizeKline(payload.kline_week),
    monthly: normalizeKline(payload.kline_month),
    m30:     normalizeKline(payload.kline_30m),
    m5:      normalizeKline(payload.kline_5m),
    m1:      normalizeKline(payload.kline_1m),
  }), [payload]);

  const kline = klineMap.daily;
  const latest = kline[kline.length - 1];
  const prev   = kline[kline.length - 2];

  const meta = payload.meta;
  const ind  = payload.indicators;
  const plan = meta?.strategic_plan;
  const chip = meta?.chip;
  const chan  = meta?.chan;

  // Header values — prefer meta.actual_close
  const headerClose  = toNum(meta?.actual_close) ?? latest?.close;
  const headerPrev   = toNum(meta?.actual_prev_close) ?? prev?.close;
  const headerChgPct = toNum(meta?.actual_change_pct) ??
    (headerClose != null && headerPrev != null && headerPrev !== 0
      ? (headerClose - headerPrev) / headerPrev * 100 : undefined);
  const headerChgAmt = headerClose != null && headerPrev != null ? headerClose - headerPrev : undefined;

  // Overview stats (区块2) from latest daily kline
  const amplitude = latest && headerPrev
    ? (latest.high - latest.low) / headerPrev * 100 : undefined;

  // Money flow
  const moneyFlow = useMemo(() => (payload.money_flow ?? []).slice(-10), [payload]);
  const mfTotal = useMemo(() => {
    return moneyFlow.reduce((acc, r) => {
      const n = toNum(r.main_net) ?? 0;
      return { main: acc.main + n, retail: acc.retail - n };
    }, { main: 0, retail: 0 });
  }, [moneyFlow]);

  // 20-day price table
  const last20 = useMemo(() => kline.slice(-20).reverse(), [kline]);

  // Active kline for chart
  const activeKline = useMemo(() => klineMap[activeTab as keyof typeof klineMap] ?? [], [klineMap, activeTab]);
  const chartOption = useMemo(() => buildChartOption(activeKline), [activeKline]);
  const tabLabel = TABS.find(t => t.key === activeTab)?.label ?? '日线';
  const chartSummary = useMemo(() => buildSummary(activeKline, tabLabel), [activeKline, tabLabel]);

  const fullAiSummaryText = useMemo(() => {
    return TABS.map(tab => {
      const data = klineMap[tab.key as keyof typeof klineMap];
      const indForTab = tab.key === 'daily' ? ind : undefined;
      return buildAiText(data, tab.label, indForTab);
    }).join('\n\n---\n\n');
  }, [klineMap, ind]);

  // Technical indicators — close price for relative %
  const closePrice = headerClose ?? latest?.close;

  function relPct(maVal: number | undefined): string {
    if (maVal == null || closePrice == null) return '-';
    return `${((closePrice - maVal) / maVal * 100).toFixed(2)}%`;
  }
  function relClass(maVal: number | undefined): string {
    if (maVal == null || closePrice == null) return 'text-slate-400';
    return closePrice >= maVal ? 'text-[#ef4444]' : 'text-[#22c55e]';
  }

  // Chan fractals & bis
  const fractalList = chan?.fractals ?? chan?.fenxing ?? [];
  const fractals = [...fractalList].slice(-10).reverse();
  const fractalCount = fractalList.length;

  // 从相邻分型推导笔（相邻两个分型 = 一笔）
  const bisFromFractals: Array<{ direction: 'up' | 'down'; start_date: string; end_date: string; change_pct?: number }> =
    fractalList.length >= 2
      ? fractalList.slice(1).map((fx, i) => {
          const prev = fractalList[i];
          const startTs = prev.timestamp ?? prev.date ?? prev.trade_date ?? '';
          const endTs   = fx.timestamp   ?? fx.date   ?? fx.trade_date   ?? '';
          const startDate = startTs.length >= 10 ? startTs.slice(0, 10) : (startTs || '-');
          const endDate   = endTs.length   >= 10 ? endTs.slice(0, 10)   : (endTs   || '-');
          const startType = prev.fractal_type ?? prev.type ?? '';
          const dir: 'up' | 'down' = startType === 'bottom' ? 'up' : 'down';
          const sp = toNum(prev.price ?? prev.position);
          const ep = toNum(fx.price   ?? fx.position);
          const cp = sp != null && ep != null && sp !== 0
            ? (ep - sp) / sp * 100 : undefined;
          return { direction: dir, start_date: startDate, end_date: endDate, change_pct: cp };
        })
      : [];
  const bis = bisFromFractals.slice(-10).reverse();
  const bisCount = bisFromFractals.length;

  // RSI zone label
  function rsiZone(v: number | undefined): { label: string; cls: string } {
    if (v == null) return { label: '-', cls: 'text-slate-400' };
    if (v > 70) return { label: '超买', cls: 'text-[#ef4444]' };
    if (v < 30) return { label: '超卖', cls: 'text-[#22c55e]' };
    return { label: '正常', cls: 'text-slate-500' };
  }

  // MACD signal
  const macdSignal = (() => {
    const dif = toNum(ind?.MACD_DIF); const dea = toNum(ind?.MACD_DEA);
    if (dif == null || dea == null) return '-';
    return dif > dea ? '金叉 ▲' : '死叉 ▼';
  })();

  // ── Render ──────────────────────────────────────────────────────────────────

  if (loading) return (
    <div className="flex min-h-screen items-center justify-center bg-white text-sm text-slate-500">
      正在加载报告…
    </div>
  );

  if (error) return (
    <div className="min-h-screen bg-white p-8">
      <div className="rounded border border-amber-200 bg-amber-50 p-5 text-sm text-amber-800">
        <p className="font-medium">{error}</p>
        <p className="mt-1 text-xs text-amber-600 font-mono">/data/reports/{code}/review_latest.json</p>
        <Link to="/reports" className="mt-3 inline-flex items-center gap-1.5 text-xs text-amber-700 underline">
          <ArrowLeft className="h-3 w-3" />返回报告列表
        </Link>
      </div>
    </div>
  );

  if (!raw) return (
    <div className="min-h-screen bg-white p-8 text-sm text-slate-500">未获取到数据。</div>
  );

  return (
    <div className="min-h-screen bg-white">

      {/* ── 【1】粘性 Header ──────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur-sm shadow-sm">
        <div className="mx-auto max-w-7xl px-6 py-2.5">
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3 sm:items-center">
            {/* 左 */}
            <div className="flex flex-wrap items-center gap-2">
              <Link to="/reports" className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 px-3 py-1 text-xs text-slate-600 hover:border-slate-300 hover:text-slate-900 transition-colors">
                <ArrowLeft className="h-3.5 w-3.5" />返回报告列表
              </Link>
              <Link to={`/reports/review/${code}/notebook`} className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 px-3 py-1 text-xs text-slate-600 hover:border-slate-300 hover:text-slate-900 transition-colors">
                NotebookLM 视图
              </Link>
            </div>
            {/* 中 */}
            <div className="text-center">
              <div className="flex flex-wrap items-center justify-center gap-2">
                <span className="text-lg font-bold text-slate-900">{payload.stock_name ?? '-'}</span>
                <span className="rounded bg-slate-100 px-2 py-0.5 font-mono text-xs text-slate-600">{payload.stock_code ?? '-'}</span>
              </div>
              <div className="mt-0.5 flex flex-wrap items-center justify-center gap-2 text-[11px] text-slate-400">
                <span>报告日期：{payload.report_date ?? '-'}</span>
                <span>·</span>
                <span>生成时间：{payload.generated_at ?? '-'}</span>
              </div>
            </div>
            {/* 右 */}
            <div className="flex items-center justify-start gap-4 sm:justify-end">
              <div className="text-right">
                <div className="text-[10px] uppercase tracking-widest text-slate-400">收盘价</div>
                <div className={`text-2xl font-bold ${clr(headerChgPct)}`}>
                  {headerClose == null ? '-' : headerClose.toFixed(2)}
                </div>
              </div>
              <div className="text-right">
                <div className={`text-sm font-semibold ${clr(headerChgAmt)}`}>
                  {headerChgAmt == null ? '-' : (headerChgAmt >= 0 ? '+' : '') + headerChgAmt.toFixed(2)}
                </div>
                <div className={`text-sm font-semibold ${clr(headerChgPct)}`}>
                  {headerChgPct == null ? '-' : (headerChgPct >= 0 ? '+' : '') + headerChgPct.toFixed(2) + '%'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-6 space-y-6">

        {/* ── 【2】当日概览（8卡片）──────────────────────────────────────── */}
        <section>
          <div className="grid grid-cols-4 gap-2 sm:grid-cols-8">
            <Card label="开盘价" value={fmt(latest?.open)} />
            <Card label="最高价" value={fmt(latest?.high)} />
            <Card label="最低价" value={fmt(latest?.low)} />
            <Card label="收盘价" value={fmt(headerClose)} valueClass={clr(headerChgPct)} />
            <Card label="涨跌幅" value={fmtPct(headerChgPct)} valueClass={clr(headerChgPct)} />
            <Card label="成交量" value={latest ? (latest.volume / 10000).toFixed(2) : '-'} unit="万手" />
            <Card
              label="成交额"
              value={latest ? ((latest.close * latest.volume) / 100000000).toFixed(2) : '-'}
              unit="亿元"
            />
            <Card label="振幅" value={amplitude == null ? '-' : amplitude.toFixed(2) + '%'} />
          </div>
        </section>

        {/* ── 【3】图表区（Tab切换）────────────────────────────────────────── */}
        <section className="rounded border border-slate-200 bg-white">
          {/* Tab bar */}
          <div className="flex items-center gap-0 border-b border-slate-200">
            {TABS.map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-4 py-2.5 text-xs font-medium transition-colors border-b-2 -mb-px ${
                  activeTab === tab.key
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                {tab.label}
                {tab.key !== 'daily' && klineMap[tab.key as keyof typeof klineMap].length === 0 && (
                  <span className="ml-1 text-[9px] text-slate-300">无数据</span>
                )}
              </button>
            ))}
          </div>

          {/* Chart */}
          <div className="p-3">
            {activeKline.length === 0 ? (
              <div className="flex h-[520px] items-center justify-center text-sm text-slate-400">
                {tabLabel}暂无数据
              </div>
            ) : (
              <div style={{ height: 520 }}>
                <ReactECharts
                  option={chartOption}
                  style={{ height: '100%', width: '100%' }}
                  notMerge
                  lazyUpdate
                  opts={{ renderer: 'canvas' }}
                />
              </div>
            )}

            {/* 供 NotebookLM 读取的纯文字摘要 */}
            <div className="chart-summary mt-3 rounded bg-slate-50 border border-slate-100 p-3">
              <p className="text-[11px] leading-relaxed text-slate-600">{chartSummary}</p>
            </div>
          </div>
        </section>

        {/* ── 【4】技术指标（3列）─────────────────────────────────────────── */}
        <section>
          <SectionTitle>技术指标</SectionTitle>
          <div className="grid gap-4 md:grid-cols-3">
            {/* 列1：均线 */}
            <div className="rounded border border-slate-200 bg-slate-50 p-4">
              <div className="mb-2 text-[10px] uppercase tracking-widest text-slate-500">均线指标</div>
              {[
                ['MA5',   ind?.MA5],   ['MA10',  ind?.MA10],
                ['MA20',  ind?.MA20],  ['MA30',  ind?.MA30],
                ['MA60',  ind?.MA60],  ['MA120', ind?.MA120],
                ['MA250', ind?.MA250], ['EMA12', ind?.EMA12],
                ['EMA26', ind?.EMA26],
              ].map(([label, val]) => (
                <div key={label as string} className="flex items-center justify-between border-b border-slate-100 py-1 last:border-0">
                  <span className="text-[11px] text-slate-500">{label}</span>
                  <span className="text-[11px] font-semibold text-slate-900 tabular-nums">{fmt(val)}</span>
                  <span className={`text-[10px] tabular-nums ${relClass(toNum(val))}`}>
                    {relPct(toNum(val))}
                  </span>
                </div>
              ))}
            </div>

            {/* 列2：动量指标 */}
            <div className="rounded border border-slate-200 bg-slate-50 p-4">
              <div className="mb-2 text-[10px] uppercase tracking-widest text-slate-500">动量指标</div>
              {/* RSI */}
              {([['RSI6', ind?.RSI6], ['RSI12', ind?.RSI12], ['RSI14', ind?.RSI14], ['RSI24', ind?.RSI24]] as [string, number | undefined][]).map(([label, val]) => {
                const z = rsiZone(toNum(val));
                return (
                  <div key={label} className="flex items-center justify-between border-b border-slate-100 py-1">
                    <span className="text-[11px] text-slate-500">{label}</span>
                    <span className="text-[11px] font-semibold text-slate-900 tabular-nums">{fmt(val)}</span>
                    <span className={`text-[10px] ${z.cls}`}>{z.label}</span>
                  </div>
                );
              })}
              <div className="mt-2 mb-1 text-[10px] text-slate-400">KDJ</div>
              <IndRow label="K" value={fmt(ind?.KDJ_K)} />
              <IndRow label="D" value={fmt(ind?.KDJ_D)} />
              <IndRow label="J" value={fmt(ind?.KDJ_J)} />
              <div className="mt-2 mb-1 text-[10px] text-slate-400">MACD</div>
              <IndRow label="DIF" value={fmt(ind?.MACD_DIF, 3)} />
              <IndRow label="DEA" value={fmt(ind?.MACD_DEA, 3)} />
              <IndRow label="MACD柱" value={fmt(ind?.MACD, 3)} />
              <div className="flex items-center justify-between py-1">
                <span className="text-[11px] text-slate-500">信号</span>
                <span className={`text-[11px] font-semibold tabular-nums ${
                  macdSignal.includes('金') ? 'text-[#ef4444]' : macdSignal.includes('死') ? 'text-[#22c55e]' : 'text-slate-500'
                }`}>{macdSignal}</span>
              </div>
            </div>

            {/* 列3：波动指标 */}
            <div className="rounded border border-slate-200 bg-slate-50 p-4">
              <div className="mb-2 text-[10px] uppercase tracking-widest text-slate-500">波动指标</div>
              <div className="mb-1 text-[10px] text-slate-400">布林带</div>
              <IndRow label="上轨 BB_Upper" value={fmt(ind?.BB_Upper)} />
              <IndRow label="中轨 BB_Middle" value={fmt(ind?.BB_Middle)} />
              <IndRow label="下轨 BB_Lower" value={fmt(ind?.BB_Lower)} />
              <IndRow
                label="带宽"
                value={
                  toNum(ind?.BB_Upper) != null && toNum(ind?.BB_Lower) != null && toNum(ind?.BB_Middle) != null
                    ? fmt((toNum(ind!.BB_Upper)! - toNum(ind!.BB_Lower)!) / toNum(ind!.BB_Middle)! * 100) + '%'
                    : '-'
                }
              />
              <div className="mt-2 mb-1 text-[10px] text-slate-400">其他</div>
              <IndRow label="ATR(14)" value={fmt(ind?.ATR14)} />
              <IndRow label="CCI(20)" value={fmt(ind?.CCI20)} />
            </div>
          </div>
        </section>

        {/* ── 【5】资金与筹码 ───────────────────────────────────────────────── */}
        <section>
          <SectionTitle>资金与筹码</SectionTitle>
          <div className="grid gap-4 md:grid-cols-2">
            {/* 资金流向 */}
            <div className="rounded border border-slate-200 bg-slate-50 p-4">
              <div className="mb-2 text-[10px] uppercase tracking-widest text-slate-500">主力资金流向（近10日）</div>
              {moneyFlow.length === 0 ? (
                <p className="text-xs text-slate-400">-</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-left text-[11px]">
                    <thead>
                      <tr className="border-b border-slate-200 text-[10px] text-slate-400">
                        <th className="py-1 pr-3 font-normal">日期</th>
                        <th className="py-1 pr-3 font-normal text-right">主力流入</th>
                        <th className="py-1 pr-3 font-normal text-right">主力流出</th>
                        <th className="py-1 pr-3 font-normal text-right">主力净额</th>
                        <th className="py-1 font-normal text-right">散户净额</th>
                      </tr>
                    </thead>
                    <tbody>
                      {moneyFlow.map((row, i) => {
                        const d = row.date ?? row.trade_date ?? '-';
                        const mainNet = toNum(row.main_net);
                        const retailNet = mainNet != null ? -mainNet : undefined;
                        const mainIn = toNum(row.main_in);
                        const mainOut = toNum(row.main_out);
                        return (
                          <tr key={`${d}-${i}`} className="border-b border-slate-100 last:border-0">
                            <td className="py-1.5 pr-3 text-slate-500 whitespace-nowrap">{d}</td>
                            <td className="py-1.5 pr-3 text-right tabular-nums text-slate-700">{fmt(mainIn)}</td>
                            <td className="py-1.5 pr-3 text-right tabular-nums text-slate-700">{fmt(mainOut)}</td>
                            <td className={`py-1.5 pr-3 text-right tabular-nums font-semibold ${mainNet == null ? 'text-slate-400' : mainNet >= 0 ? 'text-[#ef4444]' : 'text-[#22c55e]'}`}>
                              {fmt(mainNet)}
                            </td>
                            <td className={`py-1.5 text-right tabular-nums font-semibold ${retailNet == null ? 'text-slate-400' : retailNet >= 0 ? 'text-[#ef4444]' : 'text-[#22c55e]'}`}>
                              {retailNet == null ? '-' : retailNet.toFixed(2)}
                            </td>
                          </tr>
                        );
                      })}
                      {/* 累计行 */}
                      <tr className="border-t-2 border-slate-200 bg-white">
                        <td className="py-1.5 pr-3 font-semibold text-slate-700">累计</td>
                        <td className="py-1.5 pr-3 text-right tabular-nums text-slate-500" colSpan={2}></td>
                        <td className={`py-1.5 pr-3 text-right tabular-nums font-bold ${mfTotal.main >= 0 ? 'text-[#ef4444]' : 'text-[#22c55e]'}`}>
                          {mfTotal.main.toFixed(2)}
                        </td>
                        <td className={`py-1.5 text-right tabular-nums font-bold ${mfTotal.retail >= 0 ? 'text-[#ef4444]' : 'text-[#22c55e]'}`}>
                          {mfTotal.retail.toFixed(2)}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                  <p className="mt-1 text-[10px] text-slate-400">单位：万元</p>
                </div>
              )}

              {/* 融资融券 */}
              {meta?.margin && (
                <div className="mt-4">
                  <div className="mb-2 text-[10px] uppercase tracking-widest text-slate-500">融资融券</div>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      ['融资余额', meta.margin.balance],
                      ['融资买入', meta.margin.buy],
                      ['融资偿还', meta.margin.repay],
                      ['融券余额', meta.margin.short_balance],
                    ].map(([label, val]) => (
                      <div key={label as string}>
                        <div className="text-[10px] text-slate-400">{label}</div>
                        <div className="text-xs font-semibold text-slate-900">{fmt(val)}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* 筹码分布 + 北向 */}
            <div className="space-y-4">
              <div className="rounded border border-slate-200 bg-slate-50 p-4">
                <div className="mb-3 text-[10px] uppercase tracking-widest text-slate-500">筹码分布</div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <div className="text-[10px] text-slate-400">获利比例</div>
                    <div className="mt-1 text-sm font-bold text-slate-900">
                      {chip?.profit_ratio == null ? '-' : (chip.profit_ratio * 100).toFixed(2) + '%'}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-400">平均成本</div>
                    <div className="mt-1 text-sm font-bold text-slate-900">{fmt(chip?.avg_cost)}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-400">集中度</div>
                    <div className="mt-1 text-sm font-bold text-slate-900">
                      {chip?.concentration == null ? '-' : (chip.concentration * 100).toFixed(2) + '%'}
                    </div>
                  </div>
                </div>
                {/* 获利比例进度条 */}
                {chip?.profit_ratio != null && (
                  <div className="mt-3">
                    <div className="h-2 w-full rounded-full bg-slate-200">
                      <div
                        className="h-2 rounded-full bg-blue-400"
                        style={{ width: `${Math.min(100, chip.profit_ratio * 100).toFixed(1)}%` }}
                      />
                    </div>
                    <div className="mt-1 text-[10px] text-slate-400">
                      {(chip.profit_ratio * 100).toFixed(1)}% 持仓成本低于现价
                    </div>
                  </div>
                )}
              </div>

              {/* 北向资金 */}
              {meta?.northbound && (
                <div className="rounded border border-slate-200 bg-slate-50 p-4">
                  <div className="mb-2 text-[10px] uppercase tracking-widest text-slate-500">北向资金</div>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      ['持仓数量', meta.northbound.shares],
                      ['持仓比例', meta.northbound.ratio != null ? fmt(meta.northbound.ratio) + '%' : '-'],
                      ['增减数量', meta.northbound.change],
                    ].map(([label, val]) => (
                      <div key={label as string}>
                        <div className="text-[10px] text-slate-400">{label}</div>
                        <div className="text-xs font-semibold text-slate-900">{String(val) || '-'}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 市场情绪 */}
              {meta?.sentiment && (
                <div className="rounded p-4 text-white" style={{ backgroundColor: '#1e293b' }}>
                  <div className="mb-1 text-[10px] uppercase tracking-widest text-white/60">市场情绪</div>
                  <div className="flex items-center gap-3">
                    <span className="text-3xl font-bold">{Number(meta.sentiment.score).toFixed(2)}</span>
                    <span className="rounded-full bg-white/15 px-2 py-0.5 text-xs font-medium">{meta.sentiment.verdict}</span>
                  </div>
                  <p className="mt-2 text-xs text-white/75">{meta.sentiment.hint}</p>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* ── 【6】近20日价格与成交量 ─────────────────────────────────────── */}
        <section>
          <SectionTitle>近20日行情数据</SectionTitle>
          <div className="overflow-x-auto rounded border border-slate-200">
            <table className="min-w-full text-left text-[11px]">
              <thead className="bg-slate-50">
                <tr className="border-b border-slate-200 text-[10px] uppercase tracking-widest text-slate-500">
                  <th className="px-3 py-2 font-normal">交易日</th>
                  <th className="px-3 py-2 font-normal text-right">开盘</th>
                  <th className="px-3 py-2 font-normal text-right">最高</th>
                  <th className="px-3 py-2 font-normal text-right">最低</th>
                  <th className="px-3 py-2 font-normal text-right">收盘</th>
                  <th className="px-3 py-2 font-normal text-right">涨跌幅</th>
                  <th className="px-3 py-2 font-normal text-right">成交量(手)</th>
                  <th className="px-3 py-2 font-normal text-right">成交额(亿)</th>
                </tr>
              </thead>
              <tbody>
                {last20.map((d, i) => {
                  const origIdx = kline.length - 1 - i;
                  const prevClose = origIdx > 0 ? kline[origIdx - 1]?.close : undefined;
                  const pct = prevClose ? (d.close - prevClose) / prevClose * 100 : undefined;
                  const turnover = d.close * d.volume / 100000000;
                  return (
                    <tr key={d.date} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                      <td className="px-3 py-1.5 whitespace-nowrap text-slate-600">{d.date}</td>
                      <td className="px-3 py-1.5 text-right tabular-nums text-slate-700">{d.open.toFixed(2)}</td>
                      <td className="px-3 py-1.5 text-right tabular-nums text-slate-700">{d.high.toFixed(2)}</td>
                      <td className="px-3 py-1.5 text-right tabular-nums text-slate-700">{d.low.toFixed(2)}</td>
                      <td className="px-3 py-1.5 text-right tabular-nums font-semibold text-slate-900">{d.close.toFixed(2)}</td>
                      <td className={`px-3 py-1.5 text-right tabular-nums font-semibold ${pct == null ? 'text-slate-400' : pct >= 0 ? 'text-[#ef4444]' : 'text-[#22c55e]'}`}>
                        {pct == null ? '-' : (pct >= 0 ? '+' : '') + pct.toFixed(2) + '%'}
                      </td>
                      <td className="px-3 py-1.5 text-right tabular-nums text-slate-700">{d.volume.toLocaleString()}</td>
                      <td className="px-3 py-1.5 text-right tabular-nums text-slate-700">{turnover.toFixed(2)}</td>
                    </tr>
                  );
                })}
                {last20.length === 0 && (
                  <tr><td colSpan={8} className="px-3 py-4 text-center text-slate-400">暂无数据</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* ── 【7】多周期分析 ───────────────────────────────────────────────── */}
        <section>
          <SectionTitle>多周期分析</SectionTitle>
          <div className="grid gap-4 md:grid-cols-2">
            {/* 关键价位表 */}
            <div className="rounded border border-slate-200 bg-slate-50 p-4">
              <div className="mb-2 text-[10px] uppercase tracking-widest text-slate-500">关键价位</div>
              <div className="overflow-x-auto">
                <table className="min-w-full text-[11px]">
                  <thead>
                    <tr className="border-b border-slate-200 text-[10px] text-slate-400">
                      <th className="py-1 pr-3 font-normal text-left">周期</th>
                      <th className="py-1 pr-3 font-normal text-right">当前价</th>
                      <th className="py-1 pr-3 font-normal text-right">支撑1</th>
                      <th className="py-1 pr-3 font-normal text-right">支撑2</th>
                      <th className="py-1 pr-3 font-normal text-right">阻力1</th>
                      <th className="py-1 font-normal text-right">阻力2</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(['日线', '周线', '月线'] as const).map(cycle => {
                      const dataMap = { '日线': klineMap.daily, '周线': klineMap.weekly, '月线': klineMap.monthly };
                      const data = dataMap[cycle];
                      const closes = data.map(d => d.close);
                      const highs = data.slice(-20).map(d => d.high);
                      const lows  = data.slice(-20).map(d => d.low);
                      const recentHigh = highs.length ? Math.max(...highs) : undefined;
                      const recentLow  = lows.length  ? Math.min(...lows)  : undefined;
                      const ma20 = closes.length >= 20 ? closes.slice(-20).reduce((s, v) => s + v, 0) / 20 : undefined;
                      const ma60 = closes.length >= 60 ? closes.slice(-60).reduce((s, v) => s + v, 0) / 60 : undefined;
                      // 当前价统一使用日线最新收盘（headerClose），避免周线/月线滞后
                      const curPrice = headerClose ?? klineMap.daily[klineMap.daily.length - 1]?.close;
                      return (
                        <tr key={cycle} className="border-b border-slate-100 last:border-0">
                          <td className="py-1.5 pr-3 text-slate-600">{cycle}</td>
                          <td className="py-1.5 pr-3 text-right tabular-nums font-semibold text-slate-900">{fmt(curPrice)}</td>
                          <td className="py-1.5 pr-3 text-right tabular-nums text-[#22c55e]">{fmt(recentLow)}</td>
                          <td className="py-1.5 pr-3 text-right tabular-nums text-[#22c55e]">{fmt(ma60)}</td>
                          <td className="py-1.5 pr-3 text-right tabular-nums text-[#ef4444]">{fmt(ma20)}</td>
                          <td className="py-1.5 text-right tabular-nums text-[#ef4444]">{fmt(recentHigh)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* 斐波那契 */}
            <div className="rounded border border-slate-200 bg-slate-50 p-4">
              <div className="mb-2 text-[10px] uppercase tracking-widest text-slate-500">斐波那契回撤/扩展</div>
              {(() => {
                const fib = meta?.fibonacci;
                const fibHigh = toNum(fib?.high) ?? (kline.length ? Math.max(...kline.slice(-60).map(d => d.high)) : undefined);
                const fibLow  = toNum(fib?.low)  ?? (kline.length ? Math.min(...kline.slice(-60).map(d => d.low))  : undefined);
                const curClose = headerClose;
                if (fibHigh == null || fibLow == null) {
                  return <p className="text-xs text-slate-400">数据待接入</p>;
                }
                const range = fibHigh - fibLow;
                const levels = [
                  [0, '起点'], [0.236, '23.6%'], [0.382, '38.2%'],
                  [0.5, '50%'], [0.618, '61.8%'], [0.786, '78.6%'],
                  [1, '100%'], [1.272, '127.2%扩展'], [1.618, '161.8%扩展'],
                ];
                return (
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-[11px]">
                      <thead>
                        <tr className="border-b border-slate-200 text-[10px] text-slate-400">
                          <th className="py-1 pr-3 font-normal text-left">回撤位</th>
                          <th className="py-1 pr-3 font-normal text-right">价格</th>
                          <th className="py-1 font-normal text-right">距现价</th>
                        </tr>
                      </thead>
                      <tbody>
                        {levels.map(([ratio, label]) => {
                          const price = fibHigh - (ratio as number) * range;
                          const dist = curClose != null ? curClose - price : undefined;
                          return (
                            <tr key={label as string} className="border-b border-slate-100 last:border-0">
                              <td className="py-1 pr-3 text-slate-500">{label}</td>
                              <td className="py-1 pr-3 text-right tabular-nums font-semibold text-slate-900">{price.toFixed(2)}</td>
                              <td className={`py-1 text-right tabular-nums ${dist == null ? 'text-slate-400' : dist >= 0 ? 'text-[#ef4444]' : 'text-[#22c55e]'}`}>
                                {dist == null ? '-' : (dist >= 0 ? '+' : '') + dist.toFixed(2)}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                    <p className="mt-1 text-[10px] text-slate-400">基准区间：{fibLow.toFixed(2)} ~ {fibHigh.toFixed(2)}</p>
                  </div>
                );
              })()}
            </div>
          </div>
        </section>

        {/* ── 【8】缠论结构摘要 ─────────────────────────────────────────────── */}
        <section>
          <SectionTitle>缠论结构摘要</SectionTitle>
          <div className="rounded border border-slate-200 bg-slate-50 p-4">
            {/* 统计卡片 */}
            <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                ['分型数量', fractalCount],
                ['笔数量', bisCount],
                ['线段数量', '-'],
                ['中枢数量', chan?.zhongshu ? 1 : 0],
              ].map(([label, val]) => (
                <div key={label as string} className="rounded border border-slate-200 bg-white p-3 text-center">
                  <div className="text-2xl font-bold text-slate-900">{String(val)}</div>
                  <div className="mt-0.5 text-[10px] text-slate-500">{label}</div>
                </div>
              ))}
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {/* 分型列表 */}
              <div>
                <div className="mb-2 text-[10px] uppercase tracking-widest text-slate-500">最近分型</div>
                {fractals.length === 0 ? (
                  <p className="text-xs text-slate-400">-</p>
                ) : (
                  <div className="space-y-0.5">
                    {fractals.map((fx, i) => {
                      // 日期：timestamp "2025-10-17 00:00:00" 取前10位，兜底 date/trade_date
                      const rawTs = fx.timestamp ?? fx.date ?? fx.trade_date ?? '-';
                      const d = rawTs.length >= 10 ? rawTs.slice(0, 10) : rawTs;
                      // 类型：fractal_type 优先，兼容旧 type 字段
                      const ft = fx.fractal_type ?? fx.type ?? '-';
                      const t = ft === 'top' ? '顶分型' : ft === 'bottom' ? '底分型' : ft;
                      const isTop = ft === 'top';
                      return (
                        <div key={`${d}-${i}`} className="flex items-center justify-between rounded px-2 py-1 text-[11px] hover:bg-white">
                          <span className={`font-medium ${isTop ? 'text-[#ef4444]' : 'text-[#22c55e]'}`}>{t}</span>
                          <span className="text-slate-500">{d}</span>
                          <span className="tabular-nums font-semibold text-slate-900">{fmt(fx.price)}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* 笔列表 */}
              <div>
                <div className="mb-2 text-[10px] uppercase tracking-widest text-slate-500">最近笔</div>
                {bis.length === 0 ? (
                  <p className="text-xs text-slate-400">-</p>
                ) : (
                  <div className="space-y-0.5">
                    {bis.map((b, i) => {
                      const dir = b.direction === 'up' ? '向上笔 ↑' : b.direction === 'down' ? '向下笔 ↓' : String(b.direction ?? '-');
                      const isUp = b.direction === 'up';
                      const sd = b.start_date ?? (b as { start_trade_date?: string }).start_trade_date ?? '-';
                      const ed = b.end_date ?? (b as { end_trade_date?: string }).end_trade_date ?? '-';
                      const cp = b.change_pct;
                      return (
                        <div key={`${sd}-${i}`} className="flex items-center justify-between rounded px-2 py-1 text-[11px] hover:bg-white">
                          <span className={`font-medium ${isUp ? 'text-[#ef4444]' : 'text-[#22c55e]'}`}>{dir}</span>
                          <span className="text-slate-500 text-[10px]">{sd} → {ed}</span>
                          <span className={`tabular-nums font-semibold ${cp == null ? 'text-slate-400' : cp >= 0 ? 'text-[#ef4444]' : 'text-[#22c55e]'}`}>
                            {cp == null ? '-' : (cp >= 0 ? '+' : '') + cp.toFixed(2) + '%'}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* 中枢 */}
            {chan?.zhongshu && (
              <div className="mt-3 rounded border border-slate-200 bg-white px-3 py-2">
                <span className="text-[10px] text-slate-500">当前中枢区间：</span>
                <span className="ml-2 text-sm font-bold text-slate-900">
                  {fmt(chan.zhongshu.low)} ~ {fmt(chan.zhongshu.high)}
                </span>
              </div>
            )}

            {/* 缠论文字摘要（供 NotebookLM） */}
            <div className="mt-3 rounded bg-white border border-slate-100 p-3">
              <p className="text-[11px] leading-relaxed text-slate-600">
                {`【缠论摘要】共${fractalCount}个分型，${bisCount}笔，线段数据待接入，${chan?.zhongshu ? 1 : 0}个中枢。` +
                  (bis.length > 0 ? `最近一笔为${bis[0].direction === 'up' ? '向上' : '向下'}笔，从${bis[0].start_date ?? '-'}到${bis[0].end_date ?? '-'}。` : '')}
              </p>
            </div>
          </div>
        </section>

        {/* ── 【9】操作策略 ─────────────────────────────────────────────────── */}
        <section>
          <div className="rounded-lg border-l-4 px-6 py-5" style={{ backgroundColor: '#f0f9ff', borderColor: '#3b82f6' }}>
            <SectionTitle>操作策略建议</SectionTitle>
            {plan ? (
              <div className="space-y-5">
                {/* 趋势判断 + 操作建议 */}
                {(plan.scenarios?.trend_bias || plan.scenarios?.action_plan) && (
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <div className="text-[10px] uppercase tracking-widest text-slate-500">趋势判断</div>
                      <p className="mt-1 text-sm font-semibold text-slate-900">
                        {(() => {
                          const raw = plan.scenarios?.trend_bias;
                          const map: Record<string, string> = { Bullish: '看多', Bearish: '看空', Neutral: '中性' };
                          return (raw ? (map[raw] ?? raw) : '-');
                        })()}
                      </p>
                    </div>
                    <div>
                      <div className="text-[10px] uppercase tracking-widest text-slate-500">操作建议</div>
                      <p className="mt-1 text-sm font-semibold text-slate-900">{plan.scenarios?.action_plan || '-'}</p>
                    </div>
                  </div>
                )}
                {/* 关键价位网格 */}
                {plan.grid && (
                  <div>
                    <div className="mb-2 text-[10px] uppercase tracking-widest text-slate-500">关键价位</div>
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
                      {[
                        { label: '攻击线(MA5)',    value: plan.grid.attack_line_ma5,   cls: 'text-[#ef4444]' },
                        { label: '防守线(MA20)',   value: plan.grid.defense_line_ma20, cls: 'text-[#ef4444]' },
                        { label: '关键点位',       value: plan.grid.pivot_point,       cls: 'text-slate-900' },
                        { label: '支撑位',         value: plan.grid.support,           cls: 'text-[#22c55e]' },
                        { label: '阻力位',         value: plan.grid.resistance,        cls: 'text-[#ef4444]' },
                      ].map(({ label, value, cls }) => (
                        <div key={label} className="rounded border border-blue-100 bg-white px-3 py-2">
                          <div className="text-[10px] text-slate-400">{label}</div>
                          <div className={`mt-1 text-base font-bold tabular-nums ${cls}`}>
                            {value != null && value !== '' ? String(value) : '-'}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {/* 板块参考 */}
                {plan.sector_context && (
                  <div>
                    <div className="text-[10px] uppercase tracking-widest text-slate-500">板块参考</div>
                    <p className="mt-1 text-sm text-slate-700">
                      {plan.sector_context.related_index
                        ? <span className="font-semibold">{plan.sector_context.related_index}</span>
                        : null}
                      {plan.sector_context.note
                        ? <span className="ml-2 text-slate-500">{plan.sector_context.note}</span>
                        : null}
                      {!plan.sector_context.related_index && !plan.sector_context.note ? '-' : null}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-slate-500">暂无策略数据</p>
            )}
          </div>
        </section>

        {/* ── AI数据摘要（供 NotebookLM 等智能工具读取） ──────────────────── */}
        <div id="ai-readable" className="border-t border-slate-100 pt-4">
          <p className="mb-3 text-xs font-medium text-slate-400">【AI数据摘要 · 供智能分析使用】</p>
          <div className="space-y-3">
            {TABS.map(tab => {
              const data = klineMap[tab.key as keyof typeof klineMap];
              const indForTab = tab.key === 'daily' ? ind : undefined;
              const text = buildAiText(data, tab.label, indForTab);
              return (
                <div key={tab.key}>
                  <pre className="whitespace-pre-wrap font-mono text-[10px] leading-relaxed text-slate-400">{text}</pre>
                  <div className="mt-3 border-t border-slate-100" />
                </div>
              );
            })}
          </div>
        </div>

        {/* ── 【10】数据来源与声明 ──────────────────────────────────────────── */}
        <footer className="border-t border-slate-100 pt-4 pb-8">
          <p className="text-[10px] leading-relaxed text-slate-400">
            数据截止时间：{payload.report_date ?? '-'} · 报告生成时间：{payload.generated_at ?? '-'} ·
            数据来源：chuckfan.com ·
            本报告内容仅供参考，不构成任何投资建议。股票市场有风险，投资须谨慎。
            过往表现不代表未来收益，请投资者自行判断并承担投资风险。
          </p>
        </footer>

        <pre id="ai-summary-text" style={{ display: 'none' }}>{fullAiSummaryText}</pre>

      </main>
    </div>
  );
}
