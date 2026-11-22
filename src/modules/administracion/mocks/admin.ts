import type { AdminFoundationDto, AdminPlaylistDto, AdminStoreDto } from '../types/admin.dto'

const docs = (rut: boolean, camara: boolean, fotos: boolean, banco: boolean) =>
  [['RUT', rut], ['Cámara de comercio', camara], ['Fotos del local', fotos], ['Cuenta bancaria', banco]].map(([nombre, recibido]) => ({ nombre: nombre as string, recibido: recibido as boolean }))

/** Tiendas del prototipo (Luna Store es la cuenta de prueba t-1). */
export const seedStores = (): AdminStoreDto[] => [
  { id: 'luna', nombre: 'Luna Store', categoria: 'Sport', barrio: 'Chapinero', direccion: 'Cra. 13 #57-22, Chapinero', telefono: '+57 601 555 0123', correo: 'luna@styleradar.co', nit: '901.482.337-1', representante: 'Daniela Luna', aliadaDesde: 'feb 2026', verificacion: 'Verificada',
    suscripcion: { estado: 'Activa', proximo: '23 oct 2026', inicio: 'feb 2026' }, documentos: docs(true, true, true, true), catalogo: { publicadas: 13, revision: 0, agotadas: 1, retiradas: 0 } },
  { id: 'nomada', nombre: 'Nómada Studio', categoria: 'Leather', barrio: 'Usaquén', direccion: 'Cl. 119 #6-24, Usaquén', telefono: '+57 601 555 0188', correo: 'hola@nomadastudio.co', nit: '900.771.204-3', representante: 'Tomás Ríos', aliadaDesde: 'nov 2025', verificacion: 'Verificada',
    suscripcion: { estado: 'Activa', proximo: '5 oct 2026', inicio: 'nov 2025' }, documentos: docs(true, true, true, true), catalogo: { publicadas: 7, revision: 0, agotadas: 0, retiradas: 0 } },
  { id: 'kicks', nombre: 'Kicks Local', categoria: 'Confort', barrio: 'Chicó', direccion: 'Cra. 11 #93-15, Chicó', telefono: '+57 601 555 0142', correo: 'tienda@kickslocal.co', nit: '901.103.556-8', representante: 'Julián Pardo', aliadaDesde: 'ene 2026', verificacion: 'Verificada',
    suscripcion: { estado: 'Periodo gratuito', proximo: '30 sep 2026', inicio: 'ago 2026' }, documentos: docs(true, true, true, true), catalogo: { publicadas: 4, revision: 0, agotadas: 1, retiradas: 0 } },
  { id: 'lab', nombre: 'The Local Lab', categoria: 'Urbana', barrio: 'Zona G', direccion: 'Cl. 69 #5-18, Zona G', telefono: '+57 601 555 0107', correo: 'lab@thelocallab.co', nit: '901.337.920-5', representante: 'Mariana Cruz', aliadaDesde: 'dic 2025', verificacion: 'Verificada',
    suscripcion: { estado: 'Activa', proximo: '12 oct 2026', inicio: 'dic 2025' }, documentos: docs(true, true, true, true), catalogo: { publicadas: 7, revision: 0, agotadas: 0, retiradas: 0 } },
  { id: 'ropero', nombre: 'Ropero 57', categoria: 'Vintage', barrio: 'Teusaquillo', direccion: 'Cl. 39 #17-22, Teusaquillo', telefono: '+57 601 555 0170', correo: 'ropero57@correo.co', nit: '901.880.114-2', representante: 'Ana Beltrán', aliadaDesde: 'sep 2026', verificacion: 'Pendiente',
    suscripcion: { estado: 'Periodo gratuito', proximo: '20 oct 2026', inicio: 'sep 2026' }, documentos: docs(true, true, true, false), catalogo: { publicadas: 0, revision: 0, agotadas: 0, retiradas: 0 } },
  { id: 'norte', nombre: 'Norte Denim', categoria: 'Denim', barrio: 'Cedritos', direccion: 'Cl. 140 #11-45', telefono: '+57 601 555 0133', correo: 'norte@denim.co', nit: '900.445.018-9', representante: 'Luis Gómez', aliadaDesde: 'jun 2025', verificacion: 'Verificada',
    suscripcion: { estado: 'Vencida', proximo: '—', inicio: 'jun 2025' }, documentos: docs(true, true, false, true), catalogo: { publicadas: 0, revision: 0, agotadas: 0, retiradas: 0 } },
  { id: 'tweed', nombre: 'Casa Tweed', categoria: 'Sastrería', barrio: 'Chapinero', direccion: 'Cra. 9 #60-11', telefono: '+57 601 555 0119', correo: 'casatweed@correo.co', nit: '—', representante: 'Pedro Vives', aliadaDesde: 'ago 2026', verificacion: 'Rechazada',
    motivoRechazo: 'Falta el RUT y la cámara de comercio.', suscripcion: { estado: 'Sin suscripción', proximo: '—', inicio: '—' }, documentos: docs(false, false, false, false), catalogo: { publicadas: 0, revision: 0, agotadas: 0, retiradas: 0 } },
]

const cert = (id: string) => `https://mock.styleradar.co/foundations/certificates/${id}.pdf`
const fundacionSeed = (f: Omit<AdminFoundationDto, 'estado' | 'aliadaDesde' | 'legalEntityCertificateUrl'> & { aliadaDesde: string }): AdminFoundationDto =>
  ({ ...f, estado: f.active ? 'Activa' : 'Inactiva', legalEntityCertificateUrl: cert(f.id) })

/** Fundaciones del prototipo con los campos de SR-RF-63. Los representantes son usuarios del mock de ms-usuarios. */
export const seedFoundations = (): AdminFoundationDto[] => [
  fundacionSeed({ id: 'abrigo', name: 'Fundación Abrigo Bogotá', nit: '900215884-1', email: 'abrigo@styleradar.co', phone: '+57 601 555 0301', neighborhood: 'Chapinero', address: 'Cl. 45 #13-40, Chapinero', description: 'Recibe ropa de abrigo para personas en situación de calle.', latitude: 4.6371, longitude: -74.0659, acceptedCategories: ['TOP', 'BOTTOM', 'FOOTWEAR'], representativeId: 'u-2', supportedCauses: 'Habitantes de calle en Chapinero y Teusaquillo.', openingHours: 'Lunes a viernes, 8:00 a. m. a 5:00 p. m.', donationPolicies: 'Prendas limpias y en buen estado.', active: true, registeredAt: '2025-03-10T15:00:00Z', aliadaDesde: 'mar 2025', donaciones: { pendientes: 2, enProceso: 2, recibidas: 2, rechazadas: 1 } }),
  fundacionSeed({ id: 'suba', name: 'Ropero Comunitario Suba', nit: '900502117-6', email: 'ropero@suba.org', phone: '+57 601 555 0322', neighborhood: 'Suba', address: 'Cra. 91 #145-20, Suba', description: 'Ropero comunitario para familias de Suba.', latitude: 4.7412, longitude: -74.0835, acceptedCategories: ['TOP', 'BOTTOM', 'DRESS'], representativeId: 'u-3', active: true, registeredAt: '2025-06-02T15:00:00Z', aliadaDesde: 'jun 2025', donaciones: { pendientes: 1, enProceso: 0, recibidas: 0, rechazadas: 0 } }),
  fundacionSeed({ id: 'kennedy', name: 'Banco de Ropa Kennedy', nit: '900330662-4', email: 'banco@kennedy.org', phone: '+57 601 555 0344', neighborhood: 'Kennedy', address: 'Cl. 38 Sur #78-12, Kennedy', latitude: 4.6283, longitude: -74.1515, acceptedCategories: ['TOP', 'BOTTOM', 'FOOTWEAR', 'DRESS', 'ACCESSORY'], representativeId: 'u-4', active: true, registeredAt: '2025-08-20T15:00:00Z', aliadaDesde: 'ago 2025', donaciones: { pendientes: 0, enProceso: 0, recibidas: 0, rechazadas: 0 } }),
  fundacionSeed({ id: 'dignidad', name: 'Vestir con Dignidad', nit: '901001448-7', email: 'hola@vestircondignidad.org', phone: '+57 601 555 0356', neighborhood: 'Teusaquillo', address: 'Cra. 17 #35-40, Teusaquillo', latitude: 4.6235, longitude: -74.0728, acceptedCategories: ['TOP', 'DRESS'], representativeId: 'u-6', active: true, registeredAt: '2025-11-14T15:00:00Z', aliadaDesde: 'nov 2025', donaciones: { pendientes: 0, enProceso: 1, recibidas: 0, rechazadas: 0 } }),
  fundacionSeed({ id: 'manos', name: 'Manos que Visten', nit: '900118230-1', email: 'manos@visten.org', phone: '+57 601 555 0390', neighborhood: 'Bosa', address: 'Cl. 65 Sur #80-10, Bosa', latitude: 4.6179, longitude: -74.1907, acceptedCategories: ['FOOTWEAR', 'ACCESSORY'], representativeId: 'u-8', active: false, registeredAt: '2025-01-22T15:00:00Z', aliadaDesde: 'ene 2025', donaciones: { pendientes: 0, enProceso: 0, recibidas: 0, rechazadas: 0 } }),
]

/** Playlists públicas del prototipo; «Oficina con Estilo» está destacada en el inicio. */
export const seedPlaylists = (): AdminPlaylistDto[] => [
  { id: 'p1', nombre: 'Días en la Ciudad', creador: 'Valentina R.', meGusta: 1240, guardados: 412, prendas: 9, destacada: false },
  { id: 'p2', nombre: 'Vibra Indie Rock', creador: 'Mateo P.', meGusta: 864, guardados: 230, prendas: 7, destacada: false },
  { id: 'p3', nombre: 'Oficina con Estilo', creador: 'Camila S.', meGusta: 2410, guardados: 905, prendas: 7, destacada: true },
  { id: 'p4', nombre: 'Salida Nocturna', creador: 'Sofía L.', meGusta: 760, guardados: 188, prendas: 9, destacada: false },
  { id: 'p5', nombre: 'Tonos Neutros', creador: 'Laura T.', meGusta: 640, guardados: 201, prendas: 10, destacada: false },
  { id: 'p6', nombre: 'Street Style Bogotá', creador: 'Andrés M.', meGusta: 1030, guardados: 344, prendas: 11, destacada: false },
  { id: 'p7', nombre: 'Segunda Vida', creador: 'Comunidad', meGusta: 512, guardados: 160, prendas: 8, destacada: false },
  { id: 'p8', nombre: 'Fin de Semana', creador: 'Andrés M.', meGusta: 455, guardados: 98, prendas: 8, destacada: false },
  { id: 's-luna-run', nombre: 'Running de ciudad', creador: 'Luna Store', meGusta: 188, guardados: 64, prendas: 4, destacada: false },
]
