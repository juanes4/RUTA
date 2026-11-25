import { useState } from 'react';
import { Aviso } from '../../../components/ui/Aviso';
import { Boton } from '../../../components/ui/Boton';
import { REGLAS } from '../../../config/reglas';
import { useProyecto } from '../../../estado/ProyectoContexto';
import { api } from '../../../lib/api';
import { armarDossier, contextoCopiloto, rutaDeTriaje } from '../../../lib/copiloto/logica';
import { normalizarPartesDossier } from '../../../lib/copiloto/normalizar';
import estilos from './copiloto.module.css';
import { Markdown } from './Markdown';
import { ErrorCopiloto, Esperando, InsigniaModo, type PropsModo } from './comun';

const FECHA = new Intl.DateTimeFormat('es-CO', { dateStyle: 'long' });

function descargar(nombre: string, contenido: string) {
  const url = URL.createObjectURL(new Blob([contenido], { type: 'text/markdown;charset=utf-8' }));
  const enlace = document.createElement('a');
  enlace.href = url;
  enlace.download = nombre;
  enlace.click();
  URL.revokeObjectURL(url);
}

/** Paso 4 de 4: Dossier de Reconocimiento. La app lo arma; el copiloto escribe el resumen y las recomendaciones. */
export function PanelDossier({ modo, usarSimulado }: PropsModo) {
  const { activo, datos, actualizarDatos } = useProyecto();
  const [ocupado, setOcupado] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const [mensaje, setMensaje] = useState('');
  if (!activo) return null;

  const guardado = datos.copiloto.dossier;
  const ruta = rutaDeTriaje(datos.triaje, REGLAS.triaje);

  const generar = async () => {
    setOcupado(true);
    setError(null);
    setMensaje('');
    try {
      const r = await api.copiloto.dossier(modo, contextoCopiloto(activo, datos, REGLAS.triaje));
      const partes = normalizarPartesDossier(r.dossier);
      if (!partes) throw new Error('El copiloto devolvió un dossier vacío. Inténtalo de nuevo.');
      await actualizarDatos((d) => ({ ...d, copiloto: { ...d.copiloto, dossier: { partes, modo: r.modo, modelo: r.modelo, fecha: new Date().toISOString() } } }));
    } catch (e) {
      setError(e);
    } finally {
      setOcupado(false);
    }
  };

  const texto = guardado
    ? armarDossier({ proyecto: activo, datos, reglas: REGLAS.triaje, partes: guardado.partes, modo: guardado.modo === 'gemini' ? 'Gemini' : 'simulado', fecha: FECHA.format(new Date(guardado.fecha)) })
    : '';

  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(texto);
      setMensaje('Dossier copiado.');
    } catch {
      setMensaje('No se pudo copiar: usa la descarga.');
    }
  };

  return (
    <div className={estilos.panel}>
      <p className={estilos.nota}>
        <strong>Paso 4 de 4 · Dossier.</strong> La app arma la ficha (R1), el triaje (R2), la voz de los colaboradores y las alertas con los datos guardados. El
        copiloto escribe el resumen ejecutivo, las recomendaciones para la etapa U (cada una con su fuente), el perfil de vocero y las preguntas que recibirán los jefes.
      </p>
      {!datos.copiloto.informe && (
        <Aviso tono="atencion" titulo="Sin buzón analizado">
          El dossier tendrá menos sustento en la voz de los colaboradores. Analízalo en el paso 3.
        </Aviso>
      )}
      {!ruta.nivel && (
        <Aviso tono="atencion" titulo="El triaje (R2) está incompleto">
          El dossier lo marcará como pendiente. Complétalo en el paso 2 o en R2.
        </Aviso>
      )}
      <div className={estilos.acciones}>
        <Boton onClick={() => void generar()} disabled={ocupado}>
          {guardado ? 'Volver a generar' : 'Generar el dossier'}
        </Boton>
        {guardado && (
          <>
            <Boton variante="secundario" onClick={() => descargar(`dossier-reconocimiento-${new Date().toISOString().slice(0, 10)}.md`, texto)}>
              Descargar (.md)
            </Boton>
            <Boton variante="secundario" onClick={() => void copiar()}>
              Copiar
            </Boton>
            <InsigniaModo modo={guardado.modo} modelo={guardado.modelo} />
          </>
        )}
      </div>
      {ocupado && <Esperando texto="El copiloto está escribiendo el resumen y las recomendaciones…" />}
      <ErrorCopiloto error={error} usarSimulado={usarSimulado} />
      <p className={estilos.nota} aria-live="polite">
        {mensaje}
      </p>
      {guardado && (
        <article className={estilos.dossier} aria-label="Dossier de Reconocimiento">
          <Markdown texto={texto} />
        </article>
      )}
    </div>
  );
}
