import { useId, type ReactNode } from 'react';
import estilos from './Explicacion.module.css';

interface Props {
  /** Nombre del campo, primera línea del tooltip. */
  titulo: string;
  /** Qué es el campo y para qué sirve. */
  texto: string;
  /**
   * Recibe el id del texto para enlazarlo con `aria-describedby` en el
   * control, así quien usa lector de pantalla también lo oye.
   */
  children(idExplicacion: string): ReactNode;
  /** Si lo envuelto no es un control (un título de columna), se puede enfocar con el teclado. */
  enfocable?: boolean;
}

/**
 * Explicación de un campo en un tooltip negro (DESIGN.md: tooltips en negro).
 * Aparece al pasar el cursor y al enfocar con el teclado o tocar el campo.
 */
export function Explicacion({ titulo, texto, children, enfocable = false }: Props) {
  const id = useId();
  return (
    <div className={estilos.contenedor} tabIndex={enfocable ? 0 : undefined} aria-describedby={enfocable ? id : undefined}>
      {children(id)}
      <span id={id} role="tooltip" className={estilos.tooltip}>
        <span className={estilos.tituloTooltip} aria-hidden="true">
          {titulo}
        </span>
        <span className={estilos.textoTooltip}>{texto}</span>
      </span>
    </div>
  );
}
