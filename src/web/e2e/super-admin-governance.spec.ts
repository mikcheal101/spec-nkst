import { expect, test } from '@playwright/test'
import { SUPER_ADMIN, loginAsSuperAdmin } from '../tests/helpers/auth'

test.describe('Super Admin governance', () => {
  test('super admin sign-in persists session', async ({ page }) => {
    await loginAsSuperAdmin(page)
    await page.reload()
    await expect(page).toHaveURL(/\/dashboard/)
    await expect(page.getByRole('heading', { name: /welcome/i })).toBeVisible()
  })

  test('settings governance tabs are visible for super admin', async ({ page }) => {
    await loginAsSuperAdmin(page)
    await page.goto('/settings')
    await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible()
    await expect(page.getByRole('button', { name: /Roles|Permissions|settings\.roles/i })).toBeVisible()
    await expect(page.locator('body')).toContainText(/Roles|Users|Configuration|Settings/i)
  })

  test('churches/sub-churches management surface is reachable', async ({ page }) => {
    await loginAsSuperAdmin(page)
    await page.goto('/churches')
    await expect(page).toHaveURL(/\/churches/)
    await expect(page.locator('body')).toContainText(/church/i)
  })
})
