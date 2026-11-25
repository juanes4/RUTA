import type { ReactNode } from 'react';
import estilos from './EnlaceFlecha.module.css';

interface Props {
  href: string;
  /** atras: flecha a la izquierda (volver, paso anterior). adelante: a la derecha. */
  direccion?: 'atras' | 'adelante';
  /** Texto pequeño sobre el principal ("Anterior", "Siguiente"). */
  antetitulo?: string;
  children: ReactNode;
}

/** Enlace de navegación: pastilla discreta con la flecha en un círculo. */
export function EnlaceFlecha({ href, direccion = 'atras', antetitulo, children }: Props) {
  return (
    <a className={estilos.enlace} href={href} data-direccion={direccion}>
      <span className={estilos.circulo} aria-hidden="true">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          {direccion === 'atras' ? <path d="M15 5l-7 7 7 7" /> : <path d="M9 5l7 7-7 7" />}
        </svg>
      </span>
      <span className={estilos.texto}>
        {antetitulo && <span className={estilos.antetitulo}>{antetitulo}</span>}
        <span className={estilos.principal}>{children}</span>
      </span>
    </a>
  );
}
