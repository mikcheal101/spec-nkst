import { createContext, useContext, useEffect, useCallback, type ReactNode } from 'react'
import { useLogin, useLogout } from '../hooks/useAuth'

interface User {
  username: string
  churchId?: string
  phoneNumber?: string
  permissions?: string[]
  roles?: string[]
}

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (username: string, password: string) => Promise<string | null>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

function parseToken(token: string): User | null {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    return {
      username: payload.sub || payload.username || '',
      churchId: payload.churchId,
      phoneNumber: payload.phoneNumber,
      permissions: payload.permissions ?? payload.authorities ?? [],
      roles: payload.roles ?? (payload.role ? [payload.role] : []),
    }
  } catch {
    return null
  }
}

function readUser(): User | null {
  const token = localStorage.getItem('accessToken')
  return token ? parseToken(token) : null
}

function persistTokens(raw: unknown) {
  const d = raw as Record<string, string> | undefined
  const accessToken = d?.accessToken ?? d?.token ?? ''
  const refreshToken = d?.refreshToken ?? ''
  if (accessToken) localStorage.setItem('accessToken', accessToken)
  if (refreshToken) localStorage.setItem('refreshToken', refreshToken)
}

function clearTokens() {
  localStorage.removeItem('accessToken')
  localStorage.removeItem('refreshToken')
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const loginMut = useLogin()
  const logoutMut = useLogout()

  const user = readUser()
  const loading = false

  const login = useCallback(async (username: string, password: string): Promise<string | null> => {
    try {
      const data = await loginMut.mutateAsync({ username, password })
      persistTokens(data)
      const parsed = parseToken(localStorage.getItem('accessToken') || '')
      if (parsed) {
        window.location.reload()
      }
      return null
    } catch (err) {
      return err instanceof Error ? err.message : 'Login failed'
    }
  }, [loginMut])

  const logout = useCallback(async () => {
    const accessToken = localStorage.getItem('accessToken') || ''
    const refreshToken = localStorage.getItem('refreshToken') || ''
    try {
      await logoutMut.mutateAsync({ accessToken, refreshToken })
    } catch {
    }
    clearTokens()
    window.location.href = '/login'
  }, [logoutMut])

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

const superAdminRoles = new Set(['CHURCH_SUPER_ADMIN', 'SYSTEM_ADMIN'])
