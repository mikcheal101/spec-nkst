import fs from 'node:fs'
import { defineConfig, devices } from '@playwright/test'

const hasMsEdge =
  process.platform === 'darwin'
    ? fs.existsSync('/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge')
    : process.platform === 'win32'
      ? true
      : fs.existsSync('/usr/bin/microsoft-edge') || fs.existsSync('/usr/bin/microsoft-edge-stable')

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
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'], baseURL: 'http://localhost:3000', headless: true } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'], baseURL: 'http://localhost:3000', headless: true } },
    { name: 'webkit', use: { ...devices['Desktop Safari'], baseURL: 'http://localhost:3000', headless: true } },
    ...(hasMsEdge
      ? [{ name: 'edge', use: { ...devices['Desktop Edge'], channel: 'msedge' as const, baseURL: 'http://localhost:3000', headless: true } }]
      : []),
  ],
  use: {
    baseURL: 'http://localhost:3000',
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
    video: 'retain-on-failure',
  },
})
