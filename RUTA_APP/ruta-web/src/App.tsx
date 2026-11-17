import type { ComponentType } from 'react';
import { Marco } from './components/marco/Marco';
import { EstadoVacio } from './components/ui/EstadoVacio';
import { ETAPAS, type Etapa } from './config/etapas';
import { useRuta } from './navegacion/RutaContexto';
import { VistaEtapa0 } from './views/etapa0/VistaEtapa0';
import { VistaInicio } from './views/inicio/VistaInicio';
import { PaginaEtapa } from './views/PaginaEtapa';
import { VistaReconocer } from './views/reconocer/VistaReconocer';
import { VistaTablero } from './views/tablero/VistaTablero';
import { VistaUnir } from './views/unir/VistaUnir';

/**
 * Vista de cada etapa activa. Para activar T o A: agregar sus pasos en
 * config/etapas.ts, crear su vista y registrarla aquí.
 */
const VISTAS: Readonly<Record<string, ComponentType<{ etapa: Etapa }>>> = {
  'etapa-0': VistaEtapa0,
  'etapa-r': VistaReconocer,
  'etapa-u': VistaUnir,
};

export function App() {
  const { ruta, enlace } = useRuta();
  const etapa = ruta.pagina === 'etapa' ? ETAPAS.find((e) => e.id === ruta.etapaId) : undefined;
  const Vista = etapa ? VISTAS[etapa.id] : undefined;

  return (
    <Marco etapas={ETAPAS} conBarraEtapas={Boolean(etapa && Vista)}>
      {ruta.pagina === 'inicio' && <VistaInicio etapas={ETAPAS} />}
      {ruta.pagina === 'tablero' && <VistaTablero />}
      {ruta.pagina === 'etapa' && etapa && Vista && (
        <PaginaEtapa key={etapa.id} etapas={ETAPAS} etapa={etapa} pasoId={ruta.pasoId} Vista={Vista} />
      )}
      {(ruta.pagina === 'no_encontrada' || (ruta.pagina === 'etapa' && !Vista)) && (
        <EstadoVacio titulo="Esta página no existe" accion={<a href={enlace({ pagina: 'inicio' })}>Volver al inicio</a>}>
          Revisa la dirección o vuelve a la página principal.
        </EstadoVacio>
      )}
    </Marco>
  );
}
