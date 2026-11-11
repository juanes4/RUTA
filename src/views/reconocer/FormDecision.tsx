import { useState, type FormEvent } from 'react';
import { CampoSeleccion, CampoTexto } from '../../components/ui/Campo';
import { DECISION_R7 } from '../../config/formularios/reconocer';
import { REGLAS } from '../../config/reglas';
import { EXPLICACION_DECISION as EX } from '../../contenido/reconocer';
import { useProyecto } from '../../estado/ProyectoContexto';
import { useBorrador } from '../../hooks/useBorrador';
import { TEXTO_DECISION, type DecisionR7 } from '../../lib/calculo/decisionR7';
import { borradorDecision, registroDe, validarDecision, type BorradorDecision } from '../../lib/reconocer/decision';
import { resultadosKotter } from '../../lib/reconocer/resultadosKotter';
import { PieFormulario } from '../etapa0/PieFormulario';
import formulario from '../etapa0/formulario.module.css';
import { hoy, MENSAJE_SIN_ESPACIO } from './ayudas';
import estilos from './reconocer.module.css';

/** R7: registra lo que decidió la persona responsable, con fecha, cargo y los tres riesgos principales. */
export function FormDecision() {
  const { datos, actualizarDatos } = useProyecto();
  const [errores, setErrores] = useState<string[]>([]);
  const { borrador, editar, confirmar, estado } = useBorrador<BorradorDecision>(borradorDecision(datos.decision, DECISION_R7.riesgos, hoy()), async (b) => {
    if (!b.decision) return;
    const decision = registroDe({ ...b, decision: b.decision });
    await actualizarDatos((d) => ({ ...d, decision }));
  });

  const recomendacion = resultadosKotter(datos, REGLAS).decision;
  const textoRecomendacion = recomendacion.estado === 'calculada' ? TEXTO_DECISION[recomendacion.decision] : 'faltan datos para recomendar';

  const enviar = async (evento: FormEvent) => {
    evento.preventDefault();
    const problemas = validarDecision(borrador, DECISION_R7.riesgos);
    setErrores(problemas);
    if (problemas.length > 0) return;
    try {
      await confirmar();
    } catch {
      setErrores([MENSAJE_SIN_ESPACIO]);
    }
  };

  return (
    <form className={formulario.formulario} onSubmit={(e) => void enviar(e)}>
      <p className={estilos.nota}>La herramienta recomienda: {textoRecomendacion}. La decisión la toma una persona.</p>
      <div className={formulario.rejilla}>
        <CampoSeleccion
          etiqueta="Decisión"
          explicacion={EX.decision}
          value={borrador.decision}
          onChange={(e) => editar((b) => ({ ...b, decision: e.target.value as DecisionR7 | '' }))}
        >
          <option value="">Elegir…</option>
          {Object.entries(TEXTO_DECISION).map(([valor, texto]) => (
            <option key={valor} value={valor}>
              {texto}
            </option>
          ))}
        </CampoSeleccion>
        <CampoTexto etiqueta="Fecha" explicacion={EX.fecha} type="date" value={borrador.fecha} onChange={(e) => editar((b) => ({ ...b, fecha: e.target.value }))} />
        <div className={formulario.ancho}>
          <CampoTexto etiqueta="Responsable" explicacion={EX.responsable} value={borrador.responsable} onChange={(e) => editar((b) => ({ ...b, responsable: e.target.value }))} />
        </div>
        {borrador.riesgos.map((riesgo, i) => (
          <div key={i} className={formulario.ancho}>
            <CampoTexto
              etiqueta={`Riesgo principal ${i + 1}`}
              explicacion={EX.riesgo}
              value={riesgo}
              onChange={(e) => editar((b) => ({ ...b, riesgos: b.riesgos.map((r, j) => (j === i ? e.target.value : r)) }))}
            />
          </div>
        ))}
      </div>
      <PieFormulario estado={estado} errores={errores} />
    </form>
  );
}
