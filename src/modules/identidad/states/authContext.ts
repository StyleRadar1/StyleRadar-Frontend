import { createContext } from 'react'
import type { LoginRequestDto, UserSessionDto } from '../types/auth.dto'

export interface AuthState {
  user: UserSessionDto | null
  login: (payload: LoginRequestDto) => Promise<UserSessionDto>
  /** P14: inicia sesión con el ID token de Google. */
  loginWithGoogle: (idToken: string) => Promise<UserSessionDto>
  logout: () => void
}

export const AuthContext = createContext<AuthState | null>(null)
