import { Card, Badge } from '@/modules/core/design-system'

type Props = {
  title: string
  squad: string
  microservicios: string
  rf: string
  description?: string
}

/** Pantalla pendiente: deja claro qué squad la construye y qué requerimientos cubre. */
export function PagePlaceholder({ title, squad, microservicios, rf, description }: Props) {
  return (
    <section className="mx-auto max-w-4xl px-4 py-16 text-[var(--color-text)]">
      <Badge tone="arena">En construcción</Badge>
      <h1 className="mt-4 text-4xl font-extrabold tracking-tight md:text-5xl">{title}</h1>
      {description && <p className="mt-3 max-w-2xl text-[var(--color-text-muted)]">{description}</p>}
      <Card className="mt-8 grid gap-4 sm:grid-cols-3">
        <div><p className="text-[0.6875rem] font-bold uppercase tracking-[.16em] text-arena">Squad</p><p className="mt-1">{squad}</p></div>
        <div><p className="text-[0.6875rem] font-bold uppercase tracking-[.16em] text-arena">Microservicios</p><p className="mt-1">{microservicios}</p></div>
        <div><p className="text-[0.6875rem] font-bold uppercase tracking-[.16em] text-arena">Requerimientos</p><p className="mt-1">{rf}</p></div>
      </Card>
    </section>
  )
}
