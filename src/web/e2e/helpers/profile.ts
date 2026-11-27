import { Page } from '@playwright/test'

export async function seedProfileAuth(page: Page) {
  await page.addInitScript(() => {
    const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJqZG9lIiwidXNlcm5hbWUiOiJqZG9lIiwicGhvbmVOdW1iZXIiOiIxMjM0NTY3ODkwIiwicm9sZXMiOlsiQURNSU4iXSwicGVybWlzc2lvbnMiOlsiUFJPRklMRTpSRUFEIiwiUFJPRklMRTpVUERBVEUiXX0=.sig'
    localStorage.setItem('accessToken', token)
    localStorage.setItem('refreshToken', 'fake-refresh')
  })
}

export async function mockProfileApis(page: Page, initial: any, opts?: { failRefreshAfterSave?: boolean; conflictTel?: string }) {
  let profile = { ...initial }
  let getAfterSaveFails = !!opts?.failRefreshAfterSave
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
      if (opts?.conflictTel && body.tel === opts.conflictTel) {
        await route.fulfill({ status: 409, contentType: 'application/json', body: JSON.stringify({ status: 409, code: 'PROFILE_CONTACT_CONFLICT', message: 'Unable to update profile with the provided information.' }) })
        return
      }
      profile = { ...profile, ...body, email: body.emailAddress ?? profile.email, phoneNumber: body.tel ?? profile.phoneNumber }
      if (opts?.failRefreshAfterSave) getAfterSaveFails = true
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ data: profile }) })
      return
    }
    await route.continue()
  })
  return {
    setRefreshFailure(v: boolean) { getAfterSaveFails = v },
    getProfile() { return profile },
  }
}
