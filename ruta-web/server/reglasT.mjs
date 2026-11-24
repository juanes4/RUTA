/**
 * Reglas de la etapa T (documento de metodología). Funciones puras, sin base
 * de datos, para poder probarlas. El navegador tiene una copia de las
 * constantes en src/config/transformar.ts; si cambias una, cambia la otra.
 */

export const CRITERIOS_MRMT = [
  'cumplimiento',
  'impacto',
  'sostenibilidad',
  'adaptacion',
  'participacion',
  'compromiso',
  'equipo',
  'iniciativa',
];

export const MAX_DINAMICAS_POR_CICLO = 2;
export const MIN_GRUPO_TERMOMETRO = 5;
export const DINAMICAS = ['parejas', 'circulo', 'simulacro'];

/** Matriz de reconocimiento. */
export function clasificar(total) {
  if (total >= 32) return 'destacado';
  if (total >= 24) return 'favorable';
  return 'desarrollo';
}

const esEntero = (n, min, max) => Number.isInteger(n) && n >= min && n <= max;
const texto = (v, max, { obligatorio = true } = {}) => {
  if (typeof v !== 'string') return obligatorio ? null : '';
  const t = v.trim();
  if (obligatorio && !t) return null;
  return t.slice(0, max);
};

class ErrorDatos extends Error {}
const exigir = (valor, mensaje) => {
  if (!valor) throw new ErrorDatos(mensaje);
  return valor;
};

/** Cada validador devuelve los datos limpios o lanza ErrorDatos con un mensaje para la persona. */
export const VALIDADORES = {
  pulso(d) {
    return {
      sesion: exigir(texto(d.sesion, 80), 'Escribe el nombre de la sesión.'),
      claridad: exigir(esEntero(d.claridad, 1, 5) && d.claridad, 'Califica la claridad del mensaje.'),
      utilidad: exigir(esEntero(d.utilidad, 1, 5) && d.utilidad, 'Califica la utilidad de la información.'),
      confianza: exigir(esEntero(d.confianza, 1, 5) && d.confianza, 'Califica el formato o canal.'),
    };
  },

  voto(d) {
    exigir(esEntero(d.ciclo, 1, 12), 'Elige el ciclo.');
    exigir(['inicio', 'cierre'].includes(d.momento), 'Elige el momento.');
    exigir(esEntero(d.nivel, 1, 4), 'Elige un escalón.');
    return { ciclo: d.ciclo, momento: d.momento, nivel: d.nivel };
  },

  acuerdo(d) {
    exigir(esEntero(d.ciclo, 1, 12), 'Elige el ciclo.');
    exigir(['inicio', 'cierre'].includes(d.momento), 'Elige el momento.');
    exigir(esEntero(d.nivel, 1, 4), 'Elige el escalón acordado.');
    const meta = d.meta === null || d.meta === undefined || d.meta === '' ? null : d.meta;
    exigir(meta === null || esEntero(meta, 1, 4), 'La meta debe ser un escalón del 1 al 4.');
    return { ciclo: d.ciclo, momento: d.momento, nivel: d.nivel, meta };
  },

  termometro(d) {
    exigir(esEntero(d.ciclo, 1, 12), 'Elige el ciclo.');
    exigir(Array.isArray(d.respuestas) && d.respuestas.length === 5 && d.respuestas.every((r) => esEntero(r, 1, 5)), 'Responde las 5 afirmaciones.');
    return { ciclo: d.ciclo, respuestas: d.respuestas };
  },

  dinamica(d) {
    exigir(DINAMICAS.includes(d.dinamica), 'Elige la dinámica.');
    exigir(esEntero(d.ciclo, 1, 12), 'Elige el ciclo.');
    const hoja = {};
    for (const [k, v] of Object.entries(d.hoja ?? {}).slice(0, 30)) {
      if (!/^[a-z0-9_]{1,30}$/i.test(k)) continue;
      if (typeof v === 'string') hoja[k] = v.trim().slice(0, 1000);
      else if (Array.isArray(v)) {
        hoja[k] = v.slice(0, 10).map((f) => (f && typeof f === 'object' ? Object.fromEntries(Object.entries(f).slice(0, 4).map(([a, b]) => [a.slice(0, 20), typeof b === 'boolean' ? b : String(b ?? '').slice(0, 300)])) : {}));
      }
    }
    const lleno = (v) => (typeof v === 'string' ? v !== '' : v.some((f) => Object.values(f).some((x) => typeof x === 'string' && x !== '')));
    exigir(Object.values(hoja).some(lleno), 'Completa la hoja de trabajo antes de guardarla.');
    return { dinamica: d.dinamica, ciclo: d.ciclo, hoja };
  },

  balance(d) {
    exigir(esEntero(d.ciclo, 1, 12), 'Elige el ciclo.');
    return {
      ciclo: d.ciclo,
      meritos: exigir(texto(d.meritos, 1500), 'Escribe los méritos obtenidos.'),
      factores: exigir(texto(d.factores, 1500), 'Escribe los factores que los impulsaron.'),
      dificultades: exigir(texto(d.dificultades, 1500), 'Escribe las dificultades encontradas.'),
    };
  },

  merito(d) {
    const fimt = {
      area: exigir(texto(d.area, 120), 'Escribe la empresa o el área.'),
      fecha: exigir(texto(d.fecha, 10), 'Escribe la fecha.'),
      cambio: exigir(texto(d.cambio, 200), 'Escribe el cambio en implementación.'),
      avance: exigir(texto(d.avance, 1000), 'Cuenta qué avance se logró.'),
      participantes: exigir(texto(d.participantes, 500), 'Escribe quiénes participaron.'),
      comoAyuda: exigir(texto(d.comoAyuda, 1000), 'Explica cómo ayuda al cambio.'),
    };
    if (!d.pasaAValoracion) return { ...fimt, pasaAValoracion: false };

    const criterios = {};
    let total = 0;
    for (const c of CRITERIOS_MRMT) {
      const f = d.criterios?.[c];
      exigir(f && esEntero(f.puntaje, 1, 5), 'Califica los ocho criterios de 1 a 5.');
      const evidencia = texto(f.evidencia, 500, { obligatorio: false });
      exigir(f.puntaje < 4 || evidencia, 'Para poner 4 o 5 hay que anotar la evidencia que lo respalda.');
      criterios[c] = { puntaje: f.puntaje, evidencia };
      total += f.puntaje;
    }
    const clasificacion = clasificar(total);
    const reconocimiento = ['', 'mencion', 'certificado', 'agradecimiento'].includes(d.reconocimiento) ? d.reconocimiento : '';
    const salida = { ...fimt, pasaAValoracion: true, criterios, total, clasificacion, reconocimiento, publicar: false };

    if (d.publicar) {
      exigir(clasificacion !== 'desarrollo', 'Con menos de 24 puntos el mérito no se publica: agradece el esfuerzo y vuelve a valorarlo más adelante.');
      exigir(d.publicacion?.autorizacion === true, 'Confirma que las personas protagonistas autorizaron la publicación.');
      salida.publicar = true;
      salida.publicacion = {
        titulo: exigir(texto(d.publicacion.titulo, 80), 'Escribe el título del mérito.'),
        logramos: exigir(texto(d.publicacion.logramos, 400), 'Cuenta qué lograron (2 a 3 líneas).'),
        protagonistas: exigir(texto(d.publicacion.protagonistas, 300), 'Escribe las personas o equipos protagonistas.'),
        importancia: exigir(texto(d.publicacion.importancia, 400), 'Explica por qué es importante.'),
        mensaje: exigir(texto(d.publicacion.mensaje, 200), 'Escribe el mensaje de reconocimiento.'),
        autorizacion: true,
      };
    }
    return salida;
  },
};

export { ErrorDatos };
