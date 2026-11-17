import { describe, expect, it } from 'vitest';
import { REGLAS } from '../../config/reglas';
import { personasEnArea } from '../calculo/pruebas/fabricas';
import { DATOS_VACIOS, type DatosProyecto, type Proyecto } from '../modelo/proyecto';
import { crearProyecto } from '../proyecto/crearProyecto';
import { construirTablero } from './construirTablero';

function proyectoCon(areas: Proyecto['segmentacion']['areas'], metas: Proyecto['metas'] = {}): Proyecto {
  const base = crearProyecto('2026-11-08T00:00:00Z', 'p');
  return { ...base, metas, segmentacion: { ...base.segmentacion, areas } };
}

const fila = (id: string) => (t: ReturnType<typeof construirTablero>) => t.indicadores.find((i) => i.meta.id === id);

describe('tablero', () => {
  it('sin datos: ningún valor inventado, cada indicador dice qué le falta', () => {
    const tablero = construirTablero(proyectoCon([]), DATOS_VACIOS, REGLAS);
    expect(tablero.indicadores.every((i) => i.valor === null && i.estado === null && i.motivo)).toBe(true);
    expect(tablero.decision.estado).toBe('datos_insuficientes');
  });

  it('participación = personas que respondieron ÷ afectados', () => {
    const datos: DatosProyecto = { ...DATOS_VACIOS, respuestas: personasEnArea('Bodega', 7) };
    const tablero = construirTablero(proyectoCon([{ area: 'Bodega', afectados: 10 }]), datos, REGLAS);
    expect(fila('participacion')(tablero)).toMatchObject({ valor: 0.7, estado: 'en_meta' });
    expect(tablero.participacion).toEqual([{ area: 'Bodega', respondentes: 7, afectados: 10, participacion: 0.7 }]);
  });

  it('utilización y uso residual salen del último ciclo, sumando grupos', () => {
    const uso = [
      { fecha: '', ciclo: 1, grupo: 'A', transacciones_nuevo: 10, transacciones_antiguo: 90, registros_con_error: 0 },
      { fecha: '', ciclo: 2, grupo: 'A', transacciones_nuevo: 40, transacciones_antiguo: 10, registros_con_error: 0 },
      { fecha: '', ciclo: 2, grupo: 'B', transacciones_nuevo: 45, transacciones_antiguo: 5, registros_con_error: 0 },
    ];
    const tablero = construirTablero(proyectoCon([]), { ...DATOS_VACIOS, uso }, REGLAS);
    expect(fila('utilizacion')(tablero)).toMatchObject({ valor: 0.85, estado: 'atencion' });
    expect(fila('uso_residual')(tablero)).toMatchObject({ valor: 0.15, estado: 'intervenir' });
  });

  it('una meta ajustada en la Etapa 0 cambia el semáforo sin tocar componentes', () => {
    const uso = [{ fecha: '', ciclo: 1, grupo: 'A', transacciones_nuevo: 85, transacciones_antiguo: 15, registros_con_error: 0 }];
    const tablero = construirTablero(proyectoCon([], { utilizacion: 0.8 }), { ...DATOS_VACIOS, uso }, REGLAS);
    expect(fila('utilizacion')(tablero)?.estado).toBe('en_meta');
  });
});
