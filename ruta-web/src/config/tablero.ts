/**
 * Categorías del tablero (diseño de administrativa, documento maestro U5,
 * "matriz de indicadores como ejemplo"). Los indicadores de cada categoría
 * son los ejemplos del documento; todavía no tienen fórmula asignada.
 */

export interface IndicadorEjemplo {
  nombre: string;
  queSeMide: string;
}

export interface CategoriaTablero {
  id: string;
  nombre: string;
  /** Token pastel de DESIGN.md ("una por categoría"). El crema queda para "Atención". */
  colorFondo: 'var(--pastel-lavender)' | 'var(--pastel-mint)' | 'var(--pastel-blue)';
  indicadores: readonly IndicadorEjemplo[];
}

export const CATEGORIAS_TABLERO: readonly CategoriaTablero[] = [
  {
    id: 'compromiso',
    nombre: 'Compromiso y conciencia del cambio',
    colorFondo: 'var(--pastel-lavender)',
    indicadores: [
      { nombre: 'Conciencia del cambio', queSeMide: 'Porcentaje de colaboradores que entienden por qué se realiza el cambio' },
      { nombre: 'Aceptación y resistencia', queSeMide: 'Número de quejas reportadas, resultados de encuestas o índice de resistencia' },
    ],
  },
  {
    id: 'formacion',
    nombre: 'Formación y comunicación',
    colorFondo: 'var(--pastel-mint)',
    indicadores: [
      { nombre: 'Efectividad de la comunicación', queSeMide: 'Reuniones realizadas e información difundida por las áreas' },
      { nombre: 'Avance en capacitación', queSeMide: 'Porcentaje de cumplimiento de cursos, talleres o certificaciones' },
    ],
  },
  {
    id: 'adopcion',
    nombre: 'Adopción',
    colorFondo: 'var(--pastel-blue)',
    indicadores: [
      { nombre: 'Adopción individual y grupal', queSeMide: 'Porcentaje de usuarios que usan activamente las nuevas herramientas' },
      { nombre: 'Velocidad de adopción', queSeMide: 'Tiempo que tarda un equipo en alcanzar el desempeño esperado' },
    ],
  },
];
