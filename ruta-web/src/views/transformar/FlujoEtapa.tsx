import { FLUJO_T, INTRO_T } from '../../config/transformar';
import estilos from './etapaT.module.css';

/** Índice de la etapa: los cuatro niveles de Kirkpatrick y cómo se aplica cada uno. */
export function FlujoEtapa() {
  return (
    <section className={`${estilos.flujo} fila-completa`} aria-labelledby="titulo-flujo-t">
      <h2 id="titulo-flujo-t" className={estilos.tituloFlujo}>
        Flujo de la etapa
      </h2>
      <p className={estilos.introFlujo}>{INTRO_T}</p>
      <div className={estilos.envolturaTabla} tabIndex={0} role="region" aria-label="Tabla del flujo de la etapa">
        <table className={estilos.tablaFlujo}>
          <thead>
            <tr>
              <th scope="col">Nivel / Momento</th>
              <th scope="col">¿Qué debe evaluar la empresa?</th>
              <th scope="col">¿Cómo lo aplica la empresa en la práctica?</th>
              <th scope="col">¿Qué evidencia debe guardar?</th>
            </tr>
          </thead>
          <tbody>
            {FLUJO_T.map((n) => (
              <tr key={n.id}>
                <th scope="row">
                  <span className={estilos.nivel}>{n.nivel}</span>
                  <span className={estilos.momento}>{n.momento}</span>
                  <span className={estilos.plan}>{n.plan}</span>
                </th>
                <td>{n.evalua}</td>
                <td>{n.practica}</td>
                <td>{n.evidencia}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
