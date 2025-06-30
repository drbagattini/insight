import { defineConfig } from 'vitest/config';
import path from 'node:path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    exclude: ['insight/**', 'node_modules/**', '**/__tests__/**']
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname)
    }
  }
});
