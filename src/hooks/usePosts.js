import { useState, useEffect } from 'react';

// 简易 frontmatter 解析（不依赖 gray-matter，避免 Buffer/eval，兼容 CSP）
function parseFrontMatter(raw) {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!match) return { data: {}, body: raw };
  const body = match[2];
  const data = {};
  const lines = match[1].split(/\r?\n/);
  for (const line of lines) {
    const colonIndex = line.indexOf(':');
    if (colonIndex === -1) continue;
    const key = line.slice(0, colonIndex).trim();
    let value = line.slice(colonIndex + 1).trim();
    if (value.startsWith('[') && value.endsWith(']')) {
      try {
        data[key] = JSON.parse(value);
      } catch {
        data[key] = value;
      }
    } else if (value === 'true') {
      data[key] = true;
    } else if (value === 'false') {
      data[key] = false;
    } else {
      data[key] = value;
    }
  }
  return { data, body };
}

// 确保 date/time 为字符串，避免 React 渲染 Date 对象报错 #31
function toDateString(v) {
  if (v == null) return '';
  if (typeof v === 'string') return v;
  if (typeof v === 'object' && typeof v.toISOString === 'function') return v.toISOString().slice(0, 10);
  return String(v);
}
function toTimeString(v) {
  if (v == null) return '';
  if (typeof v === 'string') return v;
  if (typeof v === 'object' && typeof v.toISOString === 'function') return v.toISOString().slice(11, 16);
  return String(v);
}

// 直接在组件中导入所有 markdown 文件（raw 字符串）
const postModules = import.meta.glob('../content/posts/*.md', { query: '?raw', import: 'default', eager: true });

export function usePosts() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadPosts = async () => {
      const postFiles = Object.keys(postModules);
      
      const loadedPosts = postFiles.map(filePath => {
        const fileName = filePath.split('/').pop();
        const content = postModules[filePath];
        const { data, body } = parseFrontMatter(typeof content === 'string' ? content : String(content));
        const tags = Array.isArray(data.tags) ? data.tags : [];
        return {
          slug: fileName.replace('.md', ''),
          title: data.title ?? '',
          date: toDateString(data.date),
          time: toTimeString(data.time),
          type: data.type ?? '',
          tags,
          summary: data.summary ?? '',
          body,
          draft: Boolean(data.draft)
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
    premarket: '盘前',
    intraday: '盘中',
    postmarket: '盘后',
    weekly: '周复盘'
  };
  return labels[type] || type;
}

export function getTypeColor(type) {
  const colors = {
    premarket: 'var(--color-accent)',
    intraday: 'var(--color-accent)',
    postmarket: 'var(--color-accent)',
    weekly: 'var(--color-accent)'
  };
  return colors[type] || 'var(--color-text-secondary)';
}
