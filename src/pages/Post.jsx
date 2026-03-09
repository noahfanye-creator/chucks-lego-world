import { useParams, Link } from 'react-router-dom';
import { usePost, getTypeLabel, getTypeColor } from '../hooks/usePosts';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import './Post.css';

export default function Post() {
  const { slug } = useParams();
  const { post, loading } = usePost(slug);
  
  if (loading) {
    return <div className="loading">加载中...</div>;
  }
  
  if (!post) {
    return (
      <div className="not-found">
        <h2>文章未找到</h2>
        <Link to="/">返回首页</Link>
      </div>
    );
  }
  
  const typeLabel = getTypeLabel(post.type);
  const typeColor = getTypeColor(post.type);
  
  return (
    <article className="post-page">
      <header className="post-header">
        <div className="post-meta">
          <span 
            className="post-type"
            style={{ background: typeColor }}
          >
            {typeLabel}
          </span>
          <span className="post-date">
            {post.date} · {post.time}
          </span>
        </div>
        
        <h1 className="post-title">{post.title}</h1>
        
        {post.tags && post.tags.length > 0 && (
          <div className="post-tags">
            {post.tags.map(tag => (
              <span key={tag} className="tag">{tag}</span>
            ))}
          </div>
        )}
        
        {post.summary && (
          <div className="post-summary-box">
            <strong>一句话结论：</strong>
            {post.summary}
          </div>
        )}
      </header>
      
      <div className="post-content">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>
          {post.body}
        </ReactMarkdown>
      </div>
      
      <footer className="post-footer">
        <Link to="/" className="back-btn">← 返回首页</Link>
      </footer>
    </article>
  );
}
