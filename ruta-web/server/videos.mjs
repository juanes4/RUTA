/**
 * Videos iniciales de la etapa T. Se cargan una sola vez, cuando la tabla
 * está vacía. Para cambiarlos después, edita la tabla `videos` (o borra
 * server/data/ruta.db y vuelve a iniciar para cargar esta lista de nuevo).
 *
 * audiencia: 'empleado' lo ven todos; 'lider' solo los usuarios líder.
 */
export const VIDEOS_INICIALES = [
  { id: 'emp-1', youtubeId: 'a1mJWDeCzjg', audiencia: 'empleado', titulo: '¿Qué es el cambio organizacional?' },
  { id: 'emp-2', youtubeId: 'wQZIHQxNzK4', audiencia: 'empleado', titulo: '¿Qué es la gestión del cambio?' },
  { id: 'emp-3', youtubeId: 'k0YtFrJJ3h8', audiencia: 'empleado', titulo: 'La gestión del cambio de las organizaciones' },
  { id: 'emp-4', youtubeId: 'l3_YmrgMQSE', audiencia: 'empleado', titulo: 'Algunas actividades de desarrollo organizacional' },
  { id: 'emp-5', youtubeId: 'dPZNqkoy1_4', audiencia: 'empleado', titulo: 'El virus de la actitud' },
  { id: 'lid-1', youtubeId: 'DuAdtZ2TF-Q', audiencia: 'lider', titulo: 'Liderar equipos en tiempos turbulentos' },
  { id: 'lid-2', youtubeId: '22coAwMD9M0', audiencia: 'lider', titulo: 'El modelo de cambio de 8 pasos de Kotter' },
];

/** Usuarios de demostración: se crean solo si no existe ninguno. Cambia las claves. */
export const USUARIOS_DEMO = [
  { usuario: 'lider', nombre: 'Carolina Restrepo', rol: 'lider', clave: 'ruta2026' },
  { usuario: 'empleado1', nombre: 'Laura Gómez', rol: 'empleado', clave: 'ruta2026' },
  { usuario: 'empleado2', nombre: 'Julián Mesa', rol: 'empleado', clave: 'ruta2026' },
  { usuario: 'empleado3', nombre: 'Daniela Ríos', rol: 'empleado', clave: 'ruta2026' },
];
