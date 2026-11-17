import type { FormEvent } from 'react';
import { CampoSeleccion, CampoTexto } from '../../components/ui/Campo';
import { EXPLICACION_CAMPO as EX } from '../../contenido/etapa0';
import { useBorrador } from '../../hooks/useBorrador';
import type { ConfiguracionUso, UnidadUso } from '../../lib/modelo/proyecto';
import { PieFormulario } from './PieFormulario';
import estilos from './formulario.module.css';

interface Props {
  uso: ConfiguracionUso;
  guardar(uso: ConfiguracionUso): Promise<void>;
}

/** Unidades que lista el documento (CONTEXTO §7). */
const UNIDADES: readonly { valor: UnidadUso; texto: string }[] = [
  { valor: 'transacciones', texto: 'Transacciones' },
  { valor: 'casos', texto: 'Casos' },
  { valor: 'cargos', texto: 'Cargos' },
  { valor: 'equipos', texto: 'Equipos' },
];

/** Paso 0.4: qué se cuenta como "uso" y cuánto dura un ciclo. */
export function FormUso({ uso, guardar }: Props) {
  const { borrador, editar, confirmar, estado } = useBorrador(uso, guardar);

  const enviar = (evento: FormEvent) => {
    evento.preventDefault();
    void confirmar();
  };

  return (
    <form className={estilos.formulario} onSubmit={enviar}>
      <div className={estilos.rejilla}>
        <CampoSeleccion
          etiqueta="Qué se cuenta como uso"
          explicacion={EX.unidad}
          value={borrador.unidad ?? ''}
          onChange={(e) => editar((u) => ({ ...u, unidad: (e.target.value || null) as UnidadUso | null }))}
        >
          <option value="">Elegir…</option>
          {UNIDADES.map((u) => (
            <option key={u.valor} value={u.valor}>
              {u.texto}
            </option>
          ))}
        </CampoSeleccion>
        <CampoTexto
          etiqueta="Días por ciclo"
          explicacion={EX.dias_por_ciclo}
          type="number"
          min={1}
          step={1}
          value={borrador.dias_por_ciclo}
          onChange={(e) => editar((u) => ({ ...u, dias_por_ciclo: Number(e.target.value) }))}
        />
      </div>
      <PieFormulario estado={estado} />
    </form>
  );
}
