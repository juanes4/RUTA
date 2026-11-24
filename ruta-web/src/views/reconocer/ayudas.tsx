import { Boton, BotonIcono } from '../../components/ui/Boton';
import { Explicacion } from '../../components/ui/Explicacion';
import formulario from '../etapa0/formulario.module.css';
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

interface Columna<T> {
  clave: keyof T & string;
  titulo: string;
  explicacion: string;
}

interface PropsPares<T extends Record<string, string>> {
  columnas: readonly [Columna<T>, Columna<T>];
  filas: readonly T[];
  /** Nombre de una fila, para los botones y el lector de pantalla ("beneficio"). */
  nombreFila: string;
  vacia: T;
  alCambiar(filas: T[]): void;
}

/** Tabla editable de dos columnas de texto, con + para agregar filas y − para quitarlas. */
export function TablaPares<T extends Record<string, string>>({ columnas, filas, nombreFila, vacia, alCambiar }: PropsPares<T>) {
  const editar = (i: number, clave: keyof T, valor: string) => alCambiar(filas.map((f, j) => (j === i ? { ...f, [clave]: valor } : f)));
  return (
    <>
      {filas.length > 0 && (
        <table className={formulario.tabla}>
          <thead>
            <tr>
              {columnas.map((c) => (
                <th key={c.clave} scope="col">
                  <Explicacion titulo={c.titulo} texto={c.explicacion} enfocable>
                    {() => c.titulo}
                  </Explicacion>
                </th>
              ))}
              <th scope="col" className={formulario.columnaAccion}>
                <span className="solo-lectores">Acciones</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {filas.map((f, i) => (
              <tr key={i}>
                {columnas.map((c) => (
                  <td key={c.clave}>
                    <input
                      className={formulario.control}
                      aria-label={`${c.titulo} ${i + 1}`}
                      value={f[c.clave]}
                      onChange={(e) => editar(i, c.clave, e.target.value)}
                    />
                  </td>
                ))}
                <td className={formulario.columnaAccion}>
                  <BotonIcono accion="quitar" etiqueta={`Quitar ${nombreFila} ${i + 1}`} onClick={() => alCambiar(filas.filter((_, j) => j !== i))} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <div>
        <BotonIcono accion="agregar" etiqueta={`Agregar ${nombreFila}`} etiquetaVisible onClick={() => alCambiar([...filas, { ...vacia }])} />
      </div>
    </>
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

/** Pregunta guía bajo el título de un bloque. */
export function PreguntaGuia({ children }: { children: string }) {
  return <p className={estilos.pregunta}>{children}</p>;
}

export const MENSAJE_SIN_ESPACIO =
  'No se pudo guardar: el navegador no tiene más espacio para esta herramienta. No se perdió lo que ya estaba guardado.';

export const hoy = (): string => new Date().toISOString().slice(0, 10);
