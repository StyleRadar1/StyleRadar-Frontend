import type { AdminUserDto, PerfilDto } from '../types/usuario.dto'

/** Cuentas de la administración de usuarios (SR-RF-66): las mismas del prototipo, con los campos del contrato. */
export const USUARIOS_BASE: AdminUserDto[] = [
  { id: 'u-1', name: 'Valentina Rojas', email: 'usuario@styleradar.co', roles: ['BUYER'], accountStatus: 'ACTIVE', neighborhood: 'Chapinero', registeredAt: '2025-03-04T10:00:00Z' },
  { id: 'u-2', name: 'Mateo Pérez', email: 'mateo.p@correo.com', roles: ['BUYER'], accountStatus: 'ACTIVE', neighborhood: 'Teusaquillo', registeredAt: '2025-04-11T10:00:00Z' },
  { id: 'u-3', name: 'Camila Suárez', email: 'camila.s@correo.com', roles: ['BUYER'], accountStatus: 'ACTIVE', neighborhood: 'Usaquén', registeredAt: '2025-05-02T10:00:00Z' },
  { id: 'u-4', name: 'Sofía López', email: 'sofia.l@correo.com', roles: ['BUYER'], accountStatus: 'ACTIVE', neighborhood: 'Chapinero', registeredAt: '2025-06-19T10:00:00Z' },
  { id: 'u-5', name: 'Andrés Mora', email: 'andres.m@correo.com', roles: ['BUYER'], accountStatus: 'INACTIVE', neighborhood: 'Suba', registeredAt: '2025-06-23T10:00:00Z', statusChangedAt: '2026-04-10T09:00:00Z', statusChangedBy: 'a-1', statusChangeReason: 'Sin uso en seis meses.' },
  { id: 'u-6', name: 'Laura Torres', email: 'laura.t@correo.com', roles: ['BUYER'], accountStatus: 'ACTIVE', neighborhood: 'Chicó', registeredAt: '2025-07-08T10:00:00Z' },
  { id: 'u-7', name: 'Julián Rincón', email: 'julian.r@correo.com', roles: ['BUYER'], accountStatus: 'BLOCKED', neighborhood: 'Kennedy', registeredAt: '2025-08-14T10:00:00Z', statusChangedAt: '2026-03-02T15:20:00Z', statusChangedBy: 'a-1', statusChangeReason: 'Publicó prendas que no eran suyas.' },
  { id: 'u-8', name: 'Mariana Gil', email: 'mariana.g@correo.com', roles: ['BUYER'], accountStatus: 'ACTIVE', neighborhood: 'Cedritos', registeredAt: '2025-09-01T10:00:00Z' },
  { id: 'u-9', name: 'Santiago Vélez', email: 'santiago.v@correo.com', roles: ['BUYER'], accountStatus: 'ACTIVE', neighborhood: 'Zona G', registeredAt: '2025-10-17T10:00:00Z' },
  { id: 'u-10', name: 'Daniela Ortiz', email: 'daniela.o@correo.com', roles: ['BUYER'], accountStatus: 'ACTIVE', neighborhood: 'Engativá', registeredAt: '2025-11-05T10:00:00Z' },
  { id: 'u-11', name: 'Felipe Castro', email: 'felipe.c@correo.com', roles: ['BUYER'], accountStatus: 'INACTIVE', neighborhood: 'Fontibón', registeredAt: '2026-01-20T10:00:00Z', statusChangedAt: '2026-04-10T09:00:00Z', statusChangedBy: 'a-1', statusChangeReason: 'Sin uso en seis meses.' },
  { id: 'u-12', name: 'Paula Méndez', email: 'paula.m@correo.com', roles: ['BUYER'], accountStatus: 'ACTIVE', neighborhood: 'Bosa', registeredAt: '2026-02-09T10:00:00Z' },
  { id: 't-1', name: 'Luna Store', email: 'luna@styleradar.co', roles: ['STORE_ADMIN'], accountStatus: 'ACTIVE', neighborhood: 'Chapinero', registeredAt: '2025-02-15T10:00:00Z' },
  { id: 'f-1', name: 'Fundación Abrigo Bogotá', email: 'abrigo@styleradar.co', roles: ['FOUNDATION_REPRESENTATIVE'], accountStatus: 'ACTIVE', neighborhood: 'Chapinero', registeredAt: '2025-03-28T10:00:00Z' },
]

/** Perfiles de prueba por id de usuario. El de Valentina es el del prototipo. */
export const PERFILES_BASE: Record<string, PerfilDto> = {
  'u-1': {
    id: 'u-1', name: 'Valentina Rojas', email: 'usuario@styleradar.co', phone: '+57 310 555 0142', neighborhood: 'Chapinero',
    emailVerified: true, registeredAt: '2025-03-04T10:00:00Z',
    stylePreferences: ['FORMAL', 'CASUAL', 'URBAN'], usualSizes: ['M'],
    sizesByGarmentType: { TOP: ['M'], BOTTOM: ['30'], FOOTWEAR: ['38'] },
    maniqui: 'HOMBRE', plan: 'RADAR_PLUS',
  },
}

/** Perfil inicial de una cuenta nueva: sin tallas ni estilos elegidos todavía (SR-RF-01). */
export const perfilNuevo = (id: string, name: string, email: string, neighborhood = ''): PerfilDto => ({
  id, name, email, phone: '', neighborhood, emailVerified: false, registeredAt: new Date().toISOString(),
  stylePreferences: [], usualSizes: [], sizesByGarmentType: {}, maniqui: 'MUJER', plan: 'RADAR',
})
