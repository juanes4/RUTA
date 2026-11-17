import type { CSSProperties, ReactNode } from 'react';
import { anclaPaso, type Etapa, type EstiloTarjeta, type PasoEtapa } from '../../config/etapas';
import estilos from './SeccionEtapa.module.css';

interface PropsSeccion {
  etapa: Etapa;
  descripcion: string;
  children: ReactNode;
}

/** Encabezado de la página de una etapa; la letra lleva el pastel de la etapa. */
export function SeccionEtapa({ etapa, descripcion, children }: PropsSeccion) {
  const idTitulo = `titulo-${etapa.id}`;
  const color = { '--color-etapa': etapa.color ?? 'var(--bg-soft)' } as CSSProperties;
  return (
    <section id={etapa.id} className={estilos.seccion} aria-labelledby={idTitulo} tabIndex={-1} style={color}>
      <header className={estilos.cabecera}>
        <span className={estilos.letra} aria-hidden="true">
          {etapa.letra}
        </span>
        <div>
          <h1 id={idTitulo}>{etapa.nombre}</h1>
          <p className={estilos.descripcion}>{descripcion}</p>
        </div>
      </header>
      <div className={estilos.pasos}>{children}</div>
    </section>
  );
}

interface PropsPaso {
  paso: PasoEtapa;
  /** Ocupa todo el ancho (formularios y pasos con datos) o media columna (fichas). */
  ancho?: 'completo' | 'medio';
  /** Fondo y efecto de la tarjeta (config/etapas, tarjetaDePaso). */
  tarjeta: EstiloTarjeta;
  /** Qué es el paso, en una o dos frases, bajo el título. */
  descripcion?: string;
  children: ReactNode;
}

/** Bloque de un paso. Su id es el destino de la lista de pasos y alimenta el contador. */
export function BloquePaso({ paso, ancho = 'medio', tarjeta, descripcion, children }: PropsPaso) {
  const idTitulo = `titulo-${anclaPaso(paso.id)}`;
  return (
    <article
      id={anclaPaso(paso.id)}
      className={estilos.paso}
      data-ancho={ancho}
      data-manchas={tarjeta.manchas}
      aria-labelledby={idTitulo}
      tabIndex={-1}
      style={{ '--fondo-paso': tarjeta.fondo } as CSSProperties}
    >
      <h2 id={idTitulo} className={estilos.tituloPaso}>
        <span className={`${estilos.idPaso} numero`}>{paso.id}</span>
        {paso.titulo}
      </h2>
      {descripcion && <p className={estilos.descripcionPaso}>{descripcion}</p>}
      {children}
    </article>
  );
}
