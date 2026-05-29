import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

// Vite dev server runs on the host (5173). The NestJS backend runs in Docker
// with port 3000 published, so we proxy /api/* to localhost:3000 — NOT to
// the internal Docker hostname (which the host can't resolve).
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
  test: {
    environment: 'happy-dom',
    setupFiles: './src/test/setup.ts',
    // Deterministic origin so relative fetch('/api/...') and MSW handlers agree.
    environmentOptions: { happyDOM: { url: 'http://localhost:3000' } },
  },
});
