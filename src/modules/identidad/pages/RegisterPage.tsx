import { useNavigate, useSearchParams } from 'react-router-dom'
import { AuthModal } from '@/components/modals'

/**
 * Registro en la misma tarjeta de vidrio del login.
 * El rol inicial viene de ?tipo=tienda / ?rol=tienda; dentro de la tarjeta se puede cambiar entre Usuario y Tienda.
 */
export default function RegisterPage() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const tipo = (params.get('tipo') ?? params.get('rol'))?.toLowerCase()
  const initialRole = tipo === 'tienda' ? 'STORE_ADMIN' : 'BUYER'

  return (
    <section className="min-h-screen" aria-label="Registro">
      <AuthModal
        isOpen
        initialTab="register"
        initialRole={initialRole}
        onClose={() => navigate('/catalogo', { replace: true })}
      />
    </section>
  )
}
