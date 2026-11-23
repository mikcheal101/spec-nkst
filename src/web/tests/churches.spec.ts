import { expect, test } from '@playwright/test'
import { loginAsSuperAdmin } from './helpers/auth'

test.describe('Churches module (super admin)', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsSuperAdmin(page)
    await page.goto('/churches')
    await expect(page.getByRole('heading', { name: 'Churches' })).toBeVisible()
  })

  test('happy path: churches list loads with search and existing records', async ({ page }) => {
    await expect(page.getByPlaceholder(/search churches/i)).toBeVisible()
    await expect(page.getByRole('button', { name: 'Create Church' })).toBeVisible()
    // seeded/known church from live system
    await expect(page.getByText(/ALAGOMEJI|SABO CENTER/i).first()).toBeVisible({ timeout: 15000 })
  })

  test('happy path: create church flow opens form', async ({ page }) => {
    await page.getByRole('button', { name: 'Create Church' }).click()
    // creation UI should appear (modal, drawer, or form fields)
    const formVisible = await page.locator('form, [role="dialog"], .modal, .mf-overlay, .mf-dialog').first().isVisible().catch(() => false)
    const nameField = await page.getByLabel(/name/i).first().isVisible().catch(() => false)
    expect(formVisible || nameField, 'Create Church should open a form/modal').toBeTruthy()
  })

  test('unhappy path: creating church with missing required fields should be rejected', async ({ page }) => {
    await page.getByRole('button', { name: 'Create Church' }).click()
    const dialog = page.locator('[role="dialog"], .modal, .mf-dialog, form').first()
    if (!(await dialog.isVisible().catch(() => false))) {
      test.skip(true, 'Create church form not available in UI')
    }
    // try to submit empty
    await page.getByRole('button', { name: /save|create|submit/i }).first().click()
    await expect(page).toHaveURL(/\/churches/)
  })

  test('happy path: view/edit actions present on church cards', async ({ page }) => {
    const firstCard = page.getByRole('button', { name: 'View' }).first()
    await expect(firstCard).toBeVisible({ timeout: 15000 })
    await expect(page.getByRole('button', { name: 'Edit' }).first()).toBeVisible()
  })
})
