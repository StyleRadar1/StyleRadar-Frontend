/**
 * Marca que la persona acaba de cerrar sesión ella misma. Las rutas protegidas lo usan para
 * llevarla al inicio (landing) en lugar de abrirle el inicio de sesión, igual que en el menú del usuario.
 */
let hasta = 0

export const marcarSalidaVoluntaria = () => { hasta = Date.now() + 2000 }
export const salidaVoluntariaReciente = () => Date.now() < hasta
