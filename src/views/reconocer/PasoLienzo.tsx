import { useState, type FormEvent } from 'react';
import { BotonIcono } from '../../components/ui/Boton';
import { CampoArea, CampoTexto } from '../../components/ui/Campo';
import { Explicacion } from '../../components/ui/Explicacion';
import { LIENZO } from '../../config/formularios/reconocer';
import { EXPLICACION_LIENZO as EX, NOMBRE_BLOQUE_LIENZO } from '../../contenido/reconocer';
import { useProyecto } from '../../estado/ProyectoContexto';
import { useBorrador } from '../../hooks/useBorrador';
import { formatearValor } from '../../lib/formato';
import type { BeneficioGrupo, Lienzo, MotivoUrgencia } from '../../lib/modelo/proyecto';
import { resolverMetas } from '../../lib/proyecto/etapa0';
import { bloquesFaltantes, conFilasDeUrgencia, limpiarLienzo } from '../../lib/reconocer/lienzo';
import { useRuta } from '../../navegacion/RutaContexto';
import { ListaEditable } from '../etapa0/ListaEditable';
import { PieFormulario } from '../etapa0/PieFormulario';
import formulario from '../etapa0/formulario.module.css';
import { MENSAJE_SIN_ESPACIO } from './ayudas';
import estilos from './reconocer.module.css';

/** R1: registra el lienzo del cambio. Es interno: lo usa el equipo de cambio y no alimenta el tablero. */
export function PasoLienzo() {
  const { activo, datos, actualizarDatos } = useProyecto();
  const { enlace } = useRuta();
  const [error, setError] = useState('');
  const { borrador, editar, confirmar, estado } = useBorrador<Lienzo>(conFilasDeUrgencia(datos.lienzo, LIENZO.motivosUrgencia), async (lienzo) =>
    actualizarDatos((d) => ({ ...d, lienzo: limpiarLienzo(lienzo) })),
  );
  if (!activo) return null;

  const texto = <K extends 'afectados' | 'vision' | 'que_cambia' | 'que_no_cambia'>(clave: K, valor: string) => editar((l) => ({ ...l, [clave]: valor }));
  const editarMotivo = (i: number, cambio: Partial<MotivoUrgencia>) =>
    editar((l) => ({ ...l, urgencia: l.urgencia.map((m, j) => (j === i ? { ...m, ...cambio } : m)) }));
  const editarBeneficio = (i: number, cambio: Partial<BeneficioGrupo>) =>
    editar((l) => ({ ...l, beneficios: l.beneficios.map((b, j) => (j === i ? { ...b, ...cambio } : b)) }));

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

  return (
    <form className={formulario.formulario} onSubmit={(e) => void enviar(e)}>
      <section className={estilos.bloque} aria-labelledby="lienzo-urgencia">
        <h3 id="lienzo-urgencia" className={estilos.tituloBloque}>
          {NOMBRE_BLOQUE_LIENZO.urgencia}
        </h3>
        {borrador.urgencia.map((m, i) => (
          <div key={i} className={formulario.rejilla}>
            <CampoTexto etiqueta={`Motivo ${i + 1}`} explicacion={EX.motivo} value={m.motivo} onChange={(e) => editarMotivo(i, { motivo: e.target.value })} />
            <CampoTexto etiqueta={`Dato del motivo ${i + 1}`} explicacion={EX.dato} value={m.dato} onChange={(e) => editarMotivo(i, { dato: e.target.value })} />
          </div>
        ))}
      </section>

      <div className={formulario.rejilla}>
        <div className={formulario.ancho}>
          <CampoArea etiqueta={NOMBRE_BLOQUE_LIENZO.afectados} explicacion={EX.afectados} value={borrador.afectados} onChange={(e) => texto('afectados', e.target.value)} />
        </div>
        <div className={formulario.ancho}>
          <CampoTexto etiqueta={NOMBRE_BLOQUE_LIENZO.vision} explicacion={EX.vision} value={borrador.vision} onChange={(e) => texto('vision', e.target.value)} />
        </div>
        <CampoArea etiqueta="Qué cambia" explicacion={EX.que_cambia} value={borrador.que_cambia} onChange={(e) => texto('que_cambia', e.target.value)} />
        <CampoArea etiqueta="Qué no cambia" explicacion={EX.que_no_cambia} value={borrador.que_no_cambia} onChange={(e) => texto('que_no_cambia', e.target.value)} />
      </div>

      <section className={estilos.bloque} aria-labelledby="lienzo-beneficios">
        <h3 id="lienzo-beneficios" className={estilos.tituloBloque}>
          {NOMBRE_BLOQUE_LIENZO.beneficios}
        </h3>
        {borrador.beneficios.length > 0 && (
          <table className={formulario.tabla}>
            <thead>
              <tr>
                <th scope="col">
                  <Explicacion titulo="Grupo" texto={EX.grupo} enfocable>
                    {() => 'Grupo'}
                  </Explicacion>
                </th>
                <th scope="col">
                  <Explicacion titulo="Beneficio" texto={EX.beneficio} enfocable>
                    {() => 'Beneficio'}
                  </Explicacion>
                </th>
                <th scope="col" className={formulario.columnaAccion}>
                  <span className="solo-lectores">Acciones</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {borrador.beneficios.map((b, i) => (
                <tr key={i}>
                  <td>
                    <input className={formulario.control} aria-label={`Grupo del beneficio ${i + 1}`} value={b.grupo} onChange={(e) => editarBeneficio(i, { grupo: e.target.value })} />
                  </td>
                  <td>
                    <input className={formulario.control} aria-label={`Beneficio ${i + 1}`} value={b.beneficio} onChange={(e) => editarBeneficio(i, { beneficio: e.target.value })} />
                  </td>
                  <td className={formulario.columnaAccion}>
                    <BotonIcono
                      accion="quitar"
                      etiqueta={`Quitar beneficio ${i + 1}`}
                      onClick={() => editar((l) => ({ ...l, beneficios: l.beneficios.filter((_, j) => j !== i) }))}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <div>
          <BotonIcono
            accion="agregar"
            etiqueta="Agregar beneficio"
            etiquetaVisible
            onClick={() => editar((l) => ({ ...l, beneficios: [...l.beneficios, { grupo: '', beneficio: '' }] }))}
          />
        </div>
      </section>

      <section className={estilos.bloque} aria-labelledby="lienzo-criterios">
        <h3 id="lienzo-criterios" className={estilos.tituloBloque}>
          Criterios de éxito
        </h3>
        <p className={estilos.nota}>
          Son las metas de los indicadores y aquí solo se consultan.{' '}
          <a className={estilos.enlace} href={enlace({ pagina: 'etapa', etapaId: 'etapa-0', pasoId: '0.3' })}>
            Editarlas en el paso 0.3
          </a>
        </p>
        <table className={formulario.tabla}>
          <thead>
            <tr>
              <th scope="col">Indicador</th>
              <th scope="col">Meta</th>
            </tr>
          </thead>
          <tbody>
            {resolverMetas(activo.metas).map((m) => (
              <tr key={m.id}>
                <th scope="row" className={formulario.nombreFila}>
                  {m.nombre}
                </th>
                <td className="numero">{formatearValor(m.meta, m.unidad)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <div className={formulario.rejilla}>
        <ListaEditable
          etiqueta={NOMBRE_BLOQUE_LIENZO.riesgos}
          explicacion={EX.riesgos}
          valores={borrador.riesgos}
          alCambiar={(riesgos) => editar((l) => ({ ...l, riesgos }))}
        />
        <ListaEditable
          etiqueta={NOMBRE_BLOQUE_LIENZO.intentos}
          explicacion={EX.intentos}
          valores={borrador.intentos_previos}
          alCambiar={(intentos_previos) => editar((l) => ({ ...l, intentos_previos }))}
        />
      </div>

      <p className={estilos.nota}>{faltantes.length === 0 ? 'Todos los bloques tienen contenido.' : `Falta: ${faltantes.map((b) => NOMBRE_BLOQUE_LIENZO[b].toLowerCase()).join(', ')}.`}</p>
      {error && (
        <p className={estilos.aviso} role="alert">
          {error}
        </p>
      )}
      <PieFormulario estado={estado} />
    </form>
  );
}
