import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/configs/env', () => ({ env: { appEnvironment: 'qa', apiUrl: 'http://gateway.test', useMocks: false } }))

import { apiClient } from '@/modules/core/api/apiClient'
import { usuarioService } from '../services/usuarioService'
import type { PerfilDto, UserProfileDto } from '../types/usuario.dto'

const DTO: UserProfileDto = {
  id: 12, name: 'Laura Gómez', email: 'laura@correo.com', phone: null, neighborhood: 'Chapinero', emailVerified: true,
  registeredAt: '2026-11-01T10:00:00Z', stylePreferences: ['CASUAL'], usualSizes: ['M'], sizesByGarmentType: { TOP: ['M'] },
}

describe('perfil contra ms-usuarios (F-09 · F-10 · F-11 · F-12 · F-32)', () => {
  beforeEach(() => { localStorage.setItem('sr_user', JSON.stringify({ id: '12', name: 'laura', email: 'laura@correo.com', role: 'BUYER' })) })
  afterEach(() => { vi.restoreAllMocks(); localStorage.clear() })

  it('lee el perfil con GET /api/v1/users/{id} (sin /me) y lo pasa a la pantalla', async () => {
    const get = vi.spyOn(apiClient, 'get').mockResolvedValue({ data: DTO })
    const p = await usuarioService.me()
    expect(get).toHaveBeenCalledWith('/api/v1/users/12')
    expect(p).toMatchObject({ id: '12', name: 'Laura Gómez', phone: '', neighborhood: 'Chapinero', stylePreferences: ['CASUAL'], sizesByGarmentType: { TOP: ['M'] } })
    expect(p.plan).toBeUndefined()
  })

  it('solo llama los endpoints de lo que cambió, con los cuerpos del documento', async () => {
    const actual: PerfilDto = { ...DTO, id: '12', phone: '', neighborhood: 'Chapinero', maniqui: 'MUJER' }
    const put = vi.spyOn(apiClient, 'put').mockResolvedValue({ data: DTO })
    await usuarioService.updateMe({
      name: 'Laura Gómez', phone: '', neighborhood: 'Chapinero', maniqui: 'HOMBRE',
      stylePreferences: ['CASUAL', 'VINTAGE'], sizesByGarmentType: { TOP: ['M', 'XXL'], BOTTOM: [], FOOTWEAR: ['44'] },
    }, actual)
    expect(put).toHaveBeenCalledTimes(2)
    expect(put).toHaveBeenNthCalledWith(1, '/api/v1/users/12/style-preferences', { styles: ['CASUAL', 'VINTAGE'] })
    // El tipo sin tallas (BOTTOM) no se envía.
    expect(put).toHaveBeenNthCalledWith(2, '/api/v1/users/12/sizes', { sizesByGarmentType: { TOP: ['M', 'XXL'], FOOTWEAR: ['44'] } })
    expect(localStorage.getItem('sr_maniqui_12')).toBe('HOMBRE')
  })

  it('los datos personales van a PUT /api/v1/users/{id} sin opcionales vacíos', async () => {
    const actual: PerfilDto = { ...DTO, id: '12', phone: '', neighborhood: 'Chapinero', maniqui: 'MUJER' }
    const put = vi.spyOn(apiClient, 'put').mockResolvedValue({ data: DTO })
    await usuarioService.updateMe({ ...actual, name: 'Laura G.', neighborhood: '' }, actual)
    expect(put).toHaveBeenCalledTimes(1)
    expect(put).toHaveBeenCalledWith('/api/v1/users/12', { name: 'Laura G.' })
  })
})
