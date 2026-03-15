#!/usr/bin/env python3
"""
从 review_*.json 生成与前端一致的完整 Markdown（review_{date}.md / review_latest.md）。
供 DMIT 服务器上 stock_report_generator.py 在生成 JSON/HTML 后调用，或单独运行。

用法：
  作为脚本：python generate_review_md.py /path/to/review_2026-03-15.json
    → 在同目录生成 review_2026-03-15.md 和 review_latest.md
  作为模块：from generate_review_md import build_report_notebook_text; md = build_report_notebook_text(data)
"""

from __future__ import annotations

import json
import os
import sys
from typing import Any

TABS = [
    {"key": "daily", "label": "日线"},
    {"key": "weekly", "label": "周线"},
    {"key": "monthly", "label": "月线"},
    {"key": "m30", "label": "30分钟"},
    {"key": "m5", "label": "5分钟"},
    {"key": "m1", "label": "1分钟"},
]


def to_num(v: Any) -> float | None:
    if v is None:
        return None
    if isinstance(v, (int, float)) and not (isinstance(v, bool)):
        return float(v) if (v == v) else None  # NaN check
    if isinstance(v, str):
        try:
            x = float(v)
            return x if (x == x) else None
        except ValueError:
            return None
    return None


def fmt(v: Any, d: int = 2) -> str:
    n = to_num(v)
    return "-" if n is None else f"{n:.{d}f}"


def pick_date_key(sample: Any) -> str:
    if not sample or not isinstance(sample, dict):
        return "time"
    if sample.get("time") and isinstance(sample["time"], str):
        return "time"
    if sample.get("trade_date") and isinstance(sample["trade_date"], str):
        return "trade_date"
    if sample.get("date") and isinstance(sample["date"], str):
        return "date"
    return "time"


def normalize_kline(raw: Any) -> list[dict]:
    if not isinstance(raw, list) or not raw:
        return []
    dk = pick_date_key(raw[0])
    result = []
    for d in raw:
        if not d or not isinstance(d, dict):
            continue
        r = d
        date = str(r.get(dk) or r.get("time") or r.get("date") or r.get("trade_date") or "")
        open_ = to_num(r.get("open"))
        high = to_num(r.get("high"))
        low = to_num(r.get("low"))
        close = to_num(r.get("close"))
        volume = to_num(r.get("volume"))
        if not date or open_ is None or high is None or low is None or close is None or volume is None:
            continue
        result.append({"date": date, "open": open_, "high": high, "low": low, "close": close, "volume": volume})
    result.sort(key=lambda x: (x["date"],))
    return result


def extract_payload(obj: Any) -> dict:
    if not obj:
        return {}
    if isinstance(obj, dict):
        if obj.get("data") and isinstance(obj["data"], dict):
            return obj["data"]
        if obj.get("payload") and isinstance(obj["payload"], dict):
            return obj["payload"]
        if obj.get("report") and isinstance(obj["report"], dict):
            return obj["report"]
    return obj if isinstance(obj, dict) else {}


def calc_ma(closes: list[float], length: int) -> list[float | None]:
    out = [None] * len(closes)
    for i in range(length - 1, len(closes)):
        s = sum(closes[i - j] for j in range(length))
        out[i] = s / length
    return out


def calc_ema(vals: list[float], span: int) -> list[float]:
    a = 2.0 / (span + 1)
    out = []
    prev = vals[0] if vals else 0.0
    for i, v in enumerate(vals):
        x = v if i == 0 else a * v + (1 - a) * prev
        prev = x
        out.append(x)
    return out


def calc_boll(closes: list[float], length: int = 20, k: float = 2.0) -> dict:
    mid = calc_ma(closes, length)
    upper, lower = [], []
    for i in range(len(closes)):
        m = mid[i]
        if m is None:
            upper.append(None)
            lower.append(None)
            continue
        var = 0.0
        for j in range(length):
            if i - j < 0:
                break
            d = closes[i - j] - m
            var += d * d
        import math
        std = math.sqrt(var / length) if var else 0
        upper.append(m + k * std)
        lower.append(m - k * std)
    return {"upper": upper, "mid": mid, "lower": lower}


def calc_macd(closes: list[float]) -> dict:
    e12 = calc_ema(closes, 12)
    e26 = calc_ema(closes, 26)
    dif = [e12[i] - e26[i] for i in range(len(closes))]
    dea = calc_ema(dif, 9)
    macd = [(dif[i] - dea[i]) * 2 for i in range(len(closes))]
    return {"dif": dif, "dea": dea, "macd": macd}


def calc_rsi(closes: list[float], period: int = 14) -> list[float | None]:
    out = [None] * len(closes)
    if len(closes) < period + 1:
        return out
    gain = sum(max(0, closes[i] - closes[i - 1]) for i in range(1, period + 1)) / period
    loss = sum(max(0, closes[i - 1] - closes[i]) for i in range(1, period + 1)) / period
    out[period] = 100.0 if loss == 0 else 100.0 - 100.0 / (1 + gain / loss)
    for i in range(period + 1, len(closes)):
        c = closes[i] - closes[i - 1]
        gain = (gain * (period - 1) + (c if c > 0 else 0)) / period
        loss = (loss * (period - 1) + (-c if c < 0 else 0)) / period
        out[i] = 100.0 if loss == 0 else 100.0 - 100.0 / (1 + gain / loss)
    return out


def nv(v: float | None) -> float | None:
    return v if v is not None else None


def build_summary(kline: list[dict], label: str) -> str:
    if not kline:
        return f"【{label}摘要】暂无数据。"
    last = kline[-1]
    prev = kline[-2] if len(kline) >= 2 else None
    closes = [d["close"] for d in kline]
    n = len(kline) - 1
    ma5 = calc_ma(closes, 5)
    ma10 = calc_ma(closes, 10)
    ma20 = calc_ma(closes, 20)
    ma60 = calc_ma(closes, 60)
    boll = calc_boll(closes)
    macd_res = calc_macd(closes)
    rsi14 = calc_rsi(closes, 14)
    chg_pct = (last["close"] - prev["close"]) / prev["close"] * 100 if prev else None
    avg_vol = sum(d["volume"] for d in kline[-5:]) / min(5, len(kline)) if kline else last["volume"]
    vol_desc = "明显放量" if last["volume"] > avg_vol * 1.3 else ("明显缩量" if last["volume"] < avg_vol * 0.7 else "与均量持平")
    rsi_val = rsi14[n]
    rsi_desc = "数据不足" if rsi_val is None else ("超买区间" if rsi_val > 70 else ("超卖区间" if rsi_val < 30 else "正常区间"))
    dif_val = macd_res["dif"][n]
    dea_val = macd_res["dea"][n]
    macd_signal = "MACD金叉" if dif_val > dea_val else "MACD死叉"
    b_upper, b_mid, b_lower = boll["upper"][n], boll["mid"][n], boll["lower"][n]
    boll_desc = "布林数据不足"
    if b_upper is not None and b_mid is not None and b_lower is not None:
        if last["close"] > b_upper:
            boll_desc = "布林上轨上方（超买）"
        elif last["close"] < b_lower:
            boll_desc = "布林下轨下方（超卖）"
        elif last["close"] > b_mid:
            boll_desc = "布林中轨上方"
        else:
            boll_desc = "布林中轨下方"
    chg_str = f"{chg_pct:.2f}" if chg_pct is not None else "-"
    return (
        f"【{label}摘要】当前收盘价{fmt(last['close'])}，较前日{chg_str}%。"
        f"MA5={fmt(ma5[n])}，MA10={fmt(ma10[n])}，MA20={fmt(ma20[n])}，MA60={fmt(ma60[n])}。"
        f"布林带上轨{fmt(b_upper)}，中轨{fmt(b_mid)}，下轨{fmt(b_lower)}，价格位于{boll_desc}。"
        f"MACD：DIF={fmt(dif_val, 3)}，DEA={fmt(dea_val, 3)}，{macd_signal}信号。"
        f"RSI(14)={fmt(rsi_val)}，{rsi_desc}。"
        f"成交量{last['volume'] / 10000:.2f}万手，{vol_desc}。"
    )


def build_ai_text(kline: list[dict], label: str, ind: dict | None) -> str:
    if not kline:
        return f"▌ {label} | 暂无数据\n"
    closes = [d["close"] for d in kline]
    n = len(kline) - 1
    ma5arr = calc_ma(closes, 5)
    ma10arr = calc_ma(closes, 10)
    ma20arr = calc_ma(closes, 20)
    ma60arr = calc_ma(closes, 60)
    boll_arr = calc_boll(closes)
    macd_arr = calc_macd(closes)
    rsi14arr = calc_rsi(closes, 14)
    ind = ind or {}
    ma5v = to_num(ind.get("MA5")) or nv(ma5arr[n])
    ma10v = to_num(ind.get("MA10")) or nv(ma10arr[n])
    ma20v = to_num(ind.get("MA20")) or nv(ma20arr[n])
    ma60v = to_num(ind.get("MA60")) or nv(ma60arr[n])
    difv = to_num(ind.get("MACD_DIF")) or macd_arr["dif"][n]
    deav = to_num(ind.get("MACD_DEA")) or macd_arr["dea"][n]
    macdv = to_num(ind.get("MACD")) or macd_arr["macd"][n]
    rsi14v = to_num(ind.get("RSI14")) or nv(rsi14arr[n])
    bb_u = to_num(ind.get("BB_Upper")) or nv(boll_arr["upper"][n])
    bb_m = to_num(ind.get("BB_Middle")) or nv(boll_arr["mid"][n])
    bb_l = to_num(ind.get("BB_Lower")) or nv(boll_arr["lower"][n])
    kdj_k, kdj_d, kdj_j = to_num(ind.get("KDJ_K")), to_num(ind.get("KDJ_D")), to_num(ind.get("KDJ_J"))
    last = kline[n]
    recent20 = kline[-20:]
    offset = len(kline) - len(recent20)
    kline_lines = "  日期          开盘    最高    最低    收盘    涨跌幅    成交量\n"
    for i in range(len(recent20) - 1, -1, -1):
        d = recent20[i]
        orig_idx = offset + i
        prev_close = kline[orig_idx - 1]["close"] if orig_idx > 0 else None
        pct = f"{(d['close'] - prev_close) / prev_close * 100:.2f}%" if prev_close and prev_close != 0 else "-"
        kline_lines += f"  {d['date']}  {d['open']:.2f}  {d['high']:.2f}  {d['low']:.2f}  {d['close']:.2f}  {pct:>7}  {int(d['volume'])}\n"
    ind_line1 = f"MA5={fmt(ma5v)} MA10={fmt(ma10v)} MA20={fmt(ma20v)} MA60={fmt(ma60v)}"
    ind_line2 = f"RSI14={fmt(rsi14v)} | DIF={fmt(difv, 3)} DEA={fmt(deav, 3)} MACD柱={fmt(macdv, 3)}"
    ind_line3 = f"KDJ K={fmt(kdj_k)} D={fmt(kdj_d)} J={fmt(kdj_j)}" if ind else "KDJ K=- D=- J=-（需日线indicators数据）"
    ind_line4 = f"布林带 上轨={fmt(bb_u)} 中轨={fmt(bb_m)} 下轨={fmt(bb_l)}"
    ma_desc = "-"
    if ma5v is not None and ma20v is not None and ma60v is not None:
        pos_ma5 = "在MA5上方" if last["close"] >= ma5v else "在MA5下方"
        arr = "多头排列(MA5>MA20>MA60)" if ma5v > ma20v and ma20v > ma60v else ("空头排列(MA5<MA20<MA60)" if ma5v < ma20v and ma20v < ma60v else "均线交叉整理中")
        ma_desc = f"价格{pos_ma5}，{arr}，MA20={fmt(ma20v)}"
    boll_desc = "-"
    if bb_u is not None and bb_m is not None and bb_l is not None:
        pos = "突破上轨（超买风险）" if last["close"] > bb_u else ("跌破下轨（超卖风险）" if last["close"] < bb_l else ("中轨上方（偏强）" if last["close"] > bb_m else "中轨下方（偏弱）"))
        bw_pct = f"{((bb_u - bb_l) / bb_m * 100):.2f}%" if bb_m and bb_m != 0 else "-"
        boll_desc = f"价格{pos}，带宽{bw_pct}"
    macd_desc = "-"
    if difv is not None and deav is not None:
        signal = "金叉状态" if difv > deav else "死叉状态"
        hist = "柱子为正(多方)" if macdv is not None and macdv >= 0 else ("柱子为负(空方)" if macdv is not None else "")
        macd_desc = f"{signal}，DIF={fmt(difv, 3)} DEA={fmt(deav, 3)}" + (f"，{hist}" if hist else "")
    rsi_desc = "-"
    if rsi14v is not None:
        zone = "超买区间(>70)" if rsi14v > 70 else ("超卖区间(<30)" if rsi14v < 30 else "正常区间")
        rsi_desc = f"RSI14={fmt(rsi14v)}，{zone}"
    vol_desc = "-"
    if len(kline) >= 3:
        v1, v2, v3 = kline[n]["volume"], kline[n - 1]["volume"], kline[n - 2]["volume"]
        trend = "连续放量" if v1 > v2 and v2 > v3 else ("连续缩量" if v1 < v2 and v2 < v3 else ("最新K线放量" if v1 > v2 * 1.3 else ("最新K线缩量" if v1 < v2 * 0.7 else "成交量基本持平")))
        vol_desc = f"{int(v3)}→{int(v2)}→{int(v1)}，{trend}"
    return (
        f"▌ {label} | 共{len(kline)}根K线 | 最新日期{last['date']} | 收盘{fmt(last['close'])} 开{fmt(last['open'])} 高{fmt(last['high'])} 低{fmt(last['low'])} 量{int(last['volume'])}\n\n"
        "  ① 近20根K线数据（时间倒序，最新在上）：\n"
        f"{kline_lines.rstrip()}\n\n"
        "  ② 技术指标当前值：\n"
        f"     {ind_line1}\n"
        f"     {ind_line2}\n"
        f"     {ind_line3}\n"
        f"     {ind_line4}\n\n"
        "  ③ 趋势结构描述：\n"
        f"     均线排列：{ma_desc}\n"
        f"     布林带  ：{boll_desc}\n"
        f"     MACD    ：{macd_desc}\n"
        f"     RSI     ：{rsi_desc}\n"
        f"     量价关系：{vol_desc}"
    )


def build_report_notebook_text(raw: Any) -> str:
    """从 report JSON（与 review_*.json 结构一致）生成完整 Markdown。与前端 / Node buildReportNotebookText 一致。"""
    payload = extract_payload(raw)
    if not payload:
        return "# 无数据\n"
    kline_map = {
        "daily": normalize_kline(payload.get("kline")),
        "weekly": normalize_kline(payload.get("kline_week")),
        "monthly": normalize_kline(payload.get("kline_month")),
        "m30": normalize_kline(payload.get("kline_30m")),
        "m5": normalize_kline(payload.get("kline_5m")),
        "m1": normalize_kline(payload.get("kline_1m")),
    }
    ind = payload.get("indicators")
    meta = payload.get("meta") or {}
    plan = meta.get("strategic_plan")
    chan = meta.get("chan")
    lines = []

    stock_name = payload.get("stock_name") or "-"
    stock_code = payload.get("stock_code") or "-"
    report_date = payload.get("report_date") or "-"
    generated_at = payload.get("generated_at") or "-"
    lines.append(f"# {stock_name}（{stock_code}）")
    lines.append(f"报告日期：{report_date}  生成时间：{generated_at}\n")

    kline = kline_map["daily"]
    latest = kline[-1] if kline else None
    prev = kline[-2] if len(kline) >= 2 else None
    header_close = to_num(meta.get("actual_close")) or (latest["close"] if latest else None)
    header_prev = to_num(meta.get("actual_prev_close")) or (prev["close"] if prev else None)
    header_chg_pct = to_num(meta.get("actual_change_pct"))
    if header_chg_pct is None and header_close is not None and header_prev is not None and header_prev != 0:
        header_chg_pct = (header_close - header_prev) / header_prev * 100
    chg_str = f"{header_chg_pct:+.2f}%" if header_chg_pct is not None else "-"
    lines.append("## 当日概览")
    lines.append(f"收盘价 {fmt(header_close)}，涨跌 {chg_str}。")
    if latest:
        lines.append(f"开盘 {fmt(latest['open'])} 最高 {fmt(latest['high'])} 最低 {fmt(latest['low'])} 成交量 {latest['volume'] / 10000:.2f} 万手。")
    lines.append("")

    money_flow = payload.get("money_flow") if isinstance(payload.get("money_flow"), list) else []
    chip = meta.get("chip")
    if money_flow or meta.get("margin") or chip or meta.get("northbound") or meta.get("sentiment"):
        lines.append("## 资金与筹码")
        if money_flow:
            lines.append("### 主力资金流向（近10日）")
            lines.append("| 日期 | 主力流入 | 主力流出 | 主力净额 | 散户净额 |")
            lines.append("|------|----------|----------|----------|----------|")
            mf_main, mf_retail = 0.0, 0.0
            for row in money_flow:
                d = row.get("date") or row.get("trade_date") or "-"
                main_in = to_num(row.get("main_in"))
                main_out = to_num(row.get("main_out"))
                main_net = to_num(row.get("main_net"))
                retail_net = -main_net if main_net is not None else None
                if main_net is not None:
                    mf_main += main_net
                if retail_net is not None:
                    mf_retail += retail_net
                lines.append(f"| {d} | {fmt(main_in)} | {fmt(main_out)} | {fmt(main_net)} | {fmt(retail_net)} |")
            lines.append(f"| 累计 | - | - | {mf_main:.2f} | {mf_retail:.2f} |")
            lines.append("单位：万元\n")
        if meta.get("margin"):
            m = meta["margin"]
            lines.append("### 融资融券")
            lines.append(f"融资余额 {fmt(m.get('balance'))}  融资买入 {fmt(m.get('buy'))}  融资偿还 {fmt(m.get('repay'))}  融券余额 {fmt(m.get('short_balance'))}")
            lines.append("")
        if chip:
            pr = chip.get("profit_ratio")
            co = chip.get("concentration")
            lines.append("### 筹码分布")
            lines.append(f"获利比例 {f'{pr * 100:.2f}%' if pr is not None else '-'}  平均成本 {fmt(chip.get('avg_cost'))}  集中度 {f'{co * 100:.2f}%' if co is not None else '-'}")
            lines.append("")
        if meta.get("northbound"):
            nb = meta["northbound"]
            r = nb.get("ratio")
            lines.append("### 北向资金")
            lines.append(f"持仓数量 {nb.get('shares') or '-'}  持仓比例 {fmt(r) + '%' if r is not None else '-'}  增减 {nb.get('change') or '-'}")
            lines.append("")
        if meta.get("sentiment"):
            s = meta["sentiment"]
            lines.append("### 市场情绪")
            lines.append(f"得分 {float(s.get('score', 0)):.2f}  {s.get('verdict', '')}  {s.get('hint') or ''}")
            lines.append("")
        lines.append("---\n")

    last20 = list(reversed(kline[-20:]))
    if last20:
        lines.append("## 近20日行情数据")
        lines.append("| 交易日 | 开盘 | 最高 | 最低 | 收盘 | 涨跌幅 | 成交量(手) | 成交额(亿) |")
        lines.append("|--------|------|------|------|------|--------|------------|------------|")
        for i, d in enumerate(last20):
            orig_idx = len(kline) - 1 - i
            prev_close = kline[orig_idx - 1]["close"] if orig_idx > 0 else None
            pct = (d["close"] - prev_close) / prev_close * 100 if prev_close and prev_close != 0 else None
            turnover = (d["close"] * d["volume"]) / 1e8
            pct_str = f"{pct:+.2f}%" if pct is not None else "-"
            vol_fmt = f"{int(d['volume']):,}"
            lines.append(f"| {d['date']} | {d['open']:.2f} | {d['high']:.2f} | {d['low']:.2f} | {d['close']:.2f} | {pct_str} | {vol_fmt} | {turnover:.2f} |")
        lines.append("")
        lines.append("---\n")

    if ind:
        lines.append("## 日线技术指标")
        ind_entries = [
            ("MA5", ind.get("MA5")), ("MA10", ind.get("MA10")), ("MA20", ind.get("MA20")), ("MA30", ind.get("MA30")),
            ("MA60", ind.get("MA60")), ("MA120", ind.get("MA120")), ("MA250", ind.get("MA250")),
            ("EMA12", ind.get("EMA12")), ("EMA26", ind.get("EMA26")),
            ("RSI6", ind.get("RSI6")), ("RSI12", ind.get("RSI12")), ("RSI14", ind.get("RSI14")), ("RSI24", ind.get("RSI24")),
            ("MACD", ind.get("MACD")), ("MACD_DIF", ind.get("MACD_DIF")), ("MACD_DEA", ind.get("MACD_DEA")),
            ("KDJ_K", ind.get("KDJ_K")), ("KDJ_D", ind.get("KDJ_D")), ("KDJ_J", ind.get("KDJ_J")),
            ("BB_Upper", ind.get("BB_Upper")), ("BB_Middle", ind.get("BB_Middle")), ("BB_Lower", ind.get("BB_Lower")),
            ("ATR14", ind.get("ATR14")), ("CCI20", ind.get("CCI20")),
        ]
        for label, val in ind_entries:
            if val is None:
                continue
            dec = 3 if label in ("MACD", "MACD_DIF", "MACD_DEA") else 2
            lines.append(f"{label}: {fmt(val, dec)}")
        lines.append("")
        lines.append("---\n")

    for tab in TABS:
        key, label = tab["key"], tab["label"]
        data = kline_map.get(key) or []
        ind_for_tab = ind if key == "daily" else None
        lines.append(f"## {label}")
        lines.append(build_summary(data, label))
        lines.append("")
        lines.append(build_ai_text(data, label, ind_for_tab))
        recent_k = data[-20:] if key == "daily" else data[-15:]
        if recent_k:
            recent_k = list(reversed(recent_k))
            lines.append("")
            lines.append(f"### {label} 最近{len(recent_k)}根K线")
            lines.append("| 日期 | 开 | 高 | 低 | 收 | 量(手) |")
            lines.append("|------|-----|-----|-----|-----|--------|")
            for d in recent_k:
                vol_fmt = f"{int(d['volume']):,}"
                lines.append(f"| {d['date']} | {d['open']:.2f} | {d['high']:.2f} | {d['low']:.2f} | {d['close']:.2f} | {vol_fmt} |")
        lines.append("")
        lines.append("---\n")

    if chan:
        lines.append("## 缠论结构")
        fractal_list = chan.get("fractals") or chan.get("fenxing") or []
        bis = chan.get("bis") or chan.get("bi") or []
        lines.append(f"共 {len(fractal_list)} 个分型，{len(bis)} 笔。")
        if chan.get("zhongshu"):
            z = chan["zhongshu"]
            lines.append(f"中枢区间：{fmt(z.get('low'))} ~ {fmt(z.get('high'))}")
        lines.append("")
        if fractal_list:
            lines.append("### 分型列表")
            for fx in fractal_list:
                raw_ts = fx.get("timestamp") or fx.get("date") or fx.get("trade_date") or "-"
                d = raw_ts[:10] if len(raw_ts) >= 10 else raw_ts
                ft = fx.get("fractal_type") or fx.get("type") or "-"
                t = "顶分型" if ft == "top" else ("底分型" if ft == "bottom" else ft)
                lines.append(f"- {t}  {d}  价格 {fmt(fx.get('price'))}")
            lines.append("")
        if bis:
            lines.append("### 笔列表")
            for b in bis:
                direction = b.get("direction") or "-"
                dir_cn = "向上笔" if direction == "up" else ("向下笔" if direction == "down" else str(direction))
                sd = b.get("start_date") or b.get("start_trade_date") or "-"
                ed = b.get("end_date") or b.get("end_trade_date") or "-"
                cp = b.get("change_pct")
                cp_str = f"{cp:+.2f}%" if cp is not None else "-"
                lines.append(f"- {dir_cn}  {sd} → {ed}  涨跌幅 {cp_str}")
        lines.append("")
        lines.append("---\n")

    if plan:
        lines.append("## 操作策略建议")
        bias_map = {"Bullish": "看多", "Bearish": "看空", "Neutral": "中性"}
        trend_bias = plan.get("scenarios", {}).get("trend_bias")
        if trend_bias:
            lines.append(f"趋势判断：{bias_map.get(trend_bias, trend_bias)}")
        if plan.get("scenarios", {}).get("action_plan"):
            lines.append(f"操作建议：{plan['scenarios']['action_plan']}")
        g = plan.get("grid") or {}
        if g.get("attack_line_ma5"):
            lines.append(f"攻击线(MA5)：{g['attack_line_ma5']}")
        if g.get("defense_line_ma20"):
            lines.append(f"防守线(MA20)：{g['defense_line_ma20']}")
        if g.get("support"):
            lines.append(f"支撑位：{g['support']}")
        if g.get("resistance"):
            lines.append(f"阻力位：{g['resistance']}")
        sc = plan.get("sector_context") or {}
        if sc.get("related_index") or sc.get("note"):
            lines.append(f"板块参考：{sc.get('related_index') or ''} {sc.get('note') or ''}".strip())
        lines.append("")
        lines.append("---\n")

    lines.append(f"数据来源：chuckfan.com  报告日期：{report_date}。")
    lines.append("本报告仅供参考，不构成任何投资建议。投资有风险，决策须谨慎。")
    return "\n".join(lines)


def get_report_date(payload: dict) -> str | None:
    raw = payload.get("report_date")
    if not raw:
        return None
    s = str(raw).strip().split()[0] if isinstance(raw, str) else str(raw)
    return s[:10] if len(s) >= 10 else s or None


def main() -> None:
    import argparse
    parser = argparse.ArgumentParser(description="从 review_*.json 生成 review_{date}.md 与 review_latest.md")
    parser.add_argument("json_path", nargs="?", help="review_*.json 路径（不传则从 stdin 读 JSON）")
    parser.add_argument("-o", "--output", help="只写到此文件（不写 review_latest.md）")
    parser.add_argument("--no-latest", action="store_true", help="不写 review_latest.md，只写 review_{date}.md")
    args = parser.parse_args()

    if args.json_path:
        with open(args.json_path, "r", encoding="utf-8") as f:
            raw = json.load(f)
        payload = extract_payload(raw)
        report_date = get_report_date(payload)
        out_dir = os.path.dirname(os.path.abspath(args.json_path))
    else:
        raw = json.load(sys.stdin)
        payload = extract_payload(raw)
        report_date = get_report_date(payload)
        out_dir = os.getcwd()

    md = build_report_notebook_text(raw)

    if args.output:
        with open(args.output, "w", encoding="utf-8") as f:
            f.write(md)
        print(f"Wrote: {args.output}", file=sys.stderr)
        return

    if report_date:
        path_dated = os.path.join(out_dir, f"review_{report_date}.md")
        with open(path_dated, "w", encoding="utf-8") as f:
            f.write(md)
        print(f"Wrote: {path_dated}", file=sys.stderr)
    if not args.no_latest and out_dir:
        path_latest = os.path.join(out_dir, "review_latest.md")
        with open(path_latest, "w", encoding="utf-8") as f:
            f.write(md)
        print(f"Wrote: {path_latest}", file=sys.stderr)


if __name__ == "__main__":
    main()
