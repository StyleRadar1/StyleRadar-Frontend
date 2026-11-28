import { Navigate, useNavigate } from 'react-router-dom'
import { AuthModal } from '@/components/modals'
import { tokenStorage } from '@/modules/core/api/tokenStorage'
import { ROLE_HOME } from '@/modules/core/types/roles'
import { useAuth } from '../hooks/useAuth'

/**
 * Pantalla dedicada de inicio de sesión (/login) cuando la portada de bienvenida ya fue vista.
 * Reutiliza AuthModal en modo login sobre un fondo limpio. El registro y el cambio de modo se hacen por redirección.
 */
export default function LoginPage() {
  const { user } = useAuth()
  const navigate = useNavigate()

  if (user) return <Navigate to={ROLE_HOME[user.role]} replace />

  const handleClose = () => {
    // Si el modal se cierra tras autenticar, AuthModal ya navega al destino de sesión;
    // solo volvemos al catálogo cuando el visitante cierra manualmente sin haber iniciado sesión.
    if (!tokenStorage.get()) {
      navigate('/', { replace: true })
    }
  }

  return (
    <section className="min-h-screen bg-transparent" aria-label="Iniciar sesión">
      <AuthModal isOpen initialTab="login" onClose={handleClose} />
    </section>
  )
}
