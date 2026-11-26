import { describe, expect, it } from 'vitest'
import { aRol, ROLE_HOME } from '../types/roles'

describe('roles en inglés (F-27)', () => {
  it('acepta los cuatro roles del contrato', () => {
    expect(aRol('BUYER')).toBe('BUYER')
    expect(aRol('STORE_ADMIN')).toBe('STORE_ADMIN')
    expect(aRol('FOUNDATION_REPRESENTATIVE')).toBe('FOUNDATION_REPRESENTATIVE')
    expect(aRol('STYLERADAR_ADMIN')).toBe('STYLERADAR_ADMIN')
  })

  it('pasa los valores anteriores en español al rol en inglés', () => {
    expect(aRol('COMPRADOR')).toBe('BUYER')
    expect(aRol('ADMIN_ALMACEN')).toBe('STORE_ADMIN')
    expect(aRol('REPRESENTANTE_FUNDACION')).toBe('FOUNDATION_REPRESENTATIVE')
    expect(aRol('ADMIN_STYLERADAR')).toBe('STYLERADAR_ADMIN')
  })

  it('rechaza valores desconocidos', () => {
    expect(aRol('ROOT')).toBeNull()
    expect(aRol(undefined)).toBeNull()
  })

  it('cada rol tiene pantalla de inicio', () => {
    expect(ROLE_HOME.BUYER).toBe('/inicio')
    expect(ROLE_HOME.STYLERADAR_ADMIN).toBe('/admin/estadisticas')
  })
})
