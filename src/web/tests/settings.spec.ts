import { expect, test } from '@playwright/test'
import { loginAsSuperAdmin } from './helpers/auth'

test.describe('Settings & Roles (super admin)', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsSuperAdmin(page)
    await page.goto('/settings')
    await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible()
  })

  test('happy path: roles & permissions are listed', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Roles & Permissions' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'SUPER ADMIN' })).toBeVisible({ timeout: 15000 })
    await expect(page.getByRole('heading', { name: 'CHURCH ADMIN' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'PASTOR' })).toBeVisible()
  })

  test('happy path: role cards show permission groups and edit/delete actions', async ({ page }) => {
    await expect(page.getByText('Create').first()).toBeVisible({ timeout: 15000 })
    await expect(page.getByText('Read').first()).toBeVisible()
    await expect(page.getByRole('button', { name: 'Edit' }).first()).toBeVisible()
    await expect(page.getByRole('button', { name: 'Delete' }).first()).toBeVisible()
  })
})
