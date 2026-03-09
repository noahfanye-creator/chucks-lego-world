import { useState, useEffect } from 'react';
import matter from 'gray-matter';

// 直接在组件中导入所有markdown文件
const postModules = import.meta.glob('./content/posts/*.md', { as: 'raw', eager: true });

export function usePosts() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadPosts = async () => {
      const postFiles = Object.keys(postModules);
      
      const loadedPosts = postFiles.map(filePath => {
        const fileName = filePath.split('/').pop();
        const content = postModules[filePath];
        const { data, content: body } = matter(content);
        
        return {
          slug: fileName.replace('.md', ''),
          title: data.title,
          date: data.date,
          time: data.time,
          type: data.type,
          tags: data.tags || [],
          summary: data.summary || '',
          body,
          draft: data.draft || false
        };
      });

      // 按日期和时间排序，最新的在前
      loadedPosts.sort((a, b) => {
        const dateA = new Date(`${a.date} ${a.time || '00:00'}`);
        const dateB = new Date(`${b.date} ${b.time || '00:00'}`);
        return dateB - dateA;
      });

      // 过滤掉草稿
      const publishedPosts = loadedPosts.filter(p => !p.draft);
      
      setPosts(publishedPosts);
      setLoading(false);
    };

    loadPosts();
  }, []);

  return { posts, loading };
}

export function usePostsByType(type) {
  const { posts, loading } = usePosts();
  const filteredPosts = posts.filter(p => p.type === type);
  return { posts: filteredPosts, loading };
}

export function usePost(slug) {
  const { posts, loading } = usePosts();
  const post = posts.find(p => p.slug === slug);
  return { post, loading };
}

export function getTypeLabel(type) {
  const labels = {
    premarket:    intraday: '盘前',
 '盘中',
    postmarket: '盘后',
    weekly: '周复盘'
  };
  return labels[type] || type;
}

export function getTypeColor(type) {
  const colors = {
    premarket: '#FF6B6B',
    intraday: '#4ECDC4',
    postmarket: '#45B7D1',
    weekly: '#96CEB4'
  };
  return colors[type] || '#666';
}
