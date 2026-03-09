import { usePosts } from '../hooks/usePosts';
import PostCard from '../components/PostCard';
import { Link } from 'react-router-dom';
import './Home.css';

export default function Home() {
  const { posts, loading } = usePosts();
  
  if (loading) {
    return <div className="loading">加载中...</div>;
  }
  
  // 获取今天的文章
  const today = new Date().toISOString().split('T')[0];
  const todayPosts = posts.filter(p => p.date === today);
  
  // 分类文章
  const premarketCount = posts.filter(p => p.type === 'premarket').length;
  const intradayCount = posts.filter(p => p.type === 'intraday').length;
  const postmarketCount = posts.filter(p => p.type === 'postmarket').length;
  const recentPosts = posts.slice(0, 10);

  return (
    <div className="home">
      {/* Hero: minimal intro */}
      <section className="hero">
        <h1 className="hero-title">Market Notes</h1>
        <p className="hero-subtitle">
          记录盘前、盘中、盘后的市场观察与交易思考。
        </p>
        <Link to={todayPosts.length ? `/post/${todayPosts[0].slug}` : '/intraday'} className="hero-cta">
          {todayPosts.length ? '查看最新内容 →' : '查看文章 →'}
        </Link>
      </section>

      {/* 今日最新 */}
      {todayPosts.length > 0 && (
        <section className="section today-section">
          <h2 className="section-title">今日最新</h2>
          <div className="today-posts">
            {todayPosts.map(post => (
              <PostCard key={post.slug} post={post} />
            ))}
          </div>
        </section>
      )}
      
      {/* 分类入口 */}
      <section className="section">
        <h2 className="section-title">快速入口</h2>
        <div className="category-grid">
          <Link to="/premarket" className="category-card">
            <span className="category-icon">盘前</span>
            <span className="category-name">盘前</span>
            <span className="category-count">{premarketCount} 篇</span>
          </Link>
          <Link to="/intraday" className="category-card">
            <span className="category-icon">盘中</span>
            <span className="category-name">盘中</span>
            <span className="category-count">{intradayCount} 篇</span>
          </Link>
          <Link to="/postmarket" className="category-card">
            <span className="category-icon">盘后</span>
            <span className="category-name">盘后</span>
            <span className="category-count">{postmarketCount} 篇</span>
          </Link>
          <Link to="/archive" className="category-card">
            <span className="category-icon">归档</span>
            <span className="category-name">归档</span>
            <span className="category-count">{posts.length} 篇</span>
          </Link>
        </div>
      </section>
      
      {/* 最近更新 */}
      <section className="section">
        <h2 className="section-title">最近更新</h2>
        <div className="post-list">
          {recentPosts.map(post => (
            <PostCard key={post.slug} post={post} />
          ))}
        </div>
      </section>
    </div>
  );
}
