import { useMemo, type CSSProperties, type ReactNode } from 'react';
import { EstadoVacio } from '../../components/ui/EstadoVacio';
import { Semaforo } from '../../components/ui/Semaforo';
import { FASES_VIAJE_CONFIG } from '../../config/analizar';
import { ETAPAS } from '../../config/etapas';
import { ESTILOS_LIDERAZGO, LETRAS_LIDERAZGO } from '../../config/formularios/liderazgo';
import { ALCANCES, ESTRATEGIAS_FODA, NIVELES_COMPROMISO, RUTAS_TRIAJE } from '../../config/formularios/reconocer';
import { REGLAS } from '../../config/reglas';
import { AFIRMACIONES_TERMOMETRO, ESCALERA, META_TERMOMETRO } from '../../config/transformar';
import { useProyecto } from '../../estado/ProyectoContexto';
import { useSesion } from '../../estado/SesionContexto';
import { brechaCompromiso } from '../../lib/calculo/actores';
import { deltaIndicadorA, formatearValorA, resumirSemaforosA } from '../../lib/analizar/calculos';
import { PALABRA_SEMAFORO, type EstadoSemaforo } from '../../lib/analizar/semaforo';
import type { BrechaSeguridad } from '../../lib/api';
import { formatearPorcentaje } from '../../lib/formato';
import { resumenPaso } from '../../lib/reconocer/resumenPaso';
import { construirTablero, type Tablero } from '../../lib/tablero/construirTablero';
import { filasIndicadores, hallazgos, type FilaIndicador, type Hallazgo } from '../../lib/tablero/perspectivas';
import { useRuta } from '../../navegacion/RutaContexto';
import {
  Apiladas,
  BarrasDobles,
  Burbujas,
  ChipEtapa,
  ContenidoGlobo,
  Curva,
  Divergente,
  Dona,
  Mancuernas,
  MapaCalor,
  Mariposa,
  Medidor,
  Minitendencia,
  Piruletas,
  Tarjeta,
  type ZonaBurbujas,
} from './Graficos';
import { useDatosServidor, type DatosServidor } from './useDatosServidor';
import estilos from './Tablero.module.css';

/**
 * Tablero del cambio, en cuatro niveles de importancia:
 * 1. Estado del cambio: semáforo de adopción, hallazgos priorizados e indicadores clave.
 * 2. Adopción y apropiación (etapas A y T): cómo se está viviendo el cambio.
 * 3. Diagnóstico de partida (etapas R y U): de dónde se partió.
 * 4. Avance de la metodología: el detalle por paso.
 */

const COLOR_ESTADO: Record<EstadoSemaforo, string> = {
  en_meta: 'var(--estado-bien)',
  atencion: 'var(--estado-atencion)',
  intervenir: 'var(--estado-intervenir)',
};
const DOS_DECIMALES = new Intl.NumberFormat('es-CO', { maximumFractionDigits: 2 });
const n1 = (v: number) => DOS_DECIMALES.format(v);
const MOMENTO_CORTO: Record<string, string> = { antes: 'Antes', durante: 'Durante', actual: 'Hoy', mejorar: 'Por mejorar' };
const ETIQUETA_AFIRMACION = ['Trabajo sin pensar en lo anterior', 'Puedo enseñarlo a alguien nuevo', 'Mi jefe hace seguimiento', 'Acuerdos claros en el equipo', 'La empresa cumplió lo prometido'];

export function VistaTablero() {
  const { cargando, activo, datos } = useProyecto();
  const { usuario } = useSesion();
  const { enlace } = useRuta();
  const servidor = useDatosServidor();
  const tablero = useMemo(() => (activo ? construirTablero(activo, datos, REGLAS) : null), [activo, datos]);
  const esLider = usuario?.rol === 'lider';

  if (cargando) return null;

  return (
    <>
      <header className={estilos.cabecera}>
        <h1>Tablero</h1>
        <p className={estilos.detalle}>{activo ? activo.empresa.nombre || 'Empresa sin nombre' : 'Seguimiento del cambio'}</p>
      </header>
      {!tablero || !activo ? (
        <EstadoVacio
          titulo="Aún no hay una empresa registrada"
          accion={
            <a className={estilos.enlaceSecundario} href={enlace({ pagina: 'etapa', etapaId: 'etapa-0', pasoId: null })}>
              Ir a la Etapa 0 <span aria-hidden="true">→</span>
            </a>
          }
        >
          El tablero se llena con lo que la empresa registra en las etapas de RUTA.
        </EstadoVacio>
      ) : (
        <Contenido tablero={tablero} servidor={servidor} esLider={esLider} />
      )}
    </>
  );
}

function Contenido({ tablero, servidor, esLider }: { tablero: Tablero; servidor: DatosServidor; esLider: boolean }) {
  const { datos } = useProyecto();
  const auditorias = servidor.tableroA?.auditorias ?? [];
  const indicadores = useMemo(() => filasIndicadores(auditorias), [auditorias]);
  const informe = datos.copiloto.informe?.resultado.informe ?? null;
  const ciclosTermo = (servidor.termometro?.ciclos ?? []).filter((c) => c.promedio !== null);
  const brechas = useMemo(() => conteoBrechas(servidor), [servidor]);
  const ultimoViaje = servidor.viajes.at(-1) ?? null;

  const lista = useMemo(
    () =>
      hallazgos({
        periodoActual: auditorias[0]?.periodo ?? null,
        indicadores,
        temas: informe?.temas ?? [],
        respuestasBuzon: informe?.participacion.respuestas ?? datos.buzon1.length,
        actores: tablero.actores.prioridades,
        fases: (ultimoViaje?.resumen.fases ?? []).map((f) => ({ titulo: FASES_VIAJE_CONFIG.find((c) => c.id === f.id)?.titulo ?? f.id, promedio: f.promedio })),
        periodoFases: ultimoViaje?.periodo ?? null,
        apropiacion: { anterior: ciclosTermo.at(-2)?.promedio ?? null, actual: ciclosTermo.at(-1)?.promedio ?? null, meta: META_TERMOMETRO },
        simulador: esLider && servidor.historial?.verTodos ? brechas : null,
      }),
    [auditorias, indicadores, informe, datos.buzon1.length, tablero.actores.prioridades, ultimoViaje, ciclosTermo, esLider, servidor.historial, brechas],
  );

  return (
    <div className={estilos.niveles}>
      <Seccion numero={1} titulo="Estado del cambio" subtitulo="Lo primero que hay que mirar: cómo va la adopción y qué requiere una decisión.">
        <div className={estilos.filaEstado}>
          <TarjetaEstado tablero={tablero} indicadores={indicadores} periodo={auditorias[0]?.periodo ?? null} />
          <Hallazgos lista={lista} cargando={servidor.cargando} />
        </div>
        <IndicadoresClave indicadores={indicadores} servidor={servidor} esLider={esLider} />
      </Seccion>

      <Seccion numero={2} titulo="Adopción y apropiación" subtitulo="Etapas Transformar y Analizar: cómo se está viviendo el cambio en el día a día.">
        <div className={estilos.rejilla12}>
          <GraficoIndicadores indicadores={indicadores} auditorias={auditorias} className={estilos.ancho7} />
          <GraficoViaje servidor={servidor} className={estilos.ancho5} />
          {esLider ? (
            <>
              <GraficoEscalera servidor={servidor} esLider={esLider} className={estilos.ancho6} />
              <GraficoTermometro servidor={servidor} esLider={esLider} className={estilos.ancho6} />
              <GraficoSimulador servidor={servidor} esLider={esLider} brechas={brechas} className={estilos.ancho6} />
              <GraficoPulso servidor={servidor} esLider={esLider} className={estilos.ancho6} />
            </>
          ) : (
            <p className={`${estilos.sinDatos} ${estilos.ancho12}`}>
              La escalera de autonomía, el termómetro, los resultados del simulador y el pulso de las sesiones son del equipo completo: los ve el equipo de gestión del cambio.
            </p>
          )}
        </div>
      </Seccion>

      <Seccion numero={3} titulo="Diagnóstico de partida" subtitulo="Etapas Reconocer y Unir: de dónde partió el cambio y con quién se cuenta.">
        <div className={estilos.rejilla12}>
          <GraficoTriaje tablero={tablero} className={estilos.ancho4} />
          <GraficoTemas className={estilos.ancho8} />
          <GraficoSentimientos className={estilos.ancho6} />
          <GraficoParticipacion tablero={tablero} className={estilos.ancho6} />
          <GraficoActores className={estilos.ancho7} />
          <div className={`${estilos.columna} ${estilos.ancho5}`}>
            <GraficoFoda tablero={tablero} />
            <GraficoLiderazgo tablero={tablero} />
          </div>
        </div>
      </Seccion>

      <Seccion numero={4} titulo="Avance de la metodología" subtitulo="El detalle de cada paso de Reconocer y Unir, con acceso directo.">
        <AvancePasos />
      </Seccion>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Estructura                                                           */
/* ------------------------------------------------------------------ */

function Seccion({ numero, titulo, subtitulo, children }: { numero: number; titulo: string; subtitulo: string; children: ReactNode }) {
  const id = `nivel-${numero}`;
  return (
    <section className={estilos.seccion} aria-labelledby={id} data-nivel={numero}>
      <header className={estilos.cabeceraSeccion}>
        <span className={estilos.numeroSeccion} aria-hidden="true">
          {numero}
        </span>
        <div>
          <h2 id={id} className={estilos.tituloSeccion}>
            {titulo}
          </h2>
          <p className={estilos.detalle}>{subtitulo}</p>
        </div>
      </header>
      {children}
    </section>
  );
}

function SinDatos({ children }: { children: ReactNode }) {
  return <p className={estilos.sinDatos}>{children}</p>;
}

/* ------------------------------------------------------------------ */
/* Nivel 1                                                              */
/* ------------------------------------------------------------------ */

function TarjetaEstado({ tablero, indicadores, periodo }: { tablero: Tablero; indicadores: readonly FilaIndicador[]; periodo: string | null }) {
  const { enlace } = useRuta();
  const { triaje } = tablero;
  const resumen = resumirSemaforosA(
    Object.fromEntries(indicadores.map((f) => [f.id, f.actual])),
    Object.fromEntries(indicadores.map((f) => [f.id, f.meta])),
  );
  const hay = resumen.evaluados > 0;
  const porMejorar = indicadores.filter((f) => f.estado && f.estado !== 'en_meta');
  const estadoGeneral = !hay ? 'Sin auditorías de adopción' : resumen.intervenir > 0 ? 'Requiere intervención' : resumen.atencion > 0 ? 'Avanza con alertas' : 'En la meta';
  const alcance = ALCANCES.find((a) => a.valor === triaje.alcance);
  const segmentos = [
    { nombre: 'En la meta', valor: resumen.enMeta, color: COLOR_ESTADO.en_meta },
    { nombre: 'Atención', valor: resumen.atencion, color: COLOR_ESTADO.atencion },
    { nombre: 'Intervenir', valor: resumen.intervenir, color: COLOR_ESTADO.intervenir },
  ];
  return (
    <section className={estilos.tarjetaOscura} aria-labelledby="titulo-estado">
      <p id="titulo-estado" className={estilos.antetituloOscuro}>
        Adopción · auditoría A1{periodo ? ` · ${periodo}` : ''}
      </p>
      <p className={estilos.estadoGeneral}>{estadoGeneral}</p>
      {hay ? (
        <div className={estilos.estadoDona}>
          <Dona segmentos={segmentos} centro={{ valor: `${resumen.enMeta}/${resumen.evaluados}`, etiqueta: 'en la meta' }} superficie="var(--bg-dark)" oscura tamano={184} grosor={20} />
          <ul className={estilos.leyendaOscura}>
            {segmentos.map((s) => (
              <li key={s.nombre}>
                <i style={{ background: s.color }} aria-hidden="true" />
                <span>{s.nombre}</span>
                <strong className="numero">{s.valor}</strong>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <p className={estilos.textoOscuro}>Registra la primera auditoría en la Etapa A para ver el semáforo de adopción.</p>
      )}
      {porMejorar.length > 0 && (
        <div className={estilos.porMejorar}>
          <span className={estilos.antetituloOscuro}>Por mejorar, del más lejano al más cercano a la meta</span>
          <ul>
            {porMejorar.map((f) => (
              <li key={f.id}>
                <i style={{ background: f.estado ? COLOR_ESTADO[f.estado] : undefined }} aria-hidden="true" />
                <span>{f.nombre}</span>
                <strong className="numero">{formatearValorA(f.actual, f.indicador.unidad)}</strong>
                <span className={estilos.metaOscura}>
                  meta {f.indicador.sentido === 'menor_mejor' ? '≤' : '≥'} {formatearValorA(f.meta, f.indicador.unidad)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
      <div className={estilos.rutaOscura}>
        <span className={estilos.antetituloOscuro}>Ruta del triaje (R2)</span>
        {triaje.nivel && triaje.total !== null ? (
          <span className={estilos.rutaLinea}>
            <Semaforo estado={triaje.nivel} texto={`${triaje.total} de 9`} />
            {RUTAS_TRIAJE[triaje.nivel].clasificacion}
            {alcance ? ` · ${alcance.nombre.toLowerCase()}` : ''}
          </span>
        ) : (
          <span className={estilos.textoOscuro}>Sin puntuar</span>
        )}
      </div>
      <a className={estilos.enlaceOscuro} href={enlace({ pagina: 'etapa', etapaId: 'etapa-a', pasoId: 'A1' })}>
        Abrir la auditoría <span aria-hidden="true">→</span>
      </a>
    </section>
  );
}

const PALABRA_PRIORIDAD: Record<Hallazgo['prioridad'], string> = { actuar: 'Actuar', vigilar: 'Vigilar', bien: 'Va bien' };

function Hallazgos({ lista, cargando }: { lista: readonly Hallazgo[]; cargando: boolean }) {
  return (
    <section className={estilos.hallazgos} aria-labelledby="titulo-hallazgos">
      <header className={estilos.cabeceraHallazgos}>
        <h3 id="titulo-hallazgos" className={estilos.tituloHallazgos}>
          Hallazgos, de lo más urgente a lo que va bien
        </h3>
        <p className={estilos.detalle}>Calculados con reglas fijas sobre los datos de cada etapa.</p>
      </header>
      {lista.length === 0 ? (
        <SinDatos>{cargando ? 'Cargando…' : 'Todavía no hay datos suficientes para sacar hallazgos.'}</SinDatos>
      ) : (
        <ol className={estilos.listaHallazgos}>
          {lista.map((h) => (
            <li key={h.titulo} className={estilos.hallazgo} data-prioridad={h.prioridad}>
              <span className={estilos.prioridad} data-prioridad={h.prioridad}>
                {PALABRA_PRIORIDAD[h.prioridad]}
              </span>
              <div>
                <p className={estilos.tituloHallazgo}>{h.titulo}</p>
                <p className={estilos.detalle}>{h.detalle}</p>
              </div>
              <ChipEtapa etapa={h.etapa} />
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

function IndicadoresClave({ indicadores, servidor, esLider }: { indicadores: readonly FilaIndicador[]; servidor: DatosServidor; esLider: boolean }) {
  const de = (id: string) => indicadores.find((f) => f.id === id);
  const ciclos = (servidor.termometro?.ciclos ?? []).filter((c) => c.promedio !== null);
  const meritos = servidor.meritos ?? [];
  const publicados = meritos.filter((m) => m.publicar).length;
  const tarjetas: ReactNode[] = [];

  for (const id of ['uso_sostenido', 'autonomia'] as const) {
    const f = de(id);
    const previo = f ? f.serie.at(-2) : null;
    const delta = f ? deltaIndicadorA(f.actual, previo, f.indicador) : null;
    tarjetas.push(
      <Indicador
        key={id}
        etapa="A"
        nombre={f?.nombre ?? id}
        valor={f ? formatearValorA(f.actual, f.indicador.unidad) : '—'}
        meta={f ? `Meta ${f.indicador.sentido === 'menor_mejor' ? '≤' : '≥'} ${formatearValorA(f.meta, f.indicador.unidad)}` : 'Sin auditorías'}
        estado={f?.estado ?? null}
        delta={delta ? { texto: `${delta.texto} vs. auditoría anterior`, favorable: delta.favorable } : null}
        serie={f?.serie ?? []}
      />,
    );
  }

  const ultimo = ciclos.at(-1)?.promedio ?? null;
  const anterior = ciclos.at(-2)?.promedio ?? null;
  tarjetas.push(
    <Indicador
      key="apropiacion"
      etapa="T"
      nombre="Apropiación (termómetro)"
      valor={ultimo === null ? '—' : `${n1(ultimo)} / 5`}
      meta={esLider ? `Meta ≥ ${n1(META_TERMOMETRO)} · ciclo ${ciclos.at(-1)?.ciclo ?? '—'}` : 'Solo lo ve el equipo de gestión del cambio'}
      estado={ultimo === null ? null : ultimo >= META_TERMOMETRO ? 'en_meta' : ultimo >= META_TERMOMETRO * 0.85 ? 'atencion' : 'intervenir'}
      delta={ultimo !== null && anterior !== null ? { texto: `${ultimo >= anterior ? '↑ +' : '↓ '}${n1(ultimo - anterior)} vs. ciclo anterior`, favorable: ultimo > anterior ? true : ultimo < anterior ? false : null } : null}
      serie={ciclos.map((c) => c.promedio)}
    />,
  );

  const porClase = (c: string) => meritos.filter((m) => m.clasificacion === c).length;
  tarjetas.push(
    <Indicador
      key="meritos"
      etapa="T"
      nombre="Victorias tempranas (T4)"
      valor={meritos.length ? `${publicados} publicadas` : '—'}
      meta={meritos.length ? `${meritos.length} méritos valorados · ${porClase('destacado')} destacado, ${porClase('favorable')} favorable` : 'Sin méritos registrados'}
      estado={null}
      delta={null}
      serie={[]}
    />,
  );

  return <div className={estilos.indicadoresClave}>{tarjetas}</div>;
}

function Indicador({
  etapa,
  nombre,
  valor,
  meta,
  estado,
  delta,
  serie,
}: {
  etapa: 'A' | 'T';
  nombre: string;
  valor: string;
  meta: string;
  estado: EstadoSemaforo | null;
  delta: { texto: string; favorable: boolean | null } | null;
  serie: readonly (number | null)[];
}) {
  return (
    <article className={estilos.indicador}>
      <header className={estilos.cabeceraIndicador}>
        <ChipEtapa etapa={etapa} />
        <h3 className={estilos.nombreIndicador}>{nombre}</h3>
      </header>
      <div className={estilos.valorConTendencia}>
        <p className={`${estilos.valorIndicador} numero`}>{valor}</p>
        <Minitendencia valores={serie} color={estado ? COLOR_ESTADO[estado] : 'var(--grafico-1)'} />
      </div>
      <p className={estilos.detalle}>{meta}</p>
      <div className={estilos.pieIndicador}>
        {estado && (
          <span className={estilos.estado} data-estado={estado}>
            <i aria-hidden="true" />
            {PALABRA_SEMAFORO[estado]}
          </span>
        )}
        {delta && (
          <span className={estilos.delta} data-favorable={delta.favorable === null ? 'neutro' : String(delta.favorable)}>
            {delta.texto}
          </span>
        )}
      </div>
    </article>
  );
}

/* ------------------------------------------------------------------ */
/* Nivel 2 · Adopción y apropiación                                     */
/* ------------------------------------------------------------------ */

function GraficoIndicadores({ indicadores, auditorias, className }: { indicadores: readonly FilaIndicador[]; auditorias: readonly { periodo: string }[]; className?: string }) {
  const evaluados = indicadores.filter((f) => f.estado !== null);
  const enMeta = evaluados.filter((f) => f.estado === 'en_meta').length;
  const peor = evaluados.find((f) => f.estado !== 'en_meta');
  const primera = auditorias.at(-1)?.periodo;
  const ultima = auditorias[0]?.periodo;
  return (
    <Tarjeta
      className={className}
      etapa="A"
      paso="A1"
      titulo="Indicadores de adopción frente a su meta"
      lectura={
        evaluados.length
          ? `${enMeta} de ${evaluados.length} indicadores en la meta${peor ? `; ${peor.nombre.toLowerCase()} es el que más falta.` : '.'}`
          : undefined
      }
      leyenda={[
        ...(auditorias.length > 1 ? [{ nombre: `Primera auditoría (${primera})`, color: 'var(--grafico-neutro)', forma: 'anillo' as const }] : []),
        { nombre: `${ultima ?? 'Última'} · en la meta`, color: COLOR_ESTADO.en_meta, forma: 'punto' as const },
        { nombre: 'Atención', color: COLOR_ESTADO.atencion, forma: 'punto' as const },
        { nombre: 'Intervenir', color: COLOR_ESTADO.intervenir, forma: 'punto' as const },
      ]}
      nota="Escala común: % de cumplimiento de la meta (100 = en la meta). En «Regreso a lo anterior», menos es mejor y ya viene invertido."
      datos={{
        columnas: ['Indicador', primera ?? 'Primera', ultima ?? 'Última', 'Meta', 'Cumplimiento', 'Estado'],
        filas: indicadores.map((f) => [
          f.nombre,
          formatearValorA(f.inicial, f.indicador.unidad),
          formatearValorA(f.actual, f.indicador.unidad),
          `${f.indicador.sentido === 'menor_mejor' ? '≤' : '≥'} ${formatearValorA(f.meta, f.indicador.unidad)}`,
          f.cumplimientoActual === null ? '—' : `${n1(f.cumplimientoActual)} %`,
          f.estado ? PALABRA_SEMAFORO[f.estado] : '—',
        ]),
      }}
    >
      {evaluados.length === 0 ? (
        <SinDatos>Todavía no hay auditorías de adopción (A1).</SinDatos>
      ) : (
        <Mancuernas
          filas={indicadores.map((f) => ({
            clave: f.id,
            etiqueta: f.nombre,
            desde: f.cumplimientoInicial,
            hasta: f.cumplimientoActual,
            color: f.estado ? COLOR_ESTADO[f.estado] : undefined,
            valor: formatearValorA(f.actual, f.indicador.unidad),
            globo: (
              <ContenidoGlobo
                titulo={f.nombre}
                lineas={[
                  ...(f.inicial !== null ? [`${primera}: ${formatearValorA(f.inicial, f.indicador.unidad)}`] : []),
                  `${ultima}: ${formatearValorA(f.actual, f.indicador.unidad)}`,
                  `Meta: ${f.indicador.sentido === 'menor_mejor' ? '≤' : '≥'} ${formatearValorA(f.meta, f.indicador.unidad)}`,
                  f.estado ? PALABRA_SEMAFORO[f.estado] : 'Sin dato',
                ]}
              />
            ),
          }))}
          dominio={[0, 120]}
          referencia={{ valor: 100, etiqueta: 'Meta' }}
          formato={(v) => `${Math.round(v)} %`}
        />
      )}
    </Tarjeta>
  );
}

function GraficoViaje({ servidor, className }: { servidor: DatosServidor; className?: string }) {
  const viajes = servidor.viajes.slice(-2);
  const categorias = FASES_VIAJE_CONFIG.map((f) => f.titulo);
  const ultimo = viajes.at(-1);
  const primero = viajes.length > 1 ? viajes[0] : null;
  const baja = ultimo ? [...ultimo.resumen.fases].filter((f) => f.promedio !== null).sort((a, b) => (a.promedio ?? 0) - (b.promedio ?? 0))[0] : null;
  const nombreFase = (id: string) => FASES_VIAJE_CONFIG.find((f) => f.id === id)?.titulo ?? id;
  const colores = ['var(--grafico-neutro)', 'var(--grafico-1)'];
  return (
    <Tarjeta
      className={className}
      etapa="A"
      paso="A2"
      titulo="Curva emocional del colaborador"
      lectura={
        ultimo && ultimo.resumen.promedioGeneral !== null
          ? `${primero && primero.resumen.promedioGeneral !== null ? `Pasó de ${n1(primero.resumen.promedioGeneral)} a ${n1(ultimo.resumen.promedioGeneral)}` : `Promedio ${n1(ultimo.resumen.promedioGeneral)}`} de 3; «${baja ? nombreFase(baja.id) : ''}» es el momento más bajo.`
          : undefined
      }
      leyenda={viajes.map((v, i) => ({ nombre: `${v.periodo} (${v.resumen.totalRespuestas} personas)`, color: colores[viajes.length === 1 ? 1 : i] as string, forma: viajes.length > 1 && i === 0 ? ('guion' as const) : ('linea' as const) }))}
      datos={{
        columnas: ['Momento', ...viajes.map((v) => v.periodo)],
        filas: FASES_VIAJE_CONFIG.map((f) => [f.titulo, ...viajes.map((v) => { const p = v.resumen.fases.find((x) => x.id === f.id)?.promedio; return p === null || p === undefined ? '—' : n1(p); })]),
      }}
    >
      {viajes.length === 0 ? (
        <SinDatos>Todavía no hay respuestas del mapa de viaje (A2).</SinDatos>
      ) : (
        <Curva
          alto={290}
          categorias={FASES_VIAJE_CONFIG.map((f) => MOMENTO_CORTO[f.id] ?? f.titulo)}
          categoriasLargas={categorias}
          dominio={[1, 3]}
          formato={n1}
          bandas={[
            { desde: 2.5, hasta: 3, etiqueta: '🙂 Superada', color: 'var(--pastel-mint)' },
            { desde: 1.8, hasta: 2.5, etiqueta: '😐 En proceso', color: 'var(--pastel-cream)' },
            { desde: 1, hasta: 1.8, etiqueta: '🙁 Preocupa', color: 'var(--peligro-bg)' },
          ]}
          series={viajes.map((v, i) => ({
            nombre: v.periodo,
            color: colores[viajes.length === 1 ? 1 : i] as string,
            contexto: viajes.length > 1 && i === 0,
            valores: FASES_VIAJE_CONFIG.map((f) => v.resumen.fases.find((x) => x.id === f.id)?.promedio ?? null),
          }))}
        />
      )}
    </Tarjeta>
  );
}

const COLORES_ESCALON = ['var(--grafico-sec-2)', 'var(--grafico-sec-3)', 'var(--grafico-sec-4)', 'var(--grafico-sec-5)'];

function GraficoEscalera({ servidor, esLider, className }: { servidor: DatosServidor; esLider: boolean; className?: string }) {
  const conteos = servidor.votos ?? [];
  const pct34 = (niveles: readonly number[]) => {
    const t = niveles.reduce((s, v) => s + v, 0);
    return t ? Math.round((((niveles[2] ?? 0) + (niveles[3] ?? 0)) / t) * 100) : 0;
  };
  const primero = conteos[0];
  const ultimo = conteos.at(-1);
  const nombre = (c: { ciclo: number; momento: string }) => `Ciclo ${c.ciclo} · ${c.momento}`;
  return (
    <Tarjeta
      className={className}
      etapa="T"
      paso="T3"
      titulo="Escalera de autonomía: en qué escalón se ubica el equipo"
      lectura={ultimo && primero && ultimo !== primero ? `${pct34(ultimo.niveles)} % ya es autónomo o referente (${nombre(ultimo).toLowerCase()}); al ${nombre(primero).toLowerCase()} era ${pct34(primero.niveles)} %.` : undefined}
      leyenda={ESCALERA.map((e, i) => ({ nombre: `${e.nivel}. ${e.nombre}`, color: COLORES_ESCALON[i] as string }))}
      datos={{ columnas: ['Momento', ...ESCALERA.map((e) => e.nombre)], filas: conteos.map((c) => [nombre(c), ...c.niveles]) }}
    >
      {!esLider ? (
        <SinDatos>El conteo de votos lo ve el equipo de gestión del cambio.</SinDatos>
      ) : conteos.length === 0 ? (
        <SinDatos>Todavía no hay votos en la escalera (T3).</SinDatos>
      ) : (
        <Apiladas
          filas={conteos.map((c) => ({ etiqueta: nombre(c), valores: c.niveles }))}
          categorias={ESCALERA.map((e, i) => ({ nombre: `${e.nivel}. ${e.nombre}`, color: COLORES_ESCALON[i] as string, tinta: i >= 2 ? ('clara' as const) : ('oscura' as const) }))}
          etiquetaAncho={118}
        />
      )}
    </Tarjeta>
  );
}

function GraficoTermometro({ servidor, esLider, className }: { servidor: DatosServidor; esLider: boolean; className?: string }) {
  const ciclos = (servidor.termometro?.ciclos ?? []).filter((c) => c.porAfirmacion !== null);
  const primero = ciclos.length > 1 ? ciclos[0] : null;
  const ultimo = ciclos.at(-1);
  const filas = AFIRMACIONES_TERMOMETRO.map((texto, i) => ({
    texto,
    corta: ETIQUETA_AFIRMACION[i] ?? texto,
    desde: primero?.porAfirmacion?.[i] ?? null,
    hasta: ultimo?.porAfirmacion?.[i] ?? null,
  })).sort((a, b) => (a.hasta ?? 0) - (b.hasta ?? 0));
  const baja = filas[0];
  return (
    <Tarjeta
      className={className}
      etapa="T"
      paso="T3"
      titulo="Termómetro de apropiación por afirmación"
      lectura={ultimo && baja?.hasta !== null && baja ? `La más baja: «${baja.corta.toLowerCase()}» (${n1(baja.hasta as number)} de 5).` : undefined}
      leyenda={[
        ...(primero ? [{ nombre: `Ciclo ${primero.ciclo}`, color: 'var(--grafico-neutro)', forma: 'anillo' as const }] : []),
        ...(ultimo ? [{ nombre: `Ciclo ${ultimo.ciclo} · en la meta`, color: COLOR_ESTADO.en_meta, forma: 'punto' as const }, { nombre: 'Bajo la meta', color: COLOR_ESTADO.atencion, forma: 'punto' as const }] : []),
      ]}
      nota={servidor.termometro ? `Anónimo: solo se muestra con ${servidor.termometro.minimo} respuestas o más por ciclo.` : undefined}
      datos={{ columnas: ['Afirmación', ...ciclos.map((c) => `Ciclo ${c.ciclo}`)], filas: AFIRMACIONES_TERMOMETRO.map((t, i) => [t, ...ciclos.map((c) => n1(c.porAfirmacion?.[i] ?? 0))]) }}
    >
      {!esLider ? (
        <SinDatos>El termómetro es anónimo y lo ve el equipo de gestión del cambio.</SinDatos>
      ) : !ultimo ? (
        <SinDatos>Todavía no hay un ciclo con el mínimo de respuestas.</SinDatos>
      ) : (
        <Mancuernas
          filas={filas.map((f) => ({
            clave: f.texto,
            etiqueta: f.corta,
            desde: f.desde,
            hasta: f.hasta,
            color: f.hasta !== null && f.hasta >= META_TERMOMETRO ? COLOR_ESTADO.en_meta : COLOR_ESTADO.atencion,
            globo: <ContenidoGlobo titulo={f.texto} lineas={[...(f.desde !== null && primero ? [`Ciclo ${primero.ciclo}: ${n1(f.desde)}`] : []), `Ciclo ${ultimo.ciclo}: ${f.hasta === null ? '—' : n1(f.hasta)}`, `Meta: ${n1(META_TERMOMETRO)}`]} />,
          }))}
          dominio={[1, 5]}
          referencia={{ valor: META_TERMOMETRO, etiqueta: `Meta ${n1(META_TERMOMETRO)}` }}
          formato={n1}
          proporcionEtiqueta={0.42}
        />
      )}
    </Tarjeta>
  );
}

const ZONAS_SIMULADOR: Record<BrechaSeguridad, ZonaBurbujas> = {
  sobreconfianza: { clave: 'sobreconfianza', nombre: 'Sobreconfianza', color: 'var(--grafico-2)', x: [0, 1], y: [4, 5] },
  necesita_apoyo: { clave: 'necesita_apoyo', nombre: 'Necesita apoyo', color: 'var(--grafico-4)', x: [0, 1], y: [1, 2] },
  subestima: { clave: 'subestima', nombre: 'Se subestima', color: 'var(--grafico-3)', x: [3, 3], y: [1, 2] },
  alineado: { clave: 'alineado', nombre: 'Alineado', color: 'var(--grafico-1)', x: [2, 3], y: [3, 5] },
};

/** Misma regla del servidor (simulador.mjs): 2 de 3 aciertos aprueba. */
function brechaDe(aciertos: number, seguridad: number): BrechaSeguridad {
  const aprobo = aciertos >= 2;
  if (seguridad >= 4 && !aprobo) return 'sobreconfianza';
  if (seguridad <= 2 && aciertos === 3) return 'subestima';
  if (seguridad <= 2 && !aprobo) return 'necesita_apoyo';
  return 'alineado';
}

function resultadosSimulador(servidor: DatosServidor) {
  return (servidor.historial?.videos ?? []).flatMap((v) => v.vistas.flatMap((s) => (s.simulador ? [s.simulador] : [])));
}

function conteoBrechas(servidor: DatosServidor): Partial<Record<BrechaSeguridad, number>> {
  const c: Partial<Record<BrechaSeguridad, number>> = {};
  for (const r of resultadosSimulador(servidor)) c[r.brecha] = (c[r.brecha] ?? 0) + 1;
  return c;
}

function GraficoSimulador({ servidor, esLider, brechas, className }: { servidor: DatosServidor; esLider: boolean; brechas: Partial<Record<BrechaSeguridad, number>>; className?: string }) {
  const resultados = resultadosSimulador(servidor);
  const mapa = new Map<string, { x: number; y: number; n: number }>();
  for (const r of resultados) {
    const k = `${r.aciertos}-${r.seguridad}`;
    const p = mapa.get(k) ?? { x: r.aciertos, y: r.seguridad, n: 0 };
    p.n += 1;
    mapa.set(k, p);
  }
  const total = resultados.length;
  const orden: BrechaSeguridad[] = ['alineado', 'sobreconfianza', 'subestima', 'necesita_apoyo'];
  const pct = (b: BrechaSeguridad) => (total ? Math.round(((brechas[b] ?? 0) / total) * 100) : 0);
  return (
    <Tarjeta
      className={className}
      etapa="T"
      paso="T2"
      titulo="Simulador: lo que saben frente a lo seguros que se sienten"
      lectura={total ? `${pct('alineado')} % está alineado; ${brechas.sobreconfianza ?? 0} resultados con sobreconfianza piden un repaso.` : undefined}
      leyenda={orden.map((b) => ({ nombre: `${ZONAS_SIMULADOR[b].nombre} (${brechas[b] ?? 0})`, color: ZONAS_SIMULADOR[b].color, forma: 'punto' as const }))}
      nota="Cada burbuja agrupa los resultados con los mismos aciertos y la misma seguridad; su tamaño es cuántos son."
      datos={{ columnas: ['Lectura', 'Resultados', '%'], filas: orden.map((b) => [ZONAS_SIMULADOR[b].nombre, brechas[b] ?? 0, `${pct(b)} %`]) }}
    >
      {!esLider || !servidor.historial?.verTodos ? (
        <SinDatos>Los resultados de todo el equipo los ve el equipo de gestión del cambio.</SinDatos>
      ) : total === 0 ? (
        <SinDatos>Todavía no hay resultados del simulador (T2).</SinDatos>
      ) : (
        <Burbujas
          puntos={[...mapa.values()]}
          zonas={[ZONAS_SIMULADOR.sobreconfianza, ZONAS_SIMULADOR.necesita_apoyo, ZONAS_SIMULADOR.subestima]}
          ejeX="Aciertos (de 3) · aprueba con 2"
          ejeY="Seguridad (1 a 5)"
          dominioX={[0, 3]}
          dominioY={[1, 5]}
          zonaDe={(x, y) => ZONAS_SIMULADOR[brechaDe(x, y)]}
        />
      )}
    </Tarjeta>
  );
}

function GraficoPulso({ servidor, esLider, className }: { servidor: DatosServidor; esLider: boolean; className?: string }) {
  const registros = servidor.pulsos ?? [];
  const sesiones = [...new Map([...registros].sort((a, b) => a.creadoEn.localeCompare(b.creadoEn)).map((r) => [r.sesion, true])).keys()];
  const criterios = [
    { id: 'claridad', nombre: 'Claridad' },
    { id: 'utilidad', nombre: 'Utilidad' },
    { id: 'confianza', nombre: 'Formato o canal' },
  ] as const;
  const prom = (sesion: string, c: (typeof criterios)[number]['id']) => {
    const v = registros.filter((r) => r.sesion === sesion).map((r) => r[c]);
    return v.length ? Math.round((v.reduce((s, x) => s + x, 0) / v.length) * 10) / 10 : null;
  };
  const valores = sesiones.map((s) => criterios.map((c) => prom(s, c.id)));
  const celdas = sesiones.flatMap((s, i) => criterios.map((c, j) => ({ s, c: c.nombre, v: valores[i]?.[j] ?? null }))).filter((x) => x.v !== null) as { s: string; c: string; v: number }[];
  const peor = [...celdas].sort((a, b) => a.v - b.v)[0];
  const mejor = [...celdas].sort((a, b) => b.v - a.v)[0];
  return (
    <Tarjeta
      className={className}
      etapa="T"
      paso="T1"
      titulo="Pulso de cada sesión de comunicación"
      lectura={peor && mejor ? `Lo mejor: ${mejor.c.toLowerCase()} en «${mejor.s}» (${n1(mejor.v)}). A mejorar: ${peor.c.toLowerCase()} en «${peor.s}» (${n1(peor.v)}).` : undefined}
      nota={registros.length ? `Promedio de 1 a 5 · ${registros.length} respuestas en ${sesiones.length} sesiones.` : undefined}
      datos={{ columnas: ['Sesión', ...criterios.map((c) => c.nombre)], filas: sesiones.map((s, i) => [s, ...(valores[i] ?? []).map((v) => (v === null ? '—' : n1(v)))]) }}
    >
      {!esLider ? (
        <SinDatos>El promedio por sesión lo ve el equipo de gestión del cambio.</SinDatos>
      ) : sesiones.length === 0 ? (
        <SinDatos>Todavía no hay encuestas de pulso (T1).</SinDatos>
      ) : (
        <MapaCalor filas={sesiones} columnas={criterios.map((c) => c.nombre)} valores={valores} dominio={[1, 5]} formato={n1} />
      )}
    </Tarjeta>
  );
}

/* ------------------------------------------------------------------ */
/* Nivel 3 · Diagnóstico de partida                                     */
/* ------------------------------------------------------------------ */

function GraficoTriaje({ tablero, className }: { tablero: Tablero; className?: string }) {
  const { triaje } = tablero;
  const { verdeHasta, amarilloHasta } = REGLAS.triaje;
  const criterios = [
    { nombre: 'Impacto en las personas', valor: triaje.impacto_personas },
    { nombre: 'Complejidad organizacional', valor: triaje.complejidad },
    { nombre: 'Riesgo operativo', valor: triaje.riesgo_operativo },
  ];
  return (
    <Tarjeta
      className={className}
      etapa="R"
      paso="R2"
      titulo="Triaje: qué tan grande es el cambio"
      lectura={
        triaje.nivel
          ? `${RUTAS_TRIAJE[triaje.nivel].clasificacion}: ${criterios.filter((c) => c.valor === 3).length} de 3 criterios en el puntaje máximo.`
          : undefined
      }
      datos={{ columnas: ['Criterio', 'Puntaje (1 a 3)'], filas: [...criterios.map((c) => [c.nombre, c.valor ?? '—']), ['Total', triaje.total ?? '—']] }}
    >
      <div className={estilos.triaje}>
        <Medidor
          valor={triaje.total}
          minimo={3}
          maximo={9}
          zonas={[
            { hasta: verdeHasta + 0.5, color: 'var(--estado-bien)', nombre: 'Verde · cambio ágil' },
            { hasta: amarilloHasta + 0.5, color: 'var(--estado-atencion)', nombre: 'Amarillo · cambio moderado' },
            { hasta: 9, color: 'var(--estado-intervenir)', nombre: 'Rojo · cambio mayor' },
          ]}
          etiqueta={triaje.total === null ? 'Sin puntuar' : `${triaje.total} de 9 puntos`}
        />
        <ul className={estilos.criterios}>
          {criterios.map((c) => (
            <li key={c.nombre}>
              <span>{c.nombre}</span>
              <span className={estilos.pips} aria-label={`${c.valor ?? 0} de 3`}>
                {[1, 2, 3].map((k) => (
                  <i key={k} data-lleno={c.valor !== null && k <= c.valor} />
                ))}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </Tarjeta>
  );
}

function GraficoTemas({ className }: { className?: string }) {
  const { datos } = useProyecto();
  const informe = datos.copiloto.informe?.resultado.informe ?? null;
  const temas = [...(informe?.temas ?? [])].sort((a, b) => b.total - a.total).slice(0, 8);
  const top = temas[0];
  const respuestas = informe?.participacion.respuestas ?? 0;
  return (
    <Tarjeta
      className={className}
      etapa="R"
      paso="R5"
      titulo="Temas del buzón: qué falla hoy y qué preocupa del cambio"
      lectura={top ? `«${top.tema}» encabeza con ${top.total} menciones, sobre todo por lo que falla hoy (${top.p1}).` : undefined}
      leyenda={[
        { nombre: 'Lo que falla hoy (P1)', color: 'var(--grafico-1)' },
        { nombre: 'Lo que preocupa del cambio (P2)', color: 'var(--grafico-2)' },
      ]}
      nota={informe ? `Clasificado por el Copiloto de Reconocimiento con IA; los conteos se calculan en código · ${respuestas} respuestas.` : undefined}
      datos={{ columnas: ['Tema', 'Falla hoy', 'Preocupa', 'Total'], filas: temas.map((t) => [t.tema, t.p1, t.p2, t.total]) }}
    >
      {temas.length === 0 ? (
        <SinDatos>Analiza el buzón con el Copiloto de Reconocimiento para ver sus temas.</SinDatos>
      ) : (
        <BarrasDobles
          filas={temas.map((t) => ({ etiqueta: t.tema, valores: [t.p1, t.p2] as const }))}
          series={[
            { nombre: 'Lo que falla hoy', color: 'var(--grafico-1)' },
            { nombre: 'Lo que preocupa del cambio', color: 'var(--grafico-2)' },
          ]}
        />
      )}
    </Tarjeta>
  );
}

function GraficoSentimientos({ className }: { className?: string }) {
  const { datos } = useProyecto();
  const s = datos.copiloto.informe?.resultado.informe.sentimientos ?? null;
  const v = (k: string) => s?.[k] ?? 0;
  const negativos = [
    { nombre: 'Preocupado', valor: v('preocupado') },
    { nombre: 'Molesto', valor: v('molesto') },
    { nombre: 'Resignado', valor: v('resignado') },
  ];
  const total = Object.values(s ?? {}).reduce((a, b) => a + b, 0);
  const neg = negativos.reduce((a, b) => a + b.valor, 0);
  return (
    <Tarjeta
      className={className}
      etapa="R"
      paso="R5"
      titulo="Tono de las respuestas del buzón"
      lectura={total ? `${Math.round((neg / total) * 100)} % de lo que dice la gente tiene un tono negativo; predomina la preocupación.` : undefined}
      leyenda={[
        { nombre: 'Negativo', color: 'var(--grafico-2)' },
        { nombre: 'Neutral', color: 'var(--grafico-neutro)' },
        { nombre: 'Propositivo', color: 'var(--grafico-1)' },
      ]}
      datos={{ columnas: ['Tono', 'Respuestas'], filas: [...negativos.map((n) => [n.nombre, n.valor]), ['Neutral', v('neutral')], ['Propositivo', v('propositivo')]] }}
    >
      {!total ? (
        <SinDatos>Analiza el buzón con el copiloto para ver el tono.</SinDatos>
      ) : (
        <>
          <Divergente
            negativo={{ nombre: 'Negativo', partes: negativos }}
            neutral={{ nombre: 'Neutral', valor: v('neutral') }}
            positivo={{ nombre: 'Propositivo', partes: [{ nombre: 'Propositivo', valor: v('propositivo') }] }}
          />
          <ul className={estilos.desglose} aria-label="Desglose del tono negativo">
            {negativos.map((n) => (
              <li key={n.nombre}>
                <span className={estilos.cifraDesglose}>{Math.round((n.valor / total) * 100)} %</span>
                {n.nombre.toLowerCase()}
              </li>
            ))}
          </ul>
        </>
      )}
    </Tarjeta>
  );
}

function GraficoParticipacion({ tablero, className }: { tablero: Tablero; className?: string }) {
  const { areas, total, respuestas } = tablero.buzon;
  const mejor = [...areas].filter((a) => a.participacion !== null).sort((a, b) => (b.participacion ?? 0) - (a.participacion ?? 0))[0];
  return (
    <Tarjeta
      className={className}
      etapa="R"
      paso="R5"
      titulo="Participación en el buzón por área"
      lectura={total !== null ? `Respondió el ${formatearPorcentaje(total)} de los afectados (${respuestas} personas)${mejor ? `; ${mejor.area} es el área que más participó.` : '.'}` : undefined}
      nota="Respuestas ÷ personas afectadas de cada área (Etapa 0)."
      datos={{ columnas: ['Área', 'Respondieron', 'Afectados', 'Participación'], filas: areas.map((a) => [a.area, a.respondentes, a.afectados, a.participacion === null ? '—' : formatearPorcentaje(a.participacion)]) }}
    >
      {areas.length === 0 ? (
        <SinDatos>Registra las áreas y sus afectados en la Etapa 0.</SinDatos>
      ) : (
        <Piruletas
          filas={[...areas]
            .sort((a, b) => (b.participacion ?? -1) - (a.participacion ?? -1))
            .map((a) => ({
              etiqueta: a.area,
              valor: a.participacion,
              globo: <ContenidoGlobo titulo={a.area} lineas={[`${a.respondentes} de ${a.afectados} afectados`, a.participacion === null ? 'Sin afectados registrados' : formatearPorcentaje(a.participacion)]} />,
            }))}
          formato={formatearPorcentaje}
          promedio={total !== null ? { valor: total, etiqueta: `Total ${formatearPorcentaje(total)}` } : undefined}
        />
      )}
    </Tarjeta>
  );
}

const NOMBRE_CORTO_COMPROMISO = ['Desconoce', 'Se resiste', 'Neutral', 'Apoya', 'Lidera'];

function GraficoActores({ className }: { className?: string }) {
  const { datos } = useProyecto();
  const posicion = (v: string | null) => NIVELES_COMPROMISO.findIndex((n) => n.valor === v);
  const filas = datos.actores
    .filter((a) => a.compromiso_actual && a.compromiso_deseado)
    .map((a) => ({ a, brecha: brechaCompromiso(a) ?? 0 }))
    .sort((x, y) => y.brecha - x.brecha);
  const conBrecha = filas.filter((f) => f.brecha > 0).length;
  return (
    <Tarjeta
      className={className}
      etapa="R"
      paso="R4"
      titulo="Mapa de actores: dónde está cada uno y dónde necesita estar"
      lectura={filas.length ? `${conBrecha} de ${filas.length} actores tienen que moverse; ${filas[0]?.a.actor} es el que más.` : undefined}
      leyenda={[
        { nombre: 'Compromiso hoy', color: 'var(--grafico-neutro)', forma: 'anillo' },
        { nombre: 'Compromiso necesario', color: 'var(--grafico-4)', forma: 'punto' },
      ]}
      datos={{
        columnas: ['Actor', 'Poder', 'Interés', 'Hoy', 'Necesario', 'Brecha'],
        filas: filas.map(({ a, brecha }) => [a.actor, a.poder ?? '—', a.interes ?? '—', NOMBRE_CORTO_COMPROMISO[posicion(a.compromiso_actual)] ?? '—', NOMBRE_CORTO_COMPROMISO[posicion(a.compromiso_deseado)] ?? '—', brecha]),
      }}
    >
      {filas.length === 0 ? (
        <SinDatos>Marca el compromiso actual y el deseado de cada actor en R4.</SinDatos>
      ) : (
        <Mancuernas
          filas={filas.map(({ a, brecha }) => ({
            clave: a.id,
            etiqueta: a.actor,
            desde: posicion(a.compromiso_actual),
            hasta: posicion(a.compromiso_deseado),
            color: 'var(--grafico-4)',
            valor: brecha > 0 ? `+${brecha}` : brecha === 0 ? '✓' : String(brecha),
            globo: (
              <ContenidoGlobo
                titulo={a.actor}
                lineas={[`Hoy: ${NOMBRE_CORTO_COMPROMISO[posicion(a.compromiso_actual)]}`, `Necesario: ${NOMBRE_CORTO_COMPROMISO[posicion(a.compromiso_deseado)]}`, `Poder ${a.poder === 'A' ? 'alto' : 'bajo'} · interés ${a.interes === 'A' ? 'alto' : 'bajo'}`]}
              />
            ),
          }))}
          dominio={[0, 4]}
          formato={(v) => NOMBRE_CORTO_COMPROMISO[Math.round(v)] ?? ''}
          proporcionEtiqueta={0.38}
        />
      )}
    </Tarjeta>
  );
}

function GraficoFoda({ tablero }: { tablero: Tablero }) {
  const { foda } = tablero;
  return (
    <Tarjeta
      etapa="R"
      paso="R3"
      titulo="FODA: balance interno y externo"
      lectura={foda.estrategia ? `Estrategia ${ESTRATEGIAS_FODA[foda.estrategia].nombre}: interno ${foda.interno > 0 ? '+' : ''}${foda.interno}, externo ${foda.externo > 0 ? '+' : ''}${foda.externo}.` : undefined}
      nota={foda.estrategia ? ESTRATEGIAS_FODA[foda.estrategia].descripcion : undefined}
      datos={{ columnas: ['Cuadrante', 'Puntos'], filas: [['Fortalezas', foda.totales.F], ['Debilidades', foda.totales.D], ['Oportunidades', foda.totales.O], ['Amenazas', foda.totales.A]] }}
    >
      {foda.items === 0 ? (
        <SinDatos>Registra los ítems del FODA en R3.</SinDatos>
      ) : (
        <Mariposa
          filas={[
            { etiqueta: 'Interno', izquierda: { nombre: 'D', valor: foda.totales.D }, derecha: { nombre: 'F', valor: foda.totales.F } },
            { etiqueta: 'Externo', izquierda: { nombre: 'A', valor: foda.totales.A }, derecha: { nombre: 'O', valor: foda.totales.O } },
          ]}
        />
      )}
    </Tarjeta>
  );
}

const COLOR_ESTILO = ['var(--grafico-1)', 'var(--grafico-2)', 'var(--grafico-3)', 'var(--grafico-4)'];

function GraficoLiderazgo({ tablero }: { tablero: Tablero }) {
  const { liderazgo, vocero } = tablero;
  const dominante = [...LETRAS_LIDERAZGO].sort((a, b) => liderazgo.porEstilo[b] - liderazgo.porEstilo[a])[0];
  return (
    <Tarjeta
      etapa="U"
      paso="U1"
      titulo="Estilos de liderazgo del equipo"
      lectura={liderazgo.lideres ? `Predomina el estilo ${dominante ? ESTILOS_LIDERAZGO[dominante].nombre.toLowerCase() : ''}; vocero: ${vocero || 'sin elegir'}.` : undefined}
      leyenda={LETRAS_LIDERAZGO.map((l, i) => ({ nombre: `${ESTILOS_LIDERAZGO[l].nombre} (${liderazgo.porEstilo[l]})`, color: COLOR_ESTILO[i] as string }))}
      nota="Un líder puede tener más de un estilo dominante."
      datos={{ columnas: ['Estilo', 'Líderes'], filas: LETRAS_LIDERAZGO.map((l) => [ESTILOS_LIDERAZGO[l].nombre, liderazgo.porEstilo[l]]) }}
    >
      {liderazgo.lideres === 0 ? (
        <SinDatos>Registra las encuestas de liderazgo en U1.</SinDatos>
      ) : (
        <Apiladas
          filas={[{ etiqueta: '', valores: LETRAS_LIDERAZGO.map((l) => liderazgo.porEstilo[l]) }]}
          categorias={LETRAS_LIDERAZGO.map((l, i) => ({ nombre: ESTILOS_LIDERAZGO[l].nombre, color: COLOR_ESTILO[i] as string, tinta: i === 0 || i === 3 ? ('clara' as const) : ('oscura' as const) }))}
          unidad="líderes"
          alto_fila={34}
        />
      )}
    </Tarjeta>
  );
}

/* ------------------------------------------------------------------ */
/* Nivel 4 · Avance                                                     */
/* ------------------------------------------------------------------ */

function AvancePasos() {
  const { activo, datos } = useProyecto();
  const { enlace } = useRuta();
  const etapas = ETAPAS.filter((e) => e.id === 'etapa-r' || e.id === 'etapa-u');
  return (
    <ul className={estilos.avance}>
      {etapas.flatMap((etapa) =>
        etapa.pasos.map((paso) => (
          <li key={paso.id}>
            <a className={estilos.celdaIndicador} href={enlace({ pagina: 'etapa', etapaId: etapa.id, pasoId: paso.id })}>
              <span className={estilos.cuadroEtapa} style={{ '--fondo-etapa': etapa.color } as CSSProperties}>
                {paso.id}
              </span>
              <span>
                <span className={estilos.nombrePaso}>{paso.titulo}</span>
                <span className={estilos.estadoPaso}>{resumenPaso(paso.id, activo, datos)}</span>
              </span>
            </a>
          </li>
        )),
      )}
    </ul>
  );
}
