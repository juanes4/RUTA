# Project Index

## Summary
RUTA: herramienta web de la metodología de gestión del cambio (reto ANDI 2026-2). Registra la empresa (Etapa 0), explica y mide las etapas Reconocer y Unir, y muestra un tablero con decisión R7, participación e indicadores con semáforo. Sin datos simulados; capa de IA preparada pero apagada.

## Tech Stack
TypeScript, React 19, Vite 8, Vitest 5, CSS Modules con tokens de DESIGN.md, localStorage detrás de una interfaz de almacén, enrutador propio con #.

## Files
| File | Tags | Summary | Status |
|------|------|---------|--------|
| ruta-web/src/App.tsx | frontend, routing, layout | App.tsx muestra Inicio, Tablero o una etapa según la ruta | active |
| ruta-web/src/main.tsx | frontend, entry, di | Entrada: almacén y proveedores | active |
| ruta-web/src/navegacion/rutas.ts | routing, pure | Parseo y generación de rutas con # | active |
| ruta-web/src/navegacion/RutaContexto.tsx | routing, react, context | Contexto de la ruta actual | active |
| ruta-web/src/estado/PasosVistosContexto.tsx | state, react, navigation | Pasos vistos en todas las páginas | active |
| ruta-web/src/estado/ProyectoContexto.tsx | state, react, data | Proyecto activo y sus datos | active |
| ruta-web/src/components/navegacion/NavegacionEtapas.tsx | frontend, navigation, a11y | Barra flotante de etapas | active |
| ruta-web/src/components/navegacion/estadoNavegacion.ts | pure, navigation | Estado puro de la barra | active |
| ruta-web/src/components/marco/Marco.tsx | frontend, layout, navigation, glass | Ancla fija de vidrio con la columna oscura y contenedor | active |
| ruta-web/src/components/marco/Iconos.tsx | frontend, icons | Iconos SVG | active |
| ruta-web/src/components/etapa/SeccionEtapa.tsx | frontend, layout | Encabezado de etapa y tarjeta de paso | active |
| ruta-web/src/views/PaginaEtapa.tsx | frontend, page, navigation | Página de una etapa | active |
| ruta-web/src/views/inicio/VistaInicio.tsx | frontend, page | Página principal | active |
| ruta-web/src/views/tablero/VistaTablero.tsx | frontend, dashboard | Página del tablero | active |
| ruta-web/src/views/tablero/TarjetaDecision.tsx | frontend, dashboard | Tarjeta de decisión R7 | active |
| ruta-web/src/views/tablero/ListaParticipacion.tsx | frontend, dashboard | Participación por área | active |
| ruta-web/src/views/tablero/TarjetasCategoria.tsx | frontend, dashboard | Tarjetas de categorías | active |
| ruta-web/src/views/tablero/TablaIndicadores.tsx | frontend, dashboard | Tabla de indicadores | active |
| ruta-web/src/components/ui/Semaforo.tsx | frontend, ui | Píldora de semáforo | active |
| ruta-web/src/lib/tablero/construirTablero.ts | pure, dashboard, calculo | Modelo del tablero | active |
| ruta-web/src/lib/tablero/indicadores.ts | pure, dashboard, indicadores | Calculadoras de indicadores | active |
| ruta-web/src/lib/formato.ts | utils, format | Formato de números | active |
| ruta-web/src/config/metas.ts | config, metas | Metas por defecto | active |
| ruta-web/src/config/tablero.ts | config, dashboard | Categorías del tablero | active |
| ruta-web/src/config/etapas.ts | config, navigation, colors | Etapas, pasos, color y tarjetas de cada etapa | active |
| ruta-web/src/hooks/useSeguimientoScroll.ts | hooks, navigation | Seguimiento del scroll | active |
| ruta-web/src/config/paleta.ts | config, design, colors | Pasteles y gris de DESIGN.md | active |
| ruta-web/src/components/ui/Boton.tsx | frontend, ui | Botones y botón + / − | active |
| ruta-web/src/components/ui/EstadoVacio.tsx | frontend, ui | Estado vacío | active |
| ruta-web/src/views/etapa0/VistaEtapa0.tsx | frontend, page, forms | Página de la Etapa 0 | active |
| ruta-web/src/views/etapa0/ListaEditable.tsx | frontend, forms | Lista editable con + y − | active |
| ruta-web/src/views/etapa0/FormSegmentacion.tsx | frontend, forms | Formulario de áreas y afectados | active |
| ruta-web/src/views/etapa0/SelectorProyecto.tsx | frontend, forms | Selector de empresa | active |
| ruta-web/src/views/reconocer/VistaReconocer.tsx | frontend, page | Página Reconocer | active |
| ruta-web/src/views/unir/VistaUnir.tsx | frontend, page | Página Unir | active |
| ruta-web/src/components/ui/Explicacion.tsx | frontend, ui, a11y, tooltip | Tooltip negro con la explicación de un campo (hover y foco) | active |
| ruta-web/src/contenido/etapa0.ts | content | Descripción de los pasos 0.N y explicación de cada campo | active |
