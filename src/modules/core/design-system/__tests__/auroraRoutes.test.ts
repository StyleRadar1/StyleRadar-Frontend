import { describe, it, expect } from 'vitest'
import {
  AURORA_EXCLUDED_ROUTES,
  isAuroraExcluded,
  getAuroraToneForPath,
} from '../auroraRoutes'

describe('auroraRoutes & exclusion rules', () => {
  it('identifica correctamente las rutas excluidas (landing y probador)', () => {
    expect(AURORA_EXCLUDED_ROUTES).toContain('/')
    expect(AURORA_EXCLUDED_ROUTES).toContain('/probador')

    expect(isAuroraExcluded('/')).toBe(true)
    expect(isAuroraExcluded('/probador')).toBe(true)
    expect(isAuroraExcluded('/probador/avanzado')).toBe(true)
  })

  it('permite que el resto de rutas (catálogo, playlists, mapa, admin, etc.) monten la aurora', () => {
    expect(isAuroraExcluded('/catalogo')).toBe(false)
    expect(isAuroraExcluded('/catalogo/item-123')).toBe(false)
    expect(isAuroraExcluded('/playlists')).toBe(false)
    expect(isAuroraExcluded('/playlists/1')).toBe(false)
    expect(isAuroraExcluded('/mapa')).toBe(false)
    expect(isAuroraExcluded('/planes')).toBe(false)
    expect(isAuroraExcluded('/mensajes')).toBe(false)
    expect(isAuroraExcluded('/perfil')).toBe(false)
    expect(isAuroraExcluded('/admin/estadisticas')).toBe(false)
    expect(isAuroraExcluded('/admin/tiendas')).toBe(false)
    expect(isAuroraExcluded('/mi-tienda')).toBe(false)
  })

  it('asigna los tonos correctos según la ruta', () => {
    expect(getAuroraToneForPath('/playlists')).toBe('lila')
    expect(getAuroraToneForPath('/playlists/favoritas')).toBe('lila')
    expect(getAuroraToneForPath('/catalogo')).toBe('malva')
    expect(getAuroraToneForPath('/catalogo/prenda-99')).toBe('malva')
    expect(getAuroraToneForPath('/mapa')).toBe('salvia')
    expect(getAuroraToneForPath('/planes')).toBe('rosa')
    expect(getAuroraToneForPath('/suscripcion')).toBe('rosa')
    expect(getAuroraToneForPath('/tienda/inventario')).toBe('rosa')
    expect(getAuroraToneForPath('/mi-tienda')).toBe('rosa')
    expect(getAuroraToneForPath('/mensajes')).toBe('lila')
    expect(getAuroraToneForPath('/admin/estadisticas')).toBe('lila')
  })
})
