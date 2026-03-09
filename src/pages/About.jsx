import { Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import './About.css';

const aboutContent = `## 这是什么？

**Market Notes（市场观察）** 是一个个人使用的**市场复盘与信息整理工具**，用于记录盘前、盘中、盘后的市场观察与交易思考，方便日后查阅与回溯。

---

## 谁在用？

仅**本人**使用，不对外提供服务，也不对任何他人构成投资建议或信息依据。

---

## 怎么用？

- **盘前**：开盘前看隔夜与当日可能影响市场的信息，形成当日预期与关注点。
- **盘中**：盘中重要信息与异动速记，用于临时调整或记录。
- **盘后**：收盘后做当日复盘，包括指数、板块、情绪、资金风格与明日观察等。

内容按**日期 + 类型**组织，可通过首页入口或**归档**按时间浏览。单篇详情路径为 \`/post/文件名\`（如 \`/post/2026-03-09-postmarket\`）。

---

## 数据与信息来源

- 指数、涨跌家数、成交额等**行情数据**来源于公开信息与第三方数据源（如交易所、财经终端、财经媒体等），本人不保证其实时性与准确性。
- **文字结论、判断与观点**均为个人看法，可能引用或参考媒体报道、研报、社区讨论等，但**不构成任何形式的投资建议或承诺**。

---

## 免责与使用须知

- 本工具及其中所有内容仅供**个人记录与学习**使用。
- 任何人因依赖本工具内信息所做的任何决策与后果，均与本人无关；**投资有风险，决策需谨慎**。
- 本人**不对外提供咨询、荐股或任何形式的投资建议**，也不对内容的准确性、完整性、及时性做任何保证。
- 如需引用或参考，请以**原始数据源与权威发布**为准。

---

## 关于本页

本说明页用于说明站点性质与使用方式，路径为 \`/about\`。`;

export default function About() {
  return (
    <article className="about-page">
      <header className="about-header">
        <img
          src="/og-image-1200x630.png"
          alt="Market Notes · 市场观察"
          className="about-header-img"
        />
        <h1 className="about-title">关于</h1>
      </header>

      <div className="about-content">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>
          {aboutContent}
        </ReactMarkdown>
      </div>

      <footer className="about-footer">
        <Link to="/" className="back-btn">← 返回首页</Link>
      </footer>
    </article>
  );
}
