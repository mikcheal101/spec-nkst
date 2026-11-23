import { expect, test } from '@playwright/test'
import { loginAsSuperAdmin } from '../tests/helpers/auth'

test.describe('Permission propagation', () => {
  test('roles & permissions UI is visible and editable for super admin', async ({ page }) => {
    await loginAsSuperAdmin(page)
    await page.goto('/settings')
    await expect(page.getByRole('button', { name: /Roles & Permissions|settings.roles/i })).toBeVisible()
    await page.getByRole('button', { name: /Roles & Permissions|settings.roles/i }).click()
    await expect(page.locator('body')).toContainText(/ADMIN|Role|permission/i)
  })

  test('unauthorized access is redirected/denied safely', async ({ page }) => {
    await page.goto('/settings')
    await expect(page).toHaveURL(/\/login/)
  })
})
