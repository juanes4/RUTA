import { useEffect, useState } from 'react';
import { useSesion } from '../estado/SesionContexto';
import {
  api,
  ErrorApi,
  type Acuerdo,
  type BalanceCiclo,
  type CicloTermometro,
  type Merito,
  type RegistroDinamica,
  type RegistroPulso,
} from '../lib/api';
import {
  construirMetricasServidor,
  SERVIDOR_VACIO,
  type DatosBrutosServidor,
  type MetricasServidor,
} from '../lib/tablero/metricasEjecutivas';

interface EstadoServidorTablero {
  cargando: boolean;
  metricas: MetricasServidor;
}

/**
 * Carga en paralelo las métricas vivas de Etapa T y Etapa A desde SQLite.
 * Respeta permisos por rol: los empleados no consultan endpoints exclusivos de líderes.
 */
export function useDatosTableroServidor(): EstadoServidorTablero {
  const { usuario, expirar } = useSesion();
  const esLider = usuario?.rol === 'lider';
  const [estado, setEstado] = useState<EstadoServidorTablero>(() => ({
    cargando: Boolean(usuario),
    metricas: construirMetricasServidor(SERVIDOR_VACIO),
  }));

  useEffect(() => {
    if (!usuario) return;
    let vigente = true;

    const peticiones = [
      api.registros<{ registros: RegistroPulso[] }>('pulso'),
      api.historial(),
      api.registros<{ registros: Acuerdo[] }>('acuerdo'),
      esLider ? api.registros<{ minimo: number; ciclos: CicloTermometro[] }>('termometro') : Promise.resolve(null),
      esLider ? api.registros<{ registros: RegistroDinamica[] }>('dinamica') : Promise.resolve(null),
      api.registros<{ registros: Merito[] }>('merito'),
      esLider ? api.registros<{ registros: BalanceCiclo[] }>('balance') : Promise.resolve(null),
      api.tableroA(),
      api.viajeA(),
    ] as const;

    Promise.allSettled(peticiones).then((resultados) => {
      if (!vigente) return;
      const vencio = resultados.some((r) => r.status === 'rejected' && r.reason instanceof ErrorApi && r.reason.estado === 401);
      if (vencio) {
        expirar();
        return;
      }

      const valor = <T,>(r: PromiseSettledResult<T>): T | null => (r.status === 'fulfilled' ? r.value : null);

      const bruto: DatosBrutosServidor = {
        pulsos: valor(resultados[0])?.registros ?? [],
        historialT2: valor(resultados[1]),
        acuerdosT3: valor(resultados[2])?.registros ?? [],
        termometroT3: valor(resultados[3]),
        dinamicasT3: valor(resultados[4])?.registros ?? [],
        meritosT4: valor(resultados[5])?.registros ?? [],
        balancesT4: valor(resultados[6])?.registros ?? [],
        tableroA: valor(resultados[7]),
        viajeA: valor(resultados[8]),
      };

      setEstado({ cargando: false, metricas: construirMetricasServidor(bruto) });
    });

    return () => {
      vigente = false;
    };
  }, [usuario, esLider, expirar]);

  return estado;
}
