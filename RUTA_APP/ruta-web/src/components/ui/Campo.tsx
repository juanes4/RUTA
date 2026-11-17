import { useId, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react';
import { Explicacion } from './Explicacion';
import estilos from './Campo.module.css';

interface Base {
  etiqueta: string;
  /** Texto visible bajo el control. */
  ayuda?: ReactNode;
  /** Qué es el campo; se muestra en un tooltip al pasar el cursor o enfocar. */
  explicacion?: string;
}

interface PropsEnvoltura extends Base {
  /** Recibe el id del control y su `aria-describedby`. */
  children(id: string, describedBy: string | undefined): ReactNode;
}

function Envoltura({ etiqueta, ayuda, explicacion, children }: PropsEnvoltura) {
  const id = useId();
  const idAyuda = ayuda ? `${id}-ayuda` : undefined;

  const campo = (idExplicacion?: string) => {
    const describedBy = [idExplicacion, idAyuda].filter(Boolean).join(' ') || undefined;
    return (
      <div className={estilos.campo}>
        <label htmlFor={id} className={estilos.etiqueta}>
          {etiqueta}
        </label>
        {children(id, describedBy)}
        {ayuda && (
          <p id={idAyuda} className={estilos.ayuda}>
            {ayuda}
          </p>
        )}
      </div>
    );
  };

  return explicacion ? <Explicacion titulo={etiqueta} texto={explicacion}>{(idExplicacion) => campo(idExplicacion)}</Explicacion> : campo();
}

export function CampoTexto({ etiqueta, ayuda, explicacion, ...resto }: Base & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <Envoltura etiqueta={etiqueta} ayuda={ayuda} explicacion={explicacion}>
      {(id, describedBy) => <input id={id} className={estilos.control} aria-describedby={describedBy} {...resto} />}
    </Envoltura>
  );
}

export function CampoArea({ etiqueta, ayuda, explicacion, ...resto }: Base & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <Envoltura etiqueta={etiqueta} ayuda={ayuda} explicacion={explicacion}>
      {(id, describedBy) => (
        <textarea id={id} className={estilos.control} rows={3} aria-describedby={describedBy} {...resto} />
      )}
    </Envoltura>
  );
}

export function CampoSeleccion({
  etiqueta,
  ayuda,
  explicacion,
  children,
  ...resto
}: Base & SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <Envoltura etiqueta={etiqueta} ayuda={ayuda} explicacion={explicacion}>
      {(id, describedBy) => (
        <select id={id} className={estilos.control} aria-describedby={describedBy} {...resto}>
          {children}
        </select>
      )}
    </Envoltura>
  );
}
