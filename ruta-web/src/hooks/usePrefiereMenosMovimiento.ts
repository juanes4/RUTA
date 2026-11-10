import { useEffect, useState } from 'react';

const CONSULTA = '(prefers-reduced-motion: reduce)';

export function usePrefiereMenosMovimiento(): boolean {
  const [prefiere, setPrefiere] = useState(() => window.matchMedia(CONSULTA).matches);

  useEffect(() => {
    const media = window.matchMedia(CONSULTA);
    const alCambiar = () => setPrefiere(media.matches);
    media.addEventListener('change', alCambiar);
    return () => media.removeEventListener('change', alCambiar);
  }, []);

  return prefiere;
}
