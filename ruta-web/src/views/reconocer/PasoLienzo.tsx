import { useState, type FormEvent, type ReactNode } from 'react';
import { CampoArea, CampoTexto } from '../../components/ui/Campo';
import { BLOQUES_LIENZO, LIENZO, type BloqueLienzo } from '../../config/formularios/reconocer';
import { EXPLICACION_LIENZO as EX } from '../../contenido/reconocer';
import { useProyecto } from '../../estado/ProyectoContexto';
import { useBorrador } from '../../hooks/useBorrador';
import type { Lienzo, MotivoUrgencia } from '../../lib/modelo/proyecto';
import { bloquesFaltantes, conFilasDeUrgencia, limpiarLienzo } from '../../lib/reconocer/lienzo';
import { ListaEditable } from '../etapa0/ListaEditable';
import { PieFormulario } from '../etapa0/PieFormulario';
import formulario from '../etapa0/formulario.module.css';
import { MENSAJE_SIN_ESPACIO, PreguntaGuia, TablaPares } from './ayudas';
import estilos from './reconocer.module.css';

const BLOQUE = Object.fromEntries(BLOQUES_LIENZO.map((b) => [b.id, b])) as Record<BloqueLienzo, (typeof BLOQUES_LIENZO)[number]>;

/** Un bloque del lienzo con su número, nombre y pregunta guía. */
function Bloque({ id, numero, children }: { id: BloqueLienzo; numero: number; children: ReactNode }) {
  return (
    <section className={estilos.bloque} aria-labelledby={`lienzo-${id}`}>
      <h3 id={`lienzo-${id}`} className={estilos.tituloBloque}>
        <span className="numero">{numero}.</span> {BLOQUE[id].nombre}
      </h3>
      <PreguntaGuia>{BLOQUE[id].pregunta}</PreguntaGuia>
      {children}
    </section>
  );
}

/** R1: registra el lienzo del cambio, bloque por bloque. Es interno: lo usa el equipo de cambio. */
export function PasoLienzo() {
  const { datos, actualizarDatos } = useProyecto();
  const [error, setError] = useState('');
  const { borrador, editar, confirmar, estado } = useBorrador<Lienzo>(conFilasDeUrgencia(datos.lienzo, LIENZO.motivosUrgencia), async (lienzo) =>
    actualizarDatos((d) => ({ ...d, lienzo: limpiarLienzo(lienzo) })),
  );

  const texto = (clave: 'afectados' | 'vision' | 'que_cambia' | 'que_no_cambia', valor: string) => editar((l) => ({ ...l, [clave]: valor }));
  const editarMotivo = (i: number, cambio: Partial<MotivoUrgencia>) =>
    editar((l) => ({ ...l, urgencia: l.urgencia.map((m, j) => (j === i ? { ...m, ...cambio } : m)) }));

  const enviar = async (evento: FormEvent) => {
    evento.preventDefault();
    setError('');
    try {
      await confirmar();
    } catch {
      setError(MENSAJE_SIN_ESPACIO);
    }
  };

  const faltantes = bloquesFaltantes(borrador, LIENZO.motivosUrgencia);
  const numero = (id: BloqueLienzo) => BLOQUES_LIENZO.findIndex((b) => b.id === id) + 1;

  return (
    <form className={formulario.formulario} onSubmit={(e) => void enviar(e)}>
      <Bloque id="urgencia" numero={numero('urgencia')}>
        {borrador.urgencia.map((m, i) => (
          <div key={i} className={formulario.rejilla}>
            <CampoTexto etiqueta={`Motivo ${i + 1}`} explicacion={EX.motivo} value={m.motivo} onChange={(e) => editarMotivo(i, { motivo: e.target.value })} />
            <CampoTexto etiqueta={`Dato del motivo ${i + 1}`} explicacion={EX.dato} value={m.dato} onChange={(e) => editarMotivo(i, { dato: e.target.value })} />
          </div>
        ))}
      </Bloque>

      <Bloque id="afectados" numero={numero('afectados')}>
        <CampoArea etiqueta="Afectados" explicacion={EX.afectados} value={borrador.afectados} onChange={(e) => texto('afectados', e.target.value)} />
      </Bloque>

      <Bloque id="vision" numero={numero('vision')}>
        <CampoTexto etiqueta="Visión en una frase" explicacion={EX.vision} value={borrador.vision} onChange={(e) => texto('vision', e.target.value)} />
      </Bloque>

      <Bloque id="cambios" numero={numero('cambios')}>
        <div className={formulario.rejilla}>
          <CampoArea etiqueta="Qué cambia" explicacion={EX.que_cambia} value={borrador.que_cambia} onChange={(e) => texto('que_cambia', e.target.value)} />
          <CampoArea etiqueta="Qué no cambia" explicacion={EX.que_no_cambia} value={borrador.que_no_cambia} onChange={(e) => texto('que_no_cambia', e.target.value)} />
        </div>
      </Bloque>

      <Bloque id="beneficios" numero={numero('beneficios')}>
        <TablaPares
          columnas={[
            { clave: 'grupo', titulo: 'Grupo', explicacion: EX.grupo },
            { clave: 'beneficio', titulo: 'Beneficio', explicacion: EX.beneficio },
          ]}
          filas={borrador.beneficios}
          nombreFila="beneficio"
          vacia={{ grupo: '', beneficio: '' }}
          alCambiar={(beneficios) => editar((l) => ({ ...l, beneficios }))}
        />
      </Bloque>

      <Bloque id="criterios" numero={numero('criterios')}>
        <TablaPares
          columnas={[
            { clave: 'criterio', titulo: 'Criterio', explicacion: EX.criterio },
            { clave: 'meta', titulo: 'Meta con número', explicacion: EX.meta },
          ]}
          filas={borrador.criterios}
          nombreFila="criterio"
          vacia={{ criterio: '', meta: '' }}
          alCambiar={(criterios) => editar((l) => ({ ...l, criterios }))}
        />
      </Bloque>

      <Bloque id="riesgos" numero={numero('riesgos')}>
        <div className={formulario.rejilla}>
          <ListaEditable etiqueta="Qué puede salir mal" explicacion={EX.riesgos} valores={borrador.riesgos} alCambiar={(riesgos) => editar((l) => ({ ...l, riesgos }))} />
          <ListaEditable
            etiqueta="Intentos previos que fallaron"
            explicacion={EX.intentos}
            valores={borrador.intentos_previos}
            alCambiar={(intentos_previos) => editar((l) => ({ ...l, intentos_previos }))}
          />
        </div>
      </Bloque>

      <p className={estilos.nota}>
        {faltantes.length === 0 ? 'Los 7 bloques tienen contenido.' : `Falta: ${faltantes.map((b) => BLOQUE[b].nombre.toLowerCase()).join(', ')}.`}
      </p>
      {error && (
        <p className={estilos.aviso} role="alert">
          {error}
        </p>
      )}
      <PieFormulario estado={estado} />
    </form>
  );
}
