import { useMemo, type CSSProperties } from 'react';
import { EstadoVacio } from '../../components/ui/EstadoVacio';
import { Semaforo } from '../../components/ui/Semaforo';
import { ETAPAS } from '../../config/etapas';
import { ESTILOS_LIDERAZGO, LETRAS_LIDERAZGO } from '../../config/formularios/liderazgo';
import { ALCANCES, ESTRATEGIAS_FODA, RUTAS_TRIAJE } from '../../config/formularios/reconocer';
import { REGLAS } from '../../config/reglas';
import { useProyecto } from '../../estado/ProyectoContexto';
import { conSigno } from '../../lib/formato';
import { resumenPaso } from '../../lib/reconocer/resumenPaso';
import { construirTablero, type Tablero } from '../../lib/tablero/construirTablero';
import { useRuta } from '../../navegacion/RutaContexto';
import { ListaParticipacion } from './ListaParticipacion';
import estilos from './Tablero.module.css';

/** Tablero: la ruta del cambio (triaje), la escucha y los resultados de R y U en una sola vista. */
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
      {!tablero || !activo ? (
        <EstadoVacio
          titulo="Aún no hay una empresa registrada"
          accion={
            <a className={estilos.enlaceSecundario} href={enlace({ pagina: 'etapa', etapaId: 'etapa-0', pasoId: null })}>
              Ir a la Etapa 0 <span aria-hidden="true">→</span>
            </a>
          }
        >
          El tablero se llena con lo que la empresa registra en las etapas Reconocer y Unir.
        </EstadoVacio>
      ) : (
        <div className={estilos.rejilla}>
          <aside className={estilos.panel}>
            <TarjetaRuta tablero={tablero} />
            <ListaParticipacion areas={tablero.buzon.areas} total={tablero.buzon.total} />
          </aside>
          <div className={estilos.principal}>
            <TarjetasResultados tablero={tablero} />
            <AvancePasos />
          </div>
        </div>
      )}
    </>
  );
}

/** R2: puntaje del triaje y la ruta asignada. */
function TarjetaRuta({ tablero }: { tablero: Tablero }) {
  const { enlace } = useRuta();
  const { triaje } = tablero;
  const alcance = ALCANCES.find((a) => a.valor === triaje.alcance);
  return (
    <section className={estilos.tarjetaOscura} aria-labelledby="titulo-ruta">
      <p id="titulo-ruta" className={estilos.antetituloOscuro}>
        Ruta del cambio · triaje (R2)
      </p>
      {triaje.nivel && triaje.total !== null ? (
        <>
          <p className={estilos.decision}>{RUTAS_TRIAJE[triaje.nivel].clasificacion}</p>
          <p>
            <Semaforo estado={triaje.nivel} texto={`${triaje.total} de 9 puntos`} />
          </p>
          <p className={estilos.textoOscuro}>{RUTAS_TRIAJE[triaje.nivel].descripcion}</p>
          {alcance && <p className={estilos.textoOscuro}>Alcance: {alcance.nombre.toLowerCase()}.</p>}
        </>
      ) : (
        <p className={estilos.textoOscuro}>Puntúa los tres criterios del triaje para asignar la ruta.</p>
      )}
      <a className={estilos.enlaceOscuro} href={enlace({ pagina: 'etapa', etapaId: 'etapa-r', pasoId: 'R2' })}>
        Abrir el triaje <span aria-hidden="true">→</span>
      </a>
    </section>
  );
}

function TarjetasResultados({ tablero }: { tablero: Tablero }) {
  const { foda, actores, liderazgo, vocero } = tablero;
  const fondo = (color: string) => ({ '--fondo-categoria': color }) as CSSProperties;
  return (
    <section aria-labelledby="titulo-resultados" className={estilos.bloque}>
      <h2 id="titulo-resultados" className={estilos.tituloBloque}>
        Resultados
      </h2>
      <ul className={estilos.categorias}>
        <li className={estilos.categoria} style={fondo('var(--pastel-blue)')}>
          <h3 className={estilos.nombreCategoria}>FODA del cambio (R3)</h3>
          {foda.estrategia ? (
            <ul className={estilos.ejemplos}>
              <li>
                <p className={estilos.nombreArea}>{ESTRATEGIAS_FODA[foda.estrategia].nombre}</p>
                <p className={estilos.detalle}>{ESTRATEGIAS_FODA[foda.estrategia].descripcion}</p>
              </li>
              <li>
                <p className={estilos.detalle}>
                  Interno (F − D): <span className="numero">{conSigno(foda.interno)}</span> · Externo (O − A):{' '}
                  <span className="numero">{conSigno(foda.externo)}</span>
                </p>
              </li>
            </ul>
          ) : (
            <p className={estilos.detalle}>Sin ítems registrados.</p>
          )}
          <p className={`${estilos.pieCategoria} numero`}>{foda.items} {foda.items === 1 ? 'ítem' : 'ítems'}</p>
        </li>

        <li className={estilos.categoria} style={fondo('var(--pastel-mint)')}>
          <h3 className={estilos.nombreCategoria}>Mapa de actores (R4)</h3>
          {actores.total > 0 ? (
            <ul className={estilos.ejemplos}>
              <li>
                <p className={estilos.nombreArea}>
                  <span className="numero">{actores.conBrecha}</span> con brecha de compromiso
                </p>
                <p className={estilos.detalle}>
                  {actores.prioridades.length > 0
                    ? `Mayor esfuerzo: ${actores.prioridades
                        .slice(0, 3)
                        .map((p) => p.actor)
                        .join(', ')}.`
                    : 'Ningún actor está por debajo de donde debe estar.'}
                </p>
              </li>
              <li>
                <p className={estilos.detalle}>
                  <span className="numero">{actores.evaluados}</span> de <span className="numero">{actores.total}</span> con poder e interés asignados.
                </p>
              </li>
            </ul>
          ) : (
            <p className={estilos.detalle}>Sin actores registrados.</p>
          )}
          <p className={`${estilos.pieCategoria} numero`}>{actores.total} {actores.total === 1 ? 'actor' : 'actores'}</p>
        </li>

        <li className={estilos.categoria} style={fondo('var(--pastel-lavender)')}>
          <h3 className={estilos.nombreCategoria}>Liderazgo (U1 y U2)</h3>
          {liderazgo.lideres > 0 ? (
            <ul className={estilos.ejemplos}>
              <li>
                <p className={estilos.nombreArea}>Vocero: {vocero || (liderazgo.voceros.length > 0 ? `sin elegir (sugeridos: ${liderazgo.voceros.join(', ')})` : 'sin elegir')}</p>
              </li>
              <li>
                <ul className={estilos.motivosClaros}>
                  {LETRAS_LIDERAZGO.filter((l) => liderazgo.porEstilo[l] > 0).map((l) => (
                    <li key={l}>
                      {ESTILOS_LIDERAZGO[l].nombre}: <span className="numero">{liderazgo.porEstilo[l]}</span>
                    </li>
                  ))}
                </ul>
              </li>
            </ul>
          ) : (
            <p className={estilos.detalle}>Sin encuestas de liderazgo.</p>
          )}
          <p className={`${estilos.pieCategoria} numero`}>{liderazgo.lideres} {liderazgo.lideres === 1 ? 'líder' : 'líderes'}</p>
        </li>
      </ul>
    </section>
  );
}

/** En qué va cada paso de R y U, con acceso directo. */
function AvancePasos() {
  const { activo, datos } = useProyecto();
  const { enlace } = useRuta();
  const etapas = ETAPAS.filter((e) => e.id === 'etapa-r' || e.id === 'etapa-u');
  return (
    <section aria-labelledby="titulo-avance" className={estilos.bloque}>
      <h2 id="titulo-avance" className={estilos.tituloBloque}>
        Avance de las etapas
      </h2>
      <table className={estilos.tabla}>
        <thead>
          <tr>
            <th scope="col">Paso</th>
            <th scope="col">Estado</th>
          </tr>
        </thead>
        <tbody>
          {etapas.flatMap((etapa) =>
            etapa.pasos.map((paso) => (
              <tr key={paso.id}>
                <th scope="row">
                  <a className={estilos.celdaIndicador} href={enlace({ pagina: 'etapa', etapaId: etapa.id, pasoId: paso.id })}>
                    <span className={estilos.cuadroEtapa} style={{ '--fondo-etapa': etapa.color } as CSSProperties}>
                      {paso.id}
                    </span>
                    {paso.titulo}
                  </a>
                </th>
                <td className={estilos.valor}>{resumenPaso(paso.id, activo, datos)}</td>
              </tr>
            )),
          )}
        </tbody>
      </table>
    </section>
  );
}
