import { useEffect, useState } from 'react'
import { PLAN_CHANGED, userPlanService } from '../services/userPlanService'
import type { PlanUsuario } from '../types/plan.dto'

interface State { plan: PlanUsuario | null; error: unknown }

/**
 * Plan de la persona con sesión. `plan` es null mientras carga o si no aplica (`enabled` en false).
 * Se recarga cuando el plan cambia en /planes.
 */
export function useUserPlan(enabled: boolean) {
  const [state, setState] = useState<State>({ plan: null, error: null })

  useEffect(() => {
    if (!enabled) return
    let active = true
    const load = () => userPlanService.mine()
      .then((r) => { if (active) setState({ plan: r.plan, error: null }) })
      .catch((error) => { if (active) setState({ plan: null, error }) })
    load()
    window.addEventListener(PLAN_CHANGED, load)
    return () => { active = false; window.removeEventListener(PLAN_CHANGED, load) }
  }, [enabled])

  return enabled ? state : { plan: null, error: null }
}
