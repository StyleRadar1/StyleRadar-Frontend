import { useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { QuickTryOnModal } from '@/components/modals'

/* ================================================================
   ProbadorVirtualPage — Página pública del probador inmersivo
   Renderiza QuickTryOnModal a pantalla completa (siempre abierto).
   Al cerrar, navega de vuelta al landing o a la página anterior.
   ================================================================ */
export default function ProbadorVirtualPage() {
  const navigate = useNavigate()

  const handleClose = useCallback(() => {
    // Si hay historial, vuelve atrás; si no, va al landing
    if (window.history.length > 1) {
      navigate(-1)
    } else {
      navigate('/')
    }
  }, [navigate])

  return (
    <QuickTryOnModal
      isOpen={true}
      onClose={handleClose}
    />
  )
}

