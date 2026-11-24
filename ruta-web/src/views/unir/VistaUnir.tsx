import { FichaPaso } from '../../components/etapa/FichaPaso';
import { BloquePaso, SeccionEtapa } from '../../components/etapa/SeccionEtapa';
import { EstadoVacio } from '../../components/ui/EstadoVacio';
import { tarjetaDePaso, type Etapa } from '../../config/etapas';
import { DESCRIPCION_ETAPA, FICHAS } from '../../contenido/pasos';
import { useProyecto } from '../../estado/ProyectoContexto';
import { PasoLiderazgo } from '../reconocer/PasoLiderazgo';
import { PasoMapaEmpatia } from './PasoMapaEmpatia';
import { PasoNarrativa } from './PasoNarrativa';
import { PasoSoporteLideres } from './PasoSoporteLideres';

interface Props {
  etapa: Etapa;
}

/** Etapa U: vocería, narrativa, soporte a líderes y mapa de empatía. */
export function VistaUnir({ etapa }: Props) {
  const { activo } = useProyecto();

  if (!activo) {
    return (
      <SeccionEtapa etapa={etapa} descripcion={DESCRIPCION_ETAPA[etapa.id] ?? ''}>
        <EstadoVacio titulo="Sin empresa registrada">
          Registra la empresa en la Etapa 0 antes de preparar la comunicación y el acompañamiento de sus grupos.
        </EstadoVacio>
      </SeccionEtapa>
    );
  }

  return (
    <SeccionEtapa etapa={etapa} descripcion={DESCRIPCION_ETAPA[etapa.id] ?? ''}>
      {etapa.pasos.map((paso, indice) => {
        const ficha = FICHAS[paso.id];
        return (
          <BloquePaso key={paso.id} paso={paso} ancho="completo" tarjeta={tarjetaDePaso(etapa, indice)}>
            {ficha && <FichaPaso ficha={ficha} />}
            {paso.id === 'U1' && <PasoLiderazgo />}
            {paso.id === 'U2' && <PasoNarrativa />}
            {paso.id === 'U3' && <PasoSoporteLideres />}
            {paso.id === 'U4' && <PasoMapaEmpatia />}
          </BloquePaso>
        );
      })}
    </SeccionEtapa>
  );
}
