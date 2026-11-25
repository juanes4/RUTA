import type { EstadoCarita, IdFaseViaje, IdIndicadorA } from '../config/analizar';
import type { EstadoCopiloto, MensajeCopiloto, ModoCopiloto, PartesDossier, PropuestaLienzo, PropuestaTriaje, ResultadoBuzon } from './copiloto/tipos';

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

/* ---------- Etapa A · Analizar ---------- */

export interface RegistroAuditoriaA {
  id: number;
  periodo: string;
  fecha: string;
  equipo: string;
  observaciones: string;
  valores: Record<IdIndicadorA, number | null>;
  metas: Record<IdIndicadorA, number>;
  registradoPor: string | null;
  creadoEn: string;
}

export interface SugeridosEtapaT {
  apropiacion: { valor: number; ciclo: number; respuestas: number } | null;
  ultimoAcuerdo: { ciclo: number; momento: 'inicio' | 'cierre'; nivel: number; meta: number | null } | null;
  sesionesPulso: number;
}

export interface RespuestaTableroA {
  auditorias: RegistroAuditoriaA[];
  metasActuales: Record<IdIndicadorA, number>;
  sugeridosT: SugeridosEtapaT;
  balancesT: BalanceCiclo[];
}

export interface PreguntaResumenViaje {
  indice: number;
  conteos: { a: number; b: number; c: number };
  promedio: number | null;
  porcentaje: number | null;
  carita: EstadoCarita | null;
}

export interface FaseResumenViaje {
  id: IdFaseViaje;
  promedio: number | null;
  porcentaje: number | null;
  carita: EstadoCarita | null;
  preguntas: PreguntaResumenViaje[];
}

export interface ResumenViaje {
  totalRespuestas: number;
  promedioGeneral: number | null;
  porcentajeGeneral: number | null;
  caritaGeneral: EstadoCarita | null;
  fases: FaseResumenViaje[];
  preguntas: PreguntaResumenViaje[];
}

export interface RespuestaViajePropia {
  id: number;
  periodo: string;
  area: string;
  comentario: string;
  respuestas: number[];
  creadoEn: string;
  resumen: ResumenViaje;
}

export interface ComentarioViaje {
  id: number;
  periodo: string;
  area: string;
  comentario: string;
  creadoEn: string;
}

export interface RespuestaViajeA {
  periodo: string;
  periodosDisponibles: string[];
  resumenEquipo: ResumenViaje;
  propias: RespuestaViajePropia[];
  comentarios: ComentarioViaje[];
}

/* ---------- Etapa R · Copiloto y buzón en la app ---------- */

/** Una respuesta del buzón en la tabla del copiloto (id, fecha, area, grupo, p1, p2, p3). */
export interface FilaBuzonCopiloto {
  id: string;
  fecha: string;
  area: string;
  grupo: string;
  p1: string;
  p2: string;
  p3: string;
}

/** Lo que ve gestión del cambio del buzón en la app: estado y cantidades, nunca quién respondió. */
export interface EstadoBuzonApp {
  buzon: string;
  /** null: todavía no se ha abierto. */
  estado: 'abierto' | 'cerrado' | null;
  convocados: number;
  respuestas: number;
  areas: string[];
  abiertoEn: string | null;
  cerradoEn: string | null;
  /** A quién se convocó (para marcarlo en la lista); no dice quién respondió. */
  idsConvocados?: number[];
}

export interface Colaborador {
  id: number;
  nombre: string;
  usuario: string;
}

/** El buzón que le toca a un colaborador. */
export interface BuzonColaborador {
  id: string;
  empresa: string;
  areas: string[];
  grupos: string[];
  estado: 'pendiente' | 'respondido' | 'cerrado';
}

/* ---------- Etapa A · Asistente ---------- */

export type AccionAsistenteA = 'diagnostico_a1' | 'cruce_a1_t' | 'curva_a2' | 'libre';

export interface EstadoAsistenteA {
  disponible: boolean;
  modo: 'gemini' | 'local';
  rol: Rol;
  alertas: { rojas: number; amarillas: number };
}

export interface RespuestaAsistenteA {
  titulo: string;
  resumen: string;
  secciones: { encabezado: string; items: string[] }[];
  acciones15Dias: string[];
  sugerencias: string[];
  motor: 'gemini' | 'local';
  esRecomendacion: true;
}

export class ErrorApi extends Error {
  constructor(
    readonly estado: number,
    mensaje: string,
    /** Campos extra del error (por ejemplo `puedeSimular` o `bloqueado` en el copiloto). */
    readonly detalle: Record<string, unknown> = {},
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
  const datos = (await respuesta.json().catch(() => ({}))) as { error?: string } & Record<string, unknown>;
  if (!respuesta.ok) throw new ErrorApi(respuesta.status, datos.error ?? 'Ocurrió un error.', datos);
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
  tableroA: () => llamar<RespuestaTableroA>('/api/etapa-a/tablero'),
  guardarAuditoriaA: (datos: {
    periodo: string;
    fecha: string;
    equipo: string;
    observaciones: string;
    valores: Record<IdIndicadorA, number | null>;
    metas: Record<IdIndicadorA, number>;
  }) => llamar<{ id: number }>('/api/etapa-a/auditoria', datos),
  viajeA: (periodo?: string) =>
    llamar<RespuestaViajeA>(
      periodo && periodo !== 'todos' ? `/api/etapa-a/viaje?periodo=${encodeURIComponent(periodo)}` : '/api/etapa-a/viaje',
    ),
  guardarViajeA: (datos: { periodo: string; area: string; comentario: string; respuestas: number[] }) =>
    llamar<{ id: number; resumen: ResumenViaje }>('/api/etapa-a/viaje', datos),

  copiloto: {
    estado: () => llamar<EstadoCopiloto>('/api/copiloto/estado'),
    buzonPrueba: () =>
      llamar<{ empresa: { nombre: string; sector: string; que_cambia: string; areas: { area: string; afectados: number }[] }; filas: FilaBuzonCopiloto[] }>(
        '/api/copiloto/buzon-prueba',
      ),
    /** contexto: el lienzo y el triaje, para que el copiloto proponga ajustes. */
    analizarBuzon: (modo: ModoCopiloto, buzon: FilaBuzonCopiloto[], areas: { area: string; afectados: number }[], contexto: unknown) =>
      llamar<ResultadoBuzon>('/api/copiloto/buzon', { modo, buzon, areas, contexto }),
    lienzo: (modo: ModoCopiloto, mensajes: MensajeCopiloto[], contexto: unknown) =>
      llamar<{ modo: ModoCopiloto; texto: string }>('/api/copiloto/lienzo', { modo, mensajes, contexto }),
    extraerLienzo: (modo: ModoCopiloto, mensajes: MensajeCopiloto[], contexto: unknown) =>
      llamar<{ modo: ModoCopiloto; lienzo: PropuestaLienzo }>('/api/copiloto/extraer-lienzo', { modo, mensajes, contexto }),
    triaje: (modo: ModoCopiloto, contexto: unknown) => llamar<{ modo: ModoCopiloto; modelo?: string; propuesta: PropuestaTriaje }>('/api/copiloto/triaje', { modo, contexto }),
    dossier: (modo: ModoCopiloto, contexto: unknown) => llamar<{ modo: ModoCopiloto; modelo?: string; dossier: PartesDossier }>('/api/copiloto/dossier', { modo, contexto }),
  },

  buzon: {
    /** Gestión del cambio. */
    colaboradores: () => llamar<{ colaboradores: Colaborador[] }>('/api/buzon/colaboradores'),
    estado: (buzon: string) => llamar<EstadoBuzonApp>(`/api/buzon/estado?buzon=${encodeURIComponent(buzon)}`),
    abrir: (datos: { buzon: string; empresa: string; areas: string[]; convocados: number[] }) => llamar<EstadoBuzonApp>('/api/buzon/abrir', datos),
    cerrar: (buzon: string) => llamar<EstadoBuzonApp>('/api/buzon/cerrar', { buzon }),
    respuestas: (buzon: string) => llamar<{ buzon: string; filas: FilaBuzonCopiloto[] }>(`/api/buzon/respuestas?buzon=${encodeURIComponent(buzon)}`),
    /** Colaborador. */
    mio: () => llamar<{ buzon: BuzonColaborador | null }>('/api/buzon/mio'),
    responder: (datos: { buzon: string; area: string; grupo: string; p1: string; p2: string; p3: string }) => llamar<{ ok: true }>('/api/buzon/responder', datos),
  },

  estadoAsistenteA: () => llamar<EstadoAsistenteA>('/api/etapa-a/asistente/estado'),
  consultarAsistenteA: (datos: {
    accion: AccionAsistenteA;
    mensaje?: string;
    pasoActual?: 'A1' | 'A2' | null;
    periodoViaje?: string;
    historial?: { autor: 'usuario' | 'asistente'; texto: string }[];
  }) => llamar<RespuestaAsistenteA>('/api/etapa-a/asistente', datos),
};

/** SQLite guarda la fecha en UTC como "2026-11-11 21:59:00". */
export function fechaDeVista(texto: string): Date {
  return new Date(`${texto.replace(' ', 'T')}Z`);
}

const FECHA = new Intl.DateTimeFormat('es-CO', { dateStyle: 'medium', timeStyle: 'short' });
export const formatearFechaVista = (texto: string) => FECHA.format(fechaDeVista(texto));
