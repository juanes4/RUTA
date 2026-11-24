# RUTA · app web

Metodología de gestión del cambio (reto CUEE con la ANDI). La aplicación está en `ruta-web/`.

```
cd ruta-web
npm install
npm run dev      # app + API + base SQLite, todo con un comando (Node 22.13 o superior)
npm test
```

## Sesión y usuarios

La base de datos es `ruta-web/server/data/ruta.db` (SQLite, se crea sola al iniciar y no se sube al repositorio).
Con la base vacía se crean estas cuentas de demostración, todas con la clave `ruta2026` (cámbialas):

| Usuario | Rol |
| --- | --- |
| `lider` | Líder: ve los videos de líderes y los de empleados, y quién vio cada uno |
| `empleado1`, `empleado2`, `empleado3` | Empleado: solo ve videos de empleados y sus propias vistas |

Agregar un usuario (desde `ruta-web/`): `npm run usuario -- maria "María Pérez" empleado UnaClaveLarga123`

Los videos (YouTube) están en `ruta-web/server/videos.mjs`. Para cambiarlos: edita ese archivo, borra
`ruta-web/server/data/ruta.db` y vuelve a iniciar (esto también borra usuarios e historial).
