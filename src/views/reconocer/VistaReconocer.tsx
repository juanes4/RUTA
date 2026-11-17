import type { ComponentType } from 'react';
import { FichaPaso } from '../../components/etapa/FichaPaso';
import { IndicePasos, PasoAnteriorSiguiente, VolverAlIndice } from '../../components/etapa/IndicePasos';
import { BloquePaso, SeccionEtapa } from '../../components/etapa/SeccionEtapa';
import { EstadoVacio } from '../../components/ui/EstadoVacio';
import { tarjetaDePaso, type Etapa } from '../../config/etapas';
import { DESCRIPCION_ETAPA, FICHAS } from '../../contenido/pasos';
import { DESCRIPCION_PASO_R } from '../../contenido/reconocer';
import { useProyecto } from '../../estado/ProyectoContexto';
import { resumenPasoR } from '../../lib/reconocer/resumenPaso';
import { useRuta } from '../../navegacion/RutaContexto';
import { PasoActores } from './PasoActores';
import { PasoBuzon1 } from './PasoBuzon1';
import { PasoDecision } from './PasoDecision';
import { PasoFoda } from './PasoFoda';
import { PasoLiderazgo } from './PasoLiderazgo';
import { PasoLienzo } from './PasoLienzo';

interface Props {
  etapa: Etapa;
  pasoId: string | null;
}

/** Formulario de cada paso. R5 no tiene: la ficha y la narrativa no generan datos (CONTEXTO §12.5). */
const CONTENIDO_PASO: Readonly<Record<string, ComponentType>> = {
  R1: PasoLienzo,
  R2: PasoFoda,
  R3: PasoActores,
  R4: PasoLiderazgo,
  R6: PasoBuzon1,
  R7: PasoDecision,
};

/** Etapa R: un índice de pasos y una página por paso, para no saturar. */
export function VistaReconocer({ etapa, pasoId }: Props) {
  const { activo, datos } = useProyecto();
  const { enlace } = useRuta();
  const indice = etapa.pasos.findIndex((p) => p.id === pasoId);
  const paso = etapa.pasos[indice];

  if (!paso) {
    return (
      <SeccionEtapa etapa={etapa} descripcion={DESCRIPCION_ETAPA[etapa.id]}>
        <IndicePasos
          etapa={etapa}
          queSeHace={(p) => FICHAS[p.id]?.queSeHace ?? ''}
          estado={(p) => resumenPasoR(p.id, activo, datos)}
        />
      </SeccionEtapa>
    );
  }

  const ficha = FICHAS[paso.id];
  const Contenido = CONTENIDO_PASO[paso.id];

  return (
    <SeccionEtapa etapa={etapa}>
      <VolverAlIndice etapa={etapa} paso={paso} />
      <BloquePaso paso={paso} ancho="completo" tarjeta={tarjetaDePaso(etapa, indice)} descripcion={DESCRIPCION_PASO_R[paso.id]}>
        {ficha && <FichaPaso ficha={ficha} />}
        {Contenido &&
          (activo ? (
            <Contenido key={activo.id} />
          ) : (
            <EstadoVacio
              titulo="Sin empresa registrada"
              accion={<a href={enlace({ pagina: 'etapa', etapaId: 'etapa-0', pasoId: null })}>Ir a la Etapa 0</a>}
            >
              Registra la empresa, sus áreas y sus afectados para empezar a capturar datos.
            </EstadoVacio>
          ))}
      </BloquePaso>
      <PasoAnteriorSiguiente etapa={etapa} paso={paso} />
    </SeccionEtapa>
  );
}
