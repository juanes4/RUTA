import type { ReactNode } from 'react';
import estilos from './EstadoVacio.module.css';

interface Props {
  titulo: string;
  /** Qué dato falta y de dónde sale (PLAN §4, "Estados vacíos"). */
  children: ReactNode;
  accion?: ReactNode;
}

/** Lo que se muestra cuando un indicador no tiene datos. Nunca se rellena con datos inventados. */
export function EstadoVacio({ titulo, children, accion }: Props) {
  return (
    <div className={estilos.vacio} role="status">
      <p className={estilos.titulo}>{titulo}</p>
      <div className={estilos.texto}>{children}</div>
      {accion}
    </div>
  );
}
