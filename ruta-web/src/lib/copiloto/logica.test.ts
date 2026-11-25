import { describe, expect, it } from 'vitest';
import { REGLAS } from '../../config/reglas';
import { DATOS_VACIOS, LIENZO_VACIO, TRIAJE_VACIO, type Proyecto } from '../modelo/proyecto';
import { aplicarAjustesTriaje, aplicarLienzo, aplicarRiesgos, aplicarTriaje, armarDossier, claveAjuste, filasDesdeCopiloto, filasParaCopiloto, revisarSensatez } from './logica';
import type { InformeBuzon, PropuestaLienzo, PropuestaTriaje } from './tipos';

const AREAS = [
  { area: 'Bodega', afectados: 25 },
  { area: 'Producción', afectados: 40 },
];

const fila = (area: string, grupo = 'Operativo') => ({ id: 'x', fecha: '2026-11-20', area, grupo, p1: 'a', p2: '', p3: '' });

describe('tabla del copiloto ↔ R5', () => {
  it('convierte en ambos sentidos y normaliza área y grupo', () => {
    const { filas, areasFaltantes } = filasDesdeCopiloto([fila('produccion', 'líder de área')], AREAS);
    expect(areasFaltantes).toEqual([]);
    expect(filas[0]).toMatchObject({ area: 'Producción', grupo: 'Líder de área', falla: 'a' });
    expect(filasParaCopiloto(filas)[0]).toMatchObject({ area: 'Producción', grupo: 'Líder de área', p1: 'a' });
  });

  it('no carga nada si falta un área, y un grupo desconocido queda "Sin grupo"', () => {
    expect(filasDesdeCopiloto([fila('Bodega'), fila('Ventas')], AREAS)).toEqual({ filas: [], areasFaltantes: ['Ventas'] });
    expect(filasDesdeCopiloto([fila('Bodega', 'Gerente')], AREAS).filas[0]?.grupo).toBe('Sin grupo');
  });
});

const fichaVacia: PropuestaLienzo = {
  urgencia: [],
  afectados: '',
  vision: '',
  que_cambia: '',
  que_no_cambia: '',
  beneficios: [],
  criterios: [],
  riesgos: [],
  intentos_previos: [],
  estados: { urgencia: 'por_completar', afectados: 'por_completar', vision: 'por_completar', cambios: 'por_completar', beneficios: 'por_completar', criterios: 'por_completar', riesgos: 'por_completar' },
};

describe('Pasar a R1', () => {
  it('solo reemplaza lo que la ficha trae lleno y dice qué cambia', () => {
    const actual = { ...LIENZO_VACIO, vision: 'Visión de antes', afectados: 'Bodega, 25 personas' };
    const { lienzo, cambios } = aplicarLienzo(actual, { ...fichaVacia, vision: 'Cada auxiliar alista con el lector', riesgos: ['Miedo a despidos', ''] });
    expect(lienzo.vision).toBe('Cada auxiliar alista con el lector');
    expect(lienzo.afectados).toBe('Bodega, 25 personas');
    expect(lienzo.riesgos).toEqual(['Miedo a despidos']);
    expect(cambios.map((c) => c.campo)).toEqual(['Visión', 'Riesgos']);
  });
});

const criterio = (puntaje: 1 | 2 | 3) => ({ puntaje, justificacion: 'j', fuente: 'f', cambiaria: 'c' });
const propuesta: PropuestaTriaje = {
  impacto_personas: criterio(2),
  complejidad: { elementos: ['sistemas', 'habilidades', 'sistemas'], justificacion: '', fuente: '', cambiaria: '' },
  riesgo_operativo: criterio(3),
  alcance: 'departamento',
  por_que_ahora: 'Inventario descuadrado',
  poblacion_afectada: '',
  dimension_tecnica: '',
};

describe('Pasar a R2 y verificación de sensatez', () => {
  it('lleva los puntajes y los elementos sin repetir; la suma la hace evaluarTriaje', () => {
    const t = aplicarTriaje({ ...TRIAJE_VACIO, poblacion_afectada: 'antes' }, propuesta);
    expect(t).toMatchObject({ impacto_personas: 2, riesgo_operativo: 3, elementos: ['sistemas', 'habilidades'], alcance: 'departamento', poblacion_afectada: 'antes' });
  });

  it('avisa que un verde puede ser optimista si el buzón tiene alertas fuertes', () => {
    const informe = { temas: [{ codigo: 'EMP', tema: 'Miedo a perder el empleo' }], alertas: { intensas: [{ tema: 'x', casos: 2 }], transversales: [] } } as unknown as InformeBuzon;
    expect(revisarSensatez('verde', informe)).toMatch(/optimista/);
    expect(revisarSensatez('amarillo', informe)).toBeNull();
    expect(revisarSensatez('verde', null)).toBeNull();
  });
});

describe('dossier', () => {
  it('tiene la estructura fija, muestra la suma y deja R3 y R4 como pendientes', () => {
    const proyecto = { empresa: { nombre: 'Empresa ficticia' }, segmentacion: { areas: AREAS } } as unknown as Proyecto;
    const datos = { ...DATOS_VACIOS, triaje: aplicarTriaje(TRIAJE_VACIO, propuesta) };
    const texto = armarDossier({
      proyecto,
      datos,
      reglas: REGLAS.triaje,
      partes: { resumen: 'Resumen', recomendaciones: [{ texto: 'Responder el miedo', fuente: 'Buzón' }], vocero: { perfil: 'Participativo', motivo: 'm', fuente: 'f' }, preguntas_jefes: ['¿Van a despedir?'] },
      modo: 'simulado',
      fecha: 'hoy',
    });
    for (const s of ['1. Resumen ejecutivo', '2. Ficha del cambio', '3. Triaje', '4. Voz de los colaboradores', '5. Alertas', '6. Recomendaciones', '7. Pendientes']) expect(texto).toContain(s);
    expect(texto).toContain('2 + 2 + 3 = 7');
    expect(texto).toContain('R3 (FODA del cambio) y R4 (mapa de actores)');
    expect(texto).toContain('es un borrador hasta que la persona responsable del cambio lo apruebe'.replace('es un', 'Es un'));
  });
});

describe('reparación de lo guardado por el copiloto', () => {
  it('completa propuestas y dossiers incompletos en vez de romper la página', async () => {
    const { normalizarCopiloto } = await import('./normalizar');
    const c = normalizarCopiloto({
      triaje: { propuesta: { impacto_personas: { puntaje: 7 } }, modo: 'gemini' },
      dossier: { partes: { resumen: 'x' } },
      informe: { resultado: { informe: { temas: 'no es lista' } } },
      mensajesLienzo: [{ rol: 'copiloto', texto: 'hola' }, null, { texto: '' }],
    });
    expect(c.triaje?.propuesta.impacto_personas.puntaje).toBeNull();
    expect(c.triaje?.propuesta.complejidad.elementos).toEqual([]);
    expect(c.dossier?.partes.recomendaciones).toEqual([]);
    expect(c.informe?.resultado.informe.temas).toEqual([]);
    expect(c.mensajesLienzo).toEqual([{ rol: 'copiloto', texto: 'hola' }]);
    expect(normalizarCopiloto(undefined).informe).toBeNull();
  });
});

describe('ajustes que propone el buzón', () => {
  it('agrega al lienzo solo los riesgos que no tiene', () => {
    const lienzo = { ...LIENZO_VACIO, riesgos: ['Desconfianza en la dirección'] };
    const r = aplicarRiesgos(lienzo, [
      { riesgo: 'desconfianza en la direccion', fuente: 'Buzón' },
      { riesgo: 'Miedo a perder el empleo', fuente: 'Buzón' },
    ]);
    expect(r.riesgos).toEqual(['Desconfianza en la dirección', 'Miedo a perder el empleo']);
  });

  it('cambia en el triaje solo los puntajes aceptados', () => {
    const triaje = { ...TRIAJE_VACIO, impacto_personas: 2 as const, riesgo_operativo: 2 as const };
    const r = aplicarAjustesTriaje(triaje, [{ criterio: 'riesgo_operativo', puntaje: 3, motivo: '', fuente: '' }]);
    expect(r).toMatchObject({ impacto_personas: 2, riesgo_operativo: 3 });
  });

  it('la clave de un ajuste no depende de mayúsculas ni tildes', () => {
    expect(claveAjuste({ riesgo: 'Miedo al Empleo ', fuente: 'a' })).toBe(claveAjuste({ riesgo: 'miedo al empleo', fuente: 'b' }));
  });
});
