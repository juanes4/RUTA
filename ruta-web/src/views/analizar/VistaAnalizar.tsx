import { useEffect, useState } from 'react';
import { IndicePasos, PasoAnteriorSiguiente, VolverAlIndice } from '../../components/etapa/IndicePasos';
import { BloquePaso, SeccionEtapa } from '../../components/etapa/SeccionEtapa';
import { DESCRIPCION_PASO_A } from '../../config/analizar';
import { tarjetaDePaso, type Etapa } from '../../config/etapas';
import { DESCRIPCION_ETAPA } from '../../contenido/pasos';
import { useSesion } from '../../estado/SesionContexto';
import { api, ErrorApi } from '../../lib/api';
import { resumirSemaforosA } from '../../lib/analizar/calculos';
import { AsistenteEtapaA } from './AsistenteEtapaA';
import { AuditoriaAdopcion } from './AuditoriaAdopcion';
import { FlujoEtapaA } from './FlujoEtapaA';
import { MapaViaje } from './MapaViaje';

interface Props {
  etapa: Etapa;
  pasoId: string | null;
}

interface ResumenIndiceA {
  a1: string;
  a2: string;
}

/**
 * Etapa A (Analizar):
 * - A1: Auditorías de adopción (Tablero del equipo con 8 indicadores y semáforo)
 * - A2: Mapa de viaje del colaborador (curva de 4 momentos, caritas y encuesta de 12 preguntas)
 */
export function VistaAnalizar({ etapa, pasoId }: Props) {
  const { usuario, expirar } = useSesion();
  const esLider = usuario?.rol === 'lider';
  const indice = etapa.pasos.findIndex((p) => p.id === pasoId);
  const paso = etapa.pasos[indice];

  const [resumen, setResumen] = useState<ResumenIndiceA>({
    a1: 'Cargando…',
    a2: 'Cargando…',
  });

  useEffect(() => {
    if (paso) return;
    let vigente = true;
    Promise.all([api.tableroA(), api.viajeA()])
      .then(([tablero, viaje]) => {
        if (!vigente) return;
        const ultima = tablero.auditorias[0];
        let textoA1 = esLider ? 'Sin auditorías aún · listo para registrar' : 'Sin auditorías registradas';
        if (ultima) {
          const r = resumirSemaforosA(ultima.valores, ultima.metas);
          textoA1 = `${ultima.periodo}: ${r.enMeta} de ${r.evaluados} en meta`;
        }
        const totalViaje = viaje.resumenEquipo.totalRespuestas;
        const textoA2 =
          totalViaje > 0
            ? `${totalViaje} ${totalViaje === 1 ? 'respuesta' : 'respuestas'} · promedio ${viaje.resumenEquipo.porcentajeGeneral ?? 0} %`
            : 'Todas las personas responden (12 preguntas)';
        setResumen({ a1: textoA1, a2: textoA2 });
      })
      .catch((e: unknown) => {
        if (e instanceof ErrorApi && e.estado === 401) expirar();
        if (vigente) setResumen({ a1: 'Tablero del equipo', a2: 'Encuesta y mapa interactivo' });
      });
    return () => {
      vigente = false;
    };
  }, [paso, esLider, expirar]);

  const estadoPorPaso: Record<string, string> = {
    A1: resumen.a1,
    A2: resumen.a2,
  };
  const pasoActual = paso?.id === 'A1' ? 'A1' : paso?.id === 'A2' ? 'A2' : null;

  return (
    <>
      {!paso ? (
        <SeccionEtapa etapa={etapa} descripcion={DESCRIPCION_ETAPA[etapa.id]}>
          <IndicePasos
            etapa={etapa}
            queSeHace={(p) => DESCRIPCION_PASO_A[p.id] ?? ''}
            estado={(p) => estadoPorPaso[p.id] ?? ''}
          />
          <FlujoEtapaA />
        </SeccionEtapa>
      ) : (
        <SeccionEtapa etapa={etapa}>
          <VolverAlIndice etapa={etapa} paso={paso} />
          <BloquePaso paso={paso} ancho="completo" tarjeta={tarjetaDePaso(etapa, indice)} descripcion={DESCRIPCION_PASO_A[paso.id]}>
            {paso.id === 'A1' && <AuditoriaAdopcion esLider={esLider} />}
            {paso.id === 'A2' && <MapaViaje esLider={esLider} />}
          </BloquePaso>
          <PasoAnteriorSiguiente etapa={etapa} paso={paso} />
        </SeccionEtapa>
      )}
      <AsistenteEtapaA pasoActual={pasoActual} esLider={esLider} />
    </>
  );
}
