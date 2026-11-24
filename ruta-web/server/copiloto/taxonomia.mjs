/**
 * Taxonomía fija del Copiloto de Reconocimiento (R5, análisis del buzón).
 * La usan el esquema que se le pide a Gemini, la clasificación de referencia
 * del buzón de prueba y el cálculo del informe.
 */

export const TEMAS = [
  { codigo: 'SOB', tema: 'Sobrecarga', incluye: 'Exceso de trabajo, falta de tiempo, turnos', ejemplo: 'No damos abasto y ahora nos meten otra cosa' },
  { codigo: 'CAP', tema: 'Capacitación', incluye: 'No saber hacer lo nuevo, falta de formación', ejemplo: 'Nadie nos ha explicado cómo funciona' },
  { codigo: 'REC', tema: 'Herramientas y recursos', incluye: 'Equipos, software, materiales, presupuesto', ejemplo: 'El sistema se cae todos los días' },
  { codigo: 'COA', tema: 'Comunicación entre áreas', incluye: 'Información que no fluye, trabajo aislado', ejemplo: 'Bodega no le avisa a producción' },
  { codigo: 'COD', tema: 'Comunicación con la dirección', incluye: 'Decisiones sin explicar, no ser escuchado', ejemplo: 'Siempre nos enteramos de último' },
  { codigo: 'EMP', tema: 'Miedo a perder el empleo', incluye: 'Despidos, recortes, reemplazo', ejemplo: 'Esto es para sacar gente' },
  { codigo: 'OBS', tema: 'Miedo a no poder', incluye: 'Quedar obsoleto, no aprender a tiempo', ejemplo: 'A mi edad no voy a aprender eso' },
  { codigo: 'HIS', tema: 'Cambios anteriores fallidos', incluye: 'Proyectos que no siguieron, fatiga', ejemplo: 'Ya lo intentaron dos veces y nada' },
  { codigo: 'DES', tema: 'Desconfianza', incluye: 'Sospecha sobre motivos o promesas', ejemplo: 'Dicen una cosa y hacen otra' },
  { codigo: 'PRO', tema: 'Procesos ineficientes', incluye: 'Reprocesos, pasos inútiles, demoras', ejemplo: 'Llenamos el mismo formato tres veces' },
];

/** Código para lo que no encaja en ninguno; va con un nombre corto aparte. */
export const OTRO = 'OTRO';
export const CODIGOS_TEMA = [...TEMAS.map((t) => t.codigo), OTRO];
export const NOMBRE_TEMA = Object.fromEntries(TEMAS.map((t) => [t.codigo, t.tema]));

export const SENTIMIENTOS = ['preocupado', 'molesto', 'resignado', 'neutral', 'propositivo'];

/** Protocolo de revisión humana (1.4): solo se informa tipo y cantidad. */
export const TIPOS_REVISION = ['ninguna', 'acoso_maltrato', 'seguridad_salud', 'posible_delito', 'amenaza', 'angustia_grave'];
export const NOMBRE_REVISION = {
  acoso_maltrato: 'posible acoso o maltrato',
  seguridad_salud: 'riesgo para la seguridad o la salud',
  posible_delito: 'posible delito',
  amenaza: 'amenaza',
  angustia_grave: 'angustia personal grave',
};

/** Grupo opcional del buzón (dimensión distinta del área). */
export const GRUPOS = ['Operativo', 'Administrativo', 'Líder de área', 'Prefiero no decirlo'];
export const SIN_GRUPO = 'Sin grupo';

export const PREGUNTAS = {
  p1: '¿Qué es lo que más falla hoy en este proceso?',
  p2: '¿Qué te preocupa del cambio?',
  p3: 'Si tú decidieras, ¿qué harías para mejorar?',
};

/** Reglas de conteo (1.3). */
export const REGLAS_BUZON = {
  /** Un grupo o un área con menos respuestas no se muestra por separado. */
  minimoPorSegmento: 5,
  /** Con menos respuestas en total, los resultados son indicativos y no representativos. */
  minimoRepresentativo: 20,
  /** Diferencia mínima (en puntos porcentuales) para llamar "clara" una diferencia entre segmentos. */
  diferenciaClara: 20,
  maximoDiferencias: 3,
  temasPrincipales: 5,
};
