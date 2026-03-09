import { Link } from 'react-router-dom';
import { getTypeLabel, getTypeColor } from '../hooks/usePosts';
import './PostCard.css';

export default function PostCard({ post }) {
  const typeLabel = getTypeLabel(post.type);
  const typeColor = getTypeColor(post.type);
  
  return (
    <Link to={`/post/${post.slug}`} className="post-card">
      <div className="post-card-header">
        <span 
          className="post-type"
          style={{ background: typeColor }}
        >
          {typeLabel}
        </span>
        <span className="post-date">
          {post.date} {post.time && `· ${post.time}`}
        </span>
      </div>
      
      <h3 className="post-title">{post.title}</h3>
      
      {post.summary && (
        <p className="post-summary">{post.summary}</p>
      )}
      
      {post.tags && post.tags.length > 0 && (
        <div className="post-tags">
          {post.tags.slice(0, 3).map(tag => (
            <span key={tag} className="tag">{tag}</span>
          ))}
        </div>
      )}
    </Link>
  );
}
