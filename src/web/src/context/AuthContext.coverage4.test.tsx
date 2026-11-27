import { describe, it, expect, vi } from 'vitest'
import { renderHook } from '@testing-library/react'
import { AuthProvider, useAuth } from './AuthContext'

vi.mock('../hooks/useAuth', () => ({ useLogin: () => ({ mutateAsync: vi.fn() }), useLogout: () => ({ mutateAsync: vi.fn() }) }))
vi.mock('../services/api', () => ({ authApi: { getMyPermissions: vi.fn().mockResolvedValue({}) } }))

describe('AuthContext edge branches', () => {
  it('useAuth throws outside provider', () => {
    expect(() => renderHook(() => useAuth())).toThrow(/AuthProvider/)
  })
})
