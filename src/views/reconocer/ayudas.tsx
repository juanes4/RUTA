import { Boton } from '../../components/ui/Boton';
import estilos from './reconocer.module.css';

interface PropsNumero {
  etiqueta: string;
  valor: number | null;
  min: number;
  max?: number;
  alCambiar(valor: number | null): void;
}

/** Número editable dentro de una tabla. Se guarda al salir del campo; si no es válido, vuelve al valor anterior. */
export function EntradaNumero({ etiqueta, valor, min, max, alCambiar }: PropsNumero) {
  const texto = valor === null ? '' : String(valor);
  return (
    <input
      key={texto}
      className={`${estilos.control} numero`}
      type="number"
      aria-label={etiqueta}
      min={min}
      max={max}
      step={1}
      defaultValue={texto}
      onBlur={(e) => {
        const nuevo = e.target.value.trim();
        if (nuevo === '') {
          if (valor !== null) alCambiar(null);
          return;
        }
        const numero = Number(nuevo);
        if (!Number.isInteger(numero) || numero < min || (max !== undefined && numero > max)) {
          e.target.value = texto;
        } else if (numero !== valor) {
          alCambiar(numero);
        }
      }}
    />
  );
}

interface PropsBorrar {
  texto: string;
  /** Pregunta de confirmación: borrar no se puede deshacer. */
  confirmacion: string;
  alBorrar(): void;
}

/** Borra todo lo capturado de un formulario, previa confirmación. */
export function BorrarRespuestas({ texto, confirmacion, alBorrar }: PropsBorrar) {
  return (
    <div>
      <Boton variante="secundario" onClick={() => window.confirm(confirmacion) && alBorrar()}>
        {texto}
      </Boton>
    </div>
  );
}

export const MENSAJE_SIN_ESPACIO =
  'No se pudo guardar: el navegador no tiene más espacio para esta herramienta. No se perdió lo que ya estaba guardado.';

export const hoy = (): string => new Date().toISOString().slice(0, 10);
