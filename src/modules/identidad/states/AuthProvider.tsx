import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { tokenStorage } from '@/modules/core/api/tokenStorage'
import { authService } from '../services/authService'
import type { LoginRequestDto, LoginResponseDto, RegisterRequestDto, UserSessionDto } from '../types/auth.dto'
import { AuthContext } from './authContext'

const USER_KEY = 'sr_user'

const readUser = (): UserSessionDto | null => {
  try { return JSON.parse(localStorage.getItem(USER_KEY) ?? 'null') } catch { return null }
}
const saveUser = (user: UserSessionDto) => {
  try { localStorage.setItem(USER_KEY, JSON.stringify(user)) } catch { /* sin almacenamiento */ }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserSessionDto | null>(() => (tokenStorage.get() ? readUser() : null))

  const logout = useCallback(() => {
    tokenStorage.clear()
    try { localStorage.removeItem(USER_KEY) } catch { /* sin almacenamiento */ }
    setUser(null)
  }, [])

  const start = useCallback((res: LoginResponseDto) => {
    tokenStorage.set(res.token)
    saveUser(res.user)
    setUser(res.user)
    return res.user
  }, [])

  const login = useCallback(async (payload: LoginRequestDto) => start(await authService.login(payload)), [start])
  const register = useCallback(async (payload: RegisterRequestDto) => start(await authService.register(payload)), [start])

  const updateUser = useCallback((changes: Partial<Pick<UserSessionDto, 'name'>>) => {
    setUser((u) => {
      if (!u) return u
      const next = { ...u, ...changes }
      saveUser(next)
      return next
    })
  }, [])

  const loginWithGoogle = useCallback(async (idToken: string) => start(await authService.google({ idToken })), [start])

  useEffect(() => {
    window.addEventListener('sr:sesion-expirada', logout)
    return () => window.removeEventListener('sr:sesion-expirada', logout)
  }, [logout])

  const value = useMemo(() => ({ user, login, loginWithGoogle, register, updateUser, logout }), [user, login, loginWithGoogle, register, updateUser, logout])
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
