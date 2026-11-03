import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { tokenStorage } from '@/modules/core/api/tokenStorage'
import { authService } from '../services/authService'
import type { LoginRequestDto, UserSessionDto } from '../types/auth.dto'
import { AuthContext } from './authContext'

const USER_KEY = 'sr_user'

const readUser = (): UserSessionDto | null => {
  try { return JSON.parse(localStorage.getItem(USER_KEY) ?? 'null') } catch { return null }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserSessionDto | null>(() => (tokenStorage.get() ? readUser() : null))

  const logout = useCallback(() => {
    tokenStorage.clear()
    try { localStorage.removeItem(USER_KEY) } catch { /* sin almacenamiento */ }
    setUser(null)
  }, [])

  const login = useCallback(async (payload: LoginRequestDto) => {
    const res = await authService.login(payload)
    tokenStorage.set(res.token)
    try { localStorage.setItem(USER_KEY, JSON.stringify(res.user)) } catch { /* sin almacenamiento */ }
    setUser(res.user)
    return res.user
  }, [])

  useEffect(() => {
    window.addEventListener('sr:sesion-expirada', logout)
    return () => window.removeEventListener('sr:sesion-expirada', logout)
  }, [logout])

  const value = useMemo(() => ({ user, login, logout }), [user, login, logout])
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
