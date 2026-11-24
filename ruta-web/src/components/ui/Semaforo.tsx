import type { NivelSemaforoTriaje } from '../../config/formularios/reconocer';
import estilos from './Semaforo.module.css';

/** Semáforo: siempre con palabra, nunca solo color. */
export function Semaforo({ estado, texto }: { estado: NivelSemaforoTriaje; texto: string }) {
  return (
    <span className={estilos.semaforo} data-estado={estado}>
      <span className={estilos.punto} aria-hidden="true" />
      {texto}
    </span>
  );
}
