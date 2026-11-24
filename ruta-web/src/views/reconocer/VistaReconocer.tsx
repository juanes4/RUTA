import { ID_COPILOTO, type Etapa } from '../../config/etapas';
import { DESCRIPCION_PASO_R } from '../../contenido/reconocer';
import { VistaPorPasos } from '../VistaPorPasos';
import { CopilotoEnPaso } from './copiloto/CopilotoEnPaso';
import { AccesoCopiloto, VistaCopiloto } from './copiloto/VistaCopiloto';
import { PasoActores } from './PasoActores';
import { PasoBuzon1 } from './PasoBuzon1';
import { PasoFoda } from './PasoFoda';
import { PasoLienzo } from './PasoLienzo';
import { PasoTriaje } from './PasoTriaje';

const CONTENIDO_PASO = {
  R1: PasoLienzo,
  R2: PasoTriaje,
  R3: PasoFoda,
  R4: PasoActores,
  R5: PasoBuzon1,
};

/** Etapa R: ¿qué cambio es, a quién afecta y qué ruta necesita? */
export function VistaReconocer({ etapa, pasoId }: { etapa: Etapa; pasoId: string | null }) {
  if (pasoId === ID_COPILOTO) return <VistaCopiloto etapa={etapa} />;
  return (
    <VistaPorPasos
      etapa={etapa}
      pasoId={pasoId}
      contenido={CONTENIDO_PASO}
      descripciones={DESCRIPCION_PASO_R}
      antesDelIndice={<AccesoCopiloto etapa={etapa} />}
      apoyo={(id) => <CopilotoEnPaso key={id} pasoId={id} />}
    />
  );
}
