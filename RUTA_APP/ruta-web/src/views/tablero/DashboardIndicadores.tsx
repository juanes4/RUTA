import { useMemo } from 'react';
import type { ParticipacionArea } from '../../lib/calculo/participacion';
import type { FilaRespuesta, FilaUso } from '../../lib/modelo/tipos';
import type { FilaIndicador } from '../../lib/tablero/construirTablero';
import { GaugeCircular } from './GaugeCircular';
import { GaugeSemicircular } from './GaugeSemicircular';
import { GraficoBarrasPildora } from './GraficoBarrasPildora';
import { GraficoCurvaAdopcion } from './GraficoCurvaAdopcion';
import { GraficoMapaColaborador } from './GraficoMapaColaborador';
import {
  IconoPorId,
  IconoParticipacion,
  IconoUtilizacion,
  IconoUsoResidual,
} from './IconosTablero';
import { TarjetaMetricaSecundaria } from './TarjetaMetricaSecundaria';
import estilos from './VisualizacionesTablero.module.css';

interface Props {
  filas: readonly FilaIndicador[];
  participacion?: readonly ParticipacionArea[];
  uso?: readonly FilaUso[];
  respuestas?: readonly FilaRespuesta[];
}

/**
 * Dashboard visual creativo y accesible de indicadores (KPIs).
 * Inspirado en la composición de la referencia visual.
 * Sin emojis; paleta y tokens de DESIGN.md.
 */
export function DashboardIndicadores({
  filas,
  participacion = [],
  uso = [],
  respuestas = [],
}: Props) {
  const mapaFilas = useMemo(() => new Map(filas.map((f) => [f.meta.id, f])), [filas]);

  const filaParticipacion = mapaFilas.get('participacion');
  const filaUtilizacion = mapaFilas.get('utilizacion');
  const filaUsoResidual = mapaFilas.get('uso_residual');

  const metricasSecundarias = useMemo(
    () =>
      filas.filter(
        (f) => !['participacion', 'utilizacion', 'uso_residual'].includes(f.meta.id),
      ),
    [filas],
  );

  return (
    <div className={estilos.contenedorDashboard}>
      {/* 1. Fila Superior: 3 Indicadores Core con Medidores Circulares y Semicirculares */}
      <section aria-label="Indicadores principales" className={estilos.rejillaHero}>
        {filaParticipacion && (
          <GaugeCircular
            fila={filaParticipacion}
            colorEtapa="var(--pastel-blue)"
            icono={<IconoParticipacion />}
          />
        )}
        {filaUtilizacion && (
          <GaugeCircular
            fila={filaUtilizacion}
            colorEtapa="var(--pastel-lavender)"
            icono={<IconoUtilizacion />}
          />
        )}
        {filaUsoResidual && (
          <GaugeSemicircular
            fila={filaUsoResidual}
            colorEtapa="var(--pastel-lavender)"
            icono={<IconoUsoResidual />}
          />
        )}
      </section>

      {/* 2. Gráfico de Barras Principal (Metas KPIs, Áreas, ADKAR) - Ancho completo, sin capas superpuestas */}
      <section aria-label="Comparativa de barras">
        <GraficoBarrasPildora
          filas={filas}
          areas={participacion}
          respuestas={respuestas}
        />
      </section>

      {/* 3. Mapa del Colaborador (Recorrido de la experiencia por fases con caras) - Tema Claro */}
      <section aria-label="Mapa de experiencia del colaborador">
        <GraficoMapaColaborador respuestas={respuestas} />
      </section>

      {/* 4. Fila Inferior Equilibrada: Métricas de Liderazgo + Curva de Adopción por Ciclos */}
      <section aria-label="Métricas secundarias y evolución de adopción" className={estilos.filaInferiorDoble}>
        <article className={estilos.panelSecundario}>
          <header className={estilos.cabeceraPanel}>
            <div>
              <h3 className={estilos.tituloPanel}>Gestión del cambio y liderazgo</h3>
              <p className={estilos.subtituloPanel}>Seguimiento de factores clave de éxito</p>
            </div>
          </header>

          <div className={estilos.rejillaMetricasSecundarias}>
            {metricasSecundarias.map((f) => (
              <TarjetaMetricaSecundaria
                key={f.meta.id}
                fila={f}
                icono={IconoPorId(f.meta.id)}
              />
            ))}
          </div>
        </article>

        <GraficoCurvaAdopcion uso={uso} />
      </section>
    </div>
  );
}
