import { useState, useCallback, useEffect } from 'react'
import { inventoryService } from '../services/inventoryService'
import type { InventoryItemDto, InventorySummaryDto, CreateInventoryItemDto, UpdateInventoryItemDto } from '../types/inventory.dto'

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

  const updateItem = useCallback(
    async (dto: UpdateInventoryItemDto) => {
      const updated = await inventoryService.updateItem(dto)
      setItems((prev) => prev.map((it) => (it.id === dto.prendaId ? updated : it)))
      const sum = await inventoryService.getSummary(tiendaId)
      setSummary(sum)
    },
    [tiendaId]
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

  const removeSize = useCallback(
    async (prendaId: string, talla: string) => {
      const updated = await inventoryService.removeSize(prendaId, talla)
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
      return created
    },
    [tiendaId]
  )

  const deleteItem = useCallback(
    async (prendaId: string) => {
      await inventoryService.deleteItem(prendaId)
      setItems((prev) => prev.filter((it) => it.id !== prendaId))
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
    removeSize,
    updatePrice,
    updateItem,
    toggleActive,
    addItem,
    deleteItem,
  }
}

