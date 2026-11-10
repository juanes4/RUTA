# Explicacion.tsx

## Summary
Envuelve un campo y muestra su explicación en un tooltip negro encima, al pasar el cursor o al enfocarlo (focus-within). Entrega el id del texto por render prop para enlazarlo con aria-describedby; con `enfocable` el contenedor recibe foco (títulos de columna).

## Functions
- Explicacion({titulo, texto, children(idExplicacion), enfocable}) — contenedor con tooltip de dos niveles (nombre del campo y explicación)

## Non-function code
Estilos en Explicacion.module.css (.contenedor, .tooltip).

## Imports
- (ninguna)

## Imported by
- components/ui/Campo — prop explicacion
- views/etapa0/FormSegmentacion, ListaEditable, FormMetas

## Tags
frontend, ui, a11y, tooltip

## Node path
ruta-web/src/components/ui/Explicacion.tsx

## Last verified
2026-11-08
