import { BLOQUES_LIENZO, RUTAS_TRIAJE, ELEMENTOS_ORGANIZACION, ALCANCES, type NivelSemaforoTriaje } from '../../config/formularios/reconocer';
import { GRUPOS_BUZON1, SIN_GRUPO } from '../../config/formularios/buzon1';
import type { Reglas } from '../../config/reglas';
import type { FilaBuzonCopiloto } from '../api';
import { evaluarTriaje } from '../calculo/triaje';
import type { AreaAfectada, DatosProyecto, Lienzo, Proyecto, Triaje } from '../modelo/proyecto';
import type { RespuestaBuzon1 } from '../modelo/tipos';
import type { AjusteRiesgo, AjusteTriaje, BloqueFicha, EstadoBloque, InformeBuzon, PartesDossier, PropuestaLienzo, PropuestaTriaje } from './tipos';

/** Reglas puras del Copiloto de Reconocimiento en el navegador. */

const normalizar = (t: string) =>
  t
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .trim()
    .toLowerCase();

const lleno = (t: string | undefined) => (t ?? '').trim() !== '';

/** R5 → tabla de entrada del copiloto. */
export function filasParaCopiloto(buzon: readonly RespuestaBuzon1[]): FilaBuzonCopiloto[] {
  return buzon.map((r) => ({ id: r.id, fecha: r.fecha, area: r.area, grupo: r.grupo || SIN_GRUPO, p1: r.falla, p2: r.preocupa, p3: r.harias }));
}

/**
 * Tabla del copiloto (buzón de prueba o buzón en la app) → respuestas de R5.
 * El área debe estar registrada en la Etapa 0; si alguna no lo está, no se carga nada.
 */
export function filasDesdeCopiloto(filas: readonly FilaBuzonCopiloto[], areas: readonly AreaAfectada[]): { filas: RespuestaBuzon1[]; areasFaltantes: string[] } {
  const registradas = new Map(areas.map((a) => [normalizar(a.area), a.area]));
  const faltantes = [...new Set(filas.map((f) => f.area).filter((a) => !registradas.has(normalizar(a))))];
  if (faltantes.length > 0) return { filas: [], areasFaltantes: faltantes };
  const grupo = (g: string) => GRUPOS_BUZON1.find((x) => normalizar(x) === normalizar(g)) ?? SIN_GRUPO;
  return {
    filas: filas
      .filter((f) => lleno(f.p1) || lleno(f.p2) || lleno(f.p3))
      .map((f) => ({ id: f.id, fecha: f.fecha, area: registradas.get(normalizar(f.area)) ?? f.area, grupo: grupo(f.grupo), falla: f.p1, preocupa: f.p2, harias: f.p3 })),
    areasFaltantes: [],
  };
}

export function rutaDeTriaje(triaje: Triaje, reglas: Reglas['triaje']): { total: number | null; nivel: NivelSemaforoTriaje | null; texto: string } {
  const r = evaluarTriaje(triaje, reglas);
  if (r.total === null || r.nivel === null) return { total: null, nivel: null, texto: '' };
  return { total: r.total, nivel: r.nivel, texto: `${r.nivel} · ${RUTAS_TRIAJE[r.nivel].clasificacion} (${r.total} de 9)` };
}

/** Contexto que acompaña al lienzo, el triaje y el dossier. Sin respuestas individuales del buzón. */
export function contextoCopiloto(proyecto: Proyecto, datos: DatosProyecto, reglas: Reglas['triaje']) {
  return {
    empresa: { nombre: proyecto.empresa.nombre, sector: proyecto.empresa.sector, que_cambia: proyecto.empresa.que_cambia },
    areas: proyecto.segmentacion.areas,
    lienzo: datos.lienzo,
    triaje: datos.triaje,
    ruta: rutaDeTriaje(datos.triaje, reglas).texto,
    informe: datos.copiloto.informe?.resultado.informe ?? null,
  };
}

/* ---------- Pasar a R1 ---------- */

export interface CambioCampo {
  campo: string;
  antes: string;
  despues: string;
}

const lista = (xs: readonly string[]) => xs.filter(lleno).join(' · ');
const pares = <T extends { [K in keyof T]: string }>(xs: readonly T[], a: keyof T, b: keyof T) =>
  xs.filter((x) => lleno(x[a]) || lleno(x[b])).map((x) => `${x[a]}${lleno(x[b]) ? `: ${x[b]}` : ''}`).join(' · ');

/** Cómo se ve cada campo del lienzo en texto, para mostrar qué va a cambiar. */
function vistaLienzo(l: Lienzo): Record<string, string> {
  return {
    Urgencia: pares(l.urgencia, 'motivo', 'dato'),
    Afectados: l.afectados,
    Visión: l.vision,
    'Qué cambia': l.que_cambia,
    'Qué no cambia': l.que_no_cambia,
    'Beneficios por grupo': pares(l.beneficios, 'grupo', 'beneficio'),
    'Criterios de éxito': pares(l.criterios, 'criterio', 'meta'),
    Riesgos: lista(l.riesgos),
    'Intentos previos': lista(l.intentos_previos),
  };
}

/** Mezcla la ficha propuesta con el lienzo actual: solo reemplaza los campos que la propuesta trae llenos. */
export function aplicarLienzo(actual: Lienzo, p: PropuestaLienzo): { lienzo: Lienzo; cambios: CambioCampo[] } {
  const limpias = <T extends { [K in keyof T]: string }>(xs: readonly T[] | undefined, a: keyof T) => (xs ?? []).filter((x) => lleno(x[a]));
  const urgencia = limpias(p.urgencia, 'motivo').slice(0, 3);
  const beneficios = limpias(p.beneficios, 'beneficio');
  const criterios = limpias(p.criterios, 'criterio');
  const riesgos = (p.riesgos ?? []).filter(lleno);
  const intentos = (p.intentos_previos ?? []).filter(lleno);
  const lienzo: Lienzo = {
    urgencia: urgencia.length ? urgencia.map((u) => ({ motivo: u.motivo.trim(), dato: (u.dato ?? '').trim() })) : actual.urgencia,
    afectados: lleno(p.afectados) ? p.afectados.trim() : actual.afectados,
    vision: lleno(p.vision) ? p.vision.trim() : actual.vision,
    que_cambia: lleno(p.que_cambia) ? p.que_cambia.trim() : actual.que_cambia,
    que_no_cambia: lleno(p.que_no_cambia) ? p.que_no_cambia.trim() : actual.que_no_cambia,
    beneficios: beneficios.length ? beneficios.map((b) => ({ grupo: (b.grupo ?? '').trim(), beneficio: b.beneficio.trim() })) : actual.beneficios,
    criterios: criterios.length ? criterios.map((c) => ({ criterio: c.criterio.trim(), meta: (c.meta ?? '').trim() })) : actual.criterios,
    riesgos: riesgos.length ? riesgos.map((r) => r.trim()) : actual.riesgos,
    intentos_previos: intentos.length ? intentos.map((r) => r.trim()) : actual.intentos_previos,
  };
  const antes = vistaLienzo(actual);
  const despues = vistaLienzo(lienzo);
  const cambios = Object.keys(antes)
    .filter((k) => antes[k] !== despues[k])
    .map((k) => ({ campo: k, antes: antes[k] ?? '', despues: despues[k] ?? '' }));
  return { lienzo, cambios };
}

/* ---------- Pasar a R2 ---------- */

/** La propuesta del triaje en el formulario R2. La suma y el semáforo los calcula evaluarTriaje. */
export function aplicarTriaje(actual: Triaje, p: PropuestaTriaje): Triaje {
  const puntaje = (n: number | null) => (n === 1 || n === 2 || n === 3 ? n : null);
  const elementos = [...new Set(p.complejidad.elementos)].filter((e) => ELEMENTOS_ORGANIZACION.some((x) => x.valor === e));
  const alcance = ALCANCES.find((a) => a.valor === p.alcance)?.valor ?? actual.alcance;
  return {
    por_que_ahora: lleno(p.por_que_ahora) ? p.por_que_ahora.trim() : actual.por_que_ahora,
    poblacion_afectada: lleno(p.poblacion_afectada) ? p.poblacion_afectada.trim() : actual.poblacion_afectada,
    dimension_tecnica: lleno(p.dimension_tecnica) ? p.dimension_tecnica.trim() : actual.dimension_tecnica,
    impacto_personas: puntaje(p.impacto_personas.puntaje) ?? actual.impacto_personas,
    elementos: elementos.length ? elementos : actual.elementos,
    riesgo_operativo: puntaje(p.riesgo_operativo.puntaje) ?? actual.riesgo_operativo,
    alcance,
  };
}

/* ---------- Ajustes que propone el buzón ---------- */

/** Clave estable de un ajuste, para recordar si ya se aceptó o descartó. */
export const claveAjuste = (a: AjusteRiesgo | AjusteTriaje) => ('riesgo' in a ? `r:${normalizar(a.riesgo)}` : `t:${a.criterio}:${a.puntaje}`);

/** ¿El lienzo ya tiene este riesgo (lo pasó la persona o lo escribió a mano)? */
export const riesgoEnLienzo = (l: Lienzo, riesgo: string) => l.riesgos.some((r) => normalizar(r) === normalizar(riesgo));

/** Agrega al lienzo los riesgos aceptados (sin repetir los que ya tiene). */
export function aplicarRiesgos(l: Lienzo, riesgos: readonly AjusteRiesgo[]): Lienzo {
  const nuevos = riesgos.map((r) => r.riesgo.trim()).filter((r) => r && !riesgoEnLienzo(l, r));
  return { ...l, riesgos: [...l.riesgos.filter(lleno), ...nuevos] };
}

/** Cambia en el triaje los puntajes aceptados. */
export function aplicarAjustesTriaje(t: Triaje, ajustes: readonly AjusteTriaje[]): Triaje {
  return ajustes.reduce<Triaje>((acc, a) => ({ ...acc, [a.criterio]: a.puntaje }), t);
}

/** Verificación de sensatez: un verde con alertas fuertes o temas de miedo y desconfianza puede ser optimista. */
export function revisarSensatez(nivel: NivelSemaforoTriaje | null, informe: InformeBuzon | null): string | null {
  if (nivel !== 'verde' || !informe) return null;
  const sensibles = informe.temas.filter((t) => ['EMP', 'HIS', 'DES'].includes(t.codigo)).map((t) => t.tema.toLowerCase());
  const intensas = informe.alertas.intensas.reduce((s, a) => s + a.casos, 0);
  if (sensibles.length === 0 && intensas === 0) return null;
  const motivos = [
    intensas > 0 && `${intensas} menciones de intensidad 3 en el buzón`,
    sensibles.length > 0 && `${sensibles.join(', ')} entre los temas principales`,
  ].filter(Boolean);
  return `El semáforo puede ser optimista: hay ${motivos.join(' y ')}. Revisa el riesgo operativo y el impacto en las personas.`;
}

/* ---------- Dossier ---------- */

const ESTADO_TEXTO: Record<EstadoBloque, string> = { completo: 'Completo', por_verificar: 'Por verificar', por_completar: 'Por completar' };
const celda = (t: string) => (t.trim() ? t.replace(/\|/g, '/').replace(/\n+/g, ' ') : '—');

/** Contenido y estado de cada bloque de la ficha. Sin estados guardados, se deduce si el bloque está vacío. */
export function fichaDelCambio(l: Lienzo, estados: Record<BloqueFicha, EstadoBloque> | null) {
  const contenido: Record<BloqueFicha, string> = {
    urgencia: pares(l.urgencia, 'motivo', 'dato'),
    afectados: l.afectados,
    vision: l.vision,
    cambios: [lleno(l.que_cambia) && `Cambia: ${l.que_cambia}`, lleno(l.que_no_cambia) && `Se mantiene: ${l.que_no_cambia}`].filter(Boolean).join(' · '),
    beneficios: pares(l.beneficios, 'grupo', 'beneficio'),
    criterios: pares(l.criterios, 'criterio', 'meta'),
    riesgos: [lista(l.riesgos), lleno(lista(l.intentos_previos)) && `Intentos previos: ${lista(l.intentos_previos)}`].filter(Boolean).join(' · '),
  };
  return BLOQUES_LIENZO.map((b) => {
    const texto = contenido[b.id];
    const estado: EstadoBloque = !lleno(texto) ? 'por_completar' : (estados?.[b.id] ?? 'completo');
    return { id: b.id, nombre: b.nombre, contenido: texto, estado };
  });
}

interface EntradaDossier {
  proyecto: Proyecto;
  datos: DatosProyecto;
  reglas: Reglas['triaje'];
  partes: PartesDossier;
  modo: string;
  fecha: string;
}

/** Arma el dossier en Markdown con la estructura fija del Paso 4. Los números salen del informe y de evaluarTriaje. */
export function armarDossier({ proyecto, datos, reglas, partes, modo, fecha }: EntradaDossier): string {
  const { lienzo, triaje, copiloto } = datos;
  const informe = copiloto.informe?.resultado.informe ?? null;
  const ficha = fichaDelCambio(lienzo, copiloto.estadosLienzo);
  const eval_ = evaluarTriaje(triaje, reglas);
  const ruta = rutaDeTriaje(triaje, reglas);
  const just = copiloto.triaje?.propuesta;
  const sensatez = revisarSensatez(ruta.nivel, informe);
  const L: string[] = [];

  L.push(`# Dossier de Reconocimiento · ${proyecto.empresa.nombre || 'Empresa sin nombre'}`, '');
  L.push(`_Borrador generado el ${fecha} (modo ${modo}). Es un borrador hasta que la persona responsable del cambio lo apruebe._`, '');

  L.push('## 1. Resumen ejecutivo', '', partes.resumen.trim() || '—', '');

  L.push('## 2. Ficha del cambio', '', '| Bloque | Contenido | Estado |', '|---|---|---|');
  for (const b of ficha) L.push(`| ${b.nombre} | ${celda(b.contenido)} | ${ESTADO_TEXTO[b.estado]} |`);
  L.push('');

  L.push('## 3. Triaje', '');
  if (eval_.total === null) {
    L.push('El triaje está incompleto: faltan puntajes en R2.', '');
  } else {
    L.push('| Criterio | Puntaje | Justificación | Fuente |', '|---|---|---|---|');
    L.push(`| Impacto en las personas | ${eval_.impacto_personas} | ${celda(just?.impacto_personas.justificacion ?? '')} | ${celda(just?.impacto_personas.fuente ?? 'R2')} |`);
    const elementos = triaje.elementos.map((e) => ELEMENTOS_ORGANIZACION.find((x) => x.valor === e)?.nombre ?? e).join(', ');
    L.push(`| Complejidad organizacional | ${eval_.complejidad} | ${celda(`${elementos}. ${just?.complejidad.justificacion ?? ''}`)} | ${celda(just?.complejidad.fuente ?? 'R2')} |`);
    L.push(`| Riesgo operativo | ${eval_.riesgo_operativo} | ${celda(just?.riesgo_operativo.justificacion ?? '')} | ${celda(just?.riesgo_operativo.fuente ?? 'R2')} |`);
    L.push('', `**Suma:** ${eval_.impacto_personas} + ${eval_.complejidad} + ${eval_.riesgo_operativo} = ${eval_.total} · **Ruta:** ${ruta.texto}`);
    const alcance = ALCANCES.find((a) => a.valor === triaje.alcance)?.nombre;
    if (alcance) L.push(`**Alcance de despliegue:** ${alcance} (informativo, sin puntaje).`);
    if (sensatez) L.push('', `> ${sensatez}`);
    L.push('');
  }

  L.push('## 4. Voz de los colaboradores', '');
  if (!informe) {
    L.push('No se analizó el buzón: el diagnóstico tiene menos sustento en la voz de los colaboradores.', '');
  } else {
    const p = informe.participacion;
    L.push(`**Participación:** ${p.respuestas} respuestas${p.personas ? ` de ${p.personas} personas (${p.porcentaje} %)` : ''}.`, '');
    L.push('| Tema | P1 | P2 | Síntesis |', '|---|---|---|---|');
    for (const t of informe.temas) L.push(`| ${t.tema} | ${t.p1} (${t.pctP1 ?? 0} %) | ${t.p2} (${t.pctP2 ?? 0} %) | ${celda(t.sintesis)} |`);
    L.push('');
    const difs = [...informe.diferencias.grupo.diferencias.map((d) => ({ ...d, dim: 'grupo' })), ...informe.diferencias.area.diferencias.map((d) => ({ ...d, dim: 'área' }))];
    if (difs.length) {
      L.push('**Diferencias (una dimensión a la vez, segmentos de 5 o más):**');
      for (const d of difs) L.push(`- ${d.dim === 'grupo' ? 'Grupo' : 'Área'} ${d.segmento}: ${d.tema.toLowerCase()} ${d.pctSegmento} % frente a ${d.pctResto} % del resto.`);
      L.push('');
    }
    if (informe.propuestas.length) {
      L.push('**Propuestas de los colaboradores (P3):**');
      for (const x of informe.propuestas) L.push(`- ${x.idea} (${x.menciones})`);
      L.push('');
    }
    if (informe.lectura.length) {
      L.push('**Lectura del copiloto** [Inferencia]:');
      for (const x of informe.lectura) L.push(`- ${x}`);
      L.push('');
    }
  }

  L.push('## 5. Alertas y revisión humana', '');
  if (!informe) L.push('Sin buzón analizado.', '');
  else {
    if (informe.alertas.intensas.length) for (const a of informe.alertas.intensas) L.push(`- Intensidad 3: ${a.tema} (${a.casos}).`);
    for (const t of informe.alertas.transversales) L.push(`- Transversal: ${t.tema} aparece en ${t.segmentos === 2 ? 'los 2' : `los ${t.segmentos}`} ${t.dimension === 'grupo' ? 'grupos' : 'áreas'} con 5 o más respuestas.`);
    if (informe.revision.length) {
      for (const r of informe.revision) L.push(`- Revisión humana: ${r.cantidad} ${r.cantidad === 1 ? 'respuesta menciona' : 'respuestas mencionan'} ${r.nombre}. Recomendamos que las revise talento humano o la persona designada.`);
    } else L.push('- Ninguna respuesta requiere revisión humana.');
    L.push('');
  }

  L.push('## 6. Recomendaciones para la etapa U', '');
  partes.recomendaciones.slice(0, 5).forEach((r, i) => L.push(`${i + 1}. ${r.texto.trim()} _(Fuente: ${r.fuente.trim() || 'sin fuente'})_`));
  L.push('', `**Perfil de vocero:** ${partes.vocero.perfil}. ${partes.vocero.motivo} _(Fuente: ${partes.vocero.fuente || 'sin fuente'})_`, '');
  if (partes.preguntas_jefes.length) {
    L.push('**Preguntas que los jefes probablemente recibirán:**');
    for (const q of partes.preguntas_jefes.slice(0, 6)) L.push(`- ${q}`);
    L.push('');
  }

  L.push('## 7. Pendientes', '');
  const pendientes = ficha.filter((b) => b.estado !== 'completo').map((b) => `- ${b.nombre}: ${ESTADO_TEXTO[b.estado].toLowerCase()}.`);
  L.push(...(pendientes.length ? pendientes : ['- La ficha no tiene bloques pendientes.']));
  if (eval_.total === null) L.push('- Completar el triaje (R2).');
  L.push('- R3 (FODA del cambio) y R4 (mapa de actores) para la siguiente sesión.', '');
  if (informe) L.push(...informe.limites.map((l) => `> ${l}`), '');
  return L.join('\n');
}
