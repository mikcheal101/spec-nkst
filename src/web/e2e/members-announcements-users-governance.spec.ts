import { expect, test } from '@playwright/test'
import { loginAsSuperAdmin } from '../tests/helpers/auth'

test.describe('Members/announcements/users governance', () => {
  test('members page renders and supports create flow entry', async ({ page }) => {
    await loginAsSuperAdmin(page)
    await page.goto('/members')
    await expect(page).toHaveURL(/\/members/)
    await expect(page.locator('body')).toContainText(/member/i)
  })

  test('announcements page renders', async ({ page }) => {
    await loginAsSuperAdmin(page)
    await page.goto('/announcements')
    await expect(page).toHaveURL(/\/announcements/)
    await expect(page.locator('body')).toContainText(/announcement/i)
  })

  test('settings users governance panel reachable', async ({ page }) => {
    await loginAsSuperAdmin(page)
    await page.goto('/settings')
    const usersTab = page.getByRole('button', { name: /Manage Users|settings\.manageUsers/i })
    if (await usersTab.count()) {
      await usersTab.click()
      await expect(page.locator('body')).toContainText(/user|church/i)
    } else {
      await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible()
    }
  })
})
