import { Link } from 'react-router-dom';
import { usePostsByType, getTypeLabel, getTypeColor } from '../hooks/usePosts';
import PostCard from '../components/PostCard';
import './Category.css';

export default function Category({ type }) {
  const { posts, loading } = usePostsByType(type);
  
  const typeLabel = getTypeLabel(type);
  const typeColor = getTypeColor(type);
  
  if (loading) {
    return <div className="loading">加载中...</div>;
  }
  
  return (
    <div className="category-page">
      <div className="category-header" style={{ borderLeftColor: typeColor }}>
        <h1>{typeLabel}</h1>
        <p>{posts.length} 篇文章</p>
      </div>
      
      {posts.length === 0 ? (
        <div className="empty-state">
          <p>暂无文章</p>
          <Link to="/" className="back-link">返回首页</Link>
        </div>
      ) : (
        <div className="post-list">
          {posts.map(post => (
            <PostCard key={post.slug} post={post} />
          ))}
        </div>
      )}
    </div>
  );
}
