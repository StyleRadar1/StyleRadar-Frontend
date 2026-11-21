import type { PerfilDto, UsuarioAdminDto } from '../types/usuario.dto'

/** Cuentas de la administración de usuarios: las mismas del prototipo (rama feature/archivo-unificado). */
export const USUARIOS_BASE: UsuarioAdminDto[] = [
  { id: 'u-1', nombre: 'Valentina Rojas', correo: 'usuario@styleradar.co', rol: 'BUYER', plan: 'RADAR_PLUS', estado: 'ACTIVA', barrio: 'Chapinero', miembroDesde: '2025-03-04' },
  { id: 'u-2', nombre: 'Mateo Pérez', correo: 'mateo.p@correo.com', rol: 'BUYER', plan: 'RADAR', estado: 'ACTIVA', barrio: 'Teusaquillo', miembroDesde: '2025-04-11' },
  { id: 'u-3', nombre: 'Camila Suárez', correo: 'camila.s@correo.com', rol: 'BUYER', plan: 'RADAR_PLUS', estado: 'ACTIVA', barrio: 'Usaquén', miembroDesde: '2025-05-02' },
  { id: 'u-4', nombre: 'Sofía López', correo: 'sofia.l@correo.com', rol: 'BUYER', plan: 'RADAR_PLUS', estado: 'ACTIVA', barrio: 'Chapinero', miembroDesde: '2025-06-19' },
  { id: 'u-5', nombre: 'Andrés Mora', correo: 'andres.m@correo.com', rol: 'BUYER', plan: 'RADAR', estado: 'INACTIVA', barrio: 'Suba', miembroDesde: '2025-06-23' },
  { id: 'u-6', nombre: 'Laura Torres', correo: 'laura.t@correo.com', rol: 'BUYER', plan: 'RADAR_PLUS', estado: 'ACTIVA', barrio: 'Chicó', miembroDesde: '2025-07-08' },
  { id: 'u-7', nombre: 'Julián Rincón', correo: 'julian.r@correo.com', rol: 'BUYER', plan: 'RADAR', estado: 'BLOQUEADA', barrio: 'Kennedy', miembroDesde: '2025-08-14' },
  { id: 'u-8', nombre: 'Mariana Gil', correo: 'mariana.g@correo.com', rol: 'BUYER', plan: 'RADAR', estado: 'ACTIVA', barrio: 'Cedritos', miembroDesde: '2025-09-01' },
  { id: 'u-9', nombre: 'Santiago Vélez', correo: 'santiago.v@correo.com', rol: 'BUYER', plan: 'RADAR_PLUS', estado: 'ACTIVA', barrio: 'Zona G', miembroDesde: '2025-10-17' },
  { id: 'u-10', nombre: 'Daniela Ortiz', correo: 'daniela.o@correo.com', rol: 'BUYER', plan: 'RADAR', estado: 'ACTIVA', barrio: 'Engativá', miembroDesde: '2025-11-05' },
  { id: 'u-11', nombre: 'Felipe Castro', correo: 'felipe.c@correo.com', rol: 'BUYER', plan: 'RADAR_PLUS', estado: 'INACTIVA', barrio: 'Fontibón', miembroDesde: '2026-01-20' },
  { id: 'u-12', nombre: 'Paula Méndez', correo: 'paula.m@correo.com', rol: 'BUYER', plan: 'RADAR', estado: 'ACTIVA', barrio: 'Bosa', miembroDesde: '2026-02-09' },
  { id: 't-1', nombre: 'Luna Store', correo: 'luna@styleradar.co', rol: 'STORE_ADMIN', plan: 'RADAR', estado: 'ACTIVA', barrio: 'Chapinero', miembroDesde: '2025-02-15' },
  { id: 'f-1', nombre: 'Fundación Abrigo Bogotá', correo: 'abrigo@styleradar.co', rol: 'FOUNDATION_REPRESENTATIVE', plan: 'RADAR', estado: 'ACTIVA', barrio: 'Chapinero', miembroDesde: '2025-03-28' },
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
