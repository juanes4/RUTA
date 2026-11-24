/** Cliente de la API del servidor (/api/*). La sesión viaja en una cookie HttpOnly. */

export type Rol = 'lider' | 'empleado';

export interface Usuario {
  id: number;
  usuario: string;
  nombre: string;
  rol: Rol;
}

export interface VideoCapacitacion {
  id: string;
  titulo: string;
  youtubeId: string;
  /** 'lider': solo lo ven los líderes. 'empleado': lo ven todos. */
  audiencia: Rol;
  visto: boolean;
  vistoEn: string | null;
}

export interface RegistroVista {
  usuarioId: number;
  nombre: string;
  rol: Rol;
  vistoEn: string;
}

export interface VideoHistorial {
  id: string;
  titulo: string;
  youtubeId: string;
  audiencia: Rol;
  /** Cuántas personas pueden ver este video. */
  elegibles: number;
  vistas: RegistroVista[];
}

export interface Historial {
  /** true: líder, ve a todas las personas. false: empleado, solo ve lo suyo. */
  verTodos: boolean;
  videos: VideoHistorial[];
}

export class ErrorApi extends Error {
  constructor(
    readonly estado: number,
    mensaje: string,
  ) {
    super(mensaje);
  }
}

async function llamar<T>(ruta: string, cuerpo?: unknown): Promise<T> {
  let respuesta: Response;
  try {
    respuesta = await fetch(ruta, {
      method: cuerpo === undefined ? 'GET' : 'POST',
      headers: cuerpo === undefined ? undefined : { 'Content-Type': 'application/json' },
      body: cuerpo === undefined ? undefined : JSON.stringify(cuerpo),
      credentials: 'same-origin',
    });
  } catch {
    throw new ErrorApi(0, 'No se pudo conectar con el servidor.');
  }
  const datos = (await respuesta.json().catch(() => ({}))) as { error?: string };
  if (!respuesta.ok) throw new ErrorApi(respuesta.status, datos.error ?? 'Ocurrió un error.');
  return datos as T;
}

export const api = {
  sesion: () => llamar<{ usuario: Usuario | null }>('/api/sesion'),
  iniciarSesion: (usuario: string, clave: string) => llamar<{ usuario: Usuario }>('/api/login', { usuario, clave }),
  cerrarSesion: () => llamar<{ ok: true }>('/api/logout', {}),
  videos: () => llamar<{ videos: VideoCapacitacion[] }>('/api/videos'),
  marcarVisto: (videoId: string) => llamar<{ videoId: string; vistoEn: string }>('/api/vistas', { videoId }),
  historial: () => llamar<Historial>('/api/historial'),
};

/** SQLite guarda la fecha en UTC como "2026-11-11 21:59:00". */
export function fechaDeVista(texto: string): Date {
  return new Date(`${texto.replace(' ', 'T')}Z`);
}

const FECHA = new Intl.DateTimeFormat('es-CO', { dateStyle: 'medium', timeStyle: 'short' });
export const formatearFechaVista = (texto: string) => FECHA.format(fechaDeVista(texto));
