import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { API_BASE_URL } from '../config/api'
import { authFetch, captureHashToken, clearSessionToken, getSessionToken } from '../utils/auth'

export interface AuthUser {
  id: string
  name: string | null
  email: string | null
  picture: string | null
}

interface AuthContextValue {
  user: AuthUser | null
  userId: string | null
  isLoading: boolean
  isAuthenticated: boolean | null
  refresh: () => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)

  const validateSession = useCallback(async (overrideToken?: string | null) => {
    setIsLoading(true)
    try {
      const existingToken = overrideToken ?? getSessionToken()
      if (!existingToken) {
        setUser(null)
        setUserId(null)
        setIsAuthenticated(false)
        return
      }

      const res = await authFetch(`${API_BASE_URL}/auth/session`, {}, overrideToken ?? undefined)
      if (res.status === 401) {
        // Token invalid or expired — clear so user gets a clean login next time.
        clearSessionToken()
        setUser(null)
        setUserId(null)
        setIsAuthenticated(false)
        return
      }
      if (!res.ok) {
        // Transient server/network error — keep the stored token so the next
        // visit retries instead of forcing a fresh Google login.
        setIsAuthenticated(false)
        return
      }
      const data = await res.json()
      if (data?.valid && data?.userId) {
        setUserId(data.userId)
        setUser(
          data.user
            ? {
                id: data.user.id ?? data.userId,
                name: data.user.name ?? null,
                email: data.user.email ?? null,
                picture: data.user.picture ?? null,
              }
            : null
        )
        setIsAuthenticated(true)
      } else {
        clearSessionToken()
        setUser(null)
        setUserId(null)
        setIsAuthenticated(false)
      }
    } catch {
      // Network failure (offline, etc.) — preserve the stored token for retry.
      setIsAuthenticated(false)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    // Global capture: handles OAuth redirects landing on ANY route
    // (e.g. /dashboard#session=... or /#session=...). Strips the hash
    // from the URL so it never lingers in history.
    const hashToken = captureHashToken()
    validateSession(hashToken)
  }, [validateSession])

  const refresh = useCallback(async () => {
    await validateSession()
  }, [validateSession])

  const logout = useCallback(async () => {
    try {
      await authFetch(`${API_BASE_URL}/auth/logout`, { method: 'POST' })
    } catch {
      // Logout should succeed locally even if the network request fails.
    }
    clearSessionToken()
    setUser(null)
    setUserId(null)
    setIsAuthenticated(false)
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({ user, userId, isLoading, isAuthenticated, refresh, logout }),
    [user, userId, isLoading, isAuthenticated, refresh, logout]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within <AuthProvider>')
  return ctx
}
