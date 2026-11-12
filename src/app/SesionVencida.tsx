import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { guardarRetorno } from '@/modules/core/api/retorno'
import { salidaVoluntariaReciente } from '@/modules/identidad/states/salida'

/**
 * Sesión vencida (401) en cualquier pantalla: lleva al inicio de sesión y guarda la página
 * para volver a ella al entrar (plan de errores · «Antes de empezar»).
 * Las rutas protegidas ya lo hacían con RequireRole; esto cubre también las pantallas públicas
 * (playlists, planes, catálogo…). Si la persona cerró sesión ella misma, no hace nada.
 */
export function SesionVencida() {
  const navigate = useNavigate()
  useEffect(() => {
    const irAlLogin = () => {
      if (salidaVoluntariaReciente()) return
      if (new URLSearchParams(window.location.search).has('login')) return
      guardarRetorno()
      navigate('/?login')
    }
    window.addEventListener('sr:sesion-expirada', irAlLogin)
    return () => window.removeEventListener('sr:sesion-expirada', irAlLogin)
  }, [navigate])
  return null
}
