import { useCallback, useEffect, useState } from 'react'

interface Result<T> { version: number; data: T; error: unknown }

/**
 * Carga datos de un servicio con estado de carga, error y recarga.
 * `loading` se deriva de la versión pedida, sin setState dentro del efecto.
 */
export function useResource<T>(loader: () => Promise<T>, initial: T) {
  const [version, setVersion] = useState(0)
  const [result, setResult] = useState<Result<T>>({ version: -1, data: initial, error: null })

  useEffect(() => {
    let active = true
    loader()
      .then((data) => { if (active) setResult({ version, data, error: null }) })
      .catch((error) => { if (active) setResult((r) => ({ version, data: r.data, error })) })
    return () => { active = false }
  }, [loader, version])

  const reload = useCallback(() => setVersion((v) => v + 1), [])
  const setData = useCallback((fn: (d: T) => T) => setResult((r) => ({ ...r, data: fn(r.data) })), [])
  return { data: result.data, error: result.error, loading: result.version !== version, reload, setData }
}
