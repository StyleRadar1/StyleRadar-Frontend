import { useEffect, useState } from 'react'
import { ApiError } from '@/modules/core/api/apiClient'
import { itemService } from '../services/itemService'
import type { ItemFiltersDto, ItemResponseDto } from '../types/item.dto'

interface Result { key: string; items: ItemResponseDto[]; error: string; status: number | null }

/** Texto seguro por tipo de error; el del servidor nunca llega a la pantalla. */
const textoError = (status: number) =>
  status === 0 ? 'No hay conexión. Revisa tu internet e intenta de nuevo.'
    : status >= 500 ? 'El catálogo no está disponible en este momento. Intenta en unos minutos.'
      : 'No pudimos cargar el catálogo. Intenta de nuevo.'

export function useItems(filters: ItemFiltersDto) {
  const key = JSON.stringify(filters)
  const [result, setResult] = useState<Result>({ key: '', items: [], error: '', status: null })

  useEffect(() => {
    let active = true
    itemService.search(JSON.parse(key))
      .then((items) => { if (active) setResult({ key, items, error: '', status: null }) })
      .catch((e) => {
        if (!active) return
        const status = e instanceof ApiError ? e.status : 0
        setResult({ key, items: [], error: textoError(status), status })
      })
    return () => { active = false }
  }, [key])

  /** `status` permite a la pantalla resolver casos concretos, como el 400 de cercanía sin ubicación. */
  return { items: result.items, error: result.error, status: result.status, loading: result.key !== key }
}
