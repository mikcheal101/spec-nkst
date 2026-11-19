import { expect, type Page } from '@playwright/test'

export const SUPER_ADMIN = {
  username: 'super-admin',
  password: 'super-admin',
}

/** Sign in through the real login form and wait for the dashboard. */
export async function loginAsSuperAdmin(page: Page) {
  await page.goto('/login')
  await page.getByLabel('Username').fill(SUPER_ADMIN.username)
  await page.getByLabel('Password').fill(SUPER_ADMIN.password)
  await page.getByRole('button', { name: 'Sign In' }).click()
  await expect(page).toHaveURL(/\/dashboard/, { timeout: 30000 })
  await expect(page.getByRole('heading', { name: /welcome, super-admin/i })).toBeVisible()
}

/** Sign out using the sidebar action. */
export async function logout(page: Page) {
  await page.getByText('Logout', { exact: true }).click()
  await expect(page).toHaveURL(/\/login/, { timeout: 15000 })
}

export const unique = (prefix: string) =>
  `${prefix} ${Date.now().toString(36)}${Math.floor(Math.random() * 1000)}`.toUpperCase()

export const uniqueMixed = (prefix: string) =>
  `${prefix}-${Date.now().toString(36)}${Math.floor(Math.random() * 1000)}`
