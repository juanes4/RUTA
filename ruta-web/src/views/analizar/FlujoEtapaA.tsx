import { FLUJO_A, INTRO_A } from '../../config/analizar';
import estilos from './etapaA.module.css';

/** Índice de la etapa A: tabla del flujo de A1 y A2. */
export function FlujoEtapaA() {
  return (
    <section className={`${estilos.flujo} fila-completa`} aria-labelledby="titulo-flujo-a">
      <h2 id="titulo-flujo-a" className={estilos.tituloFlujo}>
        Flujo de la etapa
      </h2>
      <p className={estilos.introFlujo}>{INTRO_A}</p>
      <div className={estilos.envolturaTabla} tabIndex={0} role="region" aria-label="Tabla del flujo de la etapa Analizar">
        <table className={estilos.tabla}>
          <thead>
            <tr>
              <th scope="col">Paso</th>
              <th scope="col">Qué se hace</th>
              <th scope="col">Formato</th>
            </tr>
          </thead>
          <tbody>
            {FLUJO_A.map((f) => (
              <tr key={f.id}>
                <th scope="row">{f.paso}</th>
                <td>{f.queSeHace}</td>
                <td>{f.formato}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
