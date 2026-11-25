import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { APROBACION_MINIMA } from './simulador.mjs';
import { MIN_GRUPO_TERMOMETRO } from './reglasT.mjs';
import {
  evaluarSemaforoA,
  INDICADORES_A,
  resumirViaje,
} from './reglasA.mjs';

const NOMBRES_INDICADOR = {
  autonomia: 'Autonomía',
  uso_sostenido: 'Uso sostenido',
  regreso_anterior: 'Regreso a lo anterior',
  traspaso: 'Traspaso',
  participacion: 'Participación',
  comunicacion: 'Comunicación',
  apropiacion: 'Apropiación',
  recaidas: 'Recaídas',
};

const NOMBRES_FASE = {
  antes: 'Antes del cambio (Línea base)',
  durante: 'Durante el cambio (Transición)',
  actual: 'Situación actual (Adopción real)',
  mejorar: 'Hacia dónde mejorar (Sostenibilidad)',
};

const ACCIONES_POR_INDICADOR = {
  autonomia:
    'Reforzar «Parejas de práctica» (T3) emparejando adoptantes tempranos con quienes aún necesitan apoyo y revisar la escalera de autonomía al cierre del ciclo.',
  uso_sostenido:
    'Observar en el puesto de trabajo qué frena el uso continuo y asignar micro-cursos cortos (5–10 min en T2) sobre los pasos con más fricción.',
  regreso_anterior:
    'Definir fecha de retiro progresivo del formato antiguo y ejecutar un «Simulacro de recaída» (T3) antes del próximo pico operativo.',
  traspaso:
    'Agendar sesiones de cierre con los equipos en nivel 3 o 4 para formalizar su acta de traspaso y definir el seguimiento mensual del dueño del proceso.',
  participacion:
    'Proteger bloques de 30–45 min dentro del turno laboral (sin descuento de producción) y convocar a través de los líderes inmediatos.',
  comunicacion:
    'Aplicar la encuesta de pulso (T1) al cierre de las próximas sesiones y reforzar el formato con mayor claridad y participación.',
  apropiacion:
    'Facilitar un «Círculo de apropiación» (T3) para elegir una práctica que todavía se siente nueva y trabajarla durante la semana.',
  recaidas:
    'Activar protocolo de atención en menos de 48 horas con los agentes de cambio frente a cada señal de desvío detectada.',
};

const MITIGACION_DETALLADA = {
  autonomia: [
    'Semana 1: identifica qué tareas siguen dependiendo del facilitador y arma parejas de práctica (30 min) entre un referente y un compañero en adaptación.',
    'Semana 2: deja que el equipo ejecute la rutina completa sin intervención externa y valida el avance en una votación rápida de la Escalera de autonomía.',
  ],
  uso_sostenido: [
    'Semana 1: recorre el puesto de trabajo en horas pico para detectar el paso exacto donde los usuarios abandonan la herramienta nueva.',
    'Semana 2: publica una guía visual de una página junto al puesto y refuerza solo ese paso con un micro-curso de 5 minutos.',
  ],
  regreso_anterior: [
    'Semana 1: mapea en qué horario o caso puntual se sigue usando el formato antiguo (picos, devoluciones o turnos sin soporte) y corrige esa traba operativa.',
    'Semana 2: acuerda una fecha visible de retiro de las planillas anteriores y haz un «Simulacro de recaída» de 40 min con el equipo antes del siguiente pico.',
  ],
  traspaso: [
    'Semana 1: lista los equipos que ya operan en nivel 3 o 4 y agenda una sesión de 30 min con cada jefe de área para revisar los criterios del acta.',
    'Semana 2: firma el acta de traspaso dejando claros el dueño del proceso, el indicador mensual de alerta y el canal de mentoría solo por excepción.',
  ],
  participacion: [
    'Semana 1: acuerda con los jefes de turno bloques protegidos de 30 min dentro de la jornada (sin afectar metas de producción).',
    'Semana 2: haz dinámicas cortas directamente en el lugar de trabajo y rota quién facilita para aumentar el compromiso del equipo.',
  ],
  comunicacion: [
    'Semana 1: revisa en T1 qué formato obtuvo mejor claridad/utilidad y reemplaza comunicados largos por demostraciones breves en vivo.',
    'Semana 2: cierra cada sesión con la encuesta de pulso de 3 preguntas y responde públicamente las dudas más frecuentes en menos de 48 horas.',
  ],
  apropiacion: [
    'Semana 1: realiza un «Círculo de apropiación» donde cada persona cuente un caso real con la nueva forma y se elija una sola tarjeta de «todavía se siente nuevo».',
    'Semana 2: haz seguimiento diario de 5 minutos sobre ese compromiso puntual y celebra visiblemente el avance en T4.',
  ],
  recaidas: [
    'Semana 1: define con los agentes de cambio qué señales tempranas disparan una alerta (errores repetidos, atrasos o dudas acumuladas).',
    'Semana 2: garantiza respuesta en el puesto en menos de 48 horas ante cada señal y registra el ajuste en la guía de una página.',
  ],
};

const CAUSAS_POR_INDICADOR = {
  autonomia: 'Suele aparecer cuando los jefes todavía resuelven todo directamente o faltan adoptantes tempranos acompañando en el puesto.',
  uso_sostenido: 'Generalmente indica fricción en el flujo diario (pasos lentos, accesos inestables o dudas no resueltas en horas pico).',
  regreso_anterior: 'Ocurre casi siempre cuando el método viejo sigue disponible «por si acaso» y en momentos de presión el equipo vuelve a lo conocido.',
  traspaso: 'No suele ser resistencia del equipo, sino falta de un cierre administrativo formal (acta y definición del seguimiento mensual con el dueño).',
  participacion: 'Aparece cuando las dinámicas compiten con picos de producción o no hay tiempo protegido dentro del turno laboral.',
  comunicacion: 'Indica que el mensaje llegó por un canal poco práctico o sin espacio real para resolver preguntas del día a día.',
  apropiacion: 'Señala que las personas ejecutan lo nuevo por instrucción, pero aún no sienten comodidad ni dominio para enseñarlo a otros.',
  recaidas: 'Suele deberse a que las alertas se detectan tarde o no hay un responsable claro para atenderlas rápido en el puesto.',
};

const TEXTOS_PREGUNTA_PRIORIDAD = {
  3: {
    titulo: 'Principal dificultad en la transición (P4)',
    a: 'Sin mayores dificultades',
    b: 'Aprender y comprender los nuevos procedimientos',
    c: 'Utilizar las nuevas herramientas o tecnologías',
  },
  4: {
    titulo: 'Mayor facilitador de adaptación (P5)',
    a: 'La capacitación y formación proporcionada por la empresa',
    b: 'El acompañamiento y apoyo de líderes y compañeros',
    c: 'La disponibilidad de herramientas y recursos necesarios',
  },
  5: {
    titulo: 'Momento de mayor necesidad de apoyo (P6)',
    a: 'Durante todo el proceso de implementación',
    b: 'Durante las capacitaciones y el aprendizaje',
    c: 'Al aplicar los nuevos procesos en las actividades diarias',
  },
  9: {
    titulo: 'Prioridad #1 a mejorar por la empresa (P10)',
    a: 'Fortalecer los procesos de capacitación y formación',
    b: 'Mejorar la comunicación entre directivos y colaboradores',
    c: 'Proporcionar mejores herramientas y recursos de trabajo',
  },
  10: {
    titulo: 'Aspecto prioritario a mantener (P11)',
    a: 'Las nuevas formas de trabajo y procedimientos establecidos',
    b: 'Los espacios de capacitación y formación',
    c: 'Los canales de comunicación y participación',
  },
  11: {
    titulo: 'Apoyo adicional más solicitado (P12)',
    a: 'Mayor capacitación sobre los nuevos procesos',
    b: 'Acompañamiento personalizado de los líderes',
    c: 'Acceso a mejores herramientas y recursos',
  },
};

const ACCION_POR_PRIORIDAD = {
  a: 'Programar micro-cápsulas prácticas de 10 minutos en el puesto (T2) enfocadas en las tareas donde persisten dudas.',
  b: 'Activar conversaciones quincenales 1 a 1 con mandos medios y reforzar el canal bidireccional de dudas con respuesta en 48 h.',
  c: 'Auditar disponibilidad de equipos, accesos y guías rápidas de una página en cada estación para eliminar cuellos de botella.',
};

const promedio = (nums) => (nums.length ? Math.round((nums.reduce((a, b) => a + b, 0) / nums.length) * 100) / 100 : null);
const fmtNum = (n, unidad = 'porcentaje') => {
  if (n === null || n === undefined) return '—';
  if (unidad === 'escala_5') return `${Number(n).toFixed(1).replace('.', ',')} / 5`;
  return `${Number.isInteger(n) ? n : Number(n).toFixed(1).replace('.', ',')} %`;
};
const fmtProm = (n) => (n === null || n === undefined ? '—' : Number(n).toFixed(2).replace('.', ','));
const normalizar = (s = '') =>
  String(s)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

/** Lee una variable desde process.env o desde archivos .env locales (0 dependencias). */
function leerVariableEntorno(nombre) {
  if (process.env.VITEST) return '';
  const directo = process.env[nombre]?.trim();
  if (directo) return directo;
  const rutas = [resolve(process.cwd(), '.env'), resolve(process.cwd(), '..', '.env')];
  for (const ruta of rutas) {
    if (!existsSync(ruta)) continue;
    try {
      const lineas = readFileSync(ruta, 'utf8').split(/\r?\n/);
      for (const linea of lineas) {
        const limpia = linea.trim();
        if (!limpia || limpia.startsWith('#')) continue;
        const eq = limpia.indexOf('=');
        if (eq === -1) continue;
        if (limpia.slice(0, eq).trim() === nombre) {
          return limpia.slice(eq + 1).trim().replace(/^['"]|['"]$/g, '');
        }
      }
    } catch {
      // Ignora errores de lectura de .env
    }
  }
  return '';
}

function opcionGanadora(preguntaResumen, indice) {
  if (!preguntaResumen) return null;
  const { a, b, c } = preguntaResumen.conteos;
  const total = a + b + c;
  if (total === 0) return null;
  const mapa = TEXTOS_PREGUNTA_PRIORIDAD[indice];
  const orden = [
    { letra: 'a', cantidad: a, texto: mapa?.a ?? 'Opción A' },
    { letra: 'b', cantidad: b, texto: mapa?.b ?? 'Opción B' },
    { letra: 'c', cantidad: c, texto: mapa?.c ?? 'Opción C' },
  ].sort((x, y) => y.cantidad - x.cantidad);
  const top = orden[0];
  return { ...top, porcentaje: Math.round((top.cantidad / total) * 100), titulo: mapa?.titulo ?? '' };
}

/**
 * Construye un contexto 100 % agregado y anonimizado de Etapa A y sus insumos
 * de Etapa T directamente desde SQLite (respeta privacidad de roles y Ley 1581).
 */
export function construirContextoEtapaA(db, usuario, periodoViaje = 'todos') {
  const esLider = usuario.rol === 'lider';

  // 1. Auditorías A1 (últimas 6 para deltas y narrativa de evolución)
  const filasAud = db.prepare("SELECT id, datos, creado_en FROM registros WHERE tipo = 'auditoria_a' ORDER BY id DESC LIMIT 6").all();
  const auditorias = filasAud.map((f) => ({ id: f.id, ...JSON.parse(f.datos), creadoEn: f.creado_en }));
  const ultimaAud = auditorias[0] ?? null;
  const previaAud = auditorias[1] ?? null;
  const primeraAud = auditorias.length > 1 ? auditorias[auditorias.length - 1] : null;

  let detalleA1 = null;
  if (ultimaAud) {
    const items = INDICADORES_A.map((ind) => {
      const meta = ultimaAud.metas?.[ind.id] ?? ind.metaInicial;
      const valor = ultimaAud.valores?.[ind.id] ?? null;
      const estado = valor === null ? null : evaluarSemaforoA(valor, meta, ind.sentido);
      const valorPrevio = previaAud?.valores?.[ind.id] ?? null;
      const delta = valor !== null && valorPrevio !== null ? Math.round((valor - valorPrevio) * 100) / 100 : null;
      const empeoro =
        delta === null || delta === 0 ? false : ind.sentido === 'mayor_mejor' ? delta < 0 : delta > 0;
      const mejoro =
        delta === null || delta === 0 ? false : ind.sentido === 'mayor_mejor' ? delta > 0 : delta < 0;
      return {
        id: ind.id,
        nombre: NOMBRES_INDICADOR[ind.id],
        unidad: ind.unidad,
        sentido: ind.sentido,
        meta,
        valor,
        estado,
        delta,
        empeoro,
        mejoro,
      };
    });
    const enMeta = items.filter((i) => i.estado === 'en_meta');
    const atencion = items.filter((i) => i.estado === 'atencion');
    const intervenir = items.filter((i) => i.estado === 'intervenir');
    const evaluados = enMeta.length + atencion.length + intervenir.length;

    const cumplimientoDe = (aud) => {
      if (!aud) return null;
      let ok = 0;
      let tot = 0;
      for (const ind of INDICADORES_A) {
        const v = aud.valores?.[ind.id];
        if (v === null || v === undefined) continue;
        tot += 1;
        if (evaluarSemaforoA(v, aud.metas?.[ind.id] ?? ind.metaInicial, ind.sentido) === 'en_meta') ok += 1;
      }
      return tot ? Math.round((ok / tot) * 100) : null;
    };

    detalleA1 = {
      periodo: ultimaAud.periodo,
      fecha: ultimaAud.fecha,
      equipo: ultimaAud.equipo || 'Organización',
      totalAuditorias: auditorias.length,
      periodoPrevio: previaAud?.periodo ?? null,
      periodoInicial: primeraAud?.periodo ?? null,
      cumplimientoInicial: cumplimientoDe(primeraAud),
      cumplimientoPrevio: cumplimientoDe(previaAud),
      cumplimiento: evaluados ? Math.round((enMeta.length / evaluados) * 100) : null,
      conteos: { enMeta: enMeta.length, atencion: atencion.length, intervenir: intervenir.length, evaluados },
      items,
      enMeta,
      atencion,
      intervenir,
    };
  }

  // 2. Mapa de viaje A2 (agregado anónimo + propio)
  const filasViaje = db.prepare("SELECT usuario_id, datos FROM registros WHERE tipo = 'viaje_a' ORDER BY id DESC").all();
  const todosViaje = filasViaje.map((f) => ({ usuarioId: f.usuario_id, ...JSON.parse(f.datos) }));
  const filtradosViaje =
    periodoViaje && periodoViaje !== 'todos' ? todosViaje.filter((v) => v.periodo === periodoViaje) : todosViaje;
  const resumenViajeEquipo = resumirViaje(filtradosViaje);
  const propiasViaje = todosViaje.filter((v) => v.usuarioId === usuario.id);
  const resumenViajePropio = propiasViaje.length ? resumirViaje([propiasViaje[0]]) : null;

  // 3. Insumos de Etapa T (solo agregados numéricos; balances solo para líder en motor local)
  const filasTerm = db.prepare("SELECT datos FROM registros WHERE tipo = 'termometro'").all();
  const termPorCiclo = new Map();
  for (const f of filasTerm) {
    const d = JSON.parse(f.datos);
    termPorCiclo.set(d.ciclo, [...(termPorCiclo.get(d.ciclo) ?? []), d.respuestas]);
  }
  let termometroT3 = null;
  for (const [ciclo, resp] of [...termPorCiclo.entries()].sort((a, b) => b[0] - a[0])) {
    if (resp.length >= MIN_GRUPO_TERMOMETRO) {
      termometroT3 = { ciclo, respuestas: resp.length, promedio: promedio(resp.map((r) => promedio(r))) };
      break;
    }
  }

  const filaAcuerdo = db.prepare("SELECT datos FROM registros WHERE tipo = 'acuerdo' ORDER BY id DESC LIMIT 1").get();
  const acuerdoT3 = filaAcuerdo ? JSON.parse(filaAcuerdo.datos) : null;

  const filasPulso = db.prepare("SELECT datos FROM registros WHERE tipo = 'pulso'").all().map((f) => JSON.parse(f.datos));
  const pulsoT1 = filasPulso.length
    ? {
        respuestas: filasPulso.length,
        sesiones: new Set(filasPulso.map((p) => p.sesion)).size,
        claridad: promedio(filasPulso.map((p) => p.claridad)),
        utilidad: promedio(filasPulso.map((p) => p.utilidad)),
        confianza: promedio(filasPulso.map((p) => p.confianza)),
      }
    : null;

  const filasSim = db.prepare('SELECT aciertos, total, seguridad FROM simulacros').all();
  const simuladorT2 = filasSim.length
    ? {
        intentos: filasSim.length,
        tasaAprobacion: Math.round((filasSim.filter((s) => s.aciertos >= APROBACION_MINIMA).length / filasSim.length) * 100),
        seguridadPromedio: promedio(filasSim.map((s) => s.seguridad)),
      }
    : null;

  const filasMeritos = db.prepare("SELECT datos FROM registros WHERE tipo = 'merito'").all().map((f) => JSON.parse(f.datos));
  const meritosT4 = {
    total: filasMeritos.length,
    publicados: filasMeritos.filter((m) => m.publicar).length,
  };

  const balancesT4 = esLider
    ? db
        .prepare("SELECT datos FROM registros WHERE tipo = 'balance' ORDER BY id DESC LIMIT 2")
        .all()
        .map((f) => JSON.parse(f.datos))
    : [];

  return {
    rol: usuario.rol,
    esLider,
    periodoViaje: periodoViaje || 'todos',
    a1: detalleA1,
    a2Equipo: resumenViajeEquipo,
    a2Propio: resumenViajePropio,
    t: {
      pulsoT1,
      simuladorT2,
      acuerdoT3,
      termometroT3,
      meritosT4,
      balancesT4,
    },
  };
}

/** Infiere qué tema se estaba conversando en el último turno del historial. */
function temaDeHistorial(historial = []) {
  if (!Array.isArray(historial) || historial.length === 0) return null;
  const ultimoAsistente = [...historial].reverse().find((h) => h?.autor === 'asistente');
  if (!ultimoAsistente) return null;
  const txt = normalizar(ultimoAsistente.texto);
  for (const [id, nombre] of Object.entries(NOMBRES_INDICADOR)) {
    if (txt.includes(`analisis puntual`) && txt.includes(normalizar(nombre))) {
      return { tipo: 'indicador', indicador: id };
    }
  }
  if (/mapa de viaje|curva emocional|curva a2|durante el cambio/.test(txt)) return { tipo: 'a2' };
  if (/lectura cruzada|etapa t|balance t4/.test(txt)) return { tipo: 'cruce' };
  if (/diagnostico a1|semaforo|auditoria/.test(txt)) return { tipo: 'a1' };
  return null;
}

/** Idea 1: Diagnóstico de semáforos A1 y plan de rescate a 15 días. */
function generarDiagnosticoA1(ctx, indicadorEspecifico = null) {
  const a1 = ctx.a1;
  if (!a1) {
    return {
      titulo: 'Diagnóstico del Tablero del equipo (A1)',
      resumen: 'Todavía no hay auditorías registradas en A1, así que aún no tengo mediciones para diagnosticar.',
      secciones: [
        {
          encabezado: 'Cómo empezar en 2 minutos',
          items: [
            ctx.esLider
              ? 'Abre la pestaña «Registrar auditoría» en A1 para ingresar la primera medición de los 8 indicadores.'
              : 'Cuando el líder registre la primera auditoría del equipo, aquí podrás revisar el estado y los consejos.',
            ctx.t.termometroT3
              ? `¡Buen dato! Ya tienes el Termómetro T3 del Ciclo ${ctx.t.termometroT3.ciclo} (${fmtNum(ctx.t.termometroT3.promedio, 'escala_5')}) listo para importar con un clic.`
              : 'Puedes usar la calculadora auxiliar (numerador ÷ denominador) en cada indicador del formulario.',
          ],
        },
      ],
      acciones15Dias: [
        'Registrar la primera auditoría base (por ejemplo, Día 30) para activar los gráficos y semáforos.',
        'Ajustar las metas iniciales solo si tu empresa definió objetivos propios.',
      ],
      sugerencias: ['Interpretar curva A2 y prioridades', '¿Cómo funciona la regla del 15 %?'],
    };
  }

  if (indicadorEspecifico) {
    const item = a1.items.find((i) => i.id === indicadorEspecifico);
    if (item) {
      const etiquetaEstado =
        item.estado === 'en_meta'
          ? 'En meta (verde)'
          : item.estado === 'atencion'
            ? 'Atención (amarillo · a menos de 15 % de la meta)'
            : item.estado === 'intervenir'
              ? 'Intervenir (rojo · desviación mayor al 15 %)'
              : 'Sin dato en la última auditoría';
      const notaDelta =
        item.delta !== null && a1.periodoPrevio
          ? `Frente a ${a1.periodoPrevio} cambió en ${item.delta > 0 ? '+' : ''}${fmtNum(item.delta, item.unidad)}.`
          : 'Aún no hay una auditoría anterior para ver tendencia.';
      return {
        titulo: `Análisis puntual · ${item.nombre}`,
        resumen: `En ${a1.periodo}, ${item.nombre} marca ${fmtNum(item.valor, item.unidad)} frente a la meta de ${item.sentido === 'menor_mejor' ? '< ' : '≥ '}${fmtNum(item.meta, item.unidad)} (${etiquetaEstado}).`,
        secciones: [
          {
            encabezado: 'Por qué importa y qué suele causarlo',
            items: [notaDelta, CAUSAS_POR_INDICADOR[item.id]],
          },
        ],
        acciones15Dias:
          item.estado === 'en_meta'
            ? [
                `Sostener la práctica que mantiene ${item.nombre} en verde y documentarla para otros equipos.`,
                'Revisar en la próxima auditoría que el resultado se conserve sin soporte externo.',
              ]
            : MITIGACION_DETALLADA[item.id],
        sugerencias: ['¿Cómo lo hablo con el equipo?', 'Cruzar A1 con Etapa T', '¿Cómo vamos frente a antes?'],
      };
    }
  }

  const focosRojos = a1.intervenir.map(
    (i) =>
      `${i.nombre}: ${fmtNum(i.valor, i.unidad)} (meta ${i.sentido === 'menor_mejor' ? '< ' : '≥ '}${fmtNum(i.meta, i.unidad)})${i.empeoro ? ' — bajó frente al corte anterior' : ''}.`,
  );
  const focosAmarillos = a1.atencion.map(
    (i) => `${i.nombre}: ${fmtNum(i.valor, i.unidad)} (meta ${i.sentido === 'menor_mejor' ? '< ' : '≥ '}${fmtNum(i.meta, i.unidad)}).`,
  );

  const prioritarios = [...a1.intervenir, ...a1.atencion];
  const acciones15Dias = prioritarios.length
    ? prioritarios.slice(0, 3).map((i) => `${i.nombre}: ${ACCIONES_POR_INDICADOR[i.id]}`)
    : [
        'Consolidar el traspaso a los dueños de proceso y pasar al equipo al escalón 4 (Referente).',
        'Publicar los logros como victorias tempranas en T4 para mantener la motivación alta.',
      ];

  const secciones = [];
  if (focosRojos.length) secciones.push({ encabezado: 'Prioridad alta · Intervenir (rojo)', items: focosRojos });
  if (focosAmarillos.length) secciones.push({ encabezado: 'Alerta temprana · Atención (amarillo)', items: focosAmarillos });
  if (a1.enMeta.length) {
    secciones.push({
      encabezado: 'Lo que ya está en meta (verde)',
      items: [a1.enMeta.map((i) => `${i.nombre} (${fmtNum(i.valor, i.unidad)})`).join(' · ')],
    });
  }

  return {
    titulo: `Diagnóstico A1 y plan a 15 días (${a1.periodo})`,
    resumen: `Tu equipo está en un ${a1.cumplimiento ?? 0} % de cumplimiento (${a1.conteos.enMeta} de ${a1.conteos.evaluados} en meta; ${a1.conteos.intervenir} en rojo y ${a1.conteos.atencion} en amarillo).`,
    secciones,
    acciones15Dias,
    sugerencias: ['¿Cómo mitigo estas alertas paso a paso?', '¿Por qué están pasando estos desvíos?', 'Cruzar A1 con Etapa T'],
  };
}

/** Idea 2: Lectura cruzada inteligente A1 + Etapa T (solo líder). */
function generarCruceA1yT(ctx) {
  if (!ctx.esLider) {
    return {
      titulo: 'Lectura cruzada A1 + Etapa T',
      resumen: 'Esa vista cruzada incluye balances internos de gestión reservados para el rol de líder, pero con gusto te ayudo a leer el tablero A1 o tu curva en A2.',
      secciones: [],
      acciones15Dias: [],
      sugerencias: ['Interpretar curva A2 y prioridades', '¿Cómo vamos en A1?', '¿Cómo se calculan las caritas?'],
    };
  }

  const hallazgos = [];
  const acciones = [];
  const a1 = ctx.a1;
  const { pulsoT1, simuladorT2, acuerdoT3, termometroT3, meritosT4, balancesT4 } = ctx.t;

  const uso = a1?.items.find((i) => i.id === 'uso_sostenido');
  const apropA1 = a1?.items.find((i) => i.id === 'apropiacion');
  const regreso = a1?.items.find((i) => i.id === 'regreso_anterior');
  const autonomia = a1?.items.find((i) => i.id === 'autonomia');
  const traspaso = a1?.items.find((i) => i.id === 'traspaso');
  const comA1 = a1?.items.find((i) => i.id === 'comunicacion');

  const apropRef = apropA1?.valor ?? termometroT3?.promedio ?? null;
  if (uso?.valor !== null && uso?.valor !== undefined && apropRef !== null) {
    if (uso.estado === 'en_meta' && apropRef < 4) {
      hallazgos.push(
        `Alerta de cumplimiento sin convicción: Uso sostenido cumple (${fmtNum(uso.valor)}), pero Apropiación está en ${fmtNum(apropRef, 'escala_5')} (< 4,0). Hay riesgo de recaída si baja el seguimiento.`,
      );
      acciones.push('Reforzar «Círculo de apropiación» (T3) y reconocimiento de méritos (T4) para pasar de cumplimiento a convicción.');
    } else if (uso.estado === 'en_meta' && apropRef >= 4) {
      hallazgos.push(
        `Buena señal de sostenibilidad: Uso sostenido (${fmtNum(uso.valor)}) y Apropiación (${fmtNum(apropRef, 'escala_5')}) avanzan ambos en meta.`,
      );
    } else if (apropRef >= 4 && uso.estado !== 'en_meta') {
      hallazgos.push(
        `Buena actitud con traba operativa: la apropiación es alta (${fmtNum(apropRef, 'escala_5')}), pero Uso sostenido marca ${fmtNum(uso.valor)}. Revisa herramientas o procesos antes que capacitaciones.`,
      );
      acciones.push('Auditar barreras técnicas en el puesto de trabajo para destrabar el uso diario.');
    }
  }

  if (acuerdoT3 && a1) {
    hallazgos.push(
      `Escalera T3 (Ciclo ${acuerdoT3.ciclo}, ${acuerdoT3.momento}): equipo en Nivel ${acuerdoT3.nivel}${acuerdoT3.meta ? ` (meta Nivel ${acuerdoT3.meta})` : ''}. En A1, Autonomía marca ${fmtNum(autonomia?.valor)} y Traspaso ${fmtNum(traspaso?.valor)}.`,
    );
    if (acuerdoT3.nivel >= 3 && traspaso?.estado && traspaso.estado !== 'en_meta') {
      acciones.push('El equipo ya alcanzó Nivel 3+: formaliza las actas de traspaso pendientes para llevar Traspaso al 100 %.');
    }
  }

  if (simuladorT2) {
    hallazgos.push(
      `Capacitación T2: ${simuladorT2.tasaAprobacion} % de aprobación en simuladores y seguridad promedio de ${fmtNum(simuladorT2.seguridadPromedio, 'escala_5')} (${simuladorT2.intentos} registros).`,
    );
    if (simuladorT2.seguridadPromedio !== null && simuladorT2.seguridadPromedio < 3.8 && regreso?.estado !== 'en_meta') {
      acciones.push('La baja seguridad práctica en T2 está empujando el regreso al método anterior: activa parejas de práctica en turno.');
    }
  }

  if (pulsoT1) {
    hallazgos.push(
      `Pulso T1: claridad ${fmtNum(pulsoT1.claridad, 'escala_5')} y utilidad ${fmtNum(pulsoT1.utilidad, 'escala_5')} en ${pulsoT1.sesiones} sesiones${comA1?.valor !== null && comA1?.valor !== undefined ? `; Comunicación A1 está en ${fmtNum(comA1.valor)}.` : '.'}`,
    );
  }

  if (termometroT3) {
    hallazgos.push(
      `Termómetro T3 (Ciclo ${termometroT3.ciclo}): ${fmtNum(termometroT3.promedio, 'escala_5')} con ${termometroT3.respuestas} respuestas anónimas (privacidad ≥ ${MIN_GRUPO_TERMOMETRO}).`,
    );
  }
  if (meritosT4.total > 0) {
    hallazgos.push(`Victorias tempranas T4: ${meritosT4.total} registradas y ${meritosT4.publicados} publicadas.`);
  }

  const secciones = [
    {
      encabezado: 'Señales al cruzar A1 con Etapa T',
      items: hallazgos.length
        ? hallazgos
        : ['Aún faltan registros en A1 o en Etapa T para cruzar datos. Registra una auditoría y actividades en T1–T4.'],
    },
  ];

  if (balancesT4.length > 0) {
    const ultimo = balancesT4[0];
    secciones.push({
      encabezado: `Insumo directo del Balance T4 (Ciclo ${ultimo.ciclo})`,
      items: [
        `Lo que impulsó los logros: ${ultimo.factores}`,
        `Dificultad abierta a resolver: ${ultimo.dificultades}`,
      ],
    });
    acciones.push(`Cerrar la dificultad reportada en el Balance del Ciclo ${ultimo.ciclo} antes de la próxima auditoría.`);
  }

  if (acciones.length === 0) {
    acciones.push('Mantener alineados el Termómetro de T3 y el Tablero A1 en cada corte de seguimiento.');
  }

  return {
    titulo: 'Lectura cruzada · Tablero A1 + Insumos de Etapa T',
    resumen: a1
      ? `Aquí ves cómo conversan los resultados de ${a1.periodo} (A1) con lo vivido en comunicación (T1), capacitación (T2), acompañamiento (T3) y balances (T4).`
      : 'Estos son los insumos actuales de Etapa T listos para alimentar tu primera auditoría en A1.',
    secciones,
    acciones15Dias: acciones.slice(0, 3),
    sugerencias: ['¿Cómo mitigo los riesgos encontrados?', 'Interpretar curva A2 y prioridades', '¿Cómo vamos frente a antes?'],
  };
}

/** Idea 4: Intérprete de la curva emocional y prioridades de mejora (A2). */
function generarAnalisisCurvaA2(ctx) {
  const fuente = !ctx.esLider && ctx.a2Equipo.totalRespuestas === 0 && ctx.a2Propio ? ctx.a2Propio : ctx.a2Equipo;
  const esPersonal = fuente === ctx.a2Propio;

  if (!fuente || fuente.totalRespuestas === 0) {
    return {
      titulo: 'Mapa de viaje del colaborador (A2)',
      resumen: 'Todavía no hay respuestas en A2. En cuanto alguien diligencie las 12 preguntas, te mostraré dónde está la fricción y qué priorizar.',
      secciones: [],
      acciones15Dias: [
        'Abrir la pestaña «Responder encuesta» en A2 y completar las 12 preguntas de los cuatro momentos.',
        'Invitar al equipo en un taller corto (20 min) para obtener una curva representativa.',
      ],
      sugerencias: ['¿Cómo se calculan las caritas en A2?', 'Diagnóstico A1 y plan a 15 días'],
    };
  }

  const fases = fuente.fases;
  const antes = fases.find((f) => f.id === 'antes');
  const durante = fases.find((f) => f.id === 'durante');
  const actual = fases.find((f) => f.id === 'actual');

  const ordenAsc = [...fases].filter((f) => f.promedio !== null).sort((a, b) => a.promedio - b.promedio);
  const masBaja = ordenAsc[0];
  const masAlta = ordenAsc[ordenAsc.length - 1];

  const lecturaCurva = [
    `Promedio general: ${fmtProm(fuente.promedioGeneral)} / 3,00 (${fuente.porcentajeGeneral} %) con ${fuente.totalRespuestas} ${fuente.totalRespuestas === 1 ? 'respuesta' : 'respuestas'}.`,
  ];

  if (masBaja) {
    lecturaCurva.push(
      `Mayor fricción en: ${NOMBRES_FASE[masBaja.id]} (${fmtProm(masBaja.promedio)} / 3,00 · ${masBaja.porcentaje} % · carita ${masBaja.carita}).`,
    );
  }
  if (durante?.promedio && actual?.promedio) {
    const recuperacion = Math.round((actual.promedio - durante.promedio) * 100) / 100;
    if (recuperacion >= 0.3) {
      lecturaCurva.push(
        `¡Buena recuperación! El equipo subió +${fmtProm(recuperacion)} puntos desde la transición (${fmtProm(durante.promedio)}) hasta hoy (${fmtProm(actual.promedio)}).`,
      );
    } else if (recuperacion < 0) {
      lecturaCurva.push(
        `Ojo: la situación actual (${fmtProm(actual.promedio)}) está por debajo de la transición (${fmtProm(durante.promedio)}). Conviene reforzar acompañamiento cuanto antes.`,
      );
    } else {
      lecturaCurva.push(
        `Ritmo estable: hoy (${fmtProm(actual.promedio)}) están en un nivel similar a la transición (${fmtProm(durante.promedio)}).`,
      );
    }
  }
  if (masAlta && masBaja && masAlta.id !== masBaja.id) {
    lecturaCurva.push(`Momento más fuerte: ${NOMBRES_FASE[masAlta.id]} (${fmtProm(masAlta.promedio)} / 3,00).`);
  }

  const p4 = opcionGanadora(fuente.preguntas[3], 3);
  const p5 = opcionGanadora(fuente.preguntas[4], 4);
  const p10 = opcionGanadora(fuente.preguntas[9], 9);
  const p11 = opcionGanadora(fuente.preguntas[10], 10);
  const p12 = opcionGanadora(fuente.preguntas[11], 11);

  const prioridades = [p4, p5, p10, p11, p12]
    .filter(Boolean)
    .map((p) => `${p.titulo}: «${p.texto}» (${p.porcentaje} %).`);

  const acciones = [];
  if (p10) acciones.push(`Atender la prioridad #1 de mejora (P10): ${ACCION_POR_PRIORIDAD[p10.letra]}`);
  if (p12 && (!p10 || p12.letra !== p10.letra)) {
    acciones.push(`Entregar el apoyo adicional más pedido (P12): ${ACCION_POR_PRIORIDAD[p12.letra]}`);
  }
  if (p11) {
    acciones.push(`Conservar lo que sí funcionó (P11): mantener «${p11.texto.toLowerCase()}».`);
  }
  if (antes?.promedio && actual?.promedio && actual.promedio < antes.promedio) {
    acciones.push('Acompañar de cerca a quienes reportan adaptación parcial hasta superar el nivel de comodidad previo al cambio.');
  }

  return {
    titulo: esPersonal
      ? 'Lectura de tu Mapa de viaje personal (A2)'
      : `Intérprete de la curva emocional y prioridades (A2 · ${ctx.periodoViaje === 'todos' ? 'Todos los periodos' : ctx.periodoViaje})`,
    resumen: masBaja
      ? `La curva muestra su punto más sensible en «${NOMBRES_FASE[masBaja.id]}» (${masBaja.porcentaje} %)${p10 ? ` y lo que más pide el equipo mejorar es: ${p10.texto.toLowerCase()}.` : '.'}`
      : 'Curva del colaborador analizada en sus cuatro momentos.',
    secciones: [
      { encabezado: 'Qué cuenta la curva', items: lecturaCurva },
      ...(prioridades.length ? [{ encabezado: 'Prioridades más votadas', items: prioridades }] : []),
    ],
    acciones15Dias: acciones.slice(0, 3),
    sugerencias: ['¿Cómo mitigo esa fricción paso a paso?', '¿Cómo lo hablo con el equipo?', 'Cruzar A1 con Etapa T'],
  };
}

/* ---------- Respuestas conversacionales flexibles (tono amigable y con contexto del hilo) ---------- */

function responderSaludo(ctx) {
  const pulsoA1 = ctx.a1
    ? `En ${ctx.a1.periodo} tienes ${ctx.a1.conteos.enMeta} de ${ctx.a1.conteos.evaluados} indicadores en meta` +
      (ctx.a1.conteos.intervenir > 0
        ? ` y ${ctx.a1.conteos.intervenir} alerta roja (${ctx.a1.intervenir.map((i) => i.nombre).join(', ')}).`
        : ctx.a1.conteos.atencion > 0
          ? ` y ${ctx.a1.conteos.atencion} en atención (${ctx.a1.atencion.map((i) => i.nombre).join(', ')}).`
          : ', ¡todo en verde!')
    : 'Aún no hay auditorías cargadas en A1.';
  const pulsoA2 =
    ctx.a2Equipo.totalRespuestas > 0
      ? `En A2 ya van ${ctx.a2Equipo.totalRespuestas} respuestas con un promedio de ${fmtProm(ctx.a2Equipo.promedioGeneral)} / 3,00.`
      : 'En A2 todavía no hay respuestas registradas.';

  return {
    titulo: '¡Hola! Qué gusto acompañarte en la Etapa A',
    resumen: `${pulsoA1} ${pulsoA2} ¿Por dónde te gustaría empezar hoy?`,
    secciones: [],
    acciones15Dias: [],
    sugerencias: ctx.esLider
      ? ['¿Cómo mitigo las alertas actuales?', 'Cruzar A1 con Etapa T', 'Interpretar curva A2 y prioridades']
      : ['Interpretar curva A2 y prioridades', '¿Cómo vamos en A1?', '¿Cómo se calculan las caritas?'],
  };
}

function responderGracias() {
  return {
    titulo: '¡Con muchísimo gusto!',
    resumen: 'Cuando quieras revisar otro indicador, preparar una conversación con el equipo o analizar un nuevo corte de auditoría, aquí estoy.',
    secciones: [],
    acciones15Dias: [],
    sugerencias: ['¿Cómo vamos frente a antes?', '¿Cómo lo hablo con el equipo?', 'Interpretar curva A2 y prioridades'],
  };
}

/** Responde específicamente a «¿qué puedo hacer para mitigar esto?» / «¿cómo lo soluciono?» según el hilo y los focos reales. */
function responderMitigacion(ctx, temaPrevio, pasoActual) {
  // Si veníamos hablando de un indicador concreto
  if (temaPrevio?.tipo === 'indicador' && ctx.a1) {
    const item = ctx.a1.items.find((i) => i.id === temaPrevio.indicador);
    if (item) {
      return {
        titulo: `Cómo mitigar ${item.nombre} paso a paso`,
        resumen: `Para llevar ${item.nombre} desde ${fmtNum(item.valor, item.unidad)} hasta su meta (${item.sentido === 'menor_mejor' ? '< ' : '≥ '}${fmtNum(item.meta, item.unidad)}), te propongo atacar la causa raíz en dos semanas:`,
        secciones: [
          { encabezado: 'Por qué suele trabarse', items: [CAUSAS_POR_INDICADOR[item.id]] },
          { encabezado: 'Hoja de ruta práctica', items: MITIGACION_DETALLADA[item.id] },
        ],
        acciones15Dias: [
          `Nombrar a una persona dueña del ajuste de ${item.nombre} esta misma semana.`,
          'Medir un control rápido a los 7 días antes del siguiente corte formal.',
        ],
        sugerencias: ['¿Cómo lo hablo con el equipo?', 'Cruzar A1 con Etapa T', '¿Qué va bien para celebrar?'],
      };
    }
  }

  // Si estamos en A2 o veníamos hablando de la curva A2
  if (temaPrevio?.tipo === 'a2' || (pasoActual === 'A2' && temaPrevio?.tipo !== 'a1')) {
    const fuente = ctx.a2Equipo;
    if (fuente.totalRespuestas > 0) {
      const p4 = opcionGanadora(fuente.preguntas[3], 3);
      const p10 = opcionGanadora(fuente.preguntas[9], 9);
      const p12 = opcionGanadora(fuente.preguntas[11], 11);
      const pasos = [];
      if (p10) pasos.push(`Foco #1 (P10 · ${p10.porcentaje} %): ${ACCION_POR_PRIORIDAD[p10.letra]}`);
      if (p12) pasos.push(`Apoyo pedido (P12 · ${p12.porcentaje} %): ${ACCION_POR_PRIORIDAD[p12.letra]}`);
      if (p4 && p4.letra !== 'a') {
        pasos.push(`Destrabar dificultad de transición (P4): hacer práctica guiada específicamente sobre «${p4.texto.toLowerCase()}».`);
      }
      return {
        titulo: 'Cómo mitigar la fricción del Mapa del Colaborador',
        resumen: 'Para subir la curva emocional y evitar recaídas, ataca directamente lo que el equipo priorizó en la encuesta A2:',
        secciones: [
          {
            encabezado: 'Plan táctico en 2 semanas',
            items: [
              'Semana 1: comparte la curva con el equipo sin señalar personas, valida la fricción sentida durante el cambio y confirma qué ajuste van a probar primero.',
              'Semana 2: ejecuta el ajuste priorizado en el puesto de trabajo y recoge un pulso rápido para confirmar si bajó la fricción.',
            ],
          },
        ],
        acciones15Dias: pasos.slice(0, 3),
        sugerencias: ['¿Cómo lo hablo con el equipo?', 'Diagnóstico A1 y plan a 15 días', 'Cruzar A1 con Etapa T'],
      };
    }
  }

  // Mitigación específica sobre las alertas reales de A1 (rojas y amarillas)
  const a1 = ctx.a1;
  if (!a1) return generarDiagnosticoA1(ctx);

  const focos = [...a1.intervenir, ...a1.atencion];
  if (focos.length === 0) {
    return {
      titulo: 'Cómo sostener el buen resultado (todo en verde)',
      resumen: `¡Buenas noticias! En ${a1.periodo} no tienes alertas rojas ni amarillas. Ahora el enfoque es blindar la sostenibilidad para no retroceder:`,
      secciones: [
        {
          encabezado: 'Cómo prevenir recaídas',
          items: [
            'Retira por completo plantillas o accesos del método antiguo si todavía existe alguno activo.',
            'Mantén auditorías breves mensuales y reconoce en T4 a los equipos que ya enseñan a otros (Nivel 4 Referente).',
          ],
        },
      ],
      acciones15Dias: ['Documentar las buenas prácticas del equipo y compartirlas con otras áreas.'],
      sugerencias: ['¿Cómo vamos frente a antes?', 'Interpretar curva A2 y prioridades'],
    };
  }

  const secciones = focos.slice(0, 2).map((ind) => ({
    encabezado: `Mitigación para ${ind.nombre} (${fmtNum(ind.valor, ind.unidad)} vs. meta ${ind.sentido === 'menor_mejor' ? '< ' : '≥ '}${fmtNum(ind.meta, ind.unidad)})`,
    items: MITIGACION_DETALLADA[ind.id],
  }));

  return {
    titulo: `Plan de mitigación puntual (${a1.periodo})`,
    resumen: `Para bajar el riesgo rápido sin saturar al equipo, enfócate solo en ${focos.map((f) => f.nombre).join(' y ')} durante las próximas dos semanas:`,
    secciones,
    acciones15Dias: [
      `Atacar primero ${focos[0].nombre}: ${ACCIONES_POR_INDICADOR[focos[0].id]}`,
      focos[1] ? `En paralelo sobre ${focos[1].nombre}: ${ACCIONES_POR_INDICADOR[focos[1].id]}` : 'Definir un control intermedio a los 7 días para validar que la tendencia cambie.',
      'Cerrar los 15 días con una nueva medición en A1 y comparar el delta frente a este corte.',
    ],
    sugerencias: ['¿Por qué están pasando estos desvíos?', '¿Cómo lo hablo con el equipo?', 'Cruzar A1 con Etapa T'],
  };
}

/** Explica las causas probables detrás de los desvíos actuales. */
function responderCausas(ctx) {
  const a1 = ctx.a1;
  const focos = a1 ? [...a1.intervenir, ...a1.atencion] : [];
  const items = focos.map((f) => `${f.nombre} (${fmtNum(f.valor, f.unidad)}): ${CAUSAS_POR_INDICADOR[f.id]}`);

  if (ctx.a2Equipo.totalRespuestas > 0) {
    const p4 = opcionGanadora(ctx.a2Equipo.preguntas[3], 3);
    if (p4 && p4.letra !== 'a') {
      items.push(`Señal desde A2: el ${p4.porcentaje} % indicó que lo más difícil fue «${p4.texto.toLowerCase()}».`);
    }
  }
  if (ctx.esLider && ctx.t.balancesT4.length > 0) {
    items.push(`Dificultad registrada en Balance T4 (Ciclo ${ctx.t.balancesT4[0].ciclo}): ${ctx.t.balancesT4[0].dificultades}`);
  }

  return {
    titulo: 'Por qué pueden estar apareciendo estos desvíos',
    resumen: items.length
      ? 'Al revisar tus indicadores junto con el pulso del equipo, estas son las causas más probables detrás de las alertas:'
      : 'No hay alertas activas en este momento; el comportamiento del cambio viene estable.',
    secciones: items.length ? [{ encabezado: 'Posibles causas raíz', items }] : [],
    acciones15Dias: focos.length
      ? [`Validar en 15 minutos con los líderes de área cuál de estas causas pesa más en ${focos[0].nombre} y atacarla primero.`]
      : ['Seguir monitoreando en el próximo corte para anticipar cualquier desvío temprano.'],
    sugerencias: ['¿Cómo mitigo esto paso a paso?', '¿Cómo lo hablo con el equipo?', 'Cruzar A1 con Etapa T'],
  };
}

/** Propone un guion amigable para conversar los resultados con el equipo. */
function responderComoHablarEquipo(ctx) {
  const logros = ctx.a1?.enMeta.slice(0, 3).map((i) => i.nombre).join(', ') || 'el avance en la nueva forma de trabajo';
  const foco = ctx.a1?.intervenir[0] ?? ctx.a1?.atencion[0] ?? null;
  const p10 = ctx.a2Equipo.totalRespuestas > 0 ? opcionGanadora(ctx.a2Equipo.preguntas[9], 9) : null;

  return {
    titulo: 'Guion breve para conversar esto con el equipo (5 min)',
    resumen: 'La clave en la Etapa A es mostrar los datos sin tono de regaño: primero reconocer lo ganado y luego acordar un solo ajuste concreto.',
    secciones: [
      {
        encabezado: 'Estructura sugerida para tu reunión',
        items: [
          `1. Reconoce lo que sí funciona: «Gracias al esfuerzo del equipo ya cumplimos metas clave como ${logros}.»`,
          foco
            ? `2. Abre el foco sin culpar: «Hoy vemos oportunidad de mejorar en ${foco.nombre} (${fmtNum(foco.valor, foco.unidad)} vs. meta ${foco.sentido === 'menor_mejor' ? '< ' : '≥ '}${fmtNum(foco.meta, foco.unidad)}). ¿Qué obstáculo puntual les está incomodando ahí?»`
            : '2. Pregunta abierta: «¿Qué parte del proceso nuevo todavía se siente pesada o lenta en días pico?»',
          p10
            ? `3. Cierra un compromiso visible: «Escuchamos que priorizaron «${p10.texto.toLowerCase()}»; en los próximos 15 días vamos a resolver eso y revisamos juntos cómo nos fue.»`
            : '3. Cierra un compromiso visible: acuerden un único ajuste para probar durante los próximos 15 días.',
        ],
      },
    ],
    acciones15Dias: ['Anotar el acuerdo del equipo en las observaciones de la siguiente auditoría de A1 para dar trazabilidad.'],
    sugerencias: ['¿Cómo mitigo esto paso a paso?', '¿Cómo vamos frente a antes?', 'Interpretar curva A2 y prioridades'],
  };
}

/** Cuenta la evolución histórica entre auditorías en tono narrativo. */
function responderEvolucion(ctx) {
  const a1 = ctx.a1;
  if (!a1) return generarDiagnosticoA1(ctx);
  if (a1.totalAuditorias < 2) {
    return {
      titulo: 'Evolución entre auditorías',
      resumen: `Por ahora solo hay una auditoría registrada (${a1.periodo}, con ${a1.cumplimiento ?? 0} % de cumplimiento). Cuando registres la segunda medición, aquí te mostraré qué subió, qué bajó y cómo avanza la curva.`,
      secciones: [],
      acciones15Dias: ['Registrar el siguiente hito de auditoría para activar la curva histórica y los deltas de comparación.'],
      sugerencias: ['Diagnóstico A1 y plan a 15 días', '¿Qué va bien para celebrar?'],
    };
  }

  const mejoraron = a1.items.filter((i) => i.mejoro).map((i) => `${i.nombre} (${i.delta > 0 ? '+' : ''}${fmtNum(i.delta, i.unidad)})`);
  const bajaron = a1.items.filter((i) => i.empeoro).map((i) => `${i.nombre} (${i.delta > 0 ? '+' : ''}${fmtNum(i.delta, i.unidad)})`);
  const salto = a1.cumplimientoInicial !== null && a1.cumplimiento !== null ? a1.cumplimiento - a1.cumplimientoInicial : null;

  return {
    titulo: `Cómo ha evolucionado tu equipo (${a1.periodoInicial} → ${a1.periodo})`,
    resumen:
      salto !== null && salto > 0
        ? `¡Excelente progreso! El cumplimiento pasó de ${a1.cumplimientoInicial} % en ${a1.periodoInicial} a ${a1.cumplimiento} % en ${a1.periodo} (+${salto} puntos en ${a1.totalAuditorias} mediciones).`
        : `Llevas ${a1.totalAuditorias} auditorías registradas; el cumplimiento actual en ${a1.periodo} es del ${a1.cumplimiento ?? 0} % (frente a ${a1.cumplimientoPrevio ?? 0} % en ${a1.periodoPrevio}).`,
    secciones: [
      ...(mejoraron.length ? [{ encabezado: `Lo que mejoró frente a ${a1.periodoPrevio}`, items: [mejoraron.join(' · ')] }] : []),
      ...(bajaron.length ? [{ encabezado: `Lo que retrocedió frente a ${a1.periodoPrevio}`, items: [bajaron.join(' · ')] }] : []),
    ],
    acciones15Dias:
      a1.intervenir.length || a1.atencion.length
        ? [`Mantener el impulso y cerrar los últimos pendientes: ${[...a1.intervenir, ...a1.atencion].map((i) => i.nombre).join(' y ')}.`]
        : ['Sostener esta tendencia en el próximo corte y preparar la consolidación final del cambio.'],
    sugerencias: ['¿Cómo mitigo los pendientes?', 'Cruzar A1 con Etapa T', 'Interpretar curva A2 y prioridades'],
  };
}

/** Destaca las fortalezas y logros actuales para motivar al equipo. */
function responderFortalezas(ctx) {
  const items = [];
  if (ctx.a1?.enMeta.length) {
    items.push(
      `En A1 (${ctx.a1.periodo}) hay ${ctx.a1.enMeta.length} indicadores en meta: ${ctx.a1.enMeta.map((i) => `${i.nombre} (${fmtNum(i.valor, i.unidad)})`).join(', ')}.`,
    );
  }
  if (ctx.a2Equipo.totalRespuestas > 0) {
    const topFase = [...ctx.a2Equipo.fases].filter((f) => f.promedio !== null).sort((a, b) => b.promedio - a.promedio)[0];
    if (topFase) {
      items.push(`En el Mapa del Colaborador, el momento mejor valorado es «${NOMBRES_FASE[topFase.id]}» (${topFase.porcentaje} %).`);
    }
    const p11 = opcionGanadora(ctx.a2Equipo.preguntas[10], 10);
    if (p11) items.push(`El equipo pide mantener: «${p11.texto}» (${p11.porcentaje} %).`);
  }
  if (ctx.t.meritosT4.publicados > 0) {
    items.push(`Ya tienes ${ctx.t.meritosT4.publicados} victoria(s) temprana(s) publicada(s) en T4 reforzando el ánimo del equipo.`);
  }

  return {
    titulo: 'Lo que va muy bien y vale la pena celebrar',
    resumen: items.length
      ? 'Reconocer lo ganado es clave para sostener el cambio sin desgaste. Estos son tus puntos más fuertes hoy:'
      : 'Aún estamos reuniendo los primeros datos de Etapa A; en cuanto registres auditorías o encuestas te destacaré los logros.',
    secciones: items.length ? [{ encabezado: 'Fortalezas confirmadas con datos', items }] : [],
    acciones15Dias: ['Compartir estos logros en la próxima reunión corta del equipo y registrar nuevos méritos en T4 si superan 24 puntos.'],
    sugerencias: ['¿Cómo lo hablo con el equipo?', '¿Cómo mitigo los pendientes?', '¿Cómo vamos frente a antes?'],
  };
}

/** Detecta intención en preguntas libres en español con soporte de seguimiento conversacional. */
export function detectarIntencionA(mensaje = '', pasoActual = null, historial = []) {
  const t = normalizar(mensaje);
  const temaPrevio = temaDeHistorial(historial);

  // Saludos, agradecimientos y preguntas sobre el asistente
  if (/^(hola|buenas|buen dia|buenos dias|buenas tardes|buenas noches|hey|que tal)\b/.test(t) && t.length < 45) {
    return { accion: 'saludo', temaPrevio };
  }
  if (/\b(gracias|muchas gracias|mil gracias|super|excelente|perfecto|genial|listo)\b/.test(t) && t.length < 40) {
    return { accion: 'gracias', temaPrevio };
  }
  if (/quien eres|que puedes hacer|como me ayudas|en que me ayudas/.test(t)) {
    return { accion: 'saludo', temaPrevio };
  }

  // Indicadores específicos de A1
  const mapaIndicadores = [
    ['autonomia', /\bautonom/],
    ['uso_sostenido', /uso sostenido|uso nuevo/],
    ['regreso_anterior', /regreso|anterior|antiguo|papel|planilla/],
    ['traspaso', /\btraspaso|\bacta/],
    ['participacion', /\bparticipaci/],
    ['comunicacion', /\bcomunicaci/],
    ['apropiacion', /\bapropiaci/],
    ['recaidas', /\brecaid/],
  ];
  for (const [id, regex] of mapaIndicadores) {
    if (regex.test(t) && !/cruce|cruzar|etapa t|balance/.test(t)) {
      if (/mitig|solucion|resolver|bajar|subir|mejorar|corregir|arreglar|hacer|paso/.test(t)) {
        return { accion: 'mitigar', temaPrevio: { tipo: 'indicador', indicador: id } };
      }
      return { accion: 'indicador_a1', indicador: id, temaPrevio };
    }
  }

  // Reglas metodológicas
  if (/regla.*15|como funciona.*semaforo|explica.*semaforo|que significa.*15/.test(t)) return { accion: 'explicar_semaforo', temaPrevio };
  if (/carita|2[.,]5|1[.,]8|como se calcula.*(viaje|carita)|escala.*a2/.test(t)) return { accion: 'explicar_caritas', temaPrevio };

  // Intenciones conversacionales flexibles (mitigación, causas, guion, evolución, logros)
  if (/mitig|solucion|resolver|corregir|arreglar|reducir|que hago|que puedo hacer|como hago|paso a paso|por donde empiezo|pendiente/.test(t)) {
    return { accion: 'mitigar', temaPrevio };
  }
  if (/por que|porque|causa|motivo|origen|razon/.test(t)) {
    return { accion: 'causas', temaPrevio };
  }
  if (/hablo|hablar|reunion|decirle|guion|conversar|comunicarlo|equipo|resistencia/.test(t)) {
    return { accion: 'hablar_equipo', temaPrevio };
  }
  if (/evolucion|progreso|comparar|frente a antes|tendencia|como vamos|historial|mejoro|empeoro|cambio respecto/.test(t)) {
    return { accion: 'evolucion', temaPrevio };
  }
  if (/va bien|fortalez|logro|celebrar|positivo|fuerte|victoria|merito/.test(t)) {
    return { accion: 'fortalezas', temaPrevio };
  }

  // Ideas 2, 4 y 1
  if (/cruzar|cruce|etapa t|termometro|escalera|balance|t1|t2|t3|t4|conviccion/.test(t)) return { accion: 'cruce_a1_t', temaPrevio };
  if (/curva|viaje|colaborador|friccion|prioridad|emocion|a2|encuesta/.test(t)) return { accion: 'curva_a2', temaPrevio };
  if (/semaforo|rojo|amarillo|rescate|indicador|auditoria|tablero|a1|diagnostico/.test(t)) return { accion: 'diagnostico_a1', temaPrevio };

  // Fallback amigable con conciencia del paso actual y sin repetir ciegamente
  if (temaPrevio?.tipo === 'a1' || temaPrevio?.tipo === 'indicador') return { accion: 'mitigar', temaPrevio };
  if (pasoActual === 'A2') return { accion: 'curva_a2', temaPrevio };
  return { accion: 'ayuda_abierta', temaPrevio };
}

/** Motor analítico local conversacional (siempre disponible, sin API key y 100 % determinista). */
export function responderLocalEtapaA(ctx, { accion = 'libre', mensaje = '', pasoActual = null, historial = [] } = {}) {
  let resolucion = { accion, indicador: null, temaPrevio: temaDeHistorial(historial) };
  if (accion === 'libre') {
    resolucion = detectarIntencionA(mensaje, pasoActual, historial);
  }

  if (resolucion.accion === 'saludo') return { ...responderSaludo(ctx), motor: 'local', esRecomendacion: true };
  if (resolucion.accion === 'gracias') return { ...responderGracias(), motor: 'local', esRecomendacion: true };
  if (resolucion.accion === 'mitigar') return { ...responderMitigacion(ctx, resolucion.temaPrevio, pasoActual), motor: 'local', esRecomendacion: true };
  if (resolucion.accion === 'causas') return { ...responderCausas(ctx), motor: 'local', esRecomendacion: true };
  if (resolucion.accion === 'hablar_equipo') return { ...responderComoHablarEquipo(ctx), motor: 'local', esRecomendacion: true };
  if (resolucion.accion === 'evolucion') return { ...responderEvolucion(ctx), motor: 'local', esRecomendacion: true };
  if (resolucion.accion === 'fortalezas') return { ...responderFortalezas(ctx), motor: 'local', esRecomendacion: true };

  if (resolucion.accion === 'ayuda_abierta') {
    return {
      titulo: 'Con gusto te ayudo a aterrizar esa duda',
      resumen: `Sobre «${mensaje}», recuerda que estoy enfocado en la Etapa A (Tablero A1, cruce con Etapa T y Mapa del Colaborador A2). Puedes preguntarme de forma directa por cualquier indicador, cómo mitigar una alerta, por qué ocurre o cómo conversarlo con tu equipo.`,
      secciones: [],
      acciones15Dias: [],
      sugerencias: ctx.esLider
        ? ['¿Cómo mitigo las alertas actuales?', '¿Cómo vamos frente a antes?', '¿Cómo lo hablo con el equipo?']
        : ['Interpretar curva A2 y prioridades', '¿Cómo vamos en A1?', '¿Qué va bien para celebrar?'],
      motor: 'local',
      esRecomendacion: true,
    };
  }

  if (resolucion.accion === 'explicar_semaforo') {
    return {
      titulo: 'Regla del semáforo en A1 (margen del 15 %)',
      resumen: 'Cada uno de los 8 indicadores del Tablero del equipo se evalúa frente a su meta con un margen relativo del 15 %.',
      secciones: [
        {
          encabezado: 'Cómo leer los tres colores',
          items: [
            'Verde (En meta): cumple o supera la meta (en Regreso a lo anterior, mantenerse en 5 % o menos).',
            'Amarillo (Atención): está a menos de un 15 % de alcanzarla — pide seguimiento preventivo.',
            'Rojo (Intervenir): desviación mayor al 15 % — requiere intervención y acompañamiento inmediato.',
          ],
        },
      ],
      acciones15Dias: [],
      sugerencias: ['Diagnóstico A1 y plan a 15 días', '¿Cómo mitigo las alertas actuales?'],
      motor: 'local',
      esRecomendacion: true,
    };
  }

  if (resolucion.accion === 'explicar_caritas') {
    return {
      titulo: 'Escala y caritas del Mapa del Colaborador (A2)',
      resumen: 'Cada una de las 12 preguntas vale A = 3 puntos, B = 2 puntos y C = 1 punto; cada fase promedia sus 3 preguntas.',
      secciones: [
        {
          encabezado: 'Umbrales visuales de la curva',
          items: [
            'Promotor (A) · 2,50 a 3,00: carita feliz verde — fase superada con éxito.',
            'En adaptación (B) · 1,80 a 2,49: carita neutra amarilla — fricción manejable que pide refuerzo leve.',
            'Riesgo (C) · 1,00 a 1,79: carita preocupada roja — punto crítico de bloqueo o riesgo de retorno al método antiguo.',
          ],
        },
      ],
      acciones15Dias: [],
      sugerencias: ['Interpretar curva A2 y prioridades', '¿Cómo mitigo la fricción en A2?'],
      motor: 'local',
      esRecomendacion: true,
    };
  }

  let base;
  if (resolucion.accion === 'cruce_a1_t') base = generarCruceA1yT(ctx);
  else if (resolucion.accion === 'curva_a2') base = generarAnalisisCurvaA2(ctx);
  else if (resolucion.accion === 'indicador_a1') base = generarDiagnosticoA1(ctx, resolucion.indicador);
  else base = generarDiagnosticoA1(ctx);

  return { ...base, motor: 'local', esRecomendacion: true };
}

/**
 * Contexto estrictamente numérico y anonimizado para modelos públicos (Ley 1581).
 * Nunca incluye nombres de personas ni textos abiertos escritos por colaboradores.
 */
function contextoPublicoSeguro(ctx) {
  return {
    rol: ctx.rol,
    a1: ctx.a1
      ? {
          periodo: ctx.a1.periodo,
          cumplimiento: ctx.a1.cumplimiento,
          conteos: ctx.a1.conteos,
          indicadores: ctx.a1.items.map(({ nombre, valor, meta, unidad, estado, delta }) => ({
            nombre,
            valor,
            meta,
            unidad,
            estado,
            delta,
          })),
        }
      : null,
    a2: {
      totalRespuestas: ctx.a2Equipo.totalRespuestas,
      promedioGeneral: ctx.a2Equipo.promedioGeneral,
      porcentajeGeneral: ctx.a2Equipo.porcentajeGeneral,
      fases: ctx.a2Equipo.fases.map(({ id, promedio: prom, porcentaje, carita }) => ({ id, promedio: prom, porcentaje, carita })),
      prioridades: [3, 4, 5, 9, 10, 11].map((idx) => opcionGanadora(ctx.a2Equipo.preguntas[idx], idx)).filter(Boolean),
    },
    etapaT: ctx.esLider
      ? {
          pulsoT1: ctx.t.pulsoT1,
          simuladorT2: ctx.t.simuladorT2,
          acuerdoT3: ctx.t.acuerdoT3,
          termometroT3: ctx.t.termometroT3,
          meritosT4: ctx.t.meritosT4,
        }
      : null,
  };
}

const INSTRUCCIONES_GEM_ETAPA_A = `Eres el Asistente amigable y práctico de la Etapa A (Analizar) de la Metodología RUTA ANDI de gestión del cambio organizacional.
Tu alcance es la Etapa A:
1) A1 Auditorías de adopción (Tablero del equipo con 8 indicadores y semáforo con margen del 15 %: verde cumple, amarillo <15 %, rojo >15 %).
2) Lectura cruzada entre A1 y los insumos de Etapa T (Pulso T1, Simulador T2, Escalera y Termómetro T3, Méritos T4).
3) A2 Mapa de viaje del colaborador (4 momentos: Antes, Durante, Situación actual, Hacia dónde mejorar; escala A=3, B=2, C=1; caritas: >=2.50 feliz, 1.80-2.49 neutra, <1.80 preocupada).

Reglas obligatorias:
- Responde en español cercano, claro, conversacional y directo a lo que preguntó la persona (sin repetir resúmenes completos si pidió algo puntual).
- Usa las cifras reales del JSON adjunto y no inventes datos.
- Recuerda que recomiendas acciones concretas, pero la decisión final es del equipo.
- Responde EXCLUSIVAMENTE con un objeto JSON válido con la forma:
{
  "titulo": "string breve y amigable",
  "resumen": "1 a 2 frases conversacionales respondiendo directo a la pregunta",
  "secciones": [{ "encabezado": "string", "items": ["string"] }],
  "acciones15Dias": ["hasta 3 acciones concretas (puede ser [] si fue un saludo o duda conceptual)"],
  "sugerencias": ["2 a 3 preguntas breves de seguimiento"]
}`;

/**
 * Llama opcionalmente a Gemini REST API con fetch nativo de Node (0 dependencias).
 * Prueba una cadena de modelos rápidos y, si no hay GEMINI_API_KEY o todos fallan,
 * devuelve null para usar el motor analítico local.
 */
async function consultarGemini(ctx, { accion, mensaje, pasoActual, historial = [] }) {
  const clave = leerVariableEntorno('GEMINI_API_KEY');
  if (!clave) return null;

  const preferido = leerVariableEntorno('GEMINI_MODEL') || 'gemini-3.5-flash-lite';
  const modelos = [...new Set([preferido, 'gemini-3.5-flash-lite', 'gemini-flash-lite-latest', 'gemini-3.8-flash'])];

  const pedidoAccion =
    accion === 'diagnostico_a1'
      ? 'Genera el diagnóstico de semáforos A1 y un plan de rescate concreto a 15 días.'
      : accion === 'cruce_a1_t'
        ? 'Realiza una lectura cruzada entre el tablero A1 y los insumos de la Etapa T detectando riesgos ocultos.'
        : accion === 'curva_a2'
          ? 'Interpreta la curva emocional del Mapa del Colaborador (A2), el punto de mayor fricción y las prioridades de mejora.'
          : mensaje || 'Resume el estado de la Etapa A y qué conviene priorizar primero.';

  const historialCorto = Array.isArray(historial)
    ? historial.slice(-4).map((h) => `${h.autor === 'usuario' ? 'Usuario' : 'Asistente'}: ${String(h.texto ?? '').slice(0, 260)}`).join('\n')
    : '';

  const promptUsuario = [
    `Paso actual en pantalla: ${pasoActual ?? 'Índice Etapa A'}`,
    `Solicitud: ${pedidoAccion}`,
    historialCorto ? `Conversación previa:\n${historialCorto}` : '',
    `Datos agregados y anonimizados actuales:\n${JSON.stringify(contextoPublicoSeguro(ctx))}`,
  ]
    .filter(Boolean)
    .join('\n\n');

  const cuerpoPeticion = JSON.stringify({
    systemInstruction: { parts: [{ text: INSTRUCCIONES_GEM_ETAPA_A }] },
    contents: [{ role: 'user', parts: [{ text: promptUsuario }] }],
    generationConfig: {
      temperature: 0.45,
      responseMimeType: 'application/json',
    },
  });

  for (const modelo of modelos) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(modelo)}:generateContent?key=${encodeURIComponent(clave)}`;
    const controlador = new AbortController();
    const temporizador = setTimeout(() => controlador.abort(), 10_000);
    try {
      const resp = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controlador.signal,
        body: cuerpoPeticion,
      });
      if (!resp.ok) continue;
      const data = await resp.json();
      const partes = data?.candidates?.[0]?.content?.parts ?? [];
      const texto = partes
        .filter((p) => !p?.thought && typeof p?.text === 'string')
        .map((p) => p.text)
        .join('')
        .trim();
      if (!texto) continue;
      const limpioJson = texto.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
      const parsed = JSON.parse(limpioJson);
      if (typeof parsed?.titulo !== 'string' || typeof parsed?.resumen !== 'string') continue;
      return {
        titulo: parsed.titulo.slice(0, 120),
        resumen: parsed.resumen.slice(0, 450),
        secciones: Array.isArray(parsed.secciones)
          ? parsed.secciones.slice(0, 4).map((s) => ({
              encabezado: String(s?.encabezado ?? '').slice(0, 100),
              items: Array.isArray(s?.items) ? s.items.slice(0, 5).map((x) => String(x).slice(0, 320)) : [],
            }))
          : [],
        acciones15Dias: Array.isArray(parsed.acciones15Dias) ? parsed.acciones15Dias.slice(0, 4).map((x) => String(x).slice(0, 280)) : [],
        sugerencias: Array.isArray(parsed.sugerencias) ? parsed.sugerencias.slice(0, 3).map((x) => String(x).slice(0, 80)) : [],
        motor: 'gemini',
        esRecomendacion: true,
      };
    } catch {
      continue;
    } finally {
      clearTimeout(temporizador);
    }
  }
  return null;
}

/**
 * Rutas HTTP del Asistente de Etapa A (Ideas 1, 2 y 4).
 * Modo híbrido: usa Gemini API si hay GEMINI_API_KEY y hace fallback transparente al motor local.
 */
export function rutasAsistenteA({ db, sesionDe, enviar, leerJson }) {
  const exigirSesion = (req, res) => {
    const u = sesionDe(req);
    if (!u) enviar(res, 401, { error: 'Inicia sesión.' });
    return u;
  };

  return {
    'GET /api/etapa-a/asistente/estado': async (req, res) => {
      const u = exigirSesion(req, res);
      if (!u) return;
      const ctx = construirContextoEtapaA(db, u);
      const alertasRojas = ctx.a1?.conteos.intervenir ?? 0;
      const alertasAmarillas = ctx.a1?.conteos.atencion ?? 0;
      enviar(res, 200, {
        disponible: true,
        modo: leerVariableEntorno('GEMINI_API_KEY') ? 'gemini' : 'local',
        rol: u.rol,
        alertas: { rojas: alertasRojas, amarillas: alertasAmarillas },
      });
    },

    'POST /api/etapa-a/asistente': async (req, res) => {
      const u = exigirSesion(req, res);
      if (!u) return;
      const cuerpo = await leerJson(req);
      const accion = ['diagnostico_a1', 'cruce_a1_t', 'curva_a2', 'libre'].includes(cuerpo?.accion) ? cuerpo.accion : 'libre';
      const mensaje = typeof cuerpo?.mensaje === 'string' ? cuerpo.mensaje.trim().slice(0, 400) : '';
      const pasoActual = cuerpo?.pasoActual === 'A1' || cuerpo?.pasoActual === 'A2' ? cuerpo.pasoActual : null;
      const periodoViaje = typeof cuerpo?.periodoViaje === 'string' ? cuerpo.periodoViaje.trim().slice(0, 60) : 'todos';
      const historial = Array.isArray(cuerpo?.historial) ? cuerpo.historial : [];

      if (accion === 'libre' && !mensaje) {
        return enviar(res, 400, { error: 'Escribe una pregunta o elige una consulta rápida.' });
      }

      const ctx = construirContextoEtapaA(db, u, periodoViaje);

      // Si un empleado pide el cruce exclusivo de líder, el motor local controla el acceso directamente.
      if (accion === 'cruce_a1_t' && !ctx.esLider) {
        return enviar(res, 200, responderLocalEtapaA(ctx, { accion, mensaje, pasoActual, historial }));
      }

      const respuestaGemini = await consultarGemini(ctx, { accion, mensaje, pasoActual, historial });
      if (respuestaGemini) return enviar(res, 200, respuestaGemini);

      enviar(res, 200, responderLocalEtapaA(ctx, { accion, mensaje, pasoActual, historial }));
    },
  };
}
