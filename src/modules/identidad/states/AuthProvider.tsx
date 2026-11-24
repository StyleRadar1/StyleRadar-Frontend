import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { tokenStorage } from '@/modules/core/api/tokenStorage'
import { aRol } from '@/modules/core/types/roles'
import { env } from '@/configs/env'
import { aResultado, aSesion, authService } from '../services/authService'
import { usuarioService } from '../services/usuarioService'
import type { LoginRequestDto, LoginResponseDto, LoginResult, RegisterRequestDto, UserSessionDto, VerifyOtpRequestDto } from '../types/auth.dto'
import { AuthContext } from './authContext'

const USER_KEY = 'sr_user'

const saveUser = (user: UserSessionDto) => {
  try { localStorage.setItem(USER_KEY, JSON.stringify(user)) } catch { /* sin almacenamiento */ }
}
/** Lee la sesión guardada. Si quedó con un rol anterior en español, lo pasa al rol en inglés y la vuelve a guardar. */
const readUser = (): UserSessionDto | null => {
  try {
    const guardado = JSON.parse(localStorage.getItem(USER_KEY) ?? 'null') as UserSessionDto | null
    if (!guardado) return null
    const role = aRol(guardado.role)
    if (!role) return null
    if (role !== guardado.role) saveUser({ ...guardado, role })
    return { ...guardado, role }
  } catch { return null }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserSessionDto | null>(() => (tokenStorage.get() ? readUser() : null))

  const logout = useCallback(() => {
    // Se toma el token antes de limpiarlo: ms-auth necesita el Bearer para revocar la sesión.
    authService.logout(tokenStorage.get()).catch(() => {})
    tokenStorage.clear()
    try { localStorage.removeItem(USER_KEY) } catch { /* sin almacenamiento */ }
    setUser(null)
  }, [])

  /** Inicia la sesión con la respuesta de ms-auth (accessToken, userId, roles y email en la raíz). */
  const start = useCallback((res: LoginResponseDto) => {
    const sesion = aSesion(res)
    tokenStorage.set(res.accessToken as string)
    saveUser(sesion)
    setUser(sesion)
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('sr:login-success', { detail: sesion }))
    }
    // El login de ms-auth no trae el nombre: se lee del perfil (GET /api/v1/users/{id}) y se actualiza la sesión.
    // Solo el comprador tiene perfil en ms-usuarios; para los demás roles esa ruta responde 403.
    if (!env.useMocks && sesion.role === 'BUYER') {
      usuarioService.get(sesion.id).then((p) => {
        if (!p.name) return
        setUser((u) => {
          if (!u || u.id !== sesion.id) return u
          const next = { ...u, name: p.name }
          saveUser(next)
          return next
        })
      }).catch(() => { /* se queda con el nombre provisional */ })
    }
    return sesion
  }, [])

  /** Si el correo no está verificado no hay token todavía: se devuelve 'otp' para pedir el código. */
  const resolver = useCallback((res: LoginResponseDto, email: string): LoginResult => {
    const r = aResultado(res, email)
    return r.kind === 'session' ? { kind: 'session', user: start(res) } : r
  }, [start])

  const login = useCallback(async (payload: LoginRequestDto) => resolver(await authService.login(payload), payload.email), [resolver])
  const register = useCallback(async (payload: RegisterRequestDto) => resolver(await authService.register(payload), payload.email), [resolver])
  const verifyOtp = useCallback(async (payload: VerifyOtpRequestDto) => start(await authService.verifyOtp(payload)), [start])

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

  const value = useMemo(
    () => ({ user, login, loginWithGoogle, register, verifyOtp, updateUser, logout }),
    [user, login, loginWithGoogle, register, verifyOtp, updateUser, logout],
  )
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
