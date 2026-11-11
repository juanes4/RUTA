import { useId, useState, type KeyboardEvent, type ReactNode } from 'react';
import estilos from './Pestanas.module.css';

export interface Pestana {
  id: string;
  etiqueta: string;
  contenido: ReactNode;
}

interface Props {
  etiqueta: string;
  pestanas: readonly Pestana[];
}

/**
 * Pestañas con subrayado bajo la activa (DESIGN.md). Los paneles siguen
 * montados al cambiar de pestaña, para no perder un formulario a medio llenar.
 */
export function Pestanas({ etiqueta, pestanas }: Props) {
  const base = useId();
  const [activa, setActiva] = useState(pestanas[0]?.id ?? '');

  const moverCon = (evento: KeyboardEvent, indice: number) => {
    const paso = evento.key === 'ArrowRight' ? 1 : evento.key === 'ArrowLeft' ? -1 : 0;
    if (paso === 0) return;
    const siguiente = pestanas[(indice + paso + pestanas.length) % pestanas.length];
    if (!siguiente) return;
    setActiva(siguiente.id);
    document.getElementById(`${base}-${siguiente.id}`)?.focus();
  };

  return (
    <div className={estilos.contenedor}>
      <div role="tablist" aria-label={etiqueta} className={estilos.lista}>
        {pestanas.map((p, i) => (
          <button
            key={p.id}
            id={`${base}-${p.id}`}
            type="button"
            role="tab"
            className={estilos.pestana}
            aria-selected={p.id === activa}
            aria-controls={`${base}-panel-${p.id}`}
            tabIndex={p.id === activa ? 0 : -1}
            onClick={() => setActiva(p.id)}
            onKeyDown={(e) => moverCon(e, i)}
          >
            {p.etiqueta}
          </button>
        ))}
      </div>
      {pestanas.map((p) => (
        <div key={p.id} id={`${base}-panel-${p.id}`} role="tabpanel" aria-labelledby={`${base}-${p.id}`} hidden={p.id !== activa}>
          {p.contenido}
        </div>
      ))}
    </div>
  );
}
