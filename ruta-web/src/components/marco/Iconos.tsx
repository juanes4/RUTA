/** Iconos de trazo simple; heredan el color del texto. */

const PROPS = {
  width: 20,
  height: 20,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
};

export function IconoInicio() {
  return (
    <svg {...PROPS}>
      <path d="M3 10.5 12 3l9 7.5" />
      <path d="M5 9.5V20h14V9.5" />
      <path d="M10 20v-6h4v6" />
    </svg>
  );
}

export function IconoTablero() {
  return (
    <svg {...PROPS}>
      <rect x="3" y="3" width="7" height="9" rx="2" />
      <rect x="14" y="3" width="7" height="5" rx="2" />
      <rect x="14" y="12" width="7" height="9" rx="2" />
      <rect x="3" y="16" width="7" height="5" rx="2" />
    </svg>
  );
}

export function IconoIngresar() {
  return (
    <svg {...PROPS}>
      <path d="M14 4h4a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-4" />
      <path d="M10 8l4 4-4 4" />
      <path d="M14 12H4" />
    </svg>
  );
}

export function IconoSalir() {
  return (
    <svg {...PROPS}>
      <path d="M10 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h4" />
      <path d="M16 8l4 4-4 4" />
      <path d="M20 12H10" />
    </svg>
  );
}

/** Edificio de oficinas: la empresa (símbolo de la Etapa 0). */
export function IconoEmpresa({ tamano = 20 }: { tamano?: number }) {
  return (
    <svg {...PROPS} width={tamano} height={tamano}>
      <path d="M4 21V5a2 2 0 0 1 2-2h7a2 2 0 0 1 2 2v16" />
      <path d="M15 9h3a2 2 0 0 1 2 2v10" />
      <path d="M2.5 21h19" />
      <path d="M8 7h3M8 11h3M8 15h3" />
      <path d="M17.5 13v.01M17.5 17v.01" />
    </svg>
  );
}

/** Destello: el copiloto (asistente de IA). */
export function IconoCopiloto({ tamano = 20 }: { tamano?: number }) {
  return (
    <svg {...PROPS} width={tamano} height={tamano}>
      <path d="M12 3.5l1.9 5.1 5.1 1.9-5.1 1.9L12 17.5l-1.9-5.1L5 10.5l5.1-1.9z" />
      <path d="M18.5 15.5l.8 2 2 .7-2 .8-.8 2-.7-2-2-.8 2-.7z" />
    </svg>
  );
}

/* ---------- Fases del recorrido (portada) ---------- */

/** Entender: un documento con renglones. */
export function IconoEntender({ tamano = 18 }: { tamano?: number }) {
  return (
    <svg {...PROPS} width={tamano} height={tamano}>
      <path d="M7 3h7l4 4v14H7z" />
      <path d="M14 3v4h4" />
      <path d="M10 11h5M10 14h5M10 17h3" />
    </svg>
  );
}

/** Escuchar: un parlante con ondas. */
export function IconoEscuchar({ tamano = 18 }: { tamano?: number }) {
  return (
    <svg {...PROPS} width={tamano} height={tamano}>
      <path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z" />
      <path d="M15.5 9a4 4 0 0 1 0 6" />
      <path d="M18 6.5a7.5 7.5 0 0 1 0 11" />
    </svg>
  );
}

/** Comunicar: dos globos de conversación. */
export function IconoComunicar({ tamano = 18 }: { tamano?: number }) {
  return (
    <svg {...PROPS} width={tamano} height={tamano}>
      <path d="M4 5h11v8H9l-3 3v-3H4z" />
      <path d="M15 9h5v8h-2v3l-3-3h-4v-2" />
    </svg>
  );
}

/** Acompañar: dos personas. */
export function IconoAcompanar({ tamano = 18 }: { tamano?: number }) {
  return (
    <svg {...PROPS} width={tamano} height={tamano}>
      <circle cx="9" cy="8" r="3.2" />
      <path d="M3.5 19a5.5 5.5 0 0 1 11 0" />
      <path d="M15.5 5.2a3 3 0 0 1 0 5.6" />
      <path d="M17.5 13.6a5.5 5.5 0 0 1 3 5.4" />
    </svg>
  );
}

/** Transformar: flechas que van y vuelven entre dos puntos. */
export function IconoTransformar({ tamano = 18 }: { tamano?: number }) {
  return (
    <svg {...PROPS} width={tamano} height={tamano}>
      <circle cx="6" cy="17" r="2" />
      <circle cx="18" cy="7" r="2" />
      <path d="M4 7h10M7 4 4 7l3 3" />
      <path d="M20 17H10m7-3 3 3-3 3" />
    </svg>
  );
}

/** Comprobar: un visto en un círculo. */
export function IconoComprobar({ tamano = 18 }: { tamano?: number }) {
  return (
    <svg {...PROPS} width={tamano} height={tamano}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="m8.5 12.2 2.4 2.4 4.6-4.8" />
    </svg>
  );
}

/* ---------- Pasos del copiloto ---------- */

/** Lienzo: un lápiz sobre una hoja. */
export function IconoLienzo({ tamano = 16 }: { tamano?: number }) {
  return (
    <svg {...PROPS} width={tamano} height={tamano}>
      <path d="M11 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-5" />
      <path d="M17.5 3.5a2.1 2.1 0 0 1 3 3L12 15l-4 1 1-4z" />
    </svg>
  );
}

/** Triaje: una cruz de evaluación en un círculo. */
export function IconoTriaje({ tamano = 16 }: { tamano?: number }) {
  return (
    <svg {...PROPS} width={tamano} height={tamano}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 8v8M8 12h8" />
    </svg>
  );
}

/** Buzón: un buzón con su bandera. */
export function IconoBuzon({ tamano = 16 }: { tamano?: number }) {
  return (
    <svg {...PROPS} width={tamano} height={tamano}>
      <path d="M3 19v-8a4 4 0 0 1 4-4h11a3 3 0 0 1 3 3v9z" />
      <path d="M7 7a4 4 0 0 1 4 4v8" />
      <path d="M15 12V4h3" />
    </svg>
  );
}

/** Dossier: una carpeta. */
export function IconoDossier({ tamano = 16 }: { tamano?: number }) {
  return (
    <svg {...PROPS} width={tamano} height={tamano}>
      <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <path d="M3 10h18" />
    </svg>
  );
}
