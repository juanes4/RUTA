import type { ReactNode } from 'react';
import estilos from './Aviso.module.css';

/**
 * atencion: falta algo antes de seguir (ámbar).
 * peligro: algo salió mal o es delicado (rojo).
 * info: contexto que conviene saber (azul).
 */
export type TonoAviso = 'atencion' | 'peligro' | 'info';

interface Props {
  tono?: TonoAviso;
  /** Frase corta en negrita, arriba del texto. */
  titulo?: ReactNode;
  children?: ReactNode;
  /** Etiquetas cortas bajo el texto (por ejemplo, los datos que se enmascaran). */
  etiquetas?: readonly string[];
  /** Botones o enlaces para resolver el aviso. */
  accion?: ReactNode;
  /** alert solo para errores que acaban de pasar; status para el resto. */
  role?: 'alert' | 'status';
  className?: string;
}

const SIMBOLO: Record<TonoAviso, string> = { atencion: '!', peligro: '!', info: 'i' };

/** Aviso que hay que leer: tarjeta flotante con el color del tono, icono y título. */
export function Aviso({ tono = 'atencion', titulo, children, etiquetas, accion, role, className }: Props) {
  return (
    <div className={`${estilos.aviso} ${className ?? ''}`} data-tono={tono} role={role}>
      <span className={estilos.icono} aria-hidden="true">
        {SIMBOLO[tono]}
      </span>
      <div className={estilos.cuerpo}>
        {titulo && <p className={estilos.titulo}>{titulo}</p>}
        {children && <div className={estilos.texto}>{children}</div>}
        {etiquetas && etiquetas.length > 0 && (
          <ul className={estilos.etiquetas}>
            {etiquetas.map((e) => (
              <li key={e}>{e}</li>
            ))}
          </ul>
        )}
        {accion && <div className={estilos.accion}>{accion}</div>}
      </div>
    </div>
  );
}
