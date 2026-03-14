import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import type { ReportIndexItem } from '@/types/reports';

const TAB_MAP = {
  review: '复盘报告',
  intraday: '日内报告',
  market: '市场全景',
} as const;

export default function ReportListSection() {
  const [reports, setReports] = useState<ReportIndexItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetch('/data/reports/index.json')
      .then((res) => {
        if (!res.ok) throw new Error('加载报告列表失败');
        return res.json();
      })
      .then((data: ReportIndexItem[]) => {
        setReports(Array.isArray(data) ? data : []);
      })
      .catch((e: unknown) => {
        const message = e instanceof Error ? e.message : '加载失败，请稍后重试';
        setError(message);
      })
      .finally(() => setLoading(false));
  }, []);

  // 按 trade_date 分组的复盘报告
  const reviewGroups = (() => {
    const grouped: Record<string, ReportIndexItem[]> = {};
    reports
      .filter((r) => r.type === 'review')
      .forEach((item) => {
        const d = item.trade_date || item.date || '';
        if (!grouped[d]) grouped[d] = [];
        grouped[d].push(item);
      });
    // 按日期倒序排列
    return Object.entries(grouped).sort(([a], [b]) => b.localeCompare(a));
  })();

  const renderEmpty = () => (
    <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 py-16 text-center text-sm text-gray-400">
      暂无数据，敬请期待
    </div>
  );

  const renderLoading = () => (
    <div className="flex items-center justify-center py-16 text-sm text-gray-500">
      正在加载报告列表…
    </div>
  );

  const renderError = () => (
    <div className="rounded-lg border border-amber-200 bg-amber-50 p-6 text-center text-sm text-amber-800">
      <p>{error}</p>
      <p className="mt-2 text-xs text-amber-700">
        请检查 <span className="font-mono">/data/reports/index.json</span> 是否可访问。
      </p>
    </div>
  );

  return (
    <div className="min-h-screen bg-white">
      <main className="mx-auto max-w-5xl px-4 py-8">
        <header className="mb-8 space-y-2">
          <p className="text-sm font-medium tracking-wide text-gray-400">REPORT CENTER</p>
          <h1 className="text-2xl font-semibold text-gray-900 sm:text-3xl">报告中心</h1>
          <p className="text-sm text-gray-500">个股复盘 · 日内分析 · 市场全景</p>
        </header>

        <Tabs defaultValue="review" className="w-full">
          <TabsList className="mb-6 bg-slate-100 p-1">
            {(Object.keys(TAB_MAP) as Array<keyof typeof TAB_MAP>).map((key) => (
              <TabsTrigger
                key={key}
                value={key}
                className="data-[state=active]:bg-white data-[state=active]:text-gray-900"
              >
                {TAB_MAP[key]}
              </TabsTrigger>
            ))}
          </TabsList>

          {/* 复盘报告 Tab */}
          <TabsContent value="review" className="mt-0">
            {loading ? renderLoading() : error ? renderError() : reviewGroups.length === 0 ? renderEmpty() : (
              <div className="space-y-8">
                {reviewGroups.map(([date, items]) => (
                  <div key={date}>
                    <h2 className="mb-3 text-sm font-semibold text-gray-500 tracking-wide">{date}</h2>
                    <div className="space-y-3">
                      {items.map((item) => (
                        <Link key={`${item.code}-${item.trade_date || item.date}`} to={item.url}>
                          <div className="rounded-xl border border-slate-200 bg-slate-50/80 px-5 py-4 transition-all hover:-translate-y-0.5 hover:border-slate-300 hover:bg-white hover:shadow-sm">
                            <div className="flex items-center justify-between">
                              <span className="text-base font-semibold text-gray-900">{item.name}</span>
                              <span className="font-mono text-sm text-gray-500">{item.code}</span>
                            </div>
                            <div className="mt-1 flex items-center gap-3 text-xs text-gray-400">
                              <span>交易日：{item.trade_date || item.date || '-'}</span>
                              {item.generated_at && (
                                <span>生成：{item.generated_at.slice(11, 16)}</span>
                              )}
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* 日内报告 Tab */}
          <TabsContent value="intraday" className="mt-0">
            {renderEmpty()}
          </TabsContent>

          {/* 市场全景 Tab */}
          <TabsContent value="market" className="mt-0">
            {renderEmpty()}
          </TabsContent>
        </Tabs>

        <div className="mt-8 text-right text-xs text-gray-400">
          数据源：<span className="font-mono">chuckfan.com</span>
        </div>
      </main>
    </div>
  );
}
