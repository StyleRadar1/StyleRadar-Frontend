import { beforeEach, describe, expect, it } from 'vitest'
import { resetSavedSearchesMock, savedSearchService } from '../services/savedSearchService'
import { sesionComo } from './helpers'

describe('búsquedas guardadas en modo de prueba (SR-RF-28)', () => {
  beforeEach(() => { resetSavedSearchesMock(); localStorage.clear(); sessionStorage.clear(); sesionComo('usuario@styleradar.co') })

  it('guarda, lista la más reciente primero y elimina solo en la propia cuenta', async () => {
    await savedSearchService.save('u-1', { name: 'Primera' })
    const b = await savedSearchService.save('u-1', { name: 'Segunda', size: 'M' })
    expect((await savedSearchService.list('u-1')).map((x) => x.name)).toEqual(['Segunda', 'Primera'])
    await savedSearchService.remove('u-1', b.id)
    expect((await savedSearchService.list('u-1')).map((x) => x.name)).toEqual(['Primera'])
    await expect(savedSearchService.list('u-2')).rejects.toMatchObject({ status: 403 })
  })
})
