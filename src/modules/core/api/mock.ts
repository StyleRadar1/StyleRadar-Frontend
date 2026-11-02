/** Simula la latencia de red para que los datos de prueba se comporten como el backend. */
export const mockDelay = <T>(data: T, ms = 350): Promise<T> =>
  new Promise((resolve) => setTimeout(() => resolve(structuredClone(data)), ms))
