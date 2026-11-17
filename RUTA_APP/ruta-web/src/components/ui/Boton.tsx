import type { ButtonHTMLAttributes } from 'react';
import estilos from './Boton.module.css';

/**
 * principal: negro con texto blanco (DESIGN.md, "Estructura").
 * secundario: fondo sólido con el acento de acción (DESIGN.md, "botón claro").
 * Los dos tienen la altura de los campos, para alinearse con ellos.
 */
type Variante = 'principal' | 'secundario';

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variante?: Variante;
}

export function Boton({ variante = 'principal', className, children, type = 'button', ...resto }: Props) {
  return (
    <button type={type} className={`${estilos.boton} ${estilos[variante]} ${className ?? ''}`} {...resto}>
      {children}
    </button>
  );
}

interface PropsIcono extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  accion: 'agregar' | 'quitar';
  /** Siempre obligatoria: es lo que lee el lector de pantalla. */
  etiqueta: string;
  /** Si se da, la etiqueta también se ve al lado del círculo. */
  etiquetaVisible?: boolean;
}

/** Botón redondo con + o −, alineado con los campos. */
export function BotonIcono({ accion, etiqueta, etiquetaVisible = false, className, type = 'button', ...resto }: PropsIcono) {
  return (
    <button
      type={type}
      className={`${estilos.icono} ${className ?? ''}`}
      data-accion={accion}
      data-con-etiqueta={etiquetaVisible}
      aria-label={etiquetaVisible ? undefined : etiqueta}
      {...resto}
    >
      <span className={estilos.circulo} aria-hidden="true">
        {accion === 'agregar' ? '+' : '−'}
      </span>
      {etiquetaVisible && etiqueta}
    </button>
  );
}
