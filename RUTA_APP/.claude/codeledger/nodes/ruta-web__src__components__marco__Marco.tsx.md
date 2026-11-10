# Marco.tsx

## Summary
Marco de todas las páginas. La columna oscura de navegación general (Inicio, etapas activas, Tablero) es un ancla fija en la pantalla, siempre en el mismo lugar, dentro de un panel de vidrio con difuminado igual al de la barra de etapas. El contenedor blanco empieza a 138px y se desplaza sin pasar por debajo. En celular el ancla pasa a barra superior.

## Functions
- Marco({etapas, conBarraEtapas, children})
- elementos(etapas) — ítems de la columna

## Non-function code
Estilos en Marco.module.css (.ancla fija con vidrio, .riel oscuro, .contenido con margen derecho de 264px cuando hay barra de etapas).

## Imports
- navegacion/RutaContexto
- Iconos

## Imported by
- App.tsx

## Tags
frontend, layout, navigation, glass

## Node path
ruta-web/src/components/marco/Marco.tsx

## Last verified
2026-11-08
