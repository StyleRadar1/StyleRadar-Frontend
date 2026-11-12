import { ApiError } from '@/modules/core/api/apiClient'
import { MENSAJES } from '@/modules/core/api/mensajes'

/**
 * Solo datos de prueba. Con /planes?demo-plan=400 o ?demo-plan=409 el cambio de plan y el inicio del pago
 * responden ese error, para ver los mensajes del plan sin backend. Dura lo que dura la pestaña;
 * ?demo-plan= (vacío) lo apaga.
 */
const KEY = 'sr_demo_plan'

function activo(): string {
  try {
    const q = new URLSearchParams(window.location.search).get('demo-plan')
    if (q !== null) sessionStorage.setItem(KEY, q)
    return sessionStorage.getItem(KEY) ?? ''
  } catch { return '' }
}

export function fallarSiDemoPlan() {
  const d = activo()
  if (d === '400') throw new ApiError(400, MENSAJES.datos)
  if (d === '409') throw new ApiError(409, MENSAJES.conflicto)
}
