import { useState, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Button, Badge } from '@/modules/core/design-system'
import { Loading } from '@/modules/core/components/Status'
import { ApiError } from '@/modules/core/api/apiClient'
import { errorKind } from '@/modules/core/api/errors'
import { Aviso, BTN_PRINCIPAL, BTN_SECUNDARIO, type TonoAviso } from '@/modules/core/components/Aviso'
import { alertService, LIMITE_PLAN } from '@/modules/soporte/services/alertService'
import { formatCOP } from '@/modules/core/utils/format'
import { useResource } from '@/modules/core/hooks/useResource'
import { ContactButton } from '@/modules/soporte/components/ContactButton'
import { tiendaContacto } from '@/modules/soporte/utils/contacts'
import { ItemCard } from '../components/ItemCard'
import { itemService } from '../services/itemService'
import type { ItemResponseDto } from '../types/item.dto'

type Accion = 'reintentar-alerta' | 'reservar' | 'planes' | 'login' | 'ver-alertas'
interface AvisoPrenda { tono: TonoAviso; titulo: string; texto: string; accion?: Accion }

/** Error al crear la alerta de una prenda (ms-notificaciones): texto fijo, nunca el del servidor. */
function avisoAlerta(e: unknown): AvisoPrenda {
  const status = e instanceof ApiError ? e.status : 0
  if (status === 409) return { tono: 'info', titulo: 'Ya tienes una alerta para esta prenda', texto: 'Te avisamos cuando llegue.', accion: 'ver-alertas' }
  if (status === 422 && e instanceof ApiError && e.code === LIMITE_PLAN) {
    return { tono: 'alerta', titulo: 'Llegaste al límite de alertas', texto: 'Con el plan Radar puedes tener hasta 3 alertas activas. Con Radar+ no hay límite.', accion: 'planes' }
  }
  if (status === 422) return { tono: 'info', titulo: 'Esta prenda ya tiene unidades', texto: 'Puedes reservarla ahora.', accion: 'reservar' }
  return general(e, 'No pudimos crear la alerta', 'reintentar-alerta')
}

/** Error al reservar (ms-inventario): 409 es que ya no hay unidades de esa talla. */
function avisoReserva(e: unknown): AvisoPrenda {
  const status = e instanceof ApiError ? e.status : 0
  if (status === 409) return { tono: 'error', titulo: 'Ya no quedan unidades en esa talla', texto: 'Prueba con otra.' }
  return general(e, 'No pudimos reservar la prenda')
}

function general(e: unknown, titulo: string, accion?: Accion): AvisoPrenda {
  const kind = errorKind(e)
  if (kind === 'sesion') return { tono: 'info', titulo: 'Inicia sesión para continuar', texto: 'Así guardamos tu alerta o tu reserva.', accion: 'login' }
  if (kind === 'sin-conexion') return { tono: 'error', titulo: 'Se perdió la conexión', texto: 'Revisa tu internet e intenta de nuevo.', accion }
  return { tono: 'error', titulo, texto: 'Intenta más tarde.', accion }
}

export default function ItemDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [tallaSeleccionada, setTallaSeleccionada] = useState<string>('')
  const [guardado, setGuardado] = useState(false)
  const [mensajeFeedback, setMensajeFeedback] = useState<string | null>(null)
  const [aviso, setAviso] = useState<AvisoPrenda | null>(null)
  const [ocupado, setOcupado] = useState<'alerta' | 'reserva' | null>(null)
  /** Tallas que el inventario dijo que se agotaron (409 al reservar). */
  const [agotadas, setAgotadas] = useState<string[]>([])

  // Carga de la prenda principal
  const loader = useCallback(async () => {
    if (!id) throw new ApiError(404, 'Prenda no especificada.')
    const prenda = await itemService.getById(id)
    const similares = await itemService.search({ estilo: prenda.estilo })
    return {
      prenda,
      similares: similares.filter((x) => x.id !== prenda.id).slice(0, 4),
    }
  }, [id])

  const { data, loading, error, reload: recargar } = useResource<{
    prenda: ItemResponseDto | null
    similares: ItemResponseDto[]
  }>(loader, { prenda: null, similares: [] })

  const prenda = data.prenda
  const similares = data.similares
  // 403 y 404 se ven igual: la prenda no existe o no está disponible para esta persona
  const noExiste = !!error && (errorKind(error) === 'no-existe' || errorKind(error) === 'permiso')

  const crearAlerta = async () => {
    if (!prenda || ocupado) return
    setOcupado('alerta'); setAviso(null)
    try {
      await alertService.createAlert(prenda.id, prenda.nombre, prenda.tienda, tallaSeleccionada || undefined)
      setAviso({ tono: 'exito', titulo: 'Te avisaremos cuando llegue', texto: 'La encuentras en «Mis búsquedas y alertas».', accion: 'ver-alertas' })
    } catch (e) {
      setAviso(avisoAlerta(e))
    } finally { setOcupado(null) }
  }

  const reservar = async () => {
    if (!prenda || ocupado) return
    if (!tallaSeleccionada) { setAviso({ tono: 'info', titulo: 'Elige tu talla', texto: 'Así reservamos la unidad correcta en la tienda.' }); return }
    setOcupado('reserva'); setAviso(null)
    try {
      await itemService.reserve(prenda.id, tallaSeleccionada)
      setAviso({ tono: 'exito', titulo: `Reservamos tu talla ${tallaSeleccionada}`, texto: `Tienes 15 minutos para recogerla en ${prenda.tienda}.` })
    } catch (e) {
      const a = avisoReserva(e)
      if (e instanceof ApiError && e.status === 409) { setAgotadas((l) => [...l, tallaSeleccionada]); setTallaSeleccionada('') }
      setAviso(a)
    } finally { setOcupado(null) }
  }

  const accionAviso = (a: AvisoPrenda) => {
    switch (a.accion) {
      case 'reintentar-alerta': return <button type="button" disabled={!!ocupado} onClick={crearAlerta} className={BTN_PRINCIPAL}>Reintentar</button>
      case 'reservar': return <button type="button" disabled={!!ocupado} onClick={reservar} className={BTN_PRINCIPAL}>Reservar en tienda</button>
      case 'planes': return <Link to="/planes" className={BTN_PRINCIPAL}>Ver Radar+</Link>
      case 'login': return <Link to="/login" className={BTN_PRINCIPAL}>Iniciar sesión</Link>
      case 'ver-alertas': return <Link to="/alertas" className={BTN_SECUNDARIO}>Ver mis alertas</Link>
      default: return undefined
    }
  }

  const handleGuardar = () => {
    setGuardado((prev) => !prev)
    setMensajeFeedback(guardado ? 'Prenda retirada de tu wishlist.' : '¡Prenda guardada en tu wishlist!')
    setTimeout(() => setMensajeFeedback(null), 3000)
  }

  return (
    <section className="mx-auto max-w-6xl px-4 py-10">
      {/* Breadcrumb */}
      <nav className="mb-6 flex items-center gap-2 text-xs text-white/50" aria-label="Migas de pan">
        <Link to="/catalogo" className="hover:text-white">Catálogo</Link>
        <span>/</span>
        {prenda && (
          <>
            <Link to={`/catalogo?estilo=${prenda.estilo}`} className="hover:text-white">
              {prenda.estilo}
            </Link>
            <span>/</span>
            <span className="truncate text-white/80">{prenda.nombre}</span>
          </>
        )}
      </nav>

      {/* Estados */}
      {loading && <Loading label="Cargando detalles de la prenda..." />}

      {noExiste && (
        <Aviso tono="info" titulo="Esta prenda ya no está disponible." acciones={<Link to="/catalogo" className={BTN_PRINCIPAL}>Volver al catálogo</Link>}>
          Puede que la tienda la haya retirado del catálogo.
        </Aviso>
      )}

      {!!error && !noExiste && (
        <Aviso tono="error" titulo="No pudimos cargar la prenda" acciones={<button type="button" onClick={recargar} className={BTN_PRINCIPAL}>Reintentar</button>}>
          {errorKind(error) === 'sin-conexion' ? 'Revisa tu internet e intenta de nuevo.' : 'Intenta en unos minutos.'}
        </Aviso>
      )}

      {mensajeFeedback && (
        <div role="status" className="mb-6 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3.5 text-xs text-emerald-200">
          {mensajeFeedback}
        </div>
      )}

      {prenda && (
        <div className="space-y-16">
          {/* Ficha Principal de la Prenda */}
          <div className="grid gap-10 md:grid-cols-2 lg:gap-14">
            {/* Columna Izquierda: Imagen Editorial 4:5 */}
            <div className="relative aspect-[4/5] w-full overflow-hidden rounded-3xl border border-white/10 bg-black/40 shadow-2xl">
              <img
                src={prenda.imagen}
                alt={prenda.nombre}
                className="h-full w-full object-cover"
                onError={(e) => {
                  ;(e.currentTarget as HTMLElement).style.display = 'none'
                }}
              />
              <div className="absolute left-4 top-4 flex gap-2">
                <Badge tone="arena">{prenda.estilo}</Badge>
                <span className="rounded-full bg-black/60 px-3 py-1 text-[11px] font-semibold text-white backdrop-blur">
                  {prenda.tipo}
                </span>
              </div>
            </div>

            {/* Columna Derecha: Información y Acciones (RF-16, 22, 57) */}
            <div className="flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 text-xs font-semibold text-arena">
                  <span>{prenda.tienda}</span>
                  <span>·</span>
                  <span>{prenda.barrio}</span>
                  <span>·</span>
                  <span className="text-white/60">A {prenda.distanciaKm} km de ti</span>
                </div>

                <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-white md:text-4xl">
                  {prenda.nombre}
                </h1>

                <p className="mt-4 text-3xl font-extrabold text-violeta-claro">
                  {formatCOP(prenda.precio)}
                </p>

                {/* Disponibilidad en tienda (RF-22) */}
                <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-4 text-xs text-white/80">
                  <p className="font-semibold text-white">Disponibilidad en tienda real (RF-22)</p>
                  <p className="mt-1 text-white/60">
                    Disponible hoy para entrega o retiro inmediato en <strong>{prenda.tienda}</strong> ({prenda.barrio}).
                  </p>
                  {/* RF-73: escribirle a la tienda por chat (reemplaza «Llamar») */}
                  <ContactButton className="mt-3" label="Enviar mensaje a la tienda" contacto={tiendaContacto(prenda.tienda)} asunto={prenda.nombre} referenciaId={prenda.id} />
                </div>

                {/* Selector de tallas interactivas */}
                <div className="mt-6">
                  <div className="flex items-center justify-between text-xs font-semibold text-white/80">
                    <span>Selecciona tu talla:</span>
                    {tallaSeleccionada && (
                      <span className="text-violeta-claro">Talla elegida: {tallaSeleccionada}</span>
                    )}
                  </div>
                  <div className="mt-2.5 flex flex-wrap gap-2.5" role="radiogroup" aria-label="Tallas disponibles">
                    {prenda.tallas.map((talla) => (
                      <button
                        key={talla}
                        type="button"
                        role="radio"
                        aria-checked={tallaSeleccionada === talla}
                        disabled={agotadas.includes(talla)}
                        aria-label={agotadas.includes(talla) ? `${talla}, agotada` : talla}
                        onClick={() => setTallaSeleccionada(talla)}
                        className={`h-11 min-w-[44px] rounded-xl border px-3 text-xs font-bold transition disabled:cursor-not-allowed disabled:line-through disabled:opacity-40 ${
                          tallaSeleccionada === talla
                            ? 'border-arena bg-arena text-grafito shadow-md scale-105'
                            : 'border-white/20 bg-white/5 text-white hover:bg-white/10'
                        }`}
                      >
                        {talla}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Atributos adicionales */}
                <div className="mt-6 grid grid-cols-2 gap-3 text-xs">
                  <div className="rounded-xl border border-white/5 bg-white/[.02] p-3">
                    <span className="text-white/50">Color</span>
                    <p className="font-semibold text-white">{prenda.color}</p>
                  </div>
                  <div className="rounded-xl border border-white/5 bg-white/[.02] p-3">
                    <span className="text-white/50">Estilo urbano</span>
                    <p className="font-semibold text-white">{prenda.estilo}</p>
                  </div>
                </div>
              </div>

              {/* Reserva en tienda (ms-inventario) y alerta de disponibilidad (ms-notificaciones) */}
              <div className="mt-6 flex flex-wrap gap-2">
                <button type="button" onClick={reservar} disabled={!!ocupado} className={BTN_PRINCIPAL}>
                  {ocupado === 'reserva' ? 'Reservando…' : 'Reservar en tienda'}
                </button>
                <button type="button" onClick={crearAlerta} disabled={!!ocupado} className={BTN_SECUNDARIO}>
                  {ocupado === 'alerta' ? 'Creando alerta…' : 'Avisarme cuando llegue'}
                </button>
              </div>
              {aviso && (
                <Aviso tono={aviso.tono} className="mt-4" titulo={aviso.titulo} acciones={accionAviso(aviso)} onCerrar={() => setAviso(null)}>
                  {aviso.texto}
                </Aviso>
              )}

              {/* Botones de acción principales (RF-57) */}
              <div className="mt-8 flex flex-col gap-3 pt-6 border-t border-white/10 sm:flex-row">
                <Link
                  to={`/probador?prenda=${prenda.id}${tallaSeleccionada ? `&talla=${tallaSeleccionada}` : ''}`}
                  className="flex-1"
                >
                  <Button variant="primario" className="w-full">
                    ✨ Probarme esta prenda en el probador
                  </Button>
                </Link>

                <Button
                  variant={guardado ? 'arena' : 'secundario'}
                  onClick={handleGuardar}
                  className="px-5"
                >
                  {guardado ? '★ Guardada' : '☆ Guardar look'}
                </Button>
              </div>
            </div>
          </div>

          {/* Sección de Prendas Similares (RF-16) */}
          {similares.length > 0 && (
            <div className="border-t border-white/10 pt-12">
              <div className="flex items-end justify-between">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-arena">RF-16</span>
                  <h2 className="mt-1 text-2xl font-bold text-white">Prendas similares de estilo {prenda.estilo}</h2>
                  <p className="mt-1 text-xs text-white/60">
                    Otras opciones disponibles en almacenes de Bogotá con estética compatible.
                  </p>
                </div>
                <Link to={`/catalogo?estilo=${prenda.estilo}`} className="text-xs font-semibold text-violeta-claro hover:underline">
                  Ver todas →
                </Link>
              </div>

              <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
                {similares.map((sim) => (
                  <ItemCard key={sim.id} item={sim} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  )
}
