import { expect, test, type Page } from '@playwright/test'

/**
 * T038/T045 - Real cross-stack profile E2E (no network-boundary mocking).
 * Requires a representative integrated environment with current web build,
 * reachable API/auth services, and valid test credentials.
 *
 * Run against an integrated stack:
 *   PLAYWRIGHT_BASE_URL=http://127.0.0.1:3000 \
 *   PROFILE_E2E_USERNAME=<user> PROFILE_E2E_PASSWORD=<pass> \
 *   npx playwright test e2e/profile-cross-stack.spec.ts --project=chromium --reporter=line
 */

const username = process.env.PROFILE_E2E_USERNAME || 'super-admin'
const password = process.env.PROFILE_E2E_PASSWORD || 'super-admin'

async function login(page: Page) {
  for (let attempt = 0; attempt < 3; attempt++) {
    await page.context().clearCookies()
    await page.goto('/login', { waitUntil: 'domcontentloaded' })
    await page.evaluate(() => { localStorage.clear(); sessionStorage.clear() })
    await page.goto('/login', { waitUntil: 'domcontentloaded' })
    await page.getByLabel('Username').fill(username)
    await page.getByLabel('Password').fill(password)
    const signIn = page.getByRole('button', { name: 'Sign In' })
    await expect(signIn).toBeEnabled({ timeout: 10000 })
    const respPromise = page.waitForResponse(r => r.url().includes('/api/v1/auth/sign-in') && r.request().method() === 'POST', { timeout: 20000 }).catch(() => null)
    await signIn.click()
    const resp = await respPromise
    try {
      await expect(page).toHaveURL(/\/dashboard/, { timeout: 25000 })
      return
    } catch (e) {
      if (attempt === 2) {
        const status = resp ? resp.status() : 'no-response'
        throw new Error(`Login failed after 3 attempts (last sign-in status: ${status}): ${String(e)}`)
      }
      await page.waitForTimeout(1500)
    }
  }
}

test.describe('Profile cross-stack (real API, no mocking)', () => {
  test.skip(
    !process.env.PROFILE_E2E_USERNAME || !process.env.PROFILE_E2E_PASSWORD,
    'Set PROFILE_E2E_USERNAME and PROFILE_E2E_PASSWORD for real cross-stack run',
  )

  test('happy path: loads, saves, reloads persisted profile, SC-005 timing', async ({ page }) => {
    test.setTimeout(120000)
    const uniqueMiddle = `E2E${Date.now().toString().slice(-6)}`

    await login(page)
    await page.goto('/profile', { waitUntil: 'domcontentloaded' })
    const firstName = page.locator('input[name="firstName"]')
    await expect(firstName).toBeVisible({ timeout: 20000 })
    await expect(firstName).not.toHaveValue('', { timeout: 20000 })

    const originalMiddle = await page.locator('input[name="middleName"]').inputValue()
    const originalTel = await page.locator('input[name="tel"]').inputValue()
    const originalEmail = await page.locator('input[name="emailAddress"]').inputValue()
    const originalFirst = await page.locator('input[name="firstName"]').inputValue()
    const originalLast = await page.locator('input[name="lastName"]').inputValue()

    await page.locator('input[name="middleName"]').fill(uniqueMiddle)
    await page.locator('input[name="middleName"]').blur()
    const saveBtn = page.getByTestId('profile-save')
    await expect(saveBtn).toBeEnabled({ timeout: 15000 })
    const start = Date.now()
    await saveBtn.click()
    await expect(page.getByText(/profile\.updateSuccess|saved|updated/i).first()).toBeVisible({ timeout: 15000 })
    const elapsedMs = Date.now() - start
    expect(elapsedMs, `SC-005 save confirmation took ${elapsedMs}ms`).toBeLessThan(10000)

    await page.reload({ waitUntil: 'domcontentloaded' })
    await expect(page.locator('input[name="middleName"]')).toHaveValue(uniqueMiddle, { timeout: 20000 })

    // Best-effort restore to avoid mutating shared test user state.
    await page.locator('input[name="firstName"]').fill(originalFirst)
    await page.locator('input[name="lastName"]').fill(originalLast)
    await page.locator('input[name="middleName"]').fill(originalMiddle)
    await page.locator('input[name="tel"]').fill(originalTel)
    await page.locator('input[name="emailAddress"]').fill(originalEmail)
    await page.locator('input[name="middleName"]').blur()
    if (await saveBtn.isEnabled().catch(() => false)) {
      await saveBtn.click()
      await expect(page.getByText(/profile\.updateSuccess|saved|updated/i).first()).toBeVisible({ timeout: 15000 })
    }
  })

  test('validation error: invalid phone shows error and preserves input (no false success)', async ({ page }) => {
    await login(page)
    await page.goto('/profile', { waitUntil: 'domcontentloaded' })
    await expect(page.locator('input[name="firstName"]')).toBeVisible({ timeout: 20000 })

    const originalTel = await page.locator('input[name="tel"]').inputValue()
    await page.locator('input[name="tel"]').fill('12')
    await page.locator('input[name="tel"]').blur()
    const saveBtn = page.getByTestId('profile-save')
    await expect(saveBtn).toBeEnabled({ timeout: 15000 })
    await saveBtn.click()

    await expect(page.getByRole('alert').filter({ hasText: /invalid|format|phone/i }).first()).toBeVisible({ timeout: 15000 })
    await expect(page.locator('input[name="tel"]')).toHaveValue('12')
    await expect(page.getByText(/profile\.updateSuccess|saved|updated/i)).toHaveCount(0)

    // Restore field (no save needed; input preserved client-side)
    await page.locator('input[name="tel"]').fill(originalTel)
  })

  test('authorization: missing/cleared token redirects protected profile to login', async ({ page }) => {
    await login(page)
    await page.goto('/profile', { waitUntil: 'domcontentloaded' })
    await expect(page.locator('input[name="firstName"]')).toBeVisible({ timeout: 20000 })

    await page.evaluate(() => {
      localStorage.removeItem('accessToken')
      localStorage.removeItem('refreshToken')
    })
    await page.goto('/profile', { waitUntil: 'domcontentloaded' })
    await expect(page).toHaveURL(/\/login/, { timeout: 20000 })
  })
})
