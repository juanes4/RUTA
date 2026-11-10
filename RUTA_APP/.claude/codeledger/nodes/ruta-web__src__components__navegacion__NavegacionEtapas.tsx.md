# NavegacionEtapas.tsx

## Summary
Barra flotante de vidrio a la derecha con los 5 nodos (0, R, U, T, A). Cada nodo activo lleva el color de su etapa y el actual va en negro. La lista de pasos que se abre al pasar el cursor va en vidrio mate (más opaco y difuso) con sombra. Contadores de pasos vistos; T y A "Próximamente". En celular, barra inferior.

## Functions
- NavegacionEtapas({etapas, idEtapaActual})
- NodoActivo() — nodo, contador y lista de pasos
- NodoVacio() — etapa por definir

## Non-function code
Estilos en NavegacionEtapas.module.css (--color-etapa por nodo).

## Imports
- estadoNavegacion — lógica pura
- estado/PasosVistosContexto, navegacion/RutaContexto

## Imported by
- views/PaginaEtapa

## Tags
frontend, navigation, a11y

## Node path
ruta-web/src/components/navegacion/NavegacionEtapas.tsx

## Last verified
2026-11-08
