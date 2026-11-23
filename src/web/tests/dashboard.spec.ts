import { expect, test } from '@playwright/test'
import { loginAsSuperAdmin } from './helpers/auth'

test.describe('Dashboard & navigation (super admin)', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsSuperAdmin(page)
  })

  test('happy path: dashboard shows welcome and key sections', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /welcome/i })).toBeVisible()
    await expect(page.getByText('Members').first()).toBeVisible()
    await expect(page.getByText('Churches').first()).toBeVisible()
    await expect(page.getByText('Contributions').first()).toBeVisible()
    await expect(page.getByText('Projects').first()).toBeVisible()
    await expect(page.getByText('Announcements').first()).toBeVisible()
  })

  test('happy path: sidebar navigates to all main modules', async ({ page }) => {
    await page.getByRole('link', { name: /Churches/ }).click()
    await expect(page).toHaveURL(/\/churches/)
    await expect(page.getByRole('heading', { name: 'Churches' })).toBeVisible()

    await page.getByRole('link', { name: /Members/ }).click()
    await expect(page).toHaveURL(/\/members/)
    await expect(page.getByRole('heading', { name: 'Members' })).toBeVisible()

    await page.getByRole('link', { name: /Announcements/ }).click()
    await expect(page).toHaveURL(/\/announcements/)
    await expect(page.getByRole('heading', { name: 'Announcements' })).toBeVisible()

    await page.getByRole('link', { name: /Settings/ }).click()
    await expect(page).toHaveURL(/\/settings/)
    await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible()

    await page.getByRole('link', { name: /Dashboard/ }).click()
    await expect(page).toHaveURL(/\/dashboard/)
  })

  test('header shows profile and notifications links', async ({ page }) => {
    await expect(page.getByRole('link', { name: /super-admin/ })).toBeVisible()
    await page.getByRole('link', { name: /super-admin/ }).click()
    await expect(page).toHaveURL(/\/profile/)
  })
})
