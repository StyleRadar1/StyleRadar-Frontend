import { useEffect, useState } from 'react'
import { ApiError } from '@/modules/core/api/apiClient'
import { itemService } from '../services/itemService'
import type { ItemFiltersDto, ItemResponseDto } from '../types/item.dto'

interface Result { key: string; items: ItemResponseDto[]; error: string }

export function useItems(filters: ItemFiltersDto) {
  const key = JSON.stringify(filters)
  const [result, setResult] = useState<Result>({ key: '', items: [], error: '' })

  useEffect(() => {
    let active = true
    itemService.search(JSON.parse(key))
      .then((items) => { if (active) setResult({ key, items, error: '' }) })
      .catch((e) => { if (active) setResult({ key, items: [], error: e instanceof ApiError ? e.message : 'No se pudo cargar el catálogo.' }) })
    return () => { active = false }
  }, [key])

  return { items: result.items, error: result.error, loading: result.key !== key }
}
