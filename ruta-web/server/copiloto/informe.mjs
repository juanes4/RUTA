import { CODIGOS_TEMA, NOMBRE_REVISION, NOMBRE_TEMA, OTRO, REGLAS_BUZON as R, SENTIMIENTOS, SIN_GRUPO, TIPOS_REVISION } from './taxonomia.mjs';

/**
 * Informe del buzón (1.5). El modelo solo clasifica; todos los conteos,
 * porcentajes, segmentos y alertas salen de aquí, con las reglas de 1.3.
 * Segmenta por una sola dimensión a la vez (grupo o área), nunca área × grupo:
 * al cruzarlas aparecen segmentos de 1 o 2 personas.
 */

const PREG = ['p1', 'p2', 'p3'];
const NO_DICE = 'Prefiero no decirlo';
const lleno = (t) => String(t ?? '').trim() !== '';
const pct = (n, d) => (d > 0 ? Math.round((n / d) * 100) : null);

/** Limpia la clasificación: ids que existen, preguntas respondidas, temas válidos (1 a 3), sin duplicados. */
export function validarClasificacion(clasificacion, filas) {
  const porId = new Map(filas.map((f) => [f.id, f]));
  const vistas = new Set();
  const validas = [];
  for (const c of clasificacion ?? []) {
    const fila = porId.get(c?.id);
    if (!fila || !PREG.includes(c.pregunta) || !lleno(fila[c.pregunta])) continue;
    const clave = `${c.id}|${c.pregunta}`;
    if (vistas.has(clave)) continue;
    const temas = [...new Set((c.temas ?? []).filter((t) => CODIGOS_TEMA.includes(t)))].slice(0, 3);
    if (temas.length === 0) continue;
    vistas.add(clave);
    const intensidad = Number(c.intensidad);
    validas.push({
      id: c.id,
      pregunta: c.pregunta,
      temas,
      otro: temas.includes(OTRO) ? String(c.otro ?? '').trim().slice(0, 60) || 'sin nombre' : '',
      sentimiento: SENTIMIENTOS.includes(c.sentimiento) ? c.sentimiento : 'neutral',
      intensidad: [1, 2, 3].includes(intensidad) ? intensidad : 1,
      revision: TIPOS_REVISION.includes(c.revision) ? c.revision : 'ninguna',
      identificable: Boolean(c.identificable),
      idea: String(c.idea ?? '').trim(),
    });
  }
  return validas;
}

/** Segmentos (valores de una dimensión) con sus filas. Las filas sin valor van a "Sin grupo". */
function segmentar(filas, dimension) {
  const mapa = new Map();
  for (const f of filas) {
    const valor = lleno(f[dimension]) ? f[dimension] : SIN_GRUPO;
    mapa.set(valor, [...(mapa.get(valor) ?? []), f]);
  }
  return mapa;
}

/** Diferencias claras entre un segmento y el resto, en una sola dimensión. */
function diferencias(filas, mencionaTema, dimension, temasCandidatos) {
  // "Sin grupo" y "Prefiero no decirlo" no son segmentos: cuentan en el total, nunca por separado.
  const segmentos = [...segmentar(filas, dimension)].filter(([nombre]) => nombre !== SIN_GRUPO && nombre !== NO_DICE);
  const visibles = segmentos.filter(([, fs]) => fs.length >= R.minimoPorSegmento);
  const ocultos = segmentos.filter(([, fs]) => fs.length < R.minimoPorSegmento).map(([n]) => n);
  const encontradas = [];
  for (const [nombre, fs] of visibles) {
    const resto = filas.filter((f) => !fs.includes(f));
    if (resto.length < R.minimoPorSegmento) continue;
    for (const tema of temasCandidatos) {
      const enSegmento = pct(fs.filter((f) => mencionaTema(f.id, tema)).length, fs.length);
      const enResto = pct(resto.filter((f) => mencionaTema(f.id, tema)).length, resto.length);
      if (Math.abs(enSegmento - enResto) >= R.diferenciaClara) {
        encontradas.push({ segmento: nombre, respuestas: fs.length, codigo: tema, tema: NOMBRE_TEMA[tema], pctSegmento: enSegmento, pctResto: enResto });
      }
    }
  }
  encontradas.sort((a, b) => Math.abs(b.pctSegmento - b.pctResto) - Math.abs(a.pctSegmento - a.pctResto));
  // Transversal: el tema aparece en todos los segmentos visibles (al menos 2).
  const transversales =
    visibles.length >= 2
      ? temasCandidatos.filter((tema) => visibles.every(([, fs]) => fs.some((f) => mencionaTema(f.id, tema))))
      : [];
  return {
    diferencias: encontradas.slice(0, R.maximoDiferencias),
    visibles: visibles.map(([n, fs]) => ({ segmento: n, respuestas: fs.length })),
    ocultos,
    transversales,
  };
}

/**
 * @param {object} entrada
 * @param {Array} entrada.filas respuestas (id, area, grupo, p1, p2, p3)
 * @param {Array} entrada.clasificacion una fila por respuesta no vacía a cada pregunta
 * @param {Array} entrada.areas áreas de la Etapa 0 con sus afectados
 * @param {Record<string,string>} [entrada.sintesis] una frase por código de tema
 * @param {Array<{idea:string, ids:string[]}>} [entrada.propuestas] ideas de P3 con las respuestas que las apoyan
 * @param {string[]} [entrada.lectura] lectura del copiloto (inferencias)
 */
export function construirInforme({ filas, clasificacion, areas, sintesis = {}, propuestas = [], lectura = [] }) {
  const clas = validarClasificacion(clasificacion, filas);
  const deFila = (id, p) => clas.find((c) => c.id === id && c.pregunta === p);
  const respondidas = Object.fromEntries(PREG.map((p) => [p, filas.filter((f) => lleno(f[p])).length]));

  // Participación: respuestas sobre personas que recibieron el buzón (afectados de la Etapa 0).
  const personas = areas.reduce((s, a) => s + (Number(a.afectados) || 0), 0);
  const participacion = { respuestas: filas.length, personas: personas || null, porcentaje: personas ? pct(filas.length, personas) : null };

  // Temas de P1 y P2. Cada respuesta cuenta igual, sea corta o larga.
  const conteo = new Map();
  const otros = new Map();
  for (const c of clas.filter((x) => x.pregunta !== 'p3')) {
    for (const t of c.temas) {
      if (t === OTRO) {
        otros.set(c.otro, (otros.get(c.otro) ?? 0) + 1);
        continue;
      }
      const actual = conteo.get(t) ?? { p1: 0, p2: 0 };
      actual[c.pregunta] += 1;
      conteo.set(t, actual);
    }
  }
  const temas = [...conteo]
    .map(([codigo, n]) => ({
      codigo,
      tema: NOMBRE_TEMA[codigo],
      p1: n.p1,
      p2: n.p2,
      pctP1: pct(n.p1, respondidas.p1),
      pctP2: pct(n.p2, respondidas.p2),
      total: n.p1 + n.p2,
      sintesis: String(sintesis[codigo] ?? '').trim(),
    }))
    .sort((a, b) => b.total - a.total || a.codigo.localeCompare(b.codigo));
  const principales = temas.slice(0, R.temasPrincipales);

  const mencionaTema = (id, tema) => ['p1', 'p2'].some((p) => deFila(id, p)?.temas.includes(tema));
  const candidatos = temas.map((t) => t.codigo);
  const porGrupo = diferencias(filas, mencionaTema, 'grupo', candidatos);
  const porArea = diferencias(filas, mencionaTema, 'area', candidatos);

  // Propuestas de P3: las ideas más repetidas, contadas por respuestas distintas que existan.
  const idsP3 = new Set(filas.filter((f) => lleno(f.p3)).map((f) => f.id));
  const ideas = propuestas
    .map((p) => ({ idea: String(p.idea ?? '').trim(), menciones: new Set((p.ids ?? []).filter((id) => idsP3.has(id))).size }))
    .filter((p) => p.idea && p.menciones > 0)
    .sort((a, b) => b.menciones - a.menciones)
    .slice(0, 5);

  // Alertas: temas con intensidad 3 aunque sean pocos casos, y temas transversales.
  const intensas = new Map();
  for (const c of clas.filter((x) => x.pregunta !== 'p3' && x.intensidad === 3)) {
    for (const t of c.temas) {
      const nombre = t === OTRO ? `Otro: ${c.otro}` : NOMBRE_TEMA[t];
      intensas.set(nombre, (intensas.get(nombre) ?? 0) + 1);
    }
  }

  // Revisión humana: solo tipo y cantidad, por respuesta (no por pregunta).
  const revision = new Map();
  const yaContadas = new Set();
  for (const c of clas.filter((x) => x.revision !== 'ninguna')) {
    const clave = `${c.id}|${c.revision}`;
    if (yaContadas.has(clave)) continue;
    yaContadas.add(clave);
    revision.set(c.revision, (revision.get(c.revision) ?? 0) + 1);
  }

  const sentimientos = Object.fromEntries(SENTIMIENTOS.map((s) => [s, clas.filter((c) => c.pregunta !== 'p3' && c.sentimiento === s).length]));
  const identificables = new Set(clas.filter((c) => c.identificable).map((c) => c.id)).size;

  // Límites del análisis.
  const limites = [];
  if (filas.length < R.minimoRepresentativo) limites.push(`Solo hay ${filas.length} respuestas: los resultados son indicativos, no representativos.`);
  limites.push('Los porcentajes son orientativos y se calculan sobre las respuestas de cada pregunta.');
  if (porGrupo.ocultos.length) limites.push(`No se muestran por separado los grupos con menos de ${R.minimoPorSegmento} respuestas: ${porGrupo.ocultos.join(', ')}.`);
  if (porArea.ocultos.length) limites.push(`No se muestran por separado las áreas con menos de ${R.minimoPorSegmento} respuestas: ${porArea.ocultos.join(', ')}.`);
  const sinGrupo = filas.filter((f) => !lleno(f.grupo) || f.grupo === SIN_GRUPO || f.grupo === NO_DICE).length;
  if (sinGrupo) limites.push(`${sinGrupo} respuestas no indican grupo o prefirieron no decirlo.`);
  if (participacion.porcentaje !== null) {
    for (const a of areas) {
      const n = filas.filter((f) => f.area === a.area).length;
      const tasa = pct(n, Number(a.afectados) || 0);
      if (tasa !== null && tasa < participacion.porcentaje / 2) limites.push(`${a.area} casi no respondió (${tasa} % de participación frente a ${participacion.porcentaje} % en total).`);
    }
  }
  const sinClasificar = PREG.reduce((s, p) => s + filas.filter((f) => lleno(f[p]) && !deFila(f.id, p)).length, 0);
  if (sinClasificar) limites.push(`${sinClasificar} respuestas no quedaron clasificadas y no entran en los conteos.`);
  if (identificables) limites.push(`${identificables} respuestas permiten reconocer a quien escribió, aun enmascaradas: no se citan.`);
  limites.push('Segmentación por una sola dimensión a la vez (grupo o área), nunca área × grupo.');

  return {
    participacion,
    respondidas,
    temas: principales,
    otrosTemas: [...otros].map(([nombre, menciones]) => ({ nombre, menciones })),
    diferencias: { grupo: porGrupo, area: porArea },
    propuestas: ideas,
    alertas: {
      intensas: [...intensas].map(([tema, casos]) => ({ tema, casos })).sort((a, b) => b.casos - a.casos),
      transversales: [
        ...porGrupo.transversales.map((t) => ({ tema: NOMBRE_TEMA[t], dimension: 'grupo', segmentos: porGrupo.visibles.length })),
        ...porArea.transversales.map((t) => ({ tema: NOMBRE_TEMA[t], dimension: 'area', segmentos: porArea.visibles.length })),
      ].filter((t) => principales.some((p) => p.tema === t.tema)),
    },
    revision: [...revision].map(([tipo, cantidad]) => ({ tipo, nombre: NOMBRE_REVISION[tipo], cantidad })),
    sentimientos,
    lectura: lectura.map((l) => String(l).trim()).filter(Boolean).slice(0, 3),
    limites,
    clasificadas: clas.length,
  };
}
