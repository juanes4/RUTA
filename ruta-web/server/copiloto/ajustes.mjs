import { TEMAS } from './taxonomia.mjs';

/**
 * Ajustes que el buzón propone al diagnóstico (paso 3 del copiloto).
 * El buzón llega después del lienzo (R1) y del triaje (R2): al analizarlo, el
 * copiloto los compara y propone riesgos que faltan en el lienzo y puntajes
 * del triaje que pueden estar subestimados. La persona acepta o descarta cada
 * uno en la app; aquí solo se proponen y se validan.
 */

export const CRITERIOS_AJUSTABLES = ['impacto_personas', 'riesgo_operativo'];
const MAX_RIESGOS = 4;

const huella = (t) =>
  String(t ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
const texto = (v, max) => String(v ?? '').trim().slice(0, max);
const esPuntaje = (n) => n === 1 || n === 2 || n === 3;

/** Lo que el diagnóstico ya dice, para que el modelo (o las reglas) comparen. */
export function diagnosticoParaComparar(ctx) {
  const l = ctx?.lienzo ?? null;
  const t = ctx?.triaje ?? null;
  return {
    lienzo: l
      ? { afectados: l.afectados ?? '', riesgos: l.riesgos ?? [], intentos_previos: l.intentos_previos ?? [], beneficios: l.beneficios ?? [] }
      : null,
    triaje: t ? { impacto_personas: t.impacto_personas ?? null, riesgo_operativo: t.riesgo_operativo ?? null, elementos: t.elementos ?? [] } : null,
    ruta: ctx?.ruta ?? '',
  };
}

/** Limpia los ajustes: riesgos que el lienzo no tiene y puntajes que de verdad cambian algo. */
export function validarAjustes(ajustes, ctx) {
  const yaEnLienzo = (ctx?.lienzo?.riesgos ?? []).map(huella).filter(Boolean);
  const vistos = new Set();
  const riesgos = [];
  for (const r of ajustes?.riesgos ?? []) {
    const riesgo = texto(r?.riesgo, 300);
    const h = huella(riesgo);
    if (!riesgo || vistos.has(h) || yaEnLienzo.some((x) => x === h || x.includes(h) || h.includes(x))) continue;
    vistos.add(h);
    riesgos.push({ riesgo, fuente: texto(r?.fuente, 200) });
  }
  const triaje = [];
  for (const a of ajustes?.triaje ?? []) {
    const actual = ctx?.triaje?.[a?.criterio];
    const puntaje = Number(a?.puntaje);
    if (!CRITERIOS_AJUSTABLES.includes(a?.criterio) || !esPuntaje(puntaje) || !esPuntaje(actual) || puntaje === actual) continue;
    if (triaje.some((x) => x.criterio === a.criterio)) continue;
    triaje.push({ criterio: a.criterio, puntaje, motivo: texto(a?.motivo, 400), fuente: texto(a?.fuente, 200) });
  }
  return { riesgos: riesgos.slice(0, MAX_RIESGOS), triaje };
}

/** Palabras que delatan que un riesgo del lienzo ya habla de ese tema. */
const CLAVES = {
  SOB: /sobrecarga|carga de trabajo|abasto|turno|falta de tiempo/,
  CAP: /capacit|formacion|entrena/,
  REC: /equipo|herramienta|recurso|software|conectividad/,
  COA: /entre areas|coordinacion|otras areas/,
  COD: /direccion|gerencia|no ser escuchad|decision/,
  EMP: /empleo|despid|puesto|recorte|reemplaz/,
  OBS: /aprender|obsolet|no poder|no saber/,
  HIS: /anterior|fallid|intento|historial|fatiga/,
  DES: /desconfi|confianza|credibilidad/,
  PRO: /proceso|reproceso|formato|demora/,
};
const CODIGO_DE = new Map(TEMAS.map((t) => [t.tema, t.codigo]));

/** Modo simulado: los mismos ajustes, por reglas, a partir del informe ya calculado. */
export function ajustesSimulados(informe, ctx) {
  const regla = 'Regla del modo simulado';
  const lienzo = ctx?.lienzo ?? {};
  const enLienzo = huella([...(lienzo.riesgos ?? []), ...(lienzo.intentos_previos ?? [])].join(' '));
  const sintesis = new Map((informe?.temas ?? []).map((t) => [t.tema, t.sintesis]));

  // Riesgos: primero los temas con intensidad fuerte, después los transversales y los más mencionados.
  const candidatos = [
    ...(informe?.alertas?.intensas ?? [])
      .filter((a) => a.casos >= 2)
      .map((a) => ({ tema: a.tema, porque: 'aparece con intensidad fuerte en el buzón', fuente: `Buzón, ${a.casos} respuestas con intensidad fuerte` })),
    ...(informe?.alertas?.transversales ?? []).map((t) => ({
      tema: t.tema,
      porque: `aparece en todos los ${t.dimension === 'grupo' ? 'grupos' : 'áreas'}`,
      fuente: `Buzón, temas transversales`,
    })),
    ...(informe?.temas ?? []).slice(0, 3).map((t) => ({ tema: t.tema, porque: 'es de lo más mencionado en el buzón', fuente: `Buzón, ${t.total} menciones en P1 y P2` })),
  ];
  const riesgos = [];
  const usados = new Set();
  for (const c of candidatos) {
    const codigo = CODIGO_DE.get(c.tema);
    if (!codigo || usados.has(codigo) || CLAVES[codigo].test(enLienzo)) continue;
    usados.add(codigo);
    const detalle = sintesis.get(c.tema);
    riesgos.push({ riesgo: detalle ? `${c.tema}: ${detalle}` : `${c.tema}: ${c.porque}.`, fuente: `${c.fuente} · ${regla}` });
    if (riesgos.length === 3) break;
  }

  // Triaje: un semáforo que puede ser optimista frente a lo que dice el buzón.
  const t = ctx?.triaje ?? {};
  const triaje = [];
  const intensas = informe?.alertas?.intensas ?? [];
  const miedo = intensas.find((a) => ['EMP', 'DES', 'HIS'].includes(CODIGO_DE.get(a.tema)));
  const seguridad = (informe?.revision ?? []).some((r) => r.tipo === 'seguridad_salud');
  if (esPuntaje(t.riesgo_operativo) && t.riesgo_operativo < 3 && (miedo || seguridad)) {
    triaje.push({
      criterio: 'riesgo_operativo',
      puntaje: 3,
      motivo: miedo
        ? `El buzón muestra ${miedo.tema.toLowerCase()} con intensidad fuerte (${miedo.casos} ${miedo.casos === 1 ? 'caso' : 'casos'}): hay más riesgo de resistencia del que refleja el triaje.`
        : 'Hay respuestas sobre riesgos para la seguridad o la salud: un fallo tendría un costo mayor.',
      fuente: `Buzón, alertas · ${regla}`,
    });
  }
  const pesado = (informe?.temas ?? []).find((x) => ['SOB', 'OBS', 'CAP', 'EMP'].includes(x.codigo) && Math.max(x.pctP1 ?? 0, x.pctP2 ?? 0) >= 30);
  if (t.impacto_personas === 1 && pesado) {
    triaje.push({
      criterio: 'impacto_personas',
      puntaje: 2,
      motivo: `${pesado.tema} aparece en el ${Math.max(pesado.pctP1 ?? 0, pesado.pctP2 ?? 0)} % de las respuestas de una pregunta: el cambio pesa más en las personas de lo que dice el triaje.`,
      fuente: `Buzón, temas principales · ${regla}`,
    });
  }
  return { riesgos, triaje };
}
