import { useContext, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Loading } from '@/modules/core/components/Status'
import { AuthContext } from '@/modules/identidad/states/authContext'
import { useUserPlan } from '../hooks/useUserPlan'

interface Props {
  /** Qué se desbloquea con Radar+, en una frase. */
  title: string
  text: string
  children: ReactNode
}

/**
 * P8 · Lo que es de pago se ve con candado y lleva a los planes si la persona no tiene Radar+.
 * Solo aplica al comprador con sesión: el backend también valida el plan, esto es la experiencia de uso.
 * Si el plan no se puede consultar se muestra el contenido; el servicio rechazará lo que no corresponda.
 */
export function PlanGate({ title, text, children }: Props) {
  const user = useContext(AuthContext)?.user
  const applies = user?.role === 'COMPRADOR'
  const { plan, error } = useUserPlan(applies)

  if (!applies || error || plan === 'RADAR_PLUS') return children
  if (!plan) return <Loading label="Revisando tu plan…" />
  return (
    <div role="region" aria-label={`${title} · requiere Radar+`} className="rounded-2xl border border-violeta/60 bg-violeta/10 p-6 text-center">
      <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" className="mx-auto h-8 w-8 text-lavanda">
        <rect x="5" y="10" width="14" height="10" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3" />
      </svg>
      <p className="mt-3 text-lg font-semibold">{title}</p>
      <p className="mx-auto mt-1 max-w-md text-sm text-white/75">{text}</p>
      <Link to="/planes" className="mt-5 inline-flex rounded-xl bg-violeta px-5 py-3 text-sm font-semibold">Ver planes</Link>
    </div>
  )
}
