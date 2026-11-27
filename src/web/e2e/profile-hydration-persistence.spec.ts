import { test, expect } from '@playwright/test'

test.describe('Profile hydration and persistence', () => {
  test('loads profile, saves partial edit, preserves values after reload, and confirms within 10s', async ({ page }) => {
    await page.addInitScript(() => {
      const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJqZG9lIiwidXNlcm5hbWUiOiJqZG9lIiwicGhvbmVOdW1iZXIiOiIxMjM0NTY3ODkwIiwicm9sZXMiOlsiQURNSU4iXSwicGVybWlzc2lvbnMiOlsiUFJPRklMRTpSRUFEIiwiUFJPRklMRTpVUERBVEUiXX0=.sig'
      localStorage.setItem('accessToken', token)
      localStorage.setItem('refreshToken', 'fake-refresh')
    })

    let profile = {
      firstName: 'John',
      middleName: 'M',
      lastName: 'Doe',
      email: 'john@test.com',
      phoneNumber: '1234567890',
      username: 'jdoe',
    }

    await page.route('**/api/v1/me/permissions', async route => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ data: ['PROFILE:READ', 'PROFILE:UPDATE'] }) })
    })
    await page.route('**/api/v1/profile', async route => {
      if (route.request().method() === 'GET') {
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ data: profile }) })
        return
      }
      if (route.request().method() === 'POST') {
        const body = route.request().postDataJSON() as any
        profile = { ...profile, ...body, email: body.emailAddress ?? profile.email, phoneNumber: body.tel ?? profile.phoneNumber }
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ data: profile }) })
        return
      }
      await route.continue()
    })

    await page.goto('/profile')
    await expect(page.locator('input[name="firstName"]')).toHaveValue('John')
    await expect(page.locator('input[name="tel"]')).toHaveValue('1234567890')

    await page.locator('input[name="firstName"]').fill('Jane')
    await page.locator('input[name="firstName"]').blur()
    const saveBtn = page.getByTestId('profile-save')
    await expect(saveBtn).toBeEnabled({ timeout: 15000 })
    const start = Date.now()
    await saveBtn.click()
    await expect(page.getByText(/profile\.updateSuccess|saved|updated/i).first()).toBeVisible({ timeout: 15000 })
    expect(Date.now() - start).toBeLessThan(10000)

    await page.reload()
    await expect(page.locator('input[name="firstName"]')).toHaveValue('Jane')
    await expect(page.locator('input[name="middleName"]')).toHaveValue('M')
  })
})
