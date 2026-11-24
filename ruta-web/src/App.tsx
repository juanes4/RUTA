import type { ComponentType } from 'react';
import { Marco } from './components/marco/Marco';
import { EstadoVacio } from './components/ui/EstadoVacio';
import { ETAPAS, type Etapa } from './config/etapas';
import { useSesion } from './estado/SesionContexto';
import { useRuta } from './navegacion/RutaContexto';
import { VistaEtapa0 } from './views/etapa0/VistaEtapa0';
import { VistaInicio } from './views/inicio/VistaInicio';
import { VistaLogin } from './views/login/VistaLogin';
import { PaginaEtapa } from './views/PaginaEtapa';
import { VistaReconocer } from './views/reconocer/VistaReconocer';
import { VistaTablero } from './views/tablero/VistaTablero';
import { VistaTransformar } from './views/transformar/VistaTransformar';
import { VistaUnir } from './views/unir/VistaUnir';

/**
 * Vista de cada etapa activa. Para activar A: agregar sus pasos en
 * config/etapas.ts, crear su vista y registrarla aquí.
 */
const VISTAS: Readonly<Record<string, ComponentType<{ etapa: Etapa; pasoId: string | null }>>> = {
  'etapa-0': VistaEtapa0,
  'etapa-r': VistaReconocer,
  'etapa-u': VistaUnir,
  'etapa-t': VistaTransformar,
};

export function App() {
  const { ruta, enlace } = useRuta();
  const { usuario, cargando } = useSesion();
  const etapa = ruta.pagina === 'etapa' ? ETAPAS.find((e) => e.id === ruta.etapaId) : undefined;
  const Vista = etapa ? VISTAS[etapa.id] : undefined;

  // Mientras el servidor confirma si hay una sesión abierta no se muestra nada: evita ver el login un instante.
  if (cargando) return null;

  // Sin sesión solo existe el inicio. Cualquier otra página pide el ingreso y, al entrar, se abre la que se pidió.
  const requiereSesion = ruta.pagina === 'tablero' || ruta.pagina === 'etapa';
  const pideIngreso = !usuario && (requiereSesion || ruta.pagina === 'ingresar');
  const conBarra = Boolean(usuario && etapa && Vista);

  return (
    <Marco etapas={ETAPAS} conBarraEtapas={conBarra}>
      {pideIngreso && <VistaLogin />}
      {!pideIngreso && (ruta.pagina === 'inicio' || ruta.pagina === 'ingresar') && <VistaInicio etapas={ETAPAS} />}
      {!pideIngreso && ruta.pagina === 'tablero' && <VistaTablero />}
      {!pideIngreso && ruta.pagina === 'etapa' && etapa && Vista && (
        <PaginaEtapa key={etapa.id} etapas={ETAPAS} etapa={etapa} pasoId={ruta.pasoId} Vista={Vista} />
      )}
      {!pideIngreso && (ruta.pagina === 'no_encontrada' || (ruta.pagina === 'etapa' && !Vista)) && (
        <EstadoVacio titulo="Esta página no existe" accion={<a href={enlace({ pagina: 'inicio' })}>Volver al inicio</a>}>
          Revisa la dirección o vuelve a la página principal.
        </EstadoVacio>
      )}
    </Marco>
  );
}
