import type { ComponentType } from 'react';
import { FichaPaso } from '../components/etapa/FichaPaso';
import { IndicePasos, PasoAnteriorSiguiente, VolverAlIndice } from '../components/etapa/IndicePasos';
import { BloquePaso, SeccionEtapa } from '../components/etapa/SeccionEtapa';
import { EstadoVacio } from '../components/ui/EstadoVacio';
import { tarjetaDePaso, type Etapa } from '../config/etapas';
import { DESCRIPCION_ETAPA, FICHAS } from '../contenido/pasos';
import { useProyecto } from '../estado/ProyectoContexto';
import { resumenPaso } from '../lib/reconocer/resumenPaso';
import { useRuta } from '../navegacion/RutaContexto';

interface Props {
  etapa: Etapa;
  pasoId: string | null;
  /** Formulario de cada paso. */
  contenido: Readonly<Record<string, ComponentType>>;
  /** Qué se registra en cada paso, bajo el título. */
  descripciones: Readonly<Record<string, string>>;
}

/** Etapa con un índice de pasos y una página por paso, para no saturar (R y U). */
export function VistaPorPasos({ etapa, pasoId, contenido, descripciones }: Props) {
  const { activo, datos } = useProyecto();
  const { enlace } = useRuta();
  const indice = etapa.pasos.findIndex((p) => p.id === pasoId);
  const paso = etapa.pasos[indice];

  if (!paso) {
    return (
      <SeccionEtapa etapa={etapa} descripcion={DESCRIPCION_ETAPA[etapa.id]}>
        <IndicePasos etapa={etapa} queSeHace={(p) => FICHAS[p.id]?.queSeHace ?? ''} estado={(p) => resumenPaso(p.id, activo, datos)} />
      </SeccionEtapa>
    );
  }

  const ficha = FICHAS[paso.id];
  const Contenido = contenido[paso.id];

  return (
    <SeccionEtapa etapa={etapa}>
      <VolverAlIndice etapa={etapa} paso={paso} />
      <BloquePaso paso={paso} ancho="completo" tarjeta={tarjetaDePaso(etapa, indice)} descripcion={descripciones[paso.id]}>
        {ficha && <FichaPaso ficha={ficha} />}
        {Contenido &&
          (activo ? (
            <Contenido key={activo.id} />
          ) : (
            <EstadoVacio
              titulo="Sin empresa registrada"
              accion={<a href={enlace({ pagina: 'etapa', etapaId: 'etapa-0', pasoId: null })}>Ir a la Etapa 0</a>}
            >
              Registra la empresa, sus áreas y sus afectados para empezar a registrar resultados.
            </EstadoVacio>
          ))}
      </BloquePaso>
      <PasoAnteriorSiguiente etapa={etapa} paso={paso} />
    </SeccionEtapa>
  );
}
