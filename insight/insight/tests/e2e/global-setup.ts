import { chromium, FullConfig } from '@playwright/test';
import fs from 'fs';
import path from 'path';

/**
 * Playwright global setup: performs a headless login using the admin credentials
 * provided via environment variables (TEST_EMAIL & TEST_PASSWORD) and saves the
 * authenticated storage state so all E2E tests can reuse it without repeating
 * the login flow.
 */
export default async function globalSetup(config: FullConfig) {
  const storageDir = path.join(__dirname, '.auth');
  const storagePath = path.join(storageDir, 'admin.json');

  // If the storage state already exists, reuse it to speed up runs
  if (fs.existsSync(storagePath)) {
    return;
  }

  if (!process.env.TEST_EMAIL || !process.env.TEST_PASSWORD) {
    throw new Error('Missing TEST_EMAIL or TEST_PASSWORD env variables.');
  }

  // Ensure directory exists
  fs.mkdirSync(storageDir, { recursive: true });

  const { projects } = config;
  const { baseURL } = projects[0].use;

  const browser = await chromium.launch();
  const page = await browser.newPage();

  // Navigate to the sign-in page
  await page.goto(`${baseURL}/auth/login`);

  // Fill and submit login form
  await page.fill('input[name="email"]', process.env.TEST_EMAIL);
  await page.fill('input[name="password"]', process.env.TEST_PASSWORD);
  await page.click('button[type="submit"]');

  // Wait for redirect to dashboard/resumen
  await page.waitForURL(/(dashboard|resumen-asistencial)/, { timeout: 15000 });

  // Save signed-in state
  await page.context().storageState({ path: storagePath });
  await browser.close();
}
