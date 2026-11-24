import { Component, type ReactNode } from 'react';
import estilos from './copiloto.module.css';

interface Props {
  children: ReactNode;
  /** Borra solo lo guardado por el copiloto en el proyecto (R1 a R5 no se tocan). */
  alReiniciar(): Promise<void>;
}

interface Estado {
  error: Error | null;
}

/**
 * Si algo del copiloto falla al dibujarse, muestra un aviso en lugar de dejar
 * toda la página en blanco, y permite reiniciar los datos del copiloto.
 */
export class LimiteErrores extends Component<Props, Estado> {
  override state: Estado = { error: null };

  static getDerivedStateFromError(error: Error): Estado {
    return { error };
  }

  override componentDidCatch(error: Error) {
    console.error('[copiloto] Error al dibujar el copiloto:', error);
  }

  private reiniciar = async () => {
    await this.props.alReiniciar();
    this.setState({ error: null });
  };

  override render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className={`${estilos.error} fila-completa`} role="alert">
        <span>
          El copiloto tuvo un error al mostrarse ({this.state.error.message}). Prueba con «Volver a intentar»; si se repite, reinicia los datos del copiloto de
          este proyecto (lo que ya pasaste a R1, R2 y las respuestas de R5 se conservan).
        </span>
        <button type="button" className={estilos.enlaceBoton} onClick={() => this.setState({ error: null })}>
          Volver a intentar
        </button>
        <button type="button" className={estilos.enlaceBoton} onClick={() => void this.reiniciar()}>
          Reiniciar los datos del copiloto
        </button>
      </div>
    );
  }
}
