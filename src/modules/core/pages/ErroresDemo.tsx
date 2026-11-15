import { useState } from 'react'
import { Aviso, ErrorCampo, EscenaError, Toasts, useToasts } from '@/modules/core/components/errores'
import { ThemeSegment } from '@/modules/core/theme/ThemeSegment'

const btn = 'rounded-xl bg-violeta px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-40'
const btnSec = 'rounded-xl border border-[color-mix(in_srgb,var(--sr-tx)_25%,transparent)] px-4 py-2.5 text-sm font-semibold text-[var(--sr-tx)]'

/**
 * Vitrina de las piezas comunes de error. Solo existe en desarrollo (/dev/errores):
 * sirve para revisarlas en los tres temas antes de usarlas en cada pantalla.
 */
export default function ErroresDemo() {
  const [intento, setIntento] = useState(0)
  const [correo, setCorreo] = useState('valentina@')
  const [enviado, setEnviado] = useState(false)
  const toasts = useToasts()
  const correoMal = enviado && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(correo)

  return (
    <main className="pb-24">
      <header className="mx-auto grid max-w-5xl gap-3 px-4 pt-10">
        <p className="text-[11px] font-bold uppercase tracking-[.2em] text-[var(--sr-tx-2)]">Solo en desarrollo · Flujo de errores</p>
        <h1 className="text-4xl font-extrabold text-[var(--sr-tx)]">Piezas comunes de error</h1>
        <p className="max-w-[70ch] text-sm text-[var(--sr-tx-2)]">Escenas animadas, error de campo, aviso y toast. Cambia el tema para verlas en oscuro, claro y daltónico.</p>
        <div className="w-fit"><ThemeSegment /></div>
      </header>

      <EscenaError escena="perchero" codigo="404" etiqueta="No encontrada" titulo="No encontramos esta página"
        texto="Puede que el enlace esté mal escrito o que la página ya no exista."
        acciones={<a href="/" className={btn}>Volver al inicio</a>} />

      <EscenaError escena="tornamesa" codigo="503" etiqueta="Servicio caído" titulo="El servicio no está disponible"
        texto="Intenta en unos minutos." intento={intento}
        acciones={<button type="button" className={btn} onClick={() => setIntento((n) => n + 1)}>Reintentar</button>} />

      <EscenaError escena="maniqui" codigo="429" etiqueta="Demasiados intentos" titulo="Espera un momento"
        texto="Hiciste demasiados intentos. Cuando el reloj llegue a cero puedes pedir otro código." segundos={45}
        acciones={(restante) => <button type="button" className={btn} disabled={restante > 0}>Pedir otro código</button>} />

      <EscenaError escena="etiqueta" codigo="401" etiqueta="Sesión vencida" titulo="Tu sesión venció"
        texto="Vuelve a iniciar sesión y te regresamos a la página donde estabas."
        acciones={<><a href="/?login" className={btn}>Iniciar sesión</a><a href="/" className={btnSec}>Cancelar</a></>} />

      <EscenaError escena="radar" etiqueta="Sin resultados" titulo="No encontramos prendas"
        texto="Quita algún filtro o prueba con otra búsqueda. (Estado vacío: no es un error del plan, no lleva código.)"
        acciones={<button type="button" className={btn}>Quitar filtros</button>} />

      <section className="mx-auto grid max-w-5xl gap-6 px-4 pt-6 md:grid-cols-3">
        <form className="grid content-start gap-2 rounded-2xl border border-[color-mix(in_srgb,var(--sr-tx)_10%,transparent)] p-5" noValidate
          onSubmit={(e) => { e.preventDefault(); setEnviado(true) }}>
          <p className="text-[11px] font-bold uppercase tracking-[.18em] text-[var(--sr-tx-2)]">Error de campo · 400</p>
          <label htmlFor="demo-correo" className="text-xs font-semibold text-[var(--sr-tx-2)]">Correo</label>
          <input id="demo-correo" value={correo} onChange={(e) => setCorreo(e.target.value)}
            aria-invalid={correoMal} aria-describedby={correoMal ? 'demo-correo-err' : undefined}
            className="rounded-xl border bg-transparent px-3 py-2.5 text-sm text-[var(--sr-tx)] outline-none focus-visible:ring-2 focus-visible:ring-[var(--sr-foco)]"
            style={{ borderColor: correoMal ? 'var(--sr-bad)' : 'color-mix(in srgb, var(--sr-tx) 20%, transparent)' }} />
          {correoMal && <ErrorCampo key={String(enviado) + correo} id="demo-correo">Escribe un correo válido, por ejemplo nombre@correo.com</ErrorCampo>}
          <button type="submit" className={`${btn} mt-2 w-fit`}>Entrar</button>
        </form>

        <div className="grid content-start gap-3">
          <p className="text-[11px] font-bold uppercase tracking-[.18em] text-[var(--sr-tx-2)]">Aviso · 409 y error</p>
          <Aviso tono="aviso" titulo="La suscripción no permite esa acción ahora">Actualizamos el estado de tu plan.</Aviso>
          <Aviso tono="error" titulo="No pudimos entrar con Google" accion={<button type="button" className={btnSec}>Intentar de nuevo</button>} />
        </div>

        <div className="grid content-start gap-3">
          <p className="text-[11px] font-bold uppercase tracking-[.18em] text-[var(--sr-tx-2)]">Toast · 5 segundos</p>
          <button type="button" className={btnSec} onClick={() => toasts.mostrar({ tono: 'error', titulo: 'No se pudo cambiar el estado', texto: 'El estado quedó como estaba.' })}>Mostrar error</button>
          <button type="button" className={btnSec} onClick={() => toasts.mostrar({ tono: 'ok', titulo: 'Cuenta de Mateo bloqueada', accion: { label: 'Deshacer', onClick: () => {} } })}>Mostrar con deshacer</button>
        </div>
      </section>
      <Toasts items={toasts.items} quitar={toasts.quitar} duracion={toasts.duracion} />
    </main>
  )
}
