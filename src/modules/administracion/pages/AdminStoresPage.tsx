import { ErrorState, Loading } from '@/modules/core/components/Status'
import { useResource } from '@/modules/core/hooks/useResource'
import { descargarCsv } from '@/modules/soporte/utils/charts'
import { AdminHeader, AdminTable, EditLink, StatusBadge, Who, type Columna } from '../components/AdminUi'
import { adminStoreService } from '../services/adminService'
import type { AdminStoreDto } from '../types/admin.dto'

const COLUMNAS: Columna<AdminStoreDto>[] = [
  { label: 'Tienda', render: (t) => <Who name={t.nombre} sub={t.categoria} />, sort: (t) => t.nombre },
  { label: 'NIT', render: (t) => t.nit, secundaria: true },
  { label: 'Barrio', render: (t) => t.barrio, sort: (t) => t.barrio },
  { label: 'Verificación', render: (t) => <StatusBadge value={t.verificacion} />, sort: (t) => t.verificacion },
  { label: 'Suscripción', render: (t) => <StatusBadge value={t.suscripcion.estado} />, sort: (t) => t.suscripcion.estado },
  { label: 'Prendas', render: (t) => t.catalogo.publicadas, sort: (t) => t.catalogo.publicadas, num: true },
]

/** Admin › Tiendas: verificación y suscripción de las tiendas aliadas (RF-89). */
export default function AdminStoresPage() {
  const { data, loading, error, reload } = useResource(adminStoreService.list, [] as AdminStoreDto[])

  return (
    <>
      <AdminHeader kicker="Configuración" title="Tiendas" />
      {loading ? <Loading label="Cargando tiendas…" /> : error ? <ErrorState error={error} onRetry={reload} title="No pudimos cargar las tiendas" /> : (
        <AdminTable rows={data} columnas={COLUMNAS} keyOf={(t) => t.id} titulo={(t) => t.nombre} vacio="No hay tiendas con esos filtros."
          buscar={{ placeholder: 'Buscar tienda, NIT o barrio', texto: (t) => `${t.nombre} ${t.nit} ${t.barrio}` }}
          filtros={[
            { label: 'Verificación', opciones: ['Verificada', 'Pendiente', 'Rechazada'], get: (t) => t.verificacion },
            { label: 'Suscripción', opciones: ['Activa', 'Periodo gratuito', 'Cancelada', 'Vencida', 'Sin suscripción'], get: (t) => t.suscripcion.estado },
          ]}
          herramientas={<button type="button" onClick={() => exportar(data)} className="rounded-xl border border-white/20 px-4 py-2.5 text-sm font-semibold hover:bg-white/10">Exportar a Excel</button>}
          acciones={(t) => <EditLink to={`/admin/tiendas/${t.id}`} name={t.nombre} />} />
      )}
    </>
  )
}

const exportar = (l: AdminStoreDto[]) => descargarCsv('tiendas-styleradar', [
  ['Tienda', 'Categoría', 'NIT', 'Barrio', 'Verificación', 'Suscripción', 'Prendas publicadas', 'Correo', 'Teléfono'],
  ...l.map((t) => [t.nombre, t.categoria, t.nit, t.barrio, t.verificacion, t.suscripcion.estado, t.catalogo.publicadas, t.correo, t.telefono]),
])
