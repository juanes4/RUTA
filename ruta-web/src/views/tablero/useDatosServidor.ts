import { useEffect, useState } from 'react';
import { PERIODOS_VIAJE } from '../../config/analizar';
import { useSesion } from '../../estado/SesionContexto';
import {
  api,
  ErrorApi,
  type CicloTermometro,
  type ConteoVotos,
  type Historial,
  type Merito,
  type RegistroPulso,
  type RespuestaTableroA,
  type ResumenViaje,
} from '../../lib/api';

/** Lo que el Tablero lee del servidor (etapas T y A). Cada parte es null si no existe o el rol no puede verla. */
export interface DatosServidor {
  cargando: boolean;
  tableroA: RespuestaTableroA | null;
  /** Mapa de viaje por periodo, en el orden de los periodos de la metodología. */
  viajes: { periodo: string; resumen: ResumenViaje }[];
  termometro: { minimo: number; ciclos: CicloTermometro[] } | null;
  votos: ConteoVotos[] | null;
  pulsos: RegistroPulso[] | null;
  historial: Historial | null;
  meritos: Merito[] | null;
}

const VACIO: DatosServidor = { cargando: true, tableroA: null, viajes: [], termometro: null, votos: null, pulsos: null, historial: null, meritos: null };

const valor = <T,>(r: PromiseSettledResult<T>): T | null => (r.status === 'fulfilled' ? r.value : null);

export function useDatosServidor(): DatosServidor {
  const { usuario, expirar } = useSesion();
  const [datos, setDatos] = useState<DatosServidor>(VACIO);
  const esLider = usuario?.rol === 'lider';

  useEffect(() => {
    if (!usuario) return;
    let vigente = true;
    (async () => {
      const [tableroA, viaje, termometro, votos, pulsos, historial, meritos] = await Promise.allSettled([
        api.tableroA(),
        api.viajeA(),
        esLider ? api.registros<{ minimo: number; ciclos: CicloTermometro[] }>('termometro') : Promise.reject(new Error('solo líderes')),
        api.registros<{ conteos: ConteoVotos[] | null }>('voto'),
        api.registros<{ registros: RegistroPulso[] }>('pulso'),
        api.historial(),
        api.registros<{ registros: Merito[] }>('merito'),
      ]);
      if ([tableroA, viaje].some((r) => r.status === 'rejected' && r.reason instanceof ErrorApi && r.reason.estado === 401)) {
        expirar();
        return;
      }
      const periodos = (valor(viaje)?.periodosDisponibles ?? [])
        .slice()
        .sort((a, b) => PERIODOS_VIAJE.indexOf(a as (typeof PERIODOS_VIAJE)[number]) - PERIODOS_VIAJE.indexOf(b as (typeof PERIODOS_VIAJE)[number]));
      const porPeriodo = await Promise.allSettled(periodos.map((p) => api.viajeA(p)));
      if (!vigente) return;
      setDatos({
        cargando: false,
        tableroA: valor(tableroA),
        viajes: porPeriodo.flatMap((r, i) => (r.status === 'fulfilled' && r.value.resumenEquipo.totalRespuestas > 0 ? [{ periodo: periodos[i] as string, resumen: r.value.resumenEquipo }] : [])),
        termometro: valor(termometro),
        votos: valor(votos)?.conteos ?? null,
        pulsos: esLider ? (valor(pulsos)?.registros ?? null) : null,
        historial: valor(historial),
        meritos: valor(meritos)?.registros ?? null,
      });
    })();
    return () => {
      vigente = false;
    };
  }, [usuario, esLider, expirar]);

  return datos;
}
