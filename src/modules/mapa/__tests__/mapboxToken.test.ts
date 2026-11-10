import { describe, expect, it } from 'vitest'
import { resolveMapboxToken } from '../utils/mapboxToken'

const PUBLICO = 'pk.proyecto'

describe('token de Mapbox', () => {
  it('usa el de .env si es público (pk.)', () => {
    expect(resolveMapboxToken('pk.propio', PUBLICO)).toBe('pk.propio')
  })

  it('si falta o está vacío usa el público del proyecto', () => {
    expect(resolveMapboxToken(undefined, PUBLICO)).toBe(PUBLICO)
    expect(resolveMapboxToken('', PUBLICO)).toBe(PUBLICO)
    expect(resolveMapboxToken('   ', PUBLICO)).toBe(PUBLICO)
  })

  it('rechaza un token secreto (sk.) y usa el público', () => {
    expect(resolveMapboxToken('sk.secreto', PUBLICO)).toBe(PUBLICO)
  })
})
