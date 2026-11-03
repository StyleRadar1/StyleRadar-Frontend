/** Simula la latencia de red para que los datos de prueba se comporten como el backend. */
export const mockDelay = <T>(data: T, ms = 350): Promise<T> =>
  new Promise((resolve) => setTimeout(() => resolve(structuredClone(data)), ms))

/** Usuario de la sesión simulada (para que los mocks apliquen permisos de dueño). */
export const mockSessionUser = (): { id: string; name: string } | null => {
  try { return JSON.parse(localStorage.getItem('sr_user') ?? 'null') } catch { return null }
}
