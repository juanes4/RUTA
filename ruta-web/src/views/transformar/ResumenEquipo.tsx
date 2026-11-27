import { useEffect, useState } from 'react';
import { Boton } from '../../components/ui/Boton';
import { useSesion } from '../../estado/SesionContexto';
import { api, ErrorApi } from '../../lib/api';
import etapaT from './etapaT.module.css';

type Resumen = { texto: string; origen: 'ia' | 'reglas'; fecha?: string };

/** El último resumen queda guardado en este navegador: no hay que volver a pedirlo al recargar. */
const CLAVE_RESUMEN = 'ruta:resumen-t2:v1';

function leerResumenGuardado(): Resumen | null {
  try {
    const r = JSON.parse(window.localStorage.getItem(CLAVE_RESUMEN) ?? 'null') as Resumen | null;
    return r && typeof r.texto === 'string' && (r.origen === 'ia' || r.origen === 'reglas') ? r : null;
  } catch {
    return null;
  }
}

/**
 * T2, solo líderes. Resume los resultados del simulador. La IA solo recibe conteos y
 * promedios de videos con el mínimo de personas, nunca nombres; si no se puede, el resumen sale por reglas.
 */
export function ResumenEquipo() {
  const { expirar } = useSesion();
  const [resumen, setResumen] = useState<Resumen | null>(leerResumenGuardado);
  const [generando, setGenerando] = useState(false);
  const [error, setError] = useState('');

  const pedir = async () => {
    setError('');
    setGenerando(true);
    try {
      setResumen({ ...(await api.resumenIA()), fecha: new Date().toISOString() });
    } catch (e) {
      if (e instanceof ErrorApi && e.estado === 401) expirar();
      setError(e instanceof Error ? e.message : 'Ocurrió un error.');
    } finally {
      setGenerando(false);
    }
  };

  useEffect(() => {
    if (!resumen) return;
    try {
      window.localStorage.setItem(CLAVE_RESUMEN, JSON.stringify(resumen));
    } catch {
      // Si el navegador bloquea localStorage, el resumen solo vive en esta pantalla.
    }
  }, [resumen]);

  return (
    <section className={etapaT.resumenEquipo} aria-labelledby="titulo-resumen-equipo">
      <h3 id="titulo-resumen-equipo" className={etapaT.subtitulo}>
        Resumen para el líder
      </h3>
      <p className={etapaT.texto}>Se arma con conteos y promedios, sin nombres de personas. La IA recomienda; tú decides.</p>
      {resumen && (
        <div>
          <p className={etapaT.textoResumen}>{resumen.texto}</p>
          <p className={etapaT.texto}>{resumen.origen === 'ia' ? 'Generado con IA.' : 'Generado por reglas (sin IA).'}</p>
        </div>
      )}
      {error && (
        <p className={etapaT.mensajeError} role="alert">
          {error}
        </p>
      )}
      <div>
        <Boton variante="secundario" onClick={() => void pedir()} disabled={generando}>
          {generando ? 'Generando…' : resumen ? 'Actualizar resumen' : 'Generar resumen'}
        </Boton>
      </div>
    </section>
  );
}
