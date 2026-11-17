import type { FormEvent } from 'react';
import type { MetaResuelta } from '../../lib/proyecto/etapa0';
import { ajustesDeMetas } from '../../lib/proyecto/etapa0';
import type { MetasAjustadas } from '../../lib/modelo/proyecto';
import { Explicacion } from '../../components/ui/Explicacion';
import { EXPLICACION_CAMPO as EX } from '../../contenido/etapa0';
import { useBorrador } from '../../hooks/useBorrador';
import { PieFormulario } from './PieFormulario';
import estilos from './formulario.module.css';

interface Props {
  metas: readonly MetaResuelta[];
  guardar(ajustes: MetasAjustadas): Promise<void>;
}

const TEXTO_SENTIDO = { mayor_mejor: 'Mayor es mejor', menor_mejor: 'Menor es mejor' } as const;

/** Los porcentajes se editan como 0–100 y se guardan como fracción. */
function aPantalla(meta: MetaResuelta, valor: number): number {
  return meta.unidad === 'porcentaje' ? Math.round(valor * 1000) / 10 : valor;
}

function desdePantalla(meta: MetaResuelta, valor: number): number {
  return meta.unidad === 'porcentaje' ? valor / 100 : valor;
}

/** Paso 0.3: metas precargadas del documento y editables por la empresa. */
export function FormMetas({ metas, guardar }: Props) {
  const inicial = Object.fromEntries(metas.map((m) => [m.id, m.meta]));
  const { borrador, editar, confirmar, estado } = useBorrador<Record<string, number>>(inicial, async (valores) =>
    guardar(ajustesDeMetas(valores)),
  );

  const enviar = (evento: FormEvent) => {
    evento.preventDefault();
    void confirmar();
  };

  return (
    <form className={estilos.formulario} onSubmit={enviar}>
      <table className={estilos.tabla}>
        <thead>
          <tr>
            <th scope="col">Indicador</th>
            <th scope="col">
              <Explicacion titulo="Meta" texto={EX.meta} enfocable>
                {() => 'Meta'}
              </Explicacion>
            </th>
            <th scope="col">
              <Explicacion titulo="Sentido" texto={EX.sentido} enfocable>
                {() => 'Sentido'}
              </Explicacion>
            </th>
            <th scope="col">
              <Explicacion titulo="Del documento" texto={EX.del_documento} enfocable>
                {() => 'Del documento'}
              </Explicacion>
            </th>
          </tr>
        </thead>
        <tbody>
          {metas.map((m) => {
            const valor = borrador[m.id] ?? m.meta;
            const sufijo = m.unidad === 'porcentaje' ? '%' : 'de 5';
            return (
              <tr key={m.id}>
                <th scope="row" className={estilos.nombreFila}>
                  <Explicacion titulo={m.nombre} texto={`${m.queMide} Dato: ${m.fuenteDato}.`} enfocable>
                    {() => m.nombre}
                  </Explicacion>
                </th>
                <td>
                  <input
                    className={`${estilos.control} ${estilos.controlCorto} numero`}
                    type="number"
                    step="any"
                    min={0}
                    max={m.unidad === 'porcentaje' ? 100 : 5}
                    aria-label={`Meta de ${m.nombre} (${sufijo})`}
                    value={aPantalla(m, valor)}
                    onChange={(e) => editar((b) => ({ ...b, [m.id]: desdePantalla(m, Number(e.target.value)) }))}
                  />{' '}
                  {sufijo}
                </td>
                <td>{TEXTO_SENTIDO[m.sentido]}</td>
                <td className="numero">
                  {aPantalla(m, m.valorPorDefecto)} {sufijo}
                  {valor !== m.valorPorDefecto && (
                    <>
                      {' '}
                      <span className={estilos.insignia}>Ajustada</span>
                    </>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <PieFormulario estado={estado} />
    </form>
  );
}
