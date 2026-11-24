import type { EstadoEnvio } from '../../hooks/useRegistros';
import estilos from './etapaT.module.css';

/** Resultado de guardar: el error se anuncia de inmediato; el éxito, con calma. */
export function MensajeEnvio({ estado }: { estado: EstadoEnvio }) {
  if (estado.fase === 'error') {
    return (
      <p className={estilos.mensajeError} role="alert">
        {estado.mensaje}
      </p>
    );
  }
  return (
    <p className={estilos.mensajeOk} role="status">
      {estado.fase === 'ok' ? estado.mensaje : ''}
    </p>
  );
}
