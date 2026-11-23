import { createContext, useContext, useCallback, useEffect, useState, type ReactNode } from 'react'
import { useLogin, useLogout } from '../hooks/useAuth'
import { authApi } from '../services/api'
import { hasPermission as hasPerm, normalizePermissions } from '../shared/utils/permissions'

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
  hasPermission: (required: string | string[]) => boolean
  refreshPermissions: () => Promise<void>
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

  const [user, setUser] = useState<User | null>(() => readUser())
  const loading = false

  const refreshPermissions = useCallback(async () => {
    try {
      const res = await authApi.getMyPermissions()
      if (res.data) {
        const p = normalizePermissions((res.data as any).permissions || (res.data as any))
        setUser((prev) => prev ? { ...prev, permissions: p } : prev)
      }
    } catch {
      // keep JWT-derived permissions
    }
  }, [])

  useEffect(() => {
    const handler = () => {
      clearTokens()
      setUser(null)
      window.location.href = '/login'
    }
    window.addEventListener('auth:unauthorized', handler)
    return () => window.removeEventListener('auth:unauthorized', handler)
  }, [])

  useEffect(() => {
    if (user) void refreshPermissions()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const login = useCallback(async (username: string, password: string): Promise<string | null> => {
    try {
      const data = await loginMut.mutateAsync({ username, password })
      persistTokens(data)
      const parsed = parseToken(localStorage.getItem('accessToken') || '')
      if (parsed) {
        setUser(parsed)
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
    setUser(null)
    window.location.href = '/login'
  }, [logoutMut])

  const hasPermission = useCallback((required: string | string[]) => hasPerm(user?.permissions, required), [user])

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, hasPermission, refreshPermissions }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
