import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    
    // GitHub Pages base path
    // 如果仓库名是 username.github.io，base 应该是 '/'
    // 如果是其他仓库名，base 应该是 '/repository-name/'
    // 可以通过环境变量 GITHUB_REPOSITORY_NAME 设置，默认为 '/'
    const base = process.env.GITHUB_REPOSITORY_NAME && process.env.GITHUB_REPOSITORY_NAME !== ''
      ? `/${process.env.GITHUB_REPOSITORY_NAME}/` 
      : '/';
    
    return {
      base: base,
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react()],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
