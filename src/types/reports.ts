/** 报告列表项（index.json 单条） */
export interface ReportIndexItem {
  type: 'review' | 'intraday' | 'market';
  code: string;
  name: string;
  date?: string;
  trade_date?: string;
  generated_at?: string;
  url: string;
  html_url?: string;
}

/** 复盘报告详情（review_latest.json） */
export interface ReportReviewData {
  stock_code: string;
  stock_name: string;
  report_date: string;
  kline: KlinePoint[];
  indicators: Indicators;
  meta: ReportMeta;
}

export interface KlinePoint {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface Indicators {
  MA5?: number;
  MA10?: number;
  MA20?: number;
  MA60?: number;
  RSI14?: number;
  DIF?: number;
  DEA?: number;
  MACD?: number;
  KDJ_K?: number;
  KDJ_D?: number;
  KDJ_J?: number;
  BB_upper?: number;
  BB_mid?: number;
  BB_lower?: number;
}

export interface ReportMeta {
  sentiment?: {
    score: number;
    verdict: string;
    hint: string;
  };
  chip?: {
    profit_ratio: number;
    avg_cost: number;
    concentration: number;
  };
  strategic_plan?: {
    position: string;
    entry: string;
    stop_loss: string;
    target: string;
    note: string;
  };
  chan_summary?: string;
}
