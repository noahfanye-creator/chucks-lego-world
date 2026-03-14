import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { buildReportNotebookText } from '@/sections/ReportDetail';

export default function ReportDetailNotebookSection() {
  const { code } = useParams<{ code: string }>();
  const [text, setText] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!code) return;
    setLoading(true);
    setError(null);
    fetch(`/data/reports/${code}/review_latest.json`)
      .then(r => {
        if (!r.ok) throw new Error('加载报告失败');
        return r.json();
      })
      .then(raw => {
        setText(buildReportNotebookText(raw));
      })
      .catch((e: unknown) => setError(e instanceof Error ? e.message : '加载失败'))
      .finally(() => setLoading(false));
  }, [code]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 text-sm text-slate-500">
        正在加载…
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 p-8">
        <div className="rounded border border-amber-200 bg-amber-50 p-5 text-sm text-amber-800">
          <p className="font-medium">{error}</p>
          <Link to="/reports" className="mt-3 inline-flex items-center gap-1.5 text-xs text-amber-700 underline">
            <ArrowLeft className="h-3 w-3" />返回报告列表
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur-sm shadow-sm">
        <div className="mx-auto max-w-3xl px-6 py-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Link to="/reports" className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 px-3 py-1 text-xs text-slate-600 hover:border-slate-300 hover:text-slate-900">
                <ArrowLeft className="h-3.5 w-3.5" />报告列表
              </Link>
              <Link to={`/reports/review/${code}`} className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 px-3 py-1 text-xs text-slate-600 hover:border-slate-300 hover:text-slate-900">
                详情页
              </Link>
            </div>
            <p className="text-[11px] text-slate-400">NotebookLM 友好版 · 纯文本</p>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-6 py-8">
        <article
          className="prose prose-slate max-w-none font-mono text-sm leading-relaxed whitespace-pre-wrap"
          style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}
        >
          {text || '暂无内容'}
        </article>
        <footer className="mt-8 pt-6 border-t border-slate-100 text-[11px] text-slate-400">
          数据来源：chuckfan.com · 仅供参考，不构成投资建议
        </footer>
      </main>
    </div>
  );
}
