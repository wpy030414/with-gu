import { fileURLToPath, URL } from 'node:url'

import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [react()],

  // 自定义域名 with-gu.xrl.im 部署在根路径
  // 无路由 ⇒ 无 SPA 404 回退需求
  base: '/',

  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },

  build: {
    target: 'es2022',
    sourcemap: false,
  },

  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
    include: ['tests/unit/**/*.{test,spec}.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      // 覆盖率主战场是零 DOM 的纯逻辑层
      include: ['src/engine/**', 'src/content/**', 'src/hooks/**'],
      reporter: ['text', 'html'],
    },
  },
})
