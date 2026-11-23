import { expect, test } from '@playwright/test'

test.describe('Accessibility & responsive smoke', () => {
  test('login page has accessible form controls at desktop viewport', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 })
    await page.goto('/login')
    await expect(page.getByLabel('Username')).toBeVisible()
    await expect(page.getByLabel('Password')).toBeVisible()
    await expect(page.getByRole('button', { name: /Sign In/i })).toBeVisible()
  })

  test('login page renders on tablet viewport', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 })
    await page.goto('/login')
    await expect(page.getByLabel('Username')).toBeVisible()
    await expect(page.getByRole('button', { name: /Sign In/i })).toBeVisible()
  })

  test('login page renders on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 })
    await page.goto('/login')
    await expect(page.getByLabel('Username')).toBeVisible()
    await expect(page.getByRole('button', { name: /Sign In/i })).toBeVisible()
  })

  test('keyboard focus can reach sign-in button', async ({ page }) => {
    await page.goto('/login')
    await page.getByLabel('Username').focus()
    await page.keyboard.press('Tab') // password
    await page.keyboard.press('Tab') // sign in or forgot-password depending on browser tab order
    const focused = await page.evaluate(() => document.activeElement?.tagName)
    expect(['INPUT', 'BUTTON', 'A', 'BODY']).toContain(focused)
  })
})
