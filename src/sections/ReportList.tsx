import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { ReportIndexItem } from '@/types/reports';

const TAB_MAP = {
  review: '复盘报告',
  intraday: '日内报告',
  market: '市场全景',
} as const;

const TYPE_LABEL: Record<string, string> = {
  review: '复盘',
  intraday: '日内',
  market: '全景',
};

const TYPE_COLOR: Record<string, string> = {
  review: 'bg-blue-100 text-blue-700',
  intraday: 'bg-orange-100 text-orange-700',
  market: 'bg-green-100 text-green-700',
};

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

  return (
    <div className="min-h-screen bg-white">
      <main className="mx-auto max-w-5xl px-4 py-8">
        <header className="mb-8 space-y-2">
          <p className="text-sm font-medium tracking-wide text-gray-400">REPORT CENTER</p>
          <h1 className="text-2xl font-semibold text-gray-900 sm:text-3xl">报告中心</h1>
          <p className="text-sm text-gray-500">
            个股复盘 · 日内分析 · 市场全景
          </p>
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

          {(Object.keys(TAB_MAP) as Array<keyof typeof TAB_MAP>).map((tabKey) => (
            <TabsContent key={tabKey} value={tabKey} className="mt-0">
              {loading ? (
                <div className="flex items-center justify-center py-16 text-sm text-gray-500">
                  正在加载报告列表…
                </div>
              ) : error ? (
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-6 text-center text-sm text-amber-800">
                  <p>{error}</p>
                  <p className="mt-2 text-xs text-amber-700">
                    请检查 <span className="font-mono">/data/reports/index.json</span> 是否可访问。
                  </p>
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                  {reports
                    .filter((r) => r.type === tabKey)
                    .map((item) => (
                      <Link key={`${item.code}-${item.date}`} to={item.url}>
                        <Card className="group h-full border-slate-200 bg-slate-50/80 transition-all hover:-translate-y-0.5 hover:border-slate-300 hover:bg-white hover:shadow-sm">
                          <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                            <div>
                              <CardTitle className="text-base font-semibold text-gray-900">
                                {item.name}
                              </CardTitle>
                              <p className="mt-1 text-xs text-gray-500">
                                <span className="font-mono text-gray-700">{item.code}</span>
                                <span className="mx-1 text-gray-400">·</span>
                                <span>{item.date}</span>
                              </p>
                            </div>
                            <Badge
                              variant="secondary"
                              className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${TYPE_COLOR[item.type] ?? ''}`}
                            >
                              {TYPE_LABEL[item.type] ?? item.type}
                            </Badge>
                          </CardHeader>
                          <CardContent className="flex items-center justify-between pt-2 text-xs text-gray-500">
                            <span>点击查看详情</span>
                            <span className="text-[11px] text-gray-400">
                              最新 · {TAB_MAP[item.type as keyof typeof TAB_MAP] ?? '报告'}
                            </span>
                          </CardContent>
                        </Card>
                      </Link>
                    ))}

                  {!loading &&
                    !error &&
                    reports.filter((r) => r.type === tabKey).length === 0 && (
                      <div className="col-span-2 rounded-lg border border-dashed border-slate-200 bg-slate-50 py-12 text-center text-sm text-gray-500">
                        暂无{TAB_MAP[tabKey]}
                      </div>
                    )}
                </div>
              )}
            </TabsContent>
          ))}
        </Tabs>

        <div className="mt-8 text-right text-xs text-gray-400">
          数据源：<span className="font-mono">chuckfan.com</span>
        </div>
      </main>
    </div>
  );
}

