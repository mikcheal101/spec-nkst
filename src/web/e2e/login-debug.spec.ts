import { expect, test } from '@playwright/test'

test('debug login redirect', async ({ page }) => {
  const logs: string[] = []
  page.on('console', (msg) => logs.push(`[${msg.type()}] ${msg.text()}`))
  page.on('pageerror', (err) => logs.push(`[PAGE_ERROR] ${err.message}`))
  page.on('crash', () => logs.push('[CRASH]'))
  page.on('framenavigated', (frame) => {
    if (frame === page.mainFrame()) logs.push(`[NAV] ${page.url()}`)
  })

  await page.goto('/login', { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(500)

  await page.getByLabel('Username').fill('super-admin')
  await page.getByLabel('Password').fill('super-admin')
  await page.getByRole('button', { name: 'Sign In' }).click()

  await page.waitForURL('**/dashboard', { timeout: 15000 })
  await expect(page.getByRole('heading', { name: /welcome, super-admin/i })).toBeVisible({ timeout: 15000 })

  const finalUrl = page.url()
  console.log('=== DEBUG LOGS ===')
  logs.forEach((l) => console.log(l))
  console.log('=== FINAL URL ===', finalUrl)
  console.log('=== LOCALSTORAGE ===')
  await expect.poll(() => page.evaluate(() => localStorage.getItem('accessToken')), { timeout: 10000 }).not.toBeNull()
  const token = await page.evaluate(() => localStorage.getItem('accessToken'))
  console.log('accessToken:', token ? token.substring(0, 50) + '...' : 'null')
  const refresh = await page.evaluate(() => localStorage.getItem('refreshToken'))
  console.log('refreshToken:', refresh ? refresh.substring(0, 50) + '...' : 'null')

  expect(finalUrl).toContain('/dashboard')
  expect(token).not.toBeNull()
  expect(token).not.toBe('undefined')
})
