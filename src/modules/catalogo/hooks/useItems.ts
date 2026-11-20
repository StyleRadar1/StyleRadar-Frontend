import { useEffect, useState } from 'react'
import { ApiError } from '@/modules/core/api/apiClient'
import { mensajePorCodigo } from '@/modules/core/api/errors'
import { itemService } from '../services/itemService'
import type { ItemFiltersDto, ItemResponseDto } from '../types/item.dto'

interface Result { key: string; items: ItemResponseDto[]; error: string; status: number | null; code?: string }

/** Texto seguro por tipo de error; el del servidor nunca llega a la pantalla. */
const textoError = (status: number, code?: string) =>
  mensajePorCodigo(code) ??
  (status === 0 ? 'No hay conexión. Revisa tu internet e intenta de nuevo.'
    : status >= 500 ? 'El catálogo no está disponible en este momento. Intenta en unos minutos.'
      : 'No pudimos cargar el catálogo. Intenta de nuevo.')

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
        const code = e instanceof ApiError ? e.code : undefined
        setResult({ key, items: [], error: textoError(status, code), status, code })
      })
    return () => { active = false }
  }, [key])

  /** `status` y `code` permiten a la pantalla resolver casos concretos, como `UBICACION_REQUERIDA`. */
  return { items: result.items, error: result.error, status: result.status, code: result.code, loading: result.key !== key }
}
