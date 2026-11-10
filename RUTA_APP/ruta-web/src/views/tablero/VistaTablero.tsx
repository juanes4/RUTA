import { useMemo } from 'react';
import { EstadoVacio } from '../../components/ui/EstadoVacio';
import { REGLAS } from '../../config/reglas';
import { CATEGORIAS_TABLERO } from '../../config/tablero';
import { useProyecto } from '../../estado/ProyectoContexto';
import { construirTablero } from '../../lib/tablero/construirTablero';
import { useRuta } from '../../navegacion/RutaContexto';
import { ListaParticipacion } from './ListaParticipacion';
import { TablaIndicadores } from './TablaIndicadores';
import { TarjetaDecision } from './TarjetaDecision';
import { TarjetasCategoria } from './TarjetasCategoria';
import estilos from './Tablero.module.css';

/**
 * Tablero (esquema de la imagen de referencia): a la izquierda la decisión
 * R7 y la participación; a la derecha las 3 categorías y los indicadores.
 */
export function VistaTablero() {
  const { cargando, activo, datos } = useProyecto();
  const { enlace } = useRuta();
  const tablero = useMemo(() => (activo ? construirTablero(activo, datos, REGLAS) : null), [activo, datos]);

  if (cargando) return null;

  return (
    <>
      <header className={estilos.cabecera}>
        <h1>Tablero</h1>
        <p className={estilos.detalle}>{activo ? activo.empresa.nombre || 'Empresa sin nombre' : 'Seguimiento del cambio'}</p>
      </header>
      {!tablero ? (
        <EstadoVacio
          titulo="Aún no hay una empresa registrada"
          accion={
            <a className={estilos.enlaceSecundario} href={enlace({ pagina: 'etapa', etapaId: 'etapa-0', pasoId: null })}>
              Ir a la Etapa 0 <span aria-hidden="true">→</span>
            </a>
          }
        >
          El tablero se llena con los datos que la empresa registra y captura.
        </EstadoVacio>
      ) : (
        <div className={estilos.rejilla}>
          <aside className={estilos.panel}>
            <TarjetaDecision decision={tablero.decision} />
            <ListaParticipacion areas={tablero.participacion} />
          </aside>
          <div className={estilos.principal}>
            <TarjetasCategoria categorias={CATEGORIAS_TABLERO} />
            <TablaIndicadores
              filas={tablero.indicadores}
              participacion={tablero.participacion}
              uso={datos.uso}
              respuestas={datos.respuestas}
            />
          </div>
        </div>
      )}
    </>
  );
}
