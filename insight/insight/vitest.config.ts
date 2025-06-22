import { defineConfig } from 'vitest/config';
import path from 'node:path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    // Exclude Playwright end-to-end specs; they are run separately via `npm run test:e2e`
    exclude: ['tests/e2e/**']
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname)
    }
  }
});
