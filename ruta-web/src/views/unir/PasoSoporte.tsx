import { useState, type FormEvent } from 'react';
import { Pestanas } from '../../components/ui/Pestanas';
import { EXPLICACION_SOPORTE as EX } from '../../contenido/unir';
import { useProyecto } from '../../estado/ProyectoContexto';
import { useBorrador } from '../../hooks/useBorrador';
import type { SoporteLideres } from '../../lib/modelo/proyecto';
import { ListaEditable } from '../etapa0/ListaEditable';
import { PieFormulario } from '../etapa0/PieFormulario';
import formulario from '../etapa0/formulario.module.css';
import { MENSAJE_SIN_ESPACIO, TablaPares } from '../reconocer/ayudas';
import estilos from '../reconocer/reconocer.module.css';
import { CoachLideres } from './CoachLideres';

const limpiar = (s: SoporteLideres): SoporteLideres => ({
  mensajes: s.mensajes,
  pautas: s.pautas,
  preguntas: s.preguntas.map((p) => ({ pregunta: p.pregunta.trim(), respuesta: p.respuesta.trim() })).filter((p) => p.pregunta || p.respuesta),
});

/** U3: guía para que los jefes acompañen a sus equipos tras el anuncio + Coach de Comunicación (IA). */
export function PasoSoporte() {
  const { datos, actualizarDatos } = useProyecto();
  const [error, setError] = useState('');
  const { borrador, editar, confirmar, estado } = useBorrador<SoporteLideres>(datos.soporte, async (s) => actualizarDatos((d) => ({ ...d, soporte: limpiar(s) })));
  const preocupaciones = datos.buzon1.map((r) => r.preocupa).filter((t) => t.trim());

  const enviar = async (evento: FormEvent) => {
    evento.preventDefault();
    setError('');
    try {
      await confirmar();
    } catch {
      setError(MENSAJE_SIN_ESPACIO);
    }
  };

  const formularioGuia = (
    <form className={formulario.formulario} onSubmit={(e) => void enviar(e)}>
      <ListaEditable etiqueta="Mensajes clave" explicacion={EX.mensajes} valores={borrador.mensajes} alCambiar={(mensajes) => editar((s) => ({ ...s, mensajes }))} />

      <section className={estilos.bloque} aria-labelledby="soporte-preguntas">
        <h3 id="soporte-preguntas" className={estilos.tituloBloque}>
          Preguntas frecuentes y su respuesta
        </h3>
        {preocupaciones.length > 0 && (
          <details className={estilos.guia}>
            <summary>Lo que preocupa a los colaboradores según el buzón 1 ({preocupaciones.length})</summary>
            <ul>
              {preocupaciones.map((p, i) => (
                <li key={i}>{p}</li>
              ))}
            </ul>
          </details>
        )}
        <TablaPares
          columnas={[
            { clave: 'pregunta', titulo: 'Pregunta', explicacion: EX.pregunta },
            { clave: 'respuesta', titulo: 'Respuesta', explicacion: EX.respuesta },
          ]}
          filas={borrador.preguntas}
          nombreFila="pregunta"
          vacia={{ pregunta: '', respuesta: '' }}
          alCambiar={(preguntas) => editar((s) => ({ ...s, preguntas }))}
        />
      </section>

      <ListaEditable etiqueta="Pautas de conversación" explicacion={EX.pautas} valores={borrador.pautas} alCambiar={(pautas) => editar((s) => ({ ...s, pautas }))} />

      {error && (
        <p className={estilos.aviso} role="alert">
          {error}
        </p>
      )}
      <PieFormulario estado={estado} />
    </form>
  );

  return (
    <Pestanas
      etiqueta="Soporte para líderes (U3)"
      pestanas={[
        { id: 'guia', etiqueta: 'Guía y preguntas frecuentes', contenido: formularioGuia },
        { id: 'coach', etiqueta: 'Coach de Comunicación (IA)', contenido: <CoachLideres soporteActual={borrador} /> },
      ]}
    />
  );
}
