import { useCallback, useEffect, useRef, useState } from 'react'

export type Tono = 'error' | 'aviso' | 'info' | 'ok'

/** Cuenta regresiva en segundos; se detiene en 0. */
export function useCuentaRegresiva(segundos?: number) {
  const [restante, setRestante] = useState(segundos ?? 0)
  const [inicio, setInicio] = useState(segundos)
  if (inicio !== segundos) { setInicio(segundos); setRestante(segundos ?? 0) }
  useEffect(() => {
    if (!segundos || restante <= 0) return
    const t = setTimeout(() => setRestante((r) => r - 1), 1000)
    return () => clearTimeout(t)
  }, [segundos, restante])
  return restante
}

export type Toast = { id: number; tono: Tono; titulo: string; texto?: string; accion?: { label: string; onClick: () => void } }

/** Toasts de una pantalla: mostrar() agrega uno que se va solo a los 5 segundos. */
export function useToasts(duracion = 5000) {
  const [items, setItems] = useState<Toast[]>([])
  const siguiente = useRef(1)
  const timers = useRef(new Map<number, ReturnType<typeof setTimeout>>())
  const quitar = useCallback((id: number) => {
    setItems((xs) => xs.filter((t) => t.id !== id))
    clearTimeout(timers.current.get(id)); timers.current.delete(id)
  }, [])
  const mostrar = useCallback((t: Omit<Toast, 'id'>) => {
    const id = siguiente.current++
    setItems((xs) => [...xs, { ...t, id }])
    timers.current.set(id, setTimeout(() => quitar(id), duracion))
    return id
  }, [duracion, quitar])
  useEffect(() => () => { timers.current.forEach(clearTimeout) }, [])
  return { items, mostrar, quitar, duracion }
}
