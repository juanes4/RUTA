import { TEXTO_DECISION, type ResultadoR7 } from '../../lib/calculo/decisionR7';
import { useRuta } from '../../navegacion/RutaContexto';
import estilos from './Tablero.module.css';

/** Tarjeta oscura destacada: la recomendación R7. La herramienta recomienda; la persona decide. */
export function TarjetaDecision({ decision }: { decision: ResultadoR7 }) {
  const { enlace } = useRuta();
  const calculada = decision.estado === 'calculada';

  return (
    <section className={estilos.tarjetaOscura} aria-labelledby="titulo-decision">
      <p id="titulo-decision" className={estilos.antetituloOscuro}>
        Decisión de lanzamiento · R7
      </p>
      <p className={estilos.decision}>{calculada ? TEXTO_DECISION[decision.decision] : 'Faltan datos para recomendar'}</p>
      <ul className={estilos.motivos}>
        {(calculada ? decision.motivos : decision.faltantes).map((m) => (
          <li key={m}>{m}</li>
        ))}
      </ul>
      <a className={estilos.enlaceOscuro} href={enlace({ pagina: 'etapa', etapaId: 'etapa-r', pasoId: 'R7' })}>
        Ver R7 <span aria-hidden="true">→</span>
      </a>
    </section>
  );
}
