import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: './',
  plugins: [
    react(),
    {
      name: 'markdown-loader',
      enforce: 'pre',
      transform(code, id) {
        if (id.endsWith('.md')) {
          // 返回原始markdown内容，vite的 ?raw 会处理
          return code;
        }
      }
    }
  ],
  assetsInclude: ['**/*.md'],
  build: {
    outDir: 'dist',
    sourcemap: false
  }
});
