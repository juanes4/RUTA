import type { CSSProperties } from 'react';
import { tarjetaDePaso, type Etapa, type PasoEtapa } from '../../config/etapas';
import { useRuta } from '../../navegacion/RutaContexto';
import estilos from './IndicePasos.module.css';

interface PropsIndice {
  etapa: Etapa;
  /** Qué hace el paso, en una frase. */
  queSeHace(paso: PasoEtapa): string;
  /** En qué va el paso ("Sin empezar", "3 actores"…). */
  estado(paso: PasoEtapa): string;
}

/** Índice de una etapa con páginas por paso: una tarjeta corta y enlazada por paso. */
export function IndicePasos({ etapa, queSeHace, estado }: PropsIndice) {
  const { enlace } = useRuta();
  return (
    <ol className={`${estilos.indice} fila-completa`}>
      {etapa.pasos.map((paso, i) => (
        <li key={paso.id}>
          <a
            className={estilos.tarjeta}
            style={{ '--fondo-paso': tarjetaDePaso(etapa, i).fondo } as CSSProperties}
            href={enlace({ pagina: 'etapa', etapaId: etapa.id, pasoId: paso.id })}
          >
            <span className={`${estilos.id} numero`}>{paso.id}</span>
            <span className={estilos.titulo}>{paso.titulo}</span>
            <span className={estilos.queSeHace}>{queSeHace(paso)}</span>
            <span className={estilos.estado}>{estado(paso)}</span>
          </a>
        </li>
      ))}
    </ol>
  );
}

/** Enlace de vuelta al índice de la etapa, arriba de la página de un paso. */
export function VolverAlIndice({ etapa, paso }: { etapa: Etapa; paso: PasoEtapa }) {
  const { enlace } = useRuta();
  const posicion = etapa.pasos.indexOf(paso) + 1;
  return (
    <p className={`${estilos.volver} fila-completa`}>
      <a href={enlace({ pagina: 'etapa', etapaId: etapa.id, pasoId: null })}>
        <span aria-hidden="true">←</span> Todos los pasos
      </a>
      <span className="numero">
        Paso {posicion} de {etapa.pasos.length}
      </span>
    </p>
  );
}

/** Anterior y Siguiente, al final de la página de un paso. */
export function PasoAnteriorSiguiente({ etapa, paso }: { etapa: Etapa; paso: PasoEtapa }) {
  const { enlace } = useRuta();
  const indice = etapa.pasos.indexOf(paso);
  const anterior = etapa.pasos[indice - 1];
  const siguiente = etapa.pasos[indice + 1];
  const href = (p: PasoEtapa) => enlace({ pagina: 'etapa', etapaId: etapa.id, pasoId: p.id });

  return (
    <nav className={`${estilos.anteriorSiguiente} fila-completa`} aria-label="Otros pasos de la etapa">
      {anterior ? (
        <a className={estilos.enlacePaso} href={href(anterior)}>
          <span aria-hidden="true">←</span> {anterior.id} {anterior.titulo}
        </a>
      ) : (
        <span />
      )}
      {siguiente && (
        <a className={estilos.enlacePaso} href={href(siguiente)}>
          {siguiente.id} {siguiente.titulo} <span aria-hidden="true">→</span>
        </a>
      )}
    </nav>
  );
}
