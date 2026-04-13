import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  // ✅ 正确的跨域代理
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:8080', // 去掉末尾的 /api
        changeOrigin: true,
        rewrite: (path) => path // 不修改路径（最稳妥）
      }
    }
  }
})