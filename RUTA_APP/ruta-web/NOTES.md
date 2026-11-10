# NOTES · mapa del código

Comandos: `npm run dev` · `npm test` · `npm run build`

## Configuración (ningún umbral, meta ni texto fijo en componentes)
- `src/config/etapas.ts` — etapas 0/R/U/T/A, pasos, `activa`; `anclaPaso()` da el id HTML de un paso.
- `src/config/reglas.ts` — `REGLAS`: umbral 3,0, mínimos 5 y 3, margen 15 %, niveles Kotter, reglas R7.
- `src/config/metas.ts` — `METAS` por defecto (documento) y `buscarMeta()`.
- `src/config/formularios/buzon1.ts` — preguntas del buzón 1.
- `src/config/formularios/kotter.ts` — `KOTTER_PARTE_A`, escala y tablas de conversión.
- `src/config/ia.ts` — capa de IA, `habilitada: false`.
- `src/contenido/pasos.ts` — `FICHAS`, `DESCRIPCION_ETAPA`, `ACCIONES_POR_BLOQUEO`, `RECORRIDO` (texto del documento).
- `src/contenido/etapa0.ts` — `DESCRIPCION_PASO_ETAPA0` (texto bajo cada 0.N) y `EXPLICACION_CAMPO` (tooltip de cada campo).

## Dominio y cálculo (funciones puras, sin React)
- `src/lib/modelo/tipos.ts` — filas del modelo de datos (CONTEXTO §7), `ORDEN_ADKAR`, `NO_SE`.
- `src/lib/modelo/proyecto.ts` — `Proyecto` (Etapa 0) y `DatosProyecto`.
- `src/lib/calculo/adkar.ts` — `resumirAdkar`, `puntoDeBloqueo`, `porcentajeFavorable`, `porcentajeNoSe`.
- `src/lib/calculo/grupos.ts` — `agruparConAnonimato` ("Otros"), `agruparCombinado` (área × turno).
- `src/lib/calculo/semaforo.ts` — `evaluarSemaforo` (margen relativo o alerta propia).
- `src/lib/calculo/kotter.ts` — `puntajeRespuesta`, `puntajesPorPaso`, `nivelPaso`, `agruparPorRol`, `calcularBrechas`.
- `src/lib/calculo/decisionR7.ts` — `decidirR7`.
- `src/lib/calculo/participacion.ts` — `participacionPorArea`, `participacionTotal`.
- `src/lib/calculo/pruebas/fabricas.ts` — constructores de filas, solo para pruebas.
- `src/lib/proyecto/` — `crearProyecto`, validación y metas de la Etapa 0.
- `src/lib/almacen/` — interfaz `Almacen`; `AlmacenMemoria`; `AlmacenLocal` (localStorage, clave `ruta:v1`).
- `src/lib/ia/contratos.ts` — interfaces `ProveedorIA`, `ContextoIA` (sin implementación).

- `src/lib/tablero/construirTablero.ts` — modelo del tablero (decisión R7, participación, indicadores).
- `src/lib/tablero/calculoUsoCiclos.ts` — `resumirUsoPorCiclo` para evolución de adopción y uso residual.
- `src/lib/tablero/calculoBarras.ts` — `prepararBarrasIndicadores` y `prepararBarrasAdkar` para el gráfico interactivo de barras.
- `src/lib/tablero/mapaColaborador.ts` — `calcularMapaColaborador` y `clasificarExperiencia` para la curva por fases con caras.
- `src/lib/tablero/indicadores.ts` — `CALCULADORAS` por indicador; `calcularIndicador()`.
- `src/lib/formato.ts` — `formatearValor()` (es-CO).

## Rutas (#/, #/tablero, #/etapa/r, #/etapa/r/R6)
- `src/navegacion/rutas.ts` — `parsearRuta`, `hashDe` (puras).
- `src/navegacion/RutaContexto.tsx` — `ProveedorRuta`, `useRuta()` → `{ruta, navegar, enlace}`.

## Interfaz
- `src/App.tsx` — elige la página según la ruta; `VISTAS` registra la vista de cada etapa.
- `src/estado/ProyectoContexto.tsx` — `ProveedorProyecto` (recibe el almacén) y `useProyecto()`.
- `src/estado/PasosVistosContexto.tsx` — pasos vistos en todas las páginas.
- `src/components/marco/` — columna oscura de navegación general + contenedor blanco.
- `src/components/navegacion/` — barra flotante de etapas (derecha); lógica pura en `estadoNavegacion.ts`.
- `src/components/etapa/` — `SeccionEtapa` (h1 de la página), `BloquePaso`, `FichaPaso`.
- `src/components/ui/` — `Boton`, `Campo*` (prop `explicacion`), `Explicacion` (tooltip negro en hover/foco, render prop con id para aria-describedby), `EstadoVacio`, `Semaforo`.
- `src/views/PaginaEtapa.tsx` — página de etapa: vista + barra flotante + scroll al paso.
- `src/views/` — `inicio`, `etapa0` (4 formularios), `reconocer`, `unir`, `tablero` (incluye dashboard visual con gauges, barras en píldora y curva de adopción).
- `src/styles/tokens.css` — todos los valores de DESIGN.md como variables CSS.
