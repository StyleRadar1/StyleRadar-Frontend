/**
 * Marca que la persona acaba de cerrar sesión ella misma. Las rutas protegidas lo usan para
 * llevarla al inicio (landing) en lugar de abrirle el inicio de sesión, igual que en el menú del usuario.
 */
let hasta = 0

export const marcarSalidaVoluntaria = () => { hasta = Date.now() + 2000 }
export const salidaVoluntariaReciente = () => Date.now() < hasta

/**
 * Cierra la sesión desde pantallas que no usan el contexto de autenticación (menús laterales de la tienda):
 * AuthProvider escucha este evento y limpia la sesión; luego se vuelve al inicio.
 */
export function cerrarSesionYVolverAlInicio() {
  marcarSalidaVoluntaria()
  window.dispatchEvent(new Event('sr:sesion-expirada'))
  window.location.assign('/')
}
