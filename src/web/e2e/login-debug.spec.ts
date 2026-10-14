import { expect, test } from '@playwright/test'

test('debug login redirect', async ({ page }) => {
  const logs: string[] = []
  page.on('console', (msg) => logs.push(`[${msg.type()}] ${msg.text()}`))
  page.on('pageerror', (err) => logs.push(`[PAGE_ERROR] ${err.message}`))
  page.on('crash', () => logs.push('[CRASH]'))
  page.on('framenavigated', (frame) => {
    if (frame === page.mainFrame()) logs.push(`[NAV] ${page.url()}`)
  })

  await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle' })
  await page.waitForTimeout(500)
  await page.screenshot({ path: 'e2e/screenshots/01-before-login.png' })

  await page.fill('input[type="text"]', 'admin')
  await page.fill('input[type="password"]', 'Admin@12345')
  await page.screenshot({ path: 'e2e/screenshots/02-filled.png' })

  await page.click('button[type="submit"]')
  await page.waitForTimeout(3000)
  await page.screenshot({ path: 'e2e/screenshots/03-after-login.png' })

  const finalUrl = page.url()
  console.log('=== DEBUG LOGS ===')
  logs.forEach((l) => console.log(l))
  console.log('=== FINAL URL ===', finalUrl)
  console.log('=== LOCALSTORAGE ===')
  const token = await page.evaluate(() => localStorage.getItem('accessToken'))
  console.log('accessToken:', token ? token.substring(0, 50) + '...' : 'null')
  const refresh = await page.evaluate(() => localStorage.getItem('refreshToken'))
  console.log('refreshToken:', refresh ? refresh.substring(0, 50) + '...' : 'null')

  expect(finalUrl).toBe('http://localhost:5173/dashboard')
  expect(token).not.toBeNull()
  expect(token).not.toBe('undefined')
})
