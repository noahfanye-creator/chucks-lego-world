import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { buildReportAiSummaryText } from '@/sections/ReportDetail';

/**
 * 独立路由 /reports/review/:code/ai-summary：
 * 仅展示 buildAiText() 的完整纯文本输出，无 HTML 壳。
 * 用 body 仅包含文本节点的方式模拟 text/plain 效果（SPA 无法改 Content-Type）。
 */
export default function ReportAiSummarySection() {
  const { code } = useParams<{ code: string }>();
  const [text, setText] = useState<string | null>(null);
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
        setText(buildReportAiSummaryText(raw));
      })
      .catch((e: unknown) => setError(e instanceof Error ? e.message : '加载失败'))
      .finally(() => setLoading(false));
  }, [code]);

  useEffect(() => {
    if (error || loading || text == null) return;
    const root = document.getElementById('root');
    if (!root) return;
    root.innerHTML = '';
    root.appendChild(document.createTextNode(text));
  }, [text, loading, error]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white text-sm text-slate-500">
        正在加载…
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white p-8">
        <pre className="whitespace-pre-wrap font-mono text-sm text-red-600">{error}</pre>
      </div>
    );
  }

  return null;
}
