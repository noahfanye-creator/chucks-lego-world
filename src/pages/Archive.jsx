import { usePosts } from '../hooks/usePosts';
import PostCard from '../components/PostCard';
import { useState } from 'react';
import './Archive.css';

export default function Archive() {
  const { posts, loading } = usePosts();
  const [view, setView] = useState('month'); // 'month' or 'all'
  
  if (loading) {
    return <div className="loading">加载中...</div>;
  }
  
  // 按月份分组
  const postsByMonth = {};
  posts.forEach(post => {
    const month = post.date.substring(0, 7); // YYYY-MM
    if (!postsByMonth[month]) {
      postsByMonth[month] = [];
    }
    postsByMonth[month].push(post);
  });
  
  // 按月份倒序
  const sortedMonths = Object.keys(postsByMonth).sort((a, b) => b.localeCompare(a));
  
  return (
    <div className="archive-page">
      <h1 className="page-title">📚 文章归档</h1>
      
      <div className="archive-stats">
        共 {posts.length} 篇文章
      </div>
      
      <div className="archive-list">
        {sortedMonths.map(month => (
          <div key={month} className="archive-month">
            <h2 className="month-title">{month}</h2>
            <div className="post-list">
              {postsByMonth[month].map(post => (
                <PostCard key={post.slug} post={post} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
