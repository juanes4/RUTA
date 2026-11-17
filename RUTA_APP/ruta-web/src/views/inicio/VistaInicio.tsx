import type { CSSProperties } from 'react';
import type { Etapa } from '../../config/etapas';
import type { Pastel } from '../../config/paleta';
import { DESCRIPCION_ETAPA, RECORRIDO } from '../../contenido/pasos';
import { useProyecto } from '../../estado/ProyectoContexto';
import { useRuta } from '../../navegacion/RutaContexto';
import estilos from './VistaInicio.module.css';

interface Props {
  etapas: readonly Etapa[];
}

const fondo = (color: Pastel | undefined) => ({ '--fondo': color ?? 'var(--bg-soft)' }) as CSSProperties;

/** Página principal: el reto, el recorrido en 10 pasos y el acceso a todo (PLAN §4). */
export function VistaInicio({ etapas }: Props) {
  const { activo } = useProyecto();
  const { enlace } = useRuta();

  return (
    <div className={estilos.inicio}>
      <header className={estilos.presentacion}>
        <p className={estilos.antetitulo}>Metodología de transformación organizacional</p>
        <h1>RUTA</h1>
        <p className={estilos.reto}>
          ¿Cómo lograr que los colaboradores de las empresas afiliadas comprendan, adopten y se apropien de los cambios
          organizacionales?
        </p>
        <p className={estilos.idea}>Entender → comunicar → escuchar → decidir → acompañar → comprobar.</p>
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
        <ol className={estilos.recorrido}>
          {RECORRIDO.map((r, i) => (
            <li key={r.pregunta} className={estilos.paso} style={fondo(etapas.find((e) => e.id === r.etapaId)?.color)}>
              <span className={`${estilos.numero} numero`}>{i + 1}</span>
              <div>
                <p className={estilos.verbo}>{r.verbo}</p>
                <p className={estilos.pregunta}>{r.pregunta}</p>
                <p className={estilos.herramienta}>{r.herramienta}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
