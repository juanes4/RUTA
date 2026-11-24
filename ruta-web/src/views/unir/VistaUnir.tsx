import type { Etapa } from '../../config/etapas';
import { DESCRIPCION_PASO_U } from '../../contenido/unir';
import { VistaPorPasos } from '../VistaPorPasos';
import { PasoEmpatia } from './PasoEmpatia';
import { PasoLiderazgo } from './PasoLiderazgo';
import { PasoNarrativa } from './PasoNarrativa';
import { PasoSoporte } from './PasoSoporte';

const CONTENIDO_PASO = {
  U1: PasoLiderazgo,
  U2: PasoNarrativa,
  U3: PasoSoporte,
  U4: PasoEmpatia,
};

/** Etapa U: ¿quién lo lidera y por qué la gente lo va a apoyar? */
export function VistaUnir({ etapa, pasoId }: { etapa: Etapa; pasoId: string | null }) {
  return <VistaPorPasos etapa={etapa} pasoId={pasoId} contenido={CONTENIDO_PASO} descripciones={DESCRIPCION_PASO_U} />;
}
