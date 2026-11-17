# rutas.ts

## Summary
Rutas con # sin dependencias: #/, #/tablero, #/etapa/<letra>[/<paso>]. Lógica pura y probada.

## Functions
- segmentoEtapa(etapa) — letra en minúscula
- parsearRuta(hash, etapas) — hash → Ruta (etapas vacías o pasos inexistentes → no_encontrada)
- hashDe(ruta, etapas) — Ruta → hash

## Non-function code
Tipo Ruta: inicio | tablero | etapa{etapaId, pasoId} | no_encontrada.

## Imports
- config/etapas — tipo Etapa

## Imported by
- navegacion/RutaContexto
- rutas.test.ts

## Tags
routing, pure

## Node path
ruta-web/src/navegacion/rutas.ts

## Last verified
2026-11-08
