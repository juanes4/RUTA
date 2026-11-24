import { useEffect, useState, type FormEvent } from 'react';
import { Boton } from '../../components/ui/Boton';
import { CampoArea, CampoSeleccion, CampoTexto } from '../../components/ui/Campo';
import { EstadoVacio } from '../../components/ui/EstadoVacio';
import { Pestanas } from '../../components/ui/Pestanas';
import { Semaforo } from '../../components/ui/Semaforo';
import {
  INDICADORES_TABLERO_A,
  REGLA_SEMAFORO_A,
  type IdIndicadorA,
  type IndicadorAuditoria,
} from '../../config/analizar';
import { useEnvio } from '../../hooks/useRegistros';
import { useSesion } from '../../estado/SesionContexto';
import {
  api,
  ErrorApi,
  formatearFechaVista,
  type RegistroAuditoriaA,
  type RespuestaTableroA,
} from '../../lib/api';
import {
  deltaIndicadorA,
  formatearMetaA,
  formatearValorA,
  progresoHaciaMetaA,
  resumirSemaforosA,
  semaforoIndicadorA,
} from '../../lib/analizar/calculos';
import { COLOR_SEMAFORO, PALABRA_SEMAFORO } from '../../lib/analizar/semaforo';
import formulario from '../etapa0/formulario.module.css';
import { MensajeEnvio } from '../transformar/MensajeEnvio';
import { GraficoEvolucionAuditorias, GraficosTableroA, type FiltroEstadoA } from './GraficosTableroA';
import estilos from './etapaA.module.css';

type CargaTablero = { fase: 'cargando' } | { fase: 'error'; mensaje: string } | { fase: 'listo'; datos: RespuestaTableroA };

const hoyIso = () => new Date().toISOString().slice(0, 10);

const valoresVacios = (): Record<IdIndicadorA, string> =>
  Object.fromEntries(INDICADORES_TABLERO_A.map((i) => [i.id, ''])) as Record<IdIndicadorA, string>;

const metasInicialesTexto = (base?: Partial<Record<IdIndicadorA, number>>): Record<IdIndicadorA, string> =>
  Object.fromEntries(INDICADORES_TABLERO_A.map((i) => [i.id, String(base?.[i.id] ?? i.metaInicial)])) as Record<IdIndicadorA, string>;

/**
 * A1 · Auditorías de adopción (Tablero del equipo).
 * Permite verificar los 8 indicadores de apropiación con metas ajustables y semáforo del 15 %.
 */
export function AuditoriaAdopcion({ esLider }: { esLider: boolean }) {
  const { expirar } = useSesion();
  const [carga, setCarga] = useState<CargaTablero>({ fase: 'cargando' });
  const [version, setVersion] = useState(0);

  useEffect(() => {
    let vigente = true;
    api
      .tableroA()
      .then((datos) => vigente && setCarga({ fase: 'listo', datos }))
      .catch((e: unknown) => {
        if (e instanceof ErrorApi && e.estado === 401) expirar();
        if (vigente) setCarga({ fase: 'error', mensaje: e instanceof Error ? e.message : 'No se pudo cargar el tablero.' });
      });
    return () => {
      vigente = false;
    };
  }, [version, expirar]);

  const recargar = () => setVersion((v) => v + 1);

  if (carga.fase === 'cargando') return <p role="status">Cargando tablero de adopción…</p>;
  if (carga.fase === 'error') return <EstadoVacio titulo="No se pudo cargar el tablero">{carga.mensaje}</EstadoVacio>;

  const { auditorias, metasActuales, sugeridosT, balancesT } = carga.datos;

  const pestanas = [
    {
      id: 'tablero',
      etiqueta: 'Tablero del equipo',
      contenido: <PanelTableroActual auditorias={auditorias} sugeridosT={sugeridosT} esLider={esLider} />,
    },
    ...(esLider
      ? [
          {
            id: 'registrar',
            etiqueta: 'Registrar auditoría',
            contenido: <FormularioAuditoria metasBase={metasActuales} sugeridosT={sugeridosT} alGuardar={recargar} />,
          },
        ]
      : []),
    {
      id: 'historial',
      etiqueta: esLider ? 'Historial e insumos de T' : 'Historial de auditorías',
      contenido: <PanelHistorial auditorias={auditorias} balancesT={balancesT} esLider={esLider} />,
    },
  ];

  return (
    <div className={estilos.bloques}>
      <p className={estilos.texto}>
        Verifica de forma periódica y objetiva el nivel real de apropiación de las nuevas prácticas en la operación diaria. Cada indicador parte de
        una meta inicial referencial que la empresa puede ajustar según su contexto.
      </p>
      <Pestanas etiqueta="Auditorías de adopción" pestanas={pestanas} />
    </div>
  );
}

function PanelTableroActual({
  auditorias,
  sugeridosT,
  esLider,
}: {
  auditorias: readonly RegistroAuditoriaA[];
  sugeridosT: RespuestaTableroA['sugeridosT'];
  esLider: boolean;
}) {
  const ultimaId = auditorias[0]?.id ?? null;
  const [seleccionId, setSeleccionId] = useState<number | null>(null);
  const [filtro, setFiltro] = useState<FiltroEstadoA>('todos');

  useEffect(() => {
    setSeleccionId(null);
    setFiltro('todos');
  }, [ultimaId]);

  const indiceActiva =
    seleccionId !== null ? auditorias.findIndex((a) => a.id === seleccionId) : 0;
  const activa = (indiceActiva >= 0 ? auditorias[indiceActiva] : null) ?? auditorias[0] ?? null;
  const anterior = indiceActiva >= 0 ? auditorias[indiceActiva + 1] ?? null : null;

  if (!activa) {
    return (
      <div className={estilos.bloques}>
        <EstadoVacio titulo="Aún no hay auditorías registradas">
          {esLider
            ? 'Abre la pestaña «Registrar auditoría» para ingresar la primera medición de los 8 indicadores del equipo.'
            : 'Cuando el líder registre la primera auditoría de adopción, el tablero del equipo aparecerá aquí.'}
        </EstadoVacio>
        <ResumenReferenciaTabla />
      </div>
    );
  }

  const resumen = resumirSemaforosA(activa.valores, activa.metas);
  const alternarFiltro = (estado: FiltroEstadoA) => setFiltro((prev) => (prev === estado ? 'todos' : estado));

  const indicadoresVisibles = INDICADORES_TABLERO_A.filter((ind) => {
    if (filtro === 'todos') return true;
    const meta = activa.metas[ind.id] ?? ind.metaInicial;
    return semaforoIndicadorA(activa.valores[ind.id], meta, ind) === filtro;
  });

  return (
    <div className={estilos.bloques}>
      <div className={estilos.encabezadoPanel}>
        <div className={estilos.pildoras}>
          <span className={estilos.pildora}>
            <strong>{activa.periodo}</strong>
          </span>
          <span className={estilos.pildora}>Fecha: {activa.fecha}</span>
          {activa.equipo && <span className={estilos.pildora}>Equipo: {activa.equipo}</span>}
          {sugeridosT.ultimoAcuerdo && (
            <span className={estilos.pildora} data-tono="t">
              Escalera T3: Nivel {sugeridosT.ultimoAcuerdo.nivel} (Ciclo {sugeridosT.ultimoAcuerdo.ciclo})
            </span>
          )}
        </div>
        {auditorias.length > 1 && (
          <CampoSeleccion
            etiqueta="Ver auditoría"
            value={activa.id}
            onChange={(e) => setSeleccionId(Number(e.target.value))}
          >
            {auditorias.map((a) => (
              <option key={a.id} value={a.id}>
                {a.periodo} · {a.fecha}
                {a.equipo ? ` (${a.equipo})` : ''}
              </option>
            ))}
          </CampoSeleccion>
        )}
      </div>

      {/* Tarjetas KPI interactivas (actúan como filtro rápido sobre los gráficos y la tabla) */}
      <div className={estilos.resumenKpi}>
        <button
          type="button"
          className={estilos.tarjetaKpi}
          data-tono="verde"
          aria-pressed={filtro === 'en_meta'}
          onClick={() => alternarFiltro('en_meta')}
        >
          <span className={estilos.kpiEtiqueta}>En meta (verde)</span>
          <span className={`${estilos.kpiNumero} numero`}>{resumen.enMeta}</span>
          <span className={estilos.kpiDetalle}>de {resumen.evaluados} evaluados</span>
        </button>
        <button
          type="button"
          className={estilos.tarjetaKpi}
          data-tono="amarillo"
          aria-pressed={filtro === 'atencion'}
          onClick={() => alternarFiltro('atencion')}
        >
          <span className={estilos.kpiEtiqueta}>Atención (amarillo)</span>
          <span className={`${estilos.kpiNumero} numero`}>{resumen.atencion}</span>
          <span className={estilos.kpiDetalle}>a menos de 15 % de la meta</span>
        </button>
        <button
          type="button"
          className={estilos.tarjetaKpi}
          data-tono="rojo"
          aria-pressed={filtro === 'intervenir'}
          onClick={() => alternarFiltro('intervenir')}
        >
          <span className={estilos.kpiEtiqueta}>Intervenir (rojo)</span>
          <span className={`${estilos.kpiNumero} numero`}>{resumen.intervenir}</span>
          <span className={estilos.kpiDetalle}>desviación mayor al 15 %</span>
        </button>
        <button
          type="button"
          className={estilos.tarjetaKpi}
          data-tono="oscuro"
          aria-pressed={filtro === 'todos'}
          onClick={() => setFiltro('todos')}
        >
          <span className={estilos.kpiEtiqueta}>Cumplimiento</span>
          <span className={`${estilos.kpiNumero} numero`}>
            {resumen.porcentajeCumplimiento === null ? '—' : `${resumen.porcentajeCumplimiento} %`}
          </span>
          <span className={estilos.kpiDetalle}>
            {resumen.sinDato > 0 ? `${resumen.sinDato} sin dato aún` : '8 de 8 indicadores medidos'}
          </span>
        </button>
      </div>

      {/* Gráficos interactivos: anillo de salud + comparativa Valor vs. Meta */}
      <GraficosTableroA auditoria={activa} resumen={resumen} filtro={filtro} alFiltrar={setFiltro} />

      {/* Curva de evolución cuando ya hay al menos dos auditorías */}
      <GraficoEvolucionAuditorias auditorias={auditorias} />

      {/* Tabla principal del equipo */}
      <div className={estilos.bloquesTabla}>
        <div className={estilos.encabezadoPanel}>
          <h3 className={estilos.subtitulo}>Detalle por indicador</h3>
          {filtro !== 'todos' && (
            <button type="button" className={estilos.botonMini} onClick={() => setFiltro('todos')}>
              Mostrar los 8 indicadores
            </button>
          )}
        </div>

        <div className={estilos.envolturaTabla} tabIndex={0} role="region" aria-label="Tablero del equipo con ocho indicadores y semáforo">
          <table className={estilos.tabla}>
            <thead>
              <tr>
                <th scope="col">Indicador</th>
                <th scope="col">Meta</th>
                <th scope="col">Valor actual</th>
                <th scope="col">Semáforo</th>
              </tr>
            </thead>
            <tbody>
              {indicadoresVisibles.length === 0 ? (
                <tr>
                  <td colSpan={4}>
                    <span className={estilos.apoyo}>No hay indicadores en el estado seleccionado.</span>
                  </td>
                </tr>
              ) : (
                indicadoresVisibles.map((ind) => {
                  const meta = activa.metas[ind.id] ?? ind.metaInicial;
                  const valor = activa.valores[ind.id];
                  const estado = semaforoIndicadorA(valor, meta, ind);
                  const progreso = progresoHaciaMetaA(valor, meta, ind);
                  const metaEditada = Math.abs(meta - ind.metaInicial) > 1e-6;
                  const delta = anterior ? deltaIndicadorA(valor, anterior.valores[ind.id], ind) : null;

                  return (
                    <tr key={ind.id}>
                      <th scope="row">
                        <span className={estilos.nombreIndicador}>{ind.nombre}</span>
                        <span className={estilos.formulaIndicador}>{ind.formula}</span>
                      </th>
                      <td className={`${estilos.metaCelda} numero`}>
                        {formatearMetaA(meta, ind)}
                        <span className={estilos.apoyo}>{metaEditada ? `Ajustada (inicial: ${ind.metaTexto})` : ind.metaTexto}</span>
                      </td>
                      <td className={`${estilos.valorCelda} numero`}>
                        <div className={estilos.valorConDelta}>
                          <span>{formatearValorA(valor, ind.unidad)}</span>
                          {delta && (
                            <span
                              className={estilos.deltaPildora}
                              data-favorable={delta.favorable === null ? 'neutro' : String(delta.favorable)}
                              title={`Variación frente a ${anterior?.periodo}`}
                            >
                              {delta.texto}
                            </span>
                          )}
                        </div>
                        {valor !== null && (
                          <div className={estilos.barraPista} aria-hidden="true">
                            <div className={estilos.barraRelleno} data-estado={estado ?? undefined} style={{ width: `${progreso}%` }} />
                          </div>
                        )}
                      </td>
                      <td>{estado ? <Semaforo estado={COLOR_SEMAFORO[estado]} texto={PALABRA_SEMAFORO[estado]} /> : <span className={estilos.apoyo}>Sin dato</span>}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {activa.observaciones && (
        <div className={estilos.tarjetaRegistro}>
          <strong>Observaciones y acciones acordadas</strong>
          <p>{activa.observaciones}</p>
          <span className={estilos.apoyo}>
            Registrado {activa.registradoPor ? `por ${activa.registradoPor} · ` : ''}
            {formatearFechaVista(activa.creadoEn)}
          </span>
        </div>
      )}

      <p className={estilos.notaRegla}>{REGLA_SEMAFORO_A}</p>
    </div>
  );
}

/** Tabla de referencia visible cuando aún no se ha guardado ninguna auditoría. */
function ResumenReferenciaTabla() {
  return (
    <div className={estilos.bloques}>
      <div className={estilos.envolturaTabla} tabIndex={0} role="region" aria-label="Estructura de los ocho indicadores del tablero del equipo">
        <table className={estilos.tabla}>
          <thead>
            <tr>
              <th scope="col">Indicador</th>
              <th scope="col">Meta inicial</th>
              <th scope="col">Valor actual</th>
              <th scope="col">Semáforo</th>
            </tr>
          </thead>
          <tbody>
            {INDICADORES_TABLERO_A.map((ind) => (
              <tr key={ind.id}>
                <th scope="row">
                  <span className={estilos.nombreIndicador}>{ind.nombre}</span>
                  <span className={estilos.formulaIndicador}>{ind.formula}</span>
                </th>
                <td className={estilos.metaCelda}>{ind.metaTexto}</td>
                <td>
                  <span className={estilos.apoyo}>Pendiente</span>
                </td>
                <td>
                  <span className={estilos.apoyo}>—</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className={estilos.notaRegla}>{REGLA_SEMAFORO_A}</p>
    </div>
  );
}

function FormularioAuditoria({
  metasBase,
  sugeridosT,
  alGuardar,
}: {
  metasBase: Record<IdIndicadorA, number>;
  sugeridosT: RespuestaTableroA['sugeridosT'];
  alGuardar(): void;
}) {
  const { estado, enviar, limpiar } = useEnvio();
  const [periodo, setPeriodo] = useState('Día 30');
  const [fecha, setFecha] = useState(hoyIso());
  const [equipo, setEquipo] = useState('');
  const [observaciones, setObservaciones] = useState('');
  const [valores, setValores] = useState<Record<IdIndicadorA, string>>(valoresVacios);
  const [metas, setMetas] = useState<Record<IdIndicadorA, string>>(() => metasInicialesTexto(metasBase));

  const alMenosUnValor = INDICADORES_TABLERO_A.some((i) => valores[i.id].trim() !== '');
  const listo = periodo.trim() !== '' && fecha.trim() !== '' && alMenosUnValor;

  const restaurarMetas = () => {
    setMetas(metasInicialesTexto());
    limpiar();
  };

  const guardar = async (e: FormEvent) => {
    e.preventDefault();
    const valoresNum = Object.fromEntries(
      INDICADORES_TABLERO_A.map((i) => [i.id, valores[i.id].trim() === '' ? null : Number(valores[i.id])]),
    ) as Record<IdIndicadorA, number | null>;
    const metasNum = Object.fromEntries(
      INDICADORES_TABLERO_A.map((i) => [i.id, metas[i.id].trim() === '' ? i.metaInicial : Number(metas[i.id])]),
    ) as Record<IdIndicadorA, number>;

    const ok = await enviar(
      () =>
        api.guardarAuditoriaA({
          periodo,
          fecha,
          equipo,
          observaciones,
          valores: valoresNum,
          metas: metasNum,
        }),
      'Auditoría guardada y tablero actualizado.',
    );
    if (ok) {
      setValores(valoresVacios());
      setObservaciones('');
      alGuardar();
    }
  };

  return (
    <form className={formulario.formulario} onSubmit={guardar} onChange={limpiar}>
      <div className={estilos.encabezadoPanel}>
        <div>
          <h3 className={estilos.subtitulo}>Nueva auditoría de adopción</h3>
          <span className={estilos.apoyo}>
            Ingresa los valores actuales del equipo (puedes usar la calculadora por fórmula) y ajusta las metas si tu empresa definió objetivos propios.
          </span>
        </div>
        <button type="button" className={estilos.botonMini} onClick={restaurarMetas}>
          Restaurar metas iniciales
        </button>
      </div>

      <div className={formulario.fila}>
        <CampoTexto
          etiqueta="Periodo o hito"
          list="hitos-auditoria-a"
          value={periodo}
          maxLength={60}
          onChange={(e) => setPeriodo(e.target.value)}
          ayuda="Por ejemplo: «Día 30», «Día 60», «Día 90» o «Día 180»."
        />
        <datalist id="hitos-auditoria-a">
          <option value="Día 30" />
          <option value="Día 60" />
          <option value="Día 90" />
          <option value="Día 180" />
          <option value="Ciclo 1" />
          <option value="Ciclo 2" />
        </datalist>
        <CampoTexto etiqueta="Fecha" type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} />
        <CampoTexto
          etiqueta="Área o equipo (opcional)"
          value={equipo}
          maxLength={100}
          onChange={(e) => setEquipo(e.target.value)}
          placeholder="Toda la organización o un área"
        />
      </div>

      <div className={estilos.gridIndicadores}>
        {INDICADORES_TABLERO_A.map((ind) => (
          <TarjetaCampoIndicador
            key={ind.id}
            indicador={ind}
            valorTexto={valores[ind.id]}
            metaTexto={metas[ind.id]}
            sugeridoApropiacion={ind.id === 'apropiacion' ? sugeridosT.apropiacion : null}
            alCambiarValor={(v) => setValores((prev) => ({ ...prev, [ind.id]: v }))}
            alCambiarMeta={(m) => setMetas((prev) => ({ ...prev, [ind.id]: m }))}
          />
        ))}
      </div>

      <CampoArea
        etiqueta="Observaciones y plan de intervención (opcional)"
        value={observaciones}
        maxLength={1000}
        onChange={(e) => setObservaciones(e.target.value)}
        placeholder="Anota desvíos detectados, acciones de acompañamiento o acuerdos para el siguiente ciclo."
      />

      <div className={estilos.pieForm}>
        <Boton type="submit" disabled={!listo || estado.fase === 'enviando'}>
          Guardar auditoría
        </Boton>
        <MensajeEnvio estado={estado} />
      </div>
    </form>
  );
}

function TarjetaCampoIndicador({
  indicador,
  valorTexto,
  metaTexto,
  sugeridoApropiacion,
  alCambiarValor,
  alCambiarMeta,
}: {
  indicador: IndicadorAuditoria;
  valorTexto: string;
  metaTexto: string;
  sugeridoApropiacion: RespuestaTableroA['sugeridosT']['apropiacion'];
  alCambiarValor(v: string): void;
  alCambiarMeta(m: string): void;
}) {
  const [num, setNum] = useState('');
  const [den, setDen] = useState('');

  const valorNum = valorTexto.trim() === '' ? null : Number(valorTexto);
  const metaNum = metaTexto.trim() === '' ? indicador.metaInicial : Number(metaTexto);
  const estado =
    valorNum !== null && Number.isFinite(valorNum) && Number.isFinite(metaNum)
      ? semaforoIndicadorA(valorNum, metaNum, indicador)
      : null;

  const aplicarCalculo = () => {
    const n = Number(num);
    const d = Number(den);
    if (!Number.isFinite(n) || !Number.isFinite(d) || d <= 0 || n < 0) return;
    const pct = Math.min(100, Math.round((n / d) * 1000) / 10);
    alCambiarValor(String(pct));
  };

  return (
    <div className={estilos.cardIndicadorForm}>
      <div className={estilos.cardIndicadorCabeza}>
        <div>
          <strong className={estilos.nombreIndicador}>{indicador.nombre}</strong>
          <span className={estilos.formulaIndicador}>{indicador.formula}</span>
        </div>
        {estado && <Semaforo estado={COLOR_SEMAFORO[estado]} texto={PALABRA_SEMAFORO[estado]} />}
      </div>

      <div className={estilos.filaInputs}>
        <CampoTexto
          etiqueta={`Valor actual (${indicador.unidad === 'escala_5' ? '1 a 5' : '%'})`}
          type="number"
          min={indicador.min}
          max={indicador.max}
          step={indicador.paso}
          value={valorTexto}
          onChange={(e) => alCambiarValor(e.target.value)}
          placeholder="Ej. 85"
        />
        <CampoTexto
          etiqueta={`Meta (${indicador.sentido === 'menor_mejor' ? '<' : '≥'})`}
          type="number"
          min={indicador.min}
          max={indicador.max}
          step={indicador.paso}
          value={metaTexto}
          onChange={(e) => alCambiarMeta(e.target.value)}
        />
      </div>

      {sugeridoApropiacion && (
        <div>
          <button
            type="button"
            className={estilos.botonMini}
            onClick={() => alCambiarValor(String(sugeridoApropiacion.valor))}
          >
            Usar termómetro T3 ({formatearValorA(sugeridoApropiacion.valor, 'escala_5')} · Ciclo {sugeridoApropiacion.ciclo},{' '}
            {sugeridoApropiacion.respuestas} respuestas)
          </button>
        </div>
      )}

      {indicador.calculadora && (
        <details className={estilos.calculadora}>
          <summary>Calcular con fórmula (numerador ÷ denominador)</summary>
          <div className={estilos.calculadoraCampos}>
            <CampoTexto
              etiqueta={indicador.calculadora.numerador}
              type="number"
              min={0}
              value={num}
              onChange={(e) => setNum(e.target.value)}
            />
            <CampoTexto
              etiqueta={indicador.calculadora.denominador}
              type="number"
              min={1}
              value={den}
              onChange={(e) => setDen(e.target.value)}
            />
            <button
              type="button"
              className={estilos.botonMini}
              onClick={aplicarCalculo}
              disabled={num.trim() === '' || den.trim() === '' || Number(den) <= 0}
            >
              Calcular %
            </button>
          </div>
        </details>
      )}
    </div>
  );
}

function PanelHistorial({
  auditorias,
  balancesT,
  esLider,
}: {
  auditorias: readonly RegistroAuditoriaA[];
  balancesT: RespuestaTableroA['balancesT'];
  esLider: boolean;
}) {
  return (
    <div className={estilos.bloques}>
      <section aria-labelledby="titulo-hist-auditorias" className={estilos.bloques}>
        <h3 id="titulo-hist-auditorias" className={estilos.subtitulo}>
          Evolución de auditorías
        </h3>
        <GraficoEvolucionAuditorias auditorias={auditorias} />
        {auditorias.length === 0 ? (
          <EstadoVacio titulo="Sin historial todavía">Las mediciones periódicas aparecerán aquí en orden cronológico.</EstadoVacio>
        ) : (
          <div className={estilos.envolturaTabla} tabIndex={0} role="region" aria-label="Historial de auditorías de adopción">
            <table className={estilos.tabla}>
              <thead>
                <tr>
                  <th scope="col">Periodo</th>
                  <th scope="col">Fecha</th>
                  <th scope="col">Equipo</th>
                  <th scope="col">En meta</th>
                  <th scope="col">Atención</th>
                  <th scope="col">Intervenir</th>
                  <th scope="col">Cumplimiento</th>
                </tr>
              </thead>
              <tbody>
                {auditorias.map((a) => {
                  const r = resumirSemaforosA(a.valores, a.metas);
                  return (
                    <tr key={a.id}>
                      <th scope="row">{a.periodo}</th>
                      <td className="numero">{a.fecha}</td>
                      <td>{a.equipo || 'Organización'}</td>
                      <td className="numero">{r.enMeta}</td>
                      <td className="numero">{r.atencion}</td>
                      <td className="numero">{r.intervenir}</td>
                      <td className={`${estilos.valorCelda} numero`}>
                        {r.porcentajeCumplimiento === null ? '—' : `${r.porcentajeCumplimiento} %`}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {esLider && (
        <section aria-labelledby="titulo-insumos-t4">
          <h3 id="titulo-insumos-t4" className={estilos.subtitulo}>
            Insumos recibidos desde Etapa T (Balances de ciclo)
          </h3>
          <p className={estilos.apoyo}>
            Los balances registrados al cierre de cada ciclo en T4 (Victorias tempranas) alimentan directamente el análisis de esta etapa.
          </p>
          {balancesT.length === 0 ? (
            <EstadoVacio titulo="Sin balances de ciclo registrados en T4">
              Cuando registres un balance de cierre en la etapa Transformar (T4), aparecerá aquí automáticamente como insumo.
            </EstadoVacio>
          ) : (
            <ul className={estilos.listaTarjetas}>
              {balancesT.map((b) => (
                <li key={b.id} className={estilos.tarjetaRegistro}>
                  <strong>Ciclo {b.ciclo}</strong>
                  <p>
                    <strong>Méritos obtenidos:</strong> {b.meritos}
                  </p>
                  <p>
                    <strong>Factores que los impulsaron:</strong> {b.factores}
                  </p>
                  <p>
                    <strong>Dificultades encontradas:</strong> {b.dificultades}
                  </p>
                  <span className={estilos.apoyo}>
                    {b.nombre ? `${b.nombre} · ` : ''}
                    {formatearFechaVista(b.creadoEn)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </div>
  );
}
