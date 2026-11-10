import { useState, useCallback, useEffect } from 'react'
import { inventoryService } from '../services/inventoryService'
import type { InventoryItemDto, InventorySummaryDto, CreateInventoryItemDto } from '../types/inventory.dto'

export function useInventory(tiendaId?: string) {
  const [items, setItems] = useState<InventoryItemDto[]>([])
  const [summary, setSummary] = useState<InventorySummaryDto | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<unknown>(null)

  const reload = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [list, sum] = await Promise.all([
        inventoryService.getStoreInventory(tiendaId),
        inventoryService.getSummary(tiendaId),
      ])
      setItems(list)
      setSummary(sum)
    } catch (err) {
      setError(err)
    } finally {
      setLoading(false)
    }
  }, [tiendaId])

  useEffect(() => {
    reload()
  }, [reload])

  const updateStock = useCallback(
    async (prendaId: string, talla: string, nuevoStock: number) => {
      const updated = await inventoryService.updateStock({ prendaId, talla, nuevoStock })
      setItems((prev) => prev.map((it) => (it.id === prendaId ? updated : it)))
      const sum = await inventoryService.getSummary(tiendaId)
      setSummary(sum)
    },
    [tiendaId]
  )

  const updatePrice = useCallback(
    async (prendaId: string, nuevoPrecio: number) => {
      const updated = await inventoryService.updatePrice({ prendaId, nuevoPrecio })
      setItems((prev) => prev.map((it) => (it.id === prendaId ? updated : it)))
    },
    []
  )

  const toggleActive = useCallback(
    async (prendaId: string) => {
      const updated = await inventoryService.toggleActive(prendaId)
      setItems((prev) => prev.map((it) => (it.id === prendaId ? updated : it)))
      const sum = await inventoryService.getSummary(tiendaId)
      setSummary(sum)
    },
    [tiendaId]
  )

  const addItem = useCallback(
    async (dto: CreateInventoryItemDto) => {
      const created = await inventoryService.addItem(dto)
      setItems((prev) => [created, ...prev])
      const sum = await inventoryService.getSummary(tiendaId)
      setSummary(sum)
    },
    [tiendaId]
  )

  return {
    items,
    summary,
    loading,
    error,
    reload,
    updateStock,
    updatePrice,
    toggleActive,
    addItem,
  }
}

