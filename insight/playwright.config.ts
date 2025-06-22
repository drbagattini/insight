import { defineConfig } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
// Extract port from BASE_URL (defaults to 80/443 if not specified)
let serverPort = 3000;
try {
  const parsed = new URL(BASE_URL);
  serverPort = parsed.port ? Number(parsed.port) : (parsed.protocol === 'https:' ? 443 : 80);
} catch {
  // Fallback keep default 3000
}

export default defineConfig({
  globalSetup: './tests/e2e/global-setup.ts',
  testDir: './tests/e2e',
  timeout: 30_000,
  retries: process.env.CI ? 2 : 0,
  use: {
    baseURL: BASE_URL,
    storageState: 'tests/e2e/.auth/admin.json',
    headless: true,
    viewport: { width: 1280, height: 720 },
    actionTimeout: 0,
  },
  webServer: {
    command: process.env.CI ? 'npm run build && npm run start' : 'npm run dev:noturbo',
    port: serverPort,
    timeout: 120 * 1000,
    reuseExistingServer: !process.env.CI,
  },
});
