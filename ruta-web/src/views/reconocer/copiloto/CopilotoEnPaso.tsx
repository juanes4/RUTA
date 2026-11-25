import { useId, useState, type ComponentType } from 'react';
import { IconoCopiloto } from '../../../components/marco/Iconos';
import { Boton } from '../../../components/ui/Boton';
import { ID_COPILOTO } from '../../../config/etapas';
import { CONFIG_IA } from '../../../config/ia';
import { useProyecto } from '../../../estado/ProyectoContexto';
import type { DatosCopiloto } from '../../../lib/copiloto/tipos';
import { useRuta } from '../../../navegacion/RutaContexto';
import { AvisosCopiloto, SelectorModo, useEsLider, useModoCopiloto, useReiniciarCopiloto, type PropsModo } from './comun';
import estilos from './copiloto.module.css';
import { LimiteErrores } from './LimiteErrores';
import { PanelBuzon } from './PanelBuzon';
import { PanelLienzo } from './PanelLienzo';
import { PanelTriaje } from './PanelTriaje';

interface AyudaPaso {
  /** Paso del copiloto (de 4). */
  numero: number;
  titulo: string;
  /** Qué hace el copiloto en este paso, en frases cortas. */
  hace: readonly string[];
  abrir: string;
  Panel: ComponentType<PropsModo>;
  /** En qué va el copiloto en este paso (vacío si no ha empezado). */
  avance(c: DatosCopiloto): string;
}

const FECHA = new Intl.DateTimeFormat('es-CO', { day: 'numeric', month: 'short' });

/** Qué hace el copiloto en cada paso de R donde ayuda. */
const AYUDAS: Readonly<Record<string, AyudaPaso>> = {
  R1: {
    numero: 1,
    titulo: 'Llena el lienzo conversando',
    hace: ['Te pregunta los 7 bloques, uno a la vez', 'Repregunta cuando falta una cifra o un hecho', 'No necesita el buzón: va primero', 'Te muestra qué cambia en R1 antes de guardar'],
    abrir: 'Empezar con el copiloto',
    Panel: PanelLienzo,
    avance: (c) => (c.mensajesLienzo.length ? `Conversación en curso · ${c.mensajesLienzo.length} mensajes` : ''),
  },
  R2: {
    numero: 2,
    titulo: 'Pide una propuesta de triaje',
    hace: ['Propone un puntaje para cada criterio', 'Dice de dónde sale y qué dato lo cambiaría', 'La app suma y asigna la ruta', 'Tú decides si pasa a R2'],
    abrir: 'Proponer con el copiloto',
    Panel: PanelTriaje,
    avance: (c) => (c.triaje ? `Propuesta del ${FECHA.format(new Date(c.triaje.fecha))}` : ''),
  },
  R5: {
    numero: 3,
    titulo: 'Pon a prueba tu diagnóstico con el buzón',
    hace: [
      'Clasifica cada respuesta por tema y sentimiento',
      'Lo compara con tu lienzo y tu triaje',
      'Propone riesgos que faltan y revisa el semáforo',
      'Marca lo que necesita revisión humana',
    ],
    abrir: 'Analizar con el copiloto',
    Panel: PanelBuzon,
    avance: (c) => (c.informe ? `Informe del ${FECHA.format(new Date(c.informe.fecha))}` : ''),
  },
};


/**
 * Tarjeta del copiloto dentro de la página de un paso (R1, R2, R5): dice qué
 * hace en ese paso y, al abrirla, muestra el copiloto ahí mismo, sin salir del
 * paso. Solo la ven los líderes.
 */
export function CopilotoEnPaso({ pasoId }: { pasoId: string }) {
  const esLider = useEsLider();
  const { datos } = useProyecto();
  const { enlace } = useRuta();
  const [abierto, setAbierto] = useState(false);
  const { estado, errorEstado, modo, setModo, usarSimulado } = useModoCopiloto(abierto && esLider);
  const idCuerpo = useId();
  const reiniciarCopiloto = useReiniciarCopiloto();
  const ayuda = AYUDAS[pasoId];
  if (!ayuda || !CONFIG_IA.habilitada || !esLider) return null;

  const avance = ayuda.avance(datos.copiloto);
  const { Panel } = ayuda;

  return (
    <section className={estilos.enPaso} data-abierto={abierto} aria-label="Copiloto de Reconocimiento">
      <div className={estilos.enPasoCabeza}>
        <span className={estilos.chispa} aria-hidden="true">
          <IconoCopiloto tamano={22} />
        </span>
        <div className={estilos.enPasoTexto}>
          <span className={estilos.enPasoEtiqueta}>
            Copiloto · paso {ayuda.numero} de 4{avance && <span className={estilos.enPasoAvance}>{avance}</span>}
          </span>
          <h3 className={estilos.enPasoTitulo}>{ayuda.titulo}</h3>
          <ul className={estilos.enPasoHace}>
            {ayuda.hace.map((h) => (
              <li key={h}>{h}</li>
            ))}
          </ul>
        </div>
        <Boton className={estilos.enPasoBoton} aria-expanded={abierto} aria-controls={idCuerpo} onClick={() => setAbierto((a) => !a)}>
          {abierto ? 'Ocultar el copiloto' : avance ? 'Continuar con el copiloto' : ayuda.abrir}
        </Boton>
      </div>

      <div id={idCuerpo} className={estilos.enPasoCuerpo} hidden={!abierto}>
        {abierto && (
          <>
            <div className={estilos.enPasoBarra}>
              <SelectorModo estado={estado} modo={modo} setModo={setModo} nombre={`modo-${pasoId}`} />
              <a href={enlace({ pagina: 'etapa', etapaId: 'etapa-r', pasoId: ID_COPILOTO })}>Ver los 4 pasos y el dossier →</a>
            </div>
            <AvisosCopiloto estado={estado} errorEstado={errorEstado} />
            <LimiteErrores alReiniciar={reiniciarCopiloto}>
              <Panel modo={modo} usarSimulado={usarSimulado} incrustado />
            </LimiteErrores>
          </>
        )}
      </div>
    </section>
  );
}
