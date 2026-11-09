import { createContext } from 'react'
import type { LoginRequestDto, RegisterRequestDto, UserSessionDto } from '../types/auth.dto'

export interface AuthState {
  user: UserSessionDto | null
  login: (payload: LoginRequestDto) => Promise<UserSessionDto>
  register: (payload: RegisterRequestDto) => Promise<UserSessionDto>
  /** Actualiza los datos visibles de la sesión (por ejemplo, el nombre después de editar el perfil). */
  updateUser: (changes: Partial<Pick<UserSessionDto, 'name'>>) => void
  logout: () => void
}

export const AuthContext = createContext<AuthState | null>(null)
