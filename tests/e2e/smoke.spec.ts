import { test, expect } from '@playwright/test';

// Simple smoke test: application root should respond with 200 OK and render HTML.
test('homepage should load', async ({ page }) => {
  const response = await page.goto('/');
  // Verify network response status
  expect(response?.status()).toBe(200);
  // Expect some HTML content present (e.g., <!DOCTYPE html>)
  const content = await page.content();
  expect(content).toMatch(/<!DOCTYPE html>/i);
});
