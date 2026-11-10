import { useState, type FormEvent } from 'react';
import { BotonIcono } from '../../components/ui/Boton';
import { Explicacion } from '../../components/ui/Explicacion';
import { EXPLICACION_CAMPO as EX } from '../../contenido/etapa0';
import { useBorrador } from '../../hooks/useBorrador';
import type { AreaAfectada, Segmentacion } from '../../lib/modelo/proyecto';
import { normalizarSegmentacion, validarAreas } from '../../lib/proyecto/etapa0';
import { ListaEditable } from './ListaEditable';
import { PieFormulario } from './PieFormulario';
import estilos from './formulario.module.css';

interface Props {
  segmentacion: Segmentacion;
  guardar(segmentacion: Segmentacion): Promise<void>;
}

/** Paso 0.2: grupos y afectados. Los afectados por área son la base de la participación. */
export function FormSegmentacion({ segmentacion, guardar }: Props) {
  const { borrador, editar, confirmar, estado } = useBorrador(segmentacion, guardar);
  const [errores, setErrores] = useState<string[]>([]);

  const editarArea = (indice: number, cambio: Partial<AreaAfectada>) =>
    editar((s) => ({ ...s, areas: s.areas.map((a, i) => (i === indice ? { ...a, ...cambio } : a)) }));

  const enviar = (evento: FormEvent) => {
    evento.preventDefault();
    const problemas = validarAreas(borrador.areas).map((e) => e.mensaje);
    setErrores(problemas);
    if (problemas.length === 0) void confirmar(normalizarSegmentacion(borrador));
  };

  const totalAfectados = borrador.areas.reduce((suma, a) => suma + (Number.isFinite(a.afectados) ? a.afectados : 0), 0);

  return (
    <form className={estilos.formulario} onSubmit={enviar}>
      <p className={estilos.subtitulo}>Áreas y personas afectadas</p>
      {borrador.areas.length > 0 && (
        <table className={estilos.tabla}>
          <thead>
            <tr>
              <th scope="col">Área</th>
              <th scope="col">Afectados</th>
              <th scope="col" className={estilos.columnaAccion}>
                <span className="solo-lectores">Acciones</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {borrador.areas.map((a, i) => (
              <tr key={i}>
                <td>
                  <Explicacion titulo="Área" texto={EX.area}>
                    {(idExplicacion) => (
                      <input
                        className={estilos.control}
                        aria-label={`Nombre del área ${i + 1}`}
                        aria-describedby={idExplicacion}
                        value={a.area}
                        onChange={(e) => editarArea(i, { area: e.target.value })}
                      />
                    )}
                  </Explicacion>
                </td>
                <td>
                  <Explicacion titulo="Afectados" texto={EX.afectados}>
                    {(idExplicacion) => (
                      <input
                        className={`${estilos.control} ${estilos.controlCorto} numero`}
                        aria-label={`Afectados del área ${i + 1}`}
                        aria-describedby={idExplicacion}
                        type="number"
                        min={0}
                        step={1}
                        value={Number.isFinite(a.afectados) ? a.afectados : ''}
                        onChange={(e) =>
                          editarArea(i, { afectados: e.target.value === '' ? Number.NaN : Number(e.target.value) })
                        }
                      />
                    )}
                  </Explicacion>
                </td>
                <td className={estilos.columnaAccion}>
                  <BotonIcono
                    accion="quitar"
                    etiqueta={`Quitar el área ${a.area || i + 1}`}
                    onClick={() => editar((s) => ({ ...s, areas: s.areas.filter((_, j) => j !== i) }))}
                  />
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td>Total</td>
              <td className="numero">{totalAfectados}</td>
              <td />
            </tr>
          </tfoot>
        </table>
      )}
      <div>
        <BotonIcono
          accion="agregar"
          etiqueta="Agregar área"
          etiquetaVisible
          onClick={() => editar((s) => ({ ...s, areas: [...s.areas, { area: '', afectados: 0 }] }))}
        />
      </div>

      <div className={estilos.rejilla}>
        <ListaEditable
          etiqueta="Turnos o sedes"
          explicacion={EX.turnos}
          valores={borrador.turnos}
          alCambiar={(turnos) => editar((s) => ({ ...s, turnos }))}
        />
        <ListaEditable
          etiqueta="Rangos de antigüedad"
          explicacion={EX.rangos_antiguedad}
          valores={borrador.rangos_antiguedad}
          alCambiar={(rangos_antiguedad) => editar((s) => ({ ...s, rangos_antiguedad }))}
        />
      </div>
      <PieFormulario estado={estado} errores={errores} />
    </form>
  );
}
