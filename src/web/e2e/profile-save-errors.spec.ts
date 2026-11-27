import { test, expect } from '@playwright/test'

test.describe('Profile save errors and recovery', () => {
  test('shows validation/conflict errors, preserves input, and recovers from post-save refresh failure', async ({ page }) => {
    await page.addInitScript(() => {
      const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJqZG9lIiwidXNlcm5hbWUiOiJqZG9lIiwicGhvbmVOdW1iZXIiOiIxMjM0NTY3ODkwIiwicm9sZXMiOlsiQURNSU4iXSwicGVybWlzc2lvbnMiOlsiUFJPRklMRTpSRUFEIiwiUFJPRklMRTpVUERBVEUiXX0=.sig'
      localStorage.setItem('accessToken', token)
      localStorage.setItem('refreshToken', 'fake-refresh')
    })

    let profile = { firstName: 'John', middleName: 'M', lastName: 'Doe', email: 'john@test.com', phoneNumber: '1234567890', username: 'jdoe' }
    let getAfterSaveFails = false

    await page.route('**/api/v1/me/permissions', async route => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ data: ['PROFILE:READ', 'PROFILE:UPDATE'] }) })
    })
    await page.route('**/api/v1/profile', async route => {
      const method = route.request().method()
      if (method === 'GET') {
        if (getAfterSaveFails) {
          await route.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ status: 500, code: 'INTERNAL_ERROR', message: 'Refresh failed' }) })
          return
        }
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ data: profile }) })
        return
      }
      if (method === 'POST') {
        const body = route.request().postDataJSON() as any
        if (body.tel === '9999999999') {
          await route.fulfill({ status: 409, contentType: 'application/json', body: JSON.stringify({ status: 409, code: 'PROFILE_CONTACT_CONFLICT', message: 'Unable to update profile with the provided information.' }) })
          return
        }
        profile = { ...profile, ...body, email: body.emailAddress ?? profile.email, phoneNumber: body.tel ?? profile.phoneNumber }
        getAfterSaveFails = true
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ data: profile }) })
        return
      }
      await route.continue()
    })

    await page.goto('/profile')
    await expect(page.locator('input[name="firstName"]')).toHaveValue('John')

    // invalid phone
    await page.locator('input[name="tel"]').fill('12')
    await page.locator('input[name="tel"]').blur()
    const saveBtn = page.getByTestId('profile-save')
    await expect(saveBtn).toBeEnabled({ timeout: 15000 })
    await saveBtn.click()
    await expect(page.getByRole('alert').filter({ hasText: /invalid|format/i }).first()).toBeVisible({ timeout: 15000 })
    await expect(page.locator('input[name="tel"]')).toHaveValue('12')

    // duplicate conflict generic 409
    await page.locator('input[name="tel"]').fill('9999999999')
    await page.locator('input[name="tel"]').blur()
    await expect(saveBtn).toBeEnabled({ timeout: 15000 })
    await saveBtn.click()
    await expect(page.getByText('Unable to update profile with the provided information.')).toBeVisible()
    await expect(page.locator('input[name="tel"]')).toHaveValue('9999999999')

    // save succeeds but refresh fails - preserve confirmed saved state and show warning
    await page.locator('input[name="tel"]').fill('1234567890')
    await page.locator('input[name="firstName"]').fill('Jane')
    await page.locator('input[name="firstName"]').blur()
    await expect(saveBtn).toBeEnabled({ timeout: 15000 })
    await saveBtn.click()
    await expect(page.getByText(/profile\.updateSuccess|saved|updated/i).first()).toBeVisible({ timeout: 15000 })
    await expect(page.getByTestId('profile-refresh-warning')).toBeVisible()
    await expect(page.locator('input[name="firstName"]')).toHaveValue('Jane')

    // retry refresh
    getAfterSaveFails = false
    await page.getByTestId('profile-refresh-warning').getByRole('button', { name: /retry/i }).click()
    await expect(page.getByTestId('profile-refresh-warning')).toHaveCount(0)
    await expect(page.locator('input[name="firstName"]')).toHaveValue('Jane')
  })
})
