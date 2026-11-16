import { useEffect, useState } from 'react'
import { PLAN_CHANGED, userPlanService } from '../services/userPlanService'
import type { MiPlanDto, PlanUsuario } from '../types/plan.dto'

interface State {
  plan: PlanUsuario | null
  details: MiPlanDto | null
  error: unknown
}

/**
 * Plan de la persona con sesión. `plan` es null mientras carga o si no aplica (`enabled` en false).
 * Se recarga cuando el plan cambia en /planes o /perfil.
 */
export function useUserPlan(enabled: boolean) {
  const [state, setState] = useState<State>({ plan: null, details: null, error: null })

  useEffect(() => {
    if (!enabled) return
    let active = true
    const load = () =>
      userPlanService
        .mine()
        .then((r) => {
          if (active) setState({ plan: r.plan, details: r, error: null })
        })
        .catch((error) => {
          if (active) setState({ plan: null, details: null, error })
        })
    load()
    window.addEventListener(PLAN_CHANGED, load)
    return () => {
      active = false
      window.removeEventListener(PLAN_CHANGED, load)
    }
  }, [enabled])

  return enabled ? state : { plan: null, details: null, error: null }
}
