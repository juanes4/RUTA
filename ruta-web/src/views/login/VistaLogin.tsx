import { useState, type FormEvent } from 'react';
import { Boton } from '../../components/ui/Boton';
import { CampoTexto } from '../../components/ui/Campo';
import { useSesion } from '../../estado/SesionContexto';
import { useRuta } from '../../navegacion/RutaContexto';
import estilos from './VistaLogin.module.css';

/**
 * Inicio de sesión. Se muestra en lugar de cualquier página que requiera
 * sesión; al entrar, la app abre la página que se había pedido.
 */
export function VistaLogin() {
  const { iniciar } = useSesion();
  const { ruta, navegar } = useRuta();
  const [usuario, setUsuario] = useState('');
  const [clave, setClave] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  const enviar = async (evento: FormEvent) => {
    evento.preventDefault();
    setEnviando(true);
    setError(null);
    const mensaje = await iniciar(usuario.trim(), clave);
    setEnviando(false);
    if (mensaje) {
      setError(mensaje);
      return;
    }
    // Entró desde el botón "Iniciar sesión": lo lleva al inicio con todo habilitado.
    if (ruta.pagina === 'ingresar') navegar({ pagina: 'inicio' });
  };

  return (
    <div className={estilos.login}>
      <section className={estilos.presentacion} aria-labelledby="titulo-login">
        <p className={estilos.antetitulo}>Metodología de transformación organizacional</p>
        <h1>RUTA</h1>
        <p id="titulo-login" className={estilos.mensaje}>
          Inicia sesión para abrir las etapas, las capacitaciones y el tablero.
        </p>
      </section>

      <form className={estilos.formulario} onSubmit={enviar} noValidate>
        <h2 className={estilos.titulo}>Iniciar sesión</h2>
        <CampoTexto
          etiqueta="Usuario"
          value={usuario}
          onChange={(e) => setUsuario(e.target.value)}
          autoComplete="username"
          autoCapitalize="none"
          spellCheck={false}
          autoFocus
          required
        />
        <CampoTexto
          etiqueta="Clave"
          type="password"
          value={clave}
          onChange={(e) => setClave(e.target.value)}
          autoComplete="current-password"
          required
        />
        {error && (
          <p className={estilos.error} role="alert">
            {error}
          </p>
        )}
        <Boton type="submit" disabled={enviando || !usuario.trim() || !clave}>
          {enviando ? 'Entrando…' : 'Entrar'}
        </Boton>
      </form>
    </div>
  );
}
