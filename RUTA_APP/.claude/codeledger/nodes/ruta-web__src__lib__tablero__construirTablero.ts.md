# construirTablero.ts

## Summary
Arma el modelo del tablero: decisión R7 (buzón 1 por área y Kotter A), participación por área e indicadores con semáforo.

## Functions
- bloqueosPorArea(datos, reglas) — punto de bloqueo de cada grupo visible
- construirTablero(proyecto, datos, reglas) — {decision, participacion, indicadores}

## Non-function code
Tipos FilaIndicador y Tablero.

## Imports
- lib/calculo/*, lib/proyecto/etapa0, lib/tablero/indicadores, config/formularios/kotter

## Imported by
- views/tablero/VistaTablero
- construirTablero.test.ts

## Tags
pure, dashboard, calculo

## Node path
ruta-web/src/lib/tablero/construirTablero.ts

## Last verified
2026-11-08
