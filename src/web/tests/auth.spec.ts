import { expect, test } from '@playwright/test'
import { loginAsSuperAdmin, SUPER_ADMIN } from './helpers/auth'

test.describe('Authentication', () => {
  test('happy path: super admin can sign in and reaches dashboard', async ({ page }) => {
    await loginAsSuperAdmin(page)
    await expect(page.getByRole('heading', { name: /welcome/i })).toBeVisible()
    await expect(page.getByText('super-admin')).toBeVisible()
  })

  test('unhappy path: wrong password shows error and stays on login', async ({ page }) => {
    await page.goto('/login')
    await page.getByLabel('Username').fill(SUPER_ADMIN.username)
    await page.getByLabel('Password').fill('definitely-wrong-password')
    await page.getByRole('button', { name: 'Sign In' }).click()

    await expect(page).toHaveURL(/\/login/)
    await expect(page.getByText(/invalid|incorrect|wrong|error|failed|unauthorized/i).first()).toBeVisible({ timeout: 10000 })
  })

  test('unhappy path: unknown username shows error', async ({ page }) => {
    await page.goto('/login')
    await page.getByLabel('Username').fill('no-such-user-xyz')
    await page.getByLabel('Password').fill('whatever')
    await page.getByRole('button', { name: 'Sign In' }).click()

    await expect(page).toHaveURL(/\/login/)
    await expect(page.getByText(/invalid|incorrect|not found|error|failed|unauthorized/i).first()).toBeVisible({ timeout: 10000 })
  })

  test('unhappy path: empty submit is blocked by client validation', async ({ page }) => {
    await page.goto('/login')
    await page.getByRole('button', { name: 'Sign In' }).click()
    await expect(page).toHaveURL(/\/login/)
  })

  test('happy path: logout returns to login', async ({ page }) => {
    await loginAsSuperAdmin(page)
    await page.getByText('Logout').click()
    await expect(page).toHaveURL(/\/login/, { timeout: 10000 })
  })

  test('unhappy path: protected route redirects unauthenticated user to login', async ({ page }) => {
    await page.goto('/dashboard')
    await expect(page).toHaveURL(/\/login/, { timeout: 10000 })
  })

  test('forgot password page is reachable', async ({ page }) => {
    await page.goto('/forgot-password')
    await expect(page).toHaveURL(/\/forgot-password/)
    await expect(page.locator('body')).not.toBeEmpty()
  })

  test('login page has no self-service registration link (accounts are admin-created)', async ({ page }) => {
    await page.goto('/login')
    await expect(page.getByRole('heading', { name: /sign in/i })).toBeVisible()
    await expect(page.getByRole('link', { name: /register|sign.?up|create account/i })).toHaveCount(0)
    await expect(page.getByRole('button', { name: /register|sign.?up|create account/i })).toHaveCount(0)
    await expect(page.locator('a[href*="register"], a[href*="signup"], a[href*="sign-up"]')).toHaveCount(0)
  })

  test('login and auth pages do not display the old Tiv slogan', async ({ page }) => {
    for (const path of ['/login', '/forgot-password', '/reset-password']) {
      await page.goto(path)
      await expect(page.getByText(/Nongo u Kristu u ken Sudan hen Tiv/i)).toHaveCount(0)
    }
  })
})
