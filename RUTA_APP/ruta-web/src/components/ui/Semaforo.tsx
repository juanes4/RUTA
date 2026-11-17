import { PALABRA_SEMAFORO, type EstadoSemaforo } from '../../lib/calculo/semaforo';
import estilos from './Semaforo.module.css';

/** Estado del semáforo: siempre con palabra, nunca solo color (PLAN §6). */
export function Semaforo({ estado }: { estado: EstadoSemaforo }) {
  return (
    <span className={estilos.semaforo} data-estado={estado}>
      <span className={estilos.punto} aria-hidden="true" />
      {PALABRA_SEMAFORO[estado]}
    </span>
  );
}
