import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: '.',
  testMatch: ['e2e/**/*.spec.ts', 'tests/**/*.spec.ts'],
  testIgnore: ['**/node_modules/**', '**/dist/**'],
  timeout: 60000,
  expect: { timeout: 15000 },
  fullyParallel: false,
  // The E2E suite runs against a single shared Docker stack and mutates
  // churches/members/announcements. Serial execution keeps state deterministic.
  workers: 1,
  retries: 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  outputDir: 'test-results',
  use: {
    baseURL: 'http://localhost:3000',
    browserName: 'chromium',
    channel: process.env.PW_CHANNEL || 'chrome',
    headless: true,
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
    video: 'retain-on-failure',
  },
})
