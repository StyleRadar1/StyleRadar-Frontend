import { Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import { AuthModal } from '@/components/modals'
import { tokenStorage } from '@/modules/core/api/tokenStorage'
import { ROLE_HOME } from '@/modules/core/types/roles'
import { useAuth } from '../hooks/useAuth'

/**
 * Pantalla dedicada de inicio de sesión (/login) cuando la portada de bienvenida ya fue vista.
 * Reutiliza AuthModal completo (login, OTP, registro, cuentas demo, Google y onboarding) sobre un fondo limpio.
 */
export default function LoginPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [params] = useSearchParams()

  if (user) return <Navigate to={ROLE_HOME[user.role]} replace />

  const initialTab = params.get('tab') === 'register' ? 'register' : 'login'

  const handleClose = () => {
    // Si el modal se cierra tras autenticar, AuthModal ya navega al destino de sesión;
    // solo volvemos al catálogo cuando el visitante cierra manualmente sin haber iniciado sesión.
    if (!tokenStorage.get()) {
      navigate('/catalogo', { replace: true })
    }
  }

  return (
    <section className="min-h-[calc(100vh-72px)] bg-transparent" aria-label="Iniciar sesión">
      <AuthModal isOpen initialTab={initialTab} onClose={handleClose} />
    </section>
  )
}
