import { expect, test } from '@playwright/test'
import { loginAsSuperAdmin } from './helpers/auth'

test.describe('Announcements module (super admin)', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsSuperAdmin(page)
    await page.goto('/announcements')
    await expect(page.getByRole('heading', { name: 'Announcements' })).toBeVisible()
  })

  test('happy path: announcements page renders with create action', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'New Announcement' })).toBeVisible()
    await expect(page.getByPlaceholder(/search announcements/i)).toBeVisible()
  })

  test('happy path: new announcement flow opens form', async ({ page }) => {
    await page.getByRole('button', { name: 'New Announcement' }).click()
    const formVisible = await page.locator('form, [role="dialog"], .modal, .mf-overlay, .mf-dialog').first().isVisible().catch(() => false)
    const titleField = await page.getByLabel(/title|subject/i).first().isVisible().catch(() => false)
    expect(formVisible || titleField, 'New Announcement should open a form/modal').toBeTruthy()
  })
})
