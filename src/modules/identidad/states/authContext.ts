import { createContext } from 'react'
import type { LoginRequestDto, LoginResult, RegisterRequestDto, UserSessionDto, VerifyOtpRequestDto } from '../types/auth.dto'

export interface AuthState {
  user: UserSessionDto | null
  /** Entra directo ('session') o pide el código OTP cuando el correo no está verificado ('otp'). */
  login: (payload: LoginRequestDto) => Promise<LoginResult>
  register: (payload: RegisterRequestDto) => Promise<LoginResult>
  verifyOtp: (payload: VerifyOtpRequestDto) => Promise<UserSessionDto>
  /** Actualiza los datos visibles de la sesión (por ejemplo, el nombre después de editar el perfil). */
  updateUser: (changes: Partial<Pick<UserSessionDto, 'name'>>) => void
  /** P14: inicia sesión con el ID token de Google. */
  loginWithGoogle: (idToken: string) => Promise<UserSessionDto>
  logout: () => void
}

export const AuthContext = createContext<AuthState | null>(null)
