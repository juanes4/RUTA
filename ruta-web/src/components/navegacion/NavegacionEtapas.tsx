import { useState, type CSSProperties, type KeyboardEvent } from 'react';
import type { Etapa } from '../../config/etapas';
import { usePasosVistos } from '../../estado/PasosVistosContexto';
import { useRuta } from '../../navegacion/RutaContexto';
import { calcularEstadoNavegacion, type EstadoNodo } from './estadoNavegacion';
import estilos from './NavegacionEtapas.module.css';

interface Props {
  etapas: readonly Etapa[];
  idEtapaActual: string;
}

/**
 * Barra flotante con el flujo lineal de las etapas (PLAN §3). Cada nodo
 * lleva a la página de su etapa; la lista de pasos, a una subsección.
 * En celular pasa a barra horizontal inferior.
 */
export function NavegacionEtapas({ etapas, idEtapaActual }: Props) {
  const { vistos } = usePasosVistos();
  const [abierta, setAbierta] = useState<string | null>(null);
  const { nodos, progreso } = calcularEstadoNavegacion(etapas, idEtapaActual, vistos);

  const alPresionarTecla = (evento: KeyboardEvent) => {
    if (evento.key === 'Escape') setAbierta(null);
  };

  return (
    <nav className={estilos.nav} aria-label="Etapas de RUTA" onKeyDown={alPresionarTecla}>
      <div className={estilos.linea} aria-hidden="true">
        <div className={estilos.relleno} style={{ '--progreso': progreso } as CSSProperties} />
      </div>
      <ol className={estilos.lista}>
        {nodos.map((nodo) =>
          nodo.etapa.activa ? (
            <NodoActivo
              key={nodo.etapa.id}
              nodo={nodo}
              abierta={abierta === nodo.etapa.id}
              alAlternar={() => setAbierta((a) => (a === nodo.etapa.id ? null : nodo.etapa.id))}
              alElegir={() => setAbierta(null)}
            />
          ) : (
            <NodoVacio key={nodo.etapa.id} />
          ),
        )}
      </ol>
    </nav>
  );
}

interface PropsNodoActivo {
  nodo: EstadoNodo;
  abierta: boolean;
  alAlternar(): void;
  alElegir(): void;
}

function NodoActivo({ nodo, abierta, alAlternar, alElegir }: PropsNodoActivo) {
  const { enlace } = useRuta();
  const { etapa, esActual, pasosVistos, totalPasos } = nodo;
  const idLista = `pasos-${etapa.id}`;

  return (
    <li className={estilos.item} data-abierta={abierta}>
      <a
        className={estilos.nodo}
        style={{ '--color-etapa': etapa.color } as CSSProperties}
        href={enlace({ pagina: 'etapa', etapaId: etapa.id, pasoId: null })}
        data-actual={esActual}
        aria-current={esActual ? 'step' : undefined}
        aria-label={`${etapa.nombre}, ${pasosVistos} de ${totalPasos} pasos vistos`}
        onClick={alElegir}
      >
        {etapa.letra}
      </a>
      <div className={estilos.etiqueta}>
        <span className={estilos.nombre}>{etapa.nombre}</span>
        <span className={`${estilos.contador} numero`} aria-hidden="true">
          {pasosVistos}/{totalPasos}
        </span>
        <button
          type="button"
          className={estilos.alternar}
          aria-expanded={abierta}
          aria-controls={idLista}
          onClick={alAlternar}
        >
          <span className="solo-lectores">Pasos de {etapa.nombre}</span>
          <span aria-hidden="true">›</span>
        </button>
      </div>
      <ul id={idLista} className={estilos.pasos}>
        {etapa.pasos.map((paso) => (
          <li key={paso.id}>
            <a
              className={estilos.paso}
              href={enlace({ pagina: 'etapa', etapaId: etapa.id, pasoId: paso.id })}
              onClick={alElegir}
            >
              <span className={`${estilos.idPaso} numero`}>{paso.id}</span>
              {paso.titulo}
            </a>
          </li>
        ))}
      </ul>
    </li>
  );
}

function NodoVacio() {
  return (
    <li className={estilos.item}>
      <span className={estilos.nodo} data-vacio="true" aria-disabled="true">
        <span className="solo-lectores">Etapa por definir</span>
      </span>
      <div className={estilos.etiqueta}>
        <span className={estilos.proximamente}>Próximamente</span>
      </div>
    </li>
  );
}
