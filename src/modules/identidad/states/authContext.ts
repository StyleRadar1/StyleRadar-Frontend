import { createContext } from 'react'
import type { LoginRequestDto, UserSessionDto } from '../types/auth.dto'

export interface AuthState {
  user: UserSessionDto | null
  login: (payload: LoginRequestDto) => Promise<UserSessionDto>
  logout: () => void
}

export const AuthContext = createContext<AuthState | null>(null)
