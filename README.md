# StyleRadar - Frontend

Frontend de StyleRadar, una plataforma web que conecta a compradores con los almacenes de moda locales de Bogotá. Permite buscar prendas, ver en un mapa qué tiendas las tienen en tu talla, probarlas en un probador virtual y vender o donar ropa usada.

Proyecto del curso Diseño y Arquitectura de Software (DOSW), Escuela Colombiana de Ingeniería Julio Garavito, 2026-2.

## Integrantes

| Integrante | Rol |
|---|---|
| Nombre | kevin Angel |
| Nombre | julian Morales |
| Nombre | Carlos Sanchez |
| Nombre | Cristian Moreno |
| Nombre | Daniel Barrera |

## Estado

Por ahora el frontend es un prototipo en HTML, CSS y JavaScript. Tiene un landing de bienvenida y la aplicación con los cinco tipos de usuario. Los datos son de prueba y se guardan en el navegador; todavía no se conecta con el backend.

## Cómo ejecutarlo

Se necesita Python 3. Desde la raíz del repositorio:

```
python -m http.server 8080
```

Luego abrir http://127.0.0.1:8080 en el navegador. En Windows, si `python` no funciona, usar `py`.

Cuentas de prueba (la contraseña de todas es `1234`):

| Rol | Correo |
|---|---|
| Comprador | usuario@styleradar.co |
| Tienda | luna@styleradar.co |
| Fundación | abrigo@styleradar.co |
| Administrador | admin@styleradar.co |

## Estructura

```
index.html    Landing y aplicación
css/          Estilos
js/           Scripts, se cargan en orden numérico
assets/       Imágenes
```

## Roles

- Invitado: ve el inicio, el catálogo, el mapa y las tiendas.
- Comprador: además usa el probador, su perfil, las playlists, la venta de ropa y los mensajes.
- Tienda: administra su catálogo, inventario, suscripción y mensajes.
- Fundación: gestiona las solicitudes de donación.
- Administrador: modera publicaciones, verifica tiendas y gestiona fundaciones y usuarios.

## Forma de trabajo

- `main` tiene la versión entregable y `develop` la de integración.
- Cada tarea se trabaja en una rama `feature/nombre-de-la-tarea` y se une a `develop` con un pull request revisado por otra persona del equipo.
