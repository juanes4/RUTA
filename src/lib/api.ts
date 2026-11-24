/** Cliente de la API del servidor (/api/*). La sesión viaja en una cookie HttpOnly. */

export type Rol = 'lider' | 'empleado';

export interface Usuario {
  id: number;
  usuario: string;
  nombre: string;
  rol: Rol;
}

/** Resultado del simulador de un micro-curso (T2). */
export interface ResultadoSimulador {
  aciertos: number;
  total: number;
  /** Aprobación práctica: 2 de 3 aciertos o más. */
  aprobado: boolean;
  /** Autoevaluación de seguridad, de 1 a 5. */
  seguridad: number;
}

export interface VideoCapacitacion {
  id: string;
  titulo: string;
  youtubeId: string;
  /** 'lider': solo lo ven los líderes. 'empleado': lo ven todos. */
  audiencia: Rol;
  visto: boolean;
  vistoEn: string | null;
  simulador: ResultadoSimulador | null;
}

export interface RegistroVista {
  usuarioId: number;
  nombre: string;
  rol: Rol;
  vistoEn: string;
  simulador: ResultadoSimulador | null;
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

export interface PreguntaSimulador {
  texto: string;
  opciones: string[];
}

export type TipoRegistro = 'pulso' | 'voto' | 'acuerdo' | 'termometro' | 'dinamica' | 'balance' | 'merito';

export interface RegistroPulso {
  id: number;
  sesion: string;
  claridad: number;
  utilidad: number;
  confianza: number;
  nombre: string | null;
  creadoEn: string;
}

export interface Voto {
  ciclo: number;
  momento: 'inicio' | 'cierre';
  nivel: number;
}

export interface ConteoVotos {
  ciclo: number;
  momento: 'inicio' | 'cierre';
  /** Personas que votaron cada escalón (posición 0 = escalón 1). */
  niveles: number[];
}

export interface Acuerdo extends Voto {
  id: number;
  meta: number | null;
  creadoEn: string;
}

export interface CicloTermometro {
  ciclo: number;
  respuestas: number;
  /** null mientras haya menos respuestas que el mínimo del grupo. */
  promedio: number | null;
  porAfirmacion: number[] | null;
}

export interface RegistroDinamica {
  id: number;
  dinamica: string;
  ciclo: number;
  hoja: Record<string, string | Record<string, string | boolean>[]>;
  nombre: string | null;
  creadoEn: string;
}

export interface BalanceCiclo {
  id: number;
  ciclo: number;
  meritos: string;
  factores: string;
  dificultades: string;
  nombre: string | null;
  creadoEn: string;
}

export interface Publicacion {
  titulo: string;
  logramos: string;
  protagonistas: string;
  importancia: string;
  mensaje: string;
  autorizacion: boolean;
}

export interface Merito {
  id: number;
  creadoEn: string;
  nombre?: string | null;
  area?: string;
  fecha?: string;
  cambio?: string;
  avance?: string;
  participantes?: string;
  comoAyuda?: string;
  pasaAValoracion?: boolean;
  criterios?: Record<string, { puntaje: number; evidencia: string }>;
  total?: number;
  clasificacion?: 'destacado' | 'favorable' | 'desarrollo';
  reconocimiento?: string;
  publicar?: boolean;
  publicacion?: Publicacion;
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
  preguntas: (videoId: string) =>
    llamar<{ videoId: string; preguntas: PreguntaSimulador[]; aprobacionMinima: number }>(`/api/preguntas?videoId=${encodeURIComponent(videoId)}`),
  responderSimulador: (videoId: string, respuestas: number[], seguridad: number) =>
    llamar<ResultadoSimulador>('/api/simulador', { videoId, respuestas, seguridad }),
  guardarRegistro: (tipo: TipoRegistro, datos: unknown) => llamar<{ id: number; tipo: TipoRegistro }>('/api/registros', { tipo, datos }),
  registros: <T>(tipo: TipoRegistro) => llamar<T>(`/api/registros?tipo=${tipo}`),
};

/** SQLite guarda la fecha en UTC como "2026-11-11 21:59:00". */
export function fechaDeVista(texto: string): Date {
  return new Date(`${texto.replace(' ', 'T')}Z`);
}

const FECHA = new Intl.DateTimeFormat('es-CO', { dateStyle: 'medium', timeStyle: 'short' });
export const formatearFechaVista = (texto: string) => FECHA.format(fechaDeVista(texto));
