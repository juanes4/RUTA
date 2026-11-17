import { useId, useState } from 'react';
import { BotonIcono } from '../../components/ui/Boton';
import { Explicacion } from '../../components/ui/Explicacion';
import estilos from './formulario.module.css';

interface Props {
  etiqueta: string;
  /** Qué es la lista; se muestra en un tooltip al pasar el cursor o enfocar. */
  explicacion: string;
  valores: readonly string[];
  alCambiar(valores: string[]): void;
}

/** Lista de textos cortos (turnos, rangos de antigüedad) que se agregan con + y se quitan con −. */
export function ListaEditable({ etiqueta, explicacion, valores, alCambiar }: Props) {
  const id = useId();
  const [nuevo, setNuevo] = useState('');

  const agregar = () => {
    if (!nuevo.trim()) return;
    alCambiar([...valores, nuevo.trim()]);
    setNuevo('');
  };

  return (
    <Explicacion titulo={etiqueta} texto={explicacion}>
      {(idExplicacion) => (
        <div className={estilos.formulario}>
          <label htmlFor={id} className={estilos.subtitulo}>
            {etiqueta}
          </label>
          <div className={estilos.agregar}>
            <input
              id={id}
              aria-describedby={idExplicacion}
              className={estilos.control}
              value={nuevo}
              onChange={(e) => setNuevo(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  agregar();
                }
              }}
            />
            <BotonIcono accion="agregar" etiqueta={`Agregar a ${etiqueta.toLowerCase()}`} onClick={agregar} />
          </div>
          {valores.length > 0 && (
            <ul className={estilos.chips}>
              {valores.map((valor, i) => (
                <li key={`${valor}-${i}`} className={estilos.chip}>
                  {valor}
                  <BotonIcono
                    accion="quitar"
                    etiqueta={`Quitar ${valor}`}
                    onClick={() => alCambiar(valores.filter((_, j) => j !== i))}
                  />
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </Explicacion>
  );
}
