import { describe, it, expect } from 'vitest'
import {
  AURORA_EXCLUDED_ROUTES,
  isAuroraExcluded,
} from '../auroraRoutes'

describe('auroraRoutes & exclusion rules', () => {
  it('identifica correctamente las rutas excluidas (únicamente probador)', () => {
    expect(AURORA_EXCLUDED_ROUTES).not.toContain('/')
    expect(AURORA_EXCLUDED_ROUTES).toContain('/probador')
    expect(AURORA_EXCLUDED_ROUTES).toContain('/probador/avanzado')

    expect(isAuroraExcluded('/')).toBe(false)
    expect(isAuroraExcluded('/probador')).toBe(true)
    expect(isAuroraExcluded('/probador/avanzado')).toBe(true)
  })

  it('permite que el resto de rutas (catálogo, playlists, mapa, admin, etc.) monten la aurora unificada', () => {
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
})
