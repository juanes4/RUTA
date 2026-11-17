import type { CSSProperties } from 'react';
import type { Etapa } from '../../config/etapas';
import { DESCRIPCION_ETAPA, RECORRIDO } from '../../contenido/pasos';
import { useProyecto } from '../../estado/ProyectoContexto';
import { fasesDelRecorrido, type PasoNumerado } from '../../lib/recorrido';
import { useRuta } from '../../navegacion/RutaContexto';
import estilos from './VistaInicio.module.css';

interface Props {
  etapas: readonly Etapa[];
}

/** Línea de tiempo: la última fase es la llegada, bajo la punta de la flecha. */
const FASES = fasesDelRecorrido(RECORRIDO);
const TRAMO = FASES.slice(0, -1);
const LLEGADA = FASES.at(-1);

const fondo = (color: string | undefined) => ({ '--fondo': color ?? 'var(--bg-soft)' }) as CSSProperties;

function TextoPaso({ paso }: { paso: PasoNumerado }) {
  return (
    <>
      <p className={estilos.pregunta}>{paso.pregunta}</p>
      <p className={estilos.herramienta}>{paso.herramienta}</p>
    </>
  );
}

/** Página principal: el reto, el recorrido en 10 pasos y el acceso a todo (PLAN §4). */
export function VistaInicio({ etapas }: Props) {
  const { activo } = useProyecto();
  const { enlace } = useRuta();
  const tono = (paso: PasoNumerado) =>
    ({ '--tono': etapas.find((e) => e.id === paso.etapaId)?.tonos?.[paso.posicionEnEtapa] ?? 'var(--bg-page)' }) as CSSProperties;

  return (
    <div className={estilos.inicio}>
      <header className={estilos.presentacion}>
        <p className={estilos.antetitulo}>Metodología de transformación organizacional</p>
        <h1>RUTA</h1>
        <p className={estilos.reto}>
          ¿Cómo lograr que los colaboradores de las empresas afiliadas comprendan, adopten y se apropien de los cambios
          organizacionales?
        </p>
        <p className={estilos.ruta}>Entender → comunicar → escuchar → decidir → acompañar → comprobar.</p>
      </header>

      <section aria-labelledby="titulo-accesos">
        <h2 id="titulo-accesos" className={estilos.tituloSeccion}>
          Etapas y tablero
        </h2>
        <ul className={estilos.accesos}>
          {etapas.map((etapa) => (
            <li key={etapa.id}>
              {etapa.activa ? (
                <a
                  className={estilos.acceso}
                  style={fondo(etapa.color)}
                  href={enlace({ pagina: 'etapa', etapaId: etapa.id, pasoId: null })}
                >
                  <span className={estilos.letra}>{etapa.letra}</span>
                  <span className={estilos.nombreAcceso}>{etapa.nombre}</span>
                  <span className={estilos.descripcion}>{DESCRIPCION_ETAPA[etapa.id]}</span>
                  <span className={`${estilos.pasos} numero`}>{etapa.pasos.length} pasos</span>
                </a>
              ) : (
                <div className={estilos.acceso} data-vacio="true" aria-label="Etapa por definir. Próximamente.">
                  <span className={estilos.letra} aria-hidden="true" />
                  <span className={estilos.proximamente}>Próximamente</span>
                </div>
              )}
            </li>
          ))}
          <li>
            <a className={estilos.acceso} data-oscuro="true" href={enlace({ pagina: 'tablero' })}>
              <span className={estilos.nombreAcceso}>Tablero</span>
              <span className={estilos.descripcion}>
                Decisión de lanzamiento, participación por área, categorías e indicadores con semáforo.
              </span>
              <span className={estilos.pasos}>
                Abrir <span aria-hidden="true">→</span>
              </span>
            </a>
          </li>
        </ul>
        {!activo && (
          <p className={estilos.idea}>Para empezar, registra la empresa en la Etapa 0.</p>
        )}
      </section>

      <section aria-labelledby="titulo-recorrido">
        <h2 id="titulo-recorrido" className={estilos.tituloSeccion}>
          El recorrido en 10 pasos
        </h2>
        <div className={estilos.recorrido}>
          <div className={estilos.tramo}>
            <ol className={estilos.fases}>
              {TRAMO.map((fase) => (
                <li key={fase.verbo} className={estilos.fase}>
                  <p className={estilos.verbo}>{fase.verbo}</p>
                  <ol className={estilos.pasosFase}>
                    {fase.pasos.map((p) => (
                      <li key={p.numero} className={estilos.paso} data-lado={p.numero % 2 === 1 ? 'derecha' : 'izquierda'} style={tono(p)}>
                        <span className={estilos.nodo} aria-hidden="true" />
                        <div className={estilos.contenido}>
                          <div className={estilos.cabeza}>
                            <span className={estilos.numeroGrande}>{String(p.numero).padStart(2, '0')}</span>
                            <span className={estilos.punto} aria-hidden="true" />
                            <span className={estilos.conector} aria-hidden="true" />
                          </div>
                          <TextoPaso paso={p} />
                        </div>
                      </li>
                    ))}
                  </ol>
                </li>
              ))}
            </ol>
            <svg className={estilos.punta} viewBox="0 0 20 16" aria-hidden="true">
              <path d="M0 0h20L10 16z" />
            </svg>
          </div>
          {LLEGADA && (
            <div className={estilos.llegada}>
              <p className={estilos.verbo}>{LLEGADA.verbo}</p>
              {LLEGADA.pasos.map((p) => (
                <div key={p.numero} className={estilos.pasoLlegada} style={tono(p)}>
                  <span className={estilos.numeroGrande}>{String(p.numero).padStart(2, '0')}</span>
                  <TextoPaso paso={p} />
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
