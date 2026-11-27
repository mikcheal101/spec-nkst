import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import type { ReactNode } from 'react'
const mockMutateAsyncLogin = vi.fn(); const mockMutateAsyncLogout = vi.fn(); const mockGetMyPermissions = vi.fn()
vi.mock('../hooks/useAuth', () => ({ useLogin: () => ({ mutateAsync: mockMutateAsyncLogin }), useLogout: () => ({ mutateAsync: mockMutateAsyncLogout }) }))
vi.mock('../services/api', () => ({ authApi: { getMyPermissions: (...a:any[])=>mockGetMyPermissions(...a) } }))
import { AuthProvider, useAuth } from './AuthContext'
function makeToken(payload: Record<string, unknown>) { return btoa(JSON.stringify({alg:'HS256'}))+'.'+btoa(JSON.stringify(payload))+'.s' }
function wrapper({children}:{children:ReactNode}){return <AuthProvider>{children}</AuthProvider>}
beforeEach(()=>{vi.clearAllMocks(); localStorage.clear(); mockGetMyPermissions.mockResolvedValue({data:{permissions:[]}}); delete (window as any).location; (window as any).location={reload:vi.fn(),href:''}})
it('parseToken uses empty username when sub and username missing', () => {
  localStorage.setItem('accessToken', makeToken({}))
  const { result } = renderHook(()=>useAuth(),{wrapper})
  expect(result.current.user?.username).toBe('')
})
it('login handles parsed token null path (no reload)', async () => {
  mockMutateAsyncLogin.mockResolvedValue({ accessToken: 'bad' })
  const { result } = renderHook(()=>useAuth(),{wrapper})
  await act(async ()=>{ await result.current.login('u','p') })
  expect((window as any).location.reload).not.toHaveBeenCalled()
})
