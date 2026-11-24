import { useState, type FormEvent } from 'react';
import { Boton } from '../../components/ui/Boton';
import { CampoArea, CampoSeleccion, CampoTexto } from '../../components/ui/Campo';
import { ESTILOS_LIDERAZGO } from '../../config/formularios/liderazgo';
import { PARTES_NARRATIVA } from '../../config/formularios/unir';
import { EXPLICACION_NARRATIVA as EX } from '../../contenido/unir';
import { useProyecto } from '../../estado/ProyectoContexto';
import { useBorrador } from '../../hooks/useBorrador';
import { resumirLiderazgo, vocerosSugeridos } from '../../lib/calculo/liderazgo';
import type { Lienzo, Narrativa } from '../../lib/modelo/proyecto';
import { PieFormulario } from '../etapa0/PieFormulario';
import formulario from '../etapa0/formulario.module.css';
import { MENSAJE_SIN_ESPACIO } from '../reconocer/ayudas';
import estilos from '../reconocer/reconocer.module.css';

/** Lo que el lienzo (R1) ya dice para cada campo de la narrativa. */
function desdeLienzo(l: Lienzo): Omit<Narrativa, 'vocero' | 'acompanamiento'> {
  const lineas = (filas: string[]) => filas.filter((f) => f.trim()).join('\n');
  return {
    urgencia: lineas(l.urgencia.map((m) => [m.motivo, m.dato].filter((t) => t.trim()).join(': '))),
    vision: l.vision,
    que_cambia: l.que_cambia,
    que_se_mantiene: l.que_no_cambia,
    que_gano: lineas(l.beneficios.map((b) => `${b.grupo}: ${b.beneficio}`)),
  };
}

const limpiar = (n: Narrativa): Narrativa => ({
  vocero: n.vocero.trim(),
  urgencia: n.urgencia.trim(),
  vision: n.vision.trim(),
  que_cambia: n.que_cambia.trim(),
  que_se_mantiene: n.que_se_mantiene.trim(),
  acompanamiento: n.acompanamiento.trim(),
  que_gano: n.que_gano.trim(),
});

/** U2: narrativa del cambio en 3 partes y su vocero. */
export function PasoNarrativa() {
  const { datos, actualizarDatos } = useProyecto();
  const [error, setError] = useState('');
  const { borrador, editar, confirmar, estado } = useBorrador<Narrativa>(datos.narrativa, async (n) =>
    actualizarDatos((d) => ({ ...d, narrativa: limpiar(n) })),
  );
  const lideres = resumirLiderazgo(datos.liderazgo);
  const sugeridos = new Set(vocerosSugeridos(lideres).map((l) => l.lider_id));
  const ordenados = [...lideres].sort((a, b) => Number(sugeridos.has(b.lider_id)) - Number(sugeridos.has(a.lider_id)));
  const delLienzo = desdeLienzo(datos.lienzo);
  const hayLienzo = Object.values(delLienzo).some((v) => v.trim());

  const traerDelLienzo = () =>
    editar((n) => {
      const nueva = { ...n };
      for (const [clave, valor] of Object.entries(delLienzo) as [keyof typeof delLienzo, string][]) {
        if (!nueva[clave].trim()) nueva[clave] = valor;
      }
      return nueva;
    });

  const enviar = async (evento: FormEvent) => {
    evento.preventDefault();
    setError('');
    try {
      await confirmar();
    } catch {
      setError(MENSAJE_SIN_ESPACIO);
    }
  };

  return (
    <form className={formulario.formulario} onSubmit={(e) => void enviar(e)}>
      <section className={estilos.bloque} aria-labelledby="narrativa-vocero">
        <h3 id="narrativa-vocero" className={estilos.tituloBloque}>
          Quién comunica el cambio
        </h3>
        {lideres.length > 0 ? (
          <CampoSeleccion etiqueta="Vocero" explicacion={EX.vocero} value={borrador.vocero} onChange={(e) => editar((n) => ({ ...n, vocero: e.target.value }))}>
            <option value="">Elegir…</option>
            {ordenados.map((l) => (
              <option key={l.lider_id} value={l.lider_id}>
                {l.lider_id} · {l.dominantes.map((d) => ESTILOS_LIDERAZGO[d].nombre).join(' / ')}
                {sugeridos.has(l.lider_id) ? ' (sugerido)' : ''}
              </option>
            ))}
          </CampoSeleccion>
        ) : (
          <CampoTexto
            etiqueta="Vocero (código o cargo)"
            explicacion={EX.vocero}
            ayuda="Registra la encuesta de liderazgo (U1) para ver los voceros sugeridos."
            value={borrador.vocero}
            onChange={(e) => editar((n) => ({ ...n, vocero: e.target.value }))}
          />
        )}
      </section>

      {hayLienzo && (
        <div>
          <Boton variante="secundario" onClick={traerDelLienzo}>
            Completar con el lienzo del cambio (R1)
          </Boton>
          <p className={estilos.nota}>Solo llena los campos vacíos; no reemplaza lo que ya escribiste.</p>
        </div>
      )}

      {PARTES_NARRATIVA.map((parte) => (
        <section key={parte.numero} className={estilos.bloque} aria-labelledby={`narrativa-${parte.numero}`}>
          <h3 id={`narrativa-${parte.numero}`} className={estilos.tituloBloque}>
            <span className="numero">{parte.numero}.</span> {parte.titulo}
          </h3>
          <dl className={estilos.guiaNarrativa}>
            <dt>Propósito</dt>
            <dd>{parte.proposito}</dd>
            <dt>Mensaje clave</dt>
            <dd>{parte.mensajeClave}</dd>
          </dl>
          <div className={formulario.rejilla}>
            {parte.campos.map((c) => (
              <div key={c.clave} className={parte.campos.length === 1 ? formulario.ancho : undefined}>
                <CampoArea etiqueta={c.etiqueta} value={borrador[c.clave]} onChange={(e) => editar((n) => ({ ...n, [c.clave]: e.target.value }))} />
              </div>
            ))}
          </div>
        </section>
      ))}

      {error && (
        <p className={estilos.aviso} role="alert">
          {error}
        </p>
      )}
      <PieFormulario estado={estado} />
    </form>
  );
}
