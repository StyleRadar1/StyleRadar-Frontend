import { useCallback } from 'react'
import { Link } from 'react-router-dom'
import { ErrorState, Loading } from '@/modules/core/components/Status'
import { useResource } from '@/modules/core/hooks/useResource'
import { donationService } from '../services/donationService'
import { foundationProfileService } from '../services/foundationProfileService'
import type { FoundationProfileDto } from '../types/foundationProfile.dto'

const card = 'rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] p-6'
const eyebrow = 'text-[11px] font-bold uppercase tracking-[.16em] text-[var(--color-text-muted)]'

/**
 * «Mi fundación»: lo primero que ve la fundación al iniciar sesión. Muestra su página tal como la ven
 * las personas que quieren donar y le avisa si tiene solicitudes pendientes (mismo diseño del prototipo).
 */
export default function FoundationHomePage() {
  const loader = useCallback(async () => {
    const [perfil, solicitudes] = await Promise.all([foundationProfileService.mine(), donationService.forMyFoundation().catch(() => [])])
    return { perfil, pendientes: solicitudes.filter((d) => d.estado === 'PENDIENTE').length }
  }, [])
  const { data, loading, error, reload } = useResource<{ perfil: FoundationProfileDto | null; pendientes: number }>(loader, { perfil: null, pendientes: 0 })
  const f = data.perfil

  if (loading && !f) return <Loading label="Cargando tu fundación…" />
  if (error || !f) return <section className="mx-auto max-w-6xl px-4 py-12"><ErrorState error={error} onRetry={reload} title="No pudimos cargar tu fundación" /></section>

  return (
    <section className="pb-14">
      {/* Portada */}
      <div className="relative h-[300px] overflow-hidden md:h-[340px]">
        <img src={f.fotos.portada} alt={`Personas de ${f.nombre.replace(/^Fundación /, '')} en una jornada de entrega de ropa`} className="absolute inset-0 h-full w-full object-cover object-[50%_35%]" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#140e20]/55 via-[#140e20]/25 to-[var(--color-bg,#1b1b1b)]" />
        <div className="relative mx-auto flex h-full max-w-6xl flex-col justify-between px-4 pb-5 pt-5">
          <p className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[.16em] text-[var(--color-text-muted,#fff)]">
            <span>Mi fundación</span><span aria-hidden="true">/</span><span>Vista de administrador</span>
          </p>
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2.5 backdrop-blur text-[var(--color-text)]">
            <p className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[.14em]">
              <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" /><circle cx="12" cy="12" r="3" /></svg>
              Así ven tu página las personas que quieren donar
            </p>
            <span className={`rounded-md border px-2 py-0.5 text-[11px] font-bold uppercase tracking-[.12em] ${f.activa ? 'border-[var(--color-success)] text-[var(--color-success)]' : 'border-[var(--color-danger)] text-[var(--color-danger)]'}`}>
              <span aria-hidden="true">● </span>{f.activa ? 'Activa' : 'Inactiva'}
            </span>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 text-[var(--color-text)]">
        {/* Aviso de pendientes */}
        {data.pendientes > 0 && (
          <div role="status" className="mt-4 flex flex-wrap items-center gap-4 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] px-5 py-4">
            <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 text-[var(--color-text-muted)]"><rect x="3" y="8" width="18" height="13" rx="1.5" /><path d="M3 12h18M12 8v13M12 8S10.5 3 8 3.5 7 8 12 8zm0 0s1.5-5 4-4.5S17 8 12 8z" /></svg>
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-[var(--color-text)]">Tienes {data.pendientes} donaci{data.pendientes === 1 ? 'ón pendiente' : 'ones pendientes'}</p>
              <p className="text-sm text-[var(--color-text-muted)]">Acéptala{data.pendientes === 1 ? '' : 's'} o recházala{data.pendientes === 1 ? '' : 's'} para que las personas sepan qué hacer.</p>
            </div>
            <Link to="/fundacion/donaciones" className="rounded-xl bg-violeta px-6 py-2.5 text-sm font-semibold text-white">Revisar</Link>
          </div>
        )}

        {/* Encabezado */}
        <p className={`mt-8 ${eyebrow}`}>Fundación aliada · {f.barrio}</p>
        <h1 className="mt-2 max-w-xl text-5xl font-extrabold leading-[.95] tracking-tight md:text-7xl text-[var(--color-text)]">{f.nombre}</h1>
        <p className="mt-4 max-w-md text-[var(--color-text-muted)]">{f.descripcion}</p>

        {/* A quién ayudamos y fotos */}
        <div className="mt-6 grid gap-4 md:grid-cols-[1.35fr_1fr_1fr]">
          <div className={card}>
            <h2 className="text-2xl font-bold">A quién ayudamos</h2>
            <p className="mt-4 text-[var(--color-text-muted)]">{f.aQuienAyudamos}</p>
            <p className={`mt-4 ${eyebrow}`}>Qué hacemos</p>
            <ul className="mt-2 space-y-2 text-sm text-[var(--color-text-muted)]">
              {f.queHacemos.map((q) => <li key={q} className="flex gap-2"><span aria-hidden="true" className="text-[var(--color-accent)]">✓</span>{q}</li>)}
            </ul>
          </div>
          {[[f.fotos.trabajo, 'Actividad de la fundación', 'Nuestro trabajo'], [f.fotos.donaciones, 'Ropa donada lista para entregar', 'Así llegan tus donaciones']].map(([src, alt, cap]) => (
            <figure key={cap} className="relative min-h-52 overflow-hidden rounded-2xl">
              <img src={src} alt={alt} loading="lazy" className="absolute inset-0 h-full w-full object-cover" />
              <figcaption className="absolute bottom-3 left-3 rounded-full bg-[var(--color-surface)]/90 text-[var(--color-text)] border border-[var(--color-border)] px-3 py-1 text-[10px] font-bold uppercase tracking-[.14em]">{cap}</figcaption>
            </figure>
          ))}
        </div>

        {/* Qué recibimos, necesidades y contacto */}
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <div className={card}>
            <h2 className="text-2xl font-bold">Qué recibimos</h2>
            <ul className="mt-4 flex flex-wrap gap-2" aria-label="Qué recibimos">
              {f.queRecibimos.map((q) => <li key={q} className="rounded-full border border-[var(--color-border)] px-3 py-1 text-[11px] font-bold uppercase tracking-[.12em]">{q}</li>)}
            </ul>
          </div>
          <div className={card}>
            <h2 className="text-2xl font-bold">Lo que más necesitamos</h2>
            <ul className="mt-4 space-y-4">
              {f.necesidades.map((n) => (
                <li key={n.nombre}>
                  <p className="text-sm font-semibold">{n.nombre}</p>
                  <div role="progressbar" aria-label={n.nombre} aria-valuemin={0} aria-valuemax={100} aria-valuenow={n.avance} className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-[var(--color-border)]">
                    <div className="h-full rounded-full bg-violeta" style={{ width: `${Math.min(100, Math.max(0, n.avance))}%` }} />
                  </div>
                  <p className="mt-1 text-xs text-[var(--color-text-muted)]">{n.avance}% de la meta</p>
                </li>
              ))}
            </ul>
          </div>
          <div className={card}>
            <h2 className="text-2xl font-bold">Contacto</h2>
            <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
              {([['Dirección', f.contacto.direccion], ['Horario', f.contacto.horario], ['Teléfono', f.contacto.telefono], ['Web', f.contacto.web], ['Correo', f.contacto.correo]] as const)
                .filter(([, v]) => v).map(([k, v]) => (
                  // El correo ocupa la fila completa para no partirse a la mitad
                  <div key={k} className={`border-b border-[var(--color-border)] pb-2 ${k === 'Correo' ? 'col-span-2' : ''}`}>
                    <dt className="text-[10px] font-bold uppercase tracking-[.14em] text-[var(--color-text-muted)]">{k}</dt>
                    <dd className="mt-0.5 break-words">{v}</dd>
                  </div>
                ))}
            </dl>
          </div>
        </div>

        <Link to="/fundacion/donaciones" className="mt-4 flex items-center justify-center gap-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-5 py-3 text-sm font-semibold hover:bg-[var(--color-surface-muted)]">
          <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" className="h-4 w-4"><path d="M12 3l8 4.5v9L12 21l-8-4.5v-9L12 3zM4 7.5l8 4.5 8-4.5M12 12v9" /></svg>
          Ver donaciones
        </Link>
      </div>
    </section>
  )
}
