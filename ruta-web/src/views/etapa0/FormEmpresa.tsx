import type { FormEvent } from 'react';
import { CampoArea, CampoTexto } from '../../components/ui/Campo';
import { EXPLICACION_CAMPO as EX } from '../../contenido/etapa0';
import { useBorrador } from '../../hooks/useBorrador';
import type { Empresa } from '../../lib/modelo/proyecto';
import { PieFormulario } from './PieFormulario';
import estilos from './formulario.module.css';

interface Props {
  empresa: Empresa;
  guardar(empresa: Empresa): Promise<void>;
}

/** Paso 0.1: empresa y cambio. Sin datos personales. */
export function FormEmpresa({ empresa, guardar }: Props) {
  const { borrador, editar, confirmar, estado } = useBorrador(empresa, guardar);
  const campo = <K extends keyof Empresa>(clave: K, valor: Empresa[K]) =>
    editar((actual) => ({ ...actual, [clave]: valor }));

  const enviar = (evento: FormEvent) => {
    evento.preventDefault();
    void confirmar();
  };

  return (
    <form className={estilos.formulario} onSubmit={enviar}>
      <div className={estilos.rejilla}>
        <CampoTexto etiqueta="Nombre de la empresa" explicacion={EX.nombre} value={borrador.nombre} onChange={(e) => campo('nombre', e.target.value)} />
        <CampoTexto etiqueta="Sector" explicacion={EX.sector} value={borrador.sector} onChange={(e) => campo('sector', e.target.value)} />
        <CampoTexto
          etiqueta="Total de colaboradores"
          explicacion={EX.total_colaboradores}
          type="number"
          min={0}
          step={1}
          value={borrador.total_colaboradores ?? ''}
          onChange={(e) => campo('total_colaboradores', e.target.value === '' ? null : Number(e.target.value))}
        />
        <CampoTexto
          etiqueta="Fecha de lanzamiento"
          explicacion={EX.fecha_lanzamiento}
          type="date"
          value={borrador.fecha_lanzamiento}
          onChange={(e) => campo('fecha_lanzamiento', e.target.value)}
        />
        <div className={estilos.ancho}>
          <CampoArea
            etiqueta="Qué cambia"
            explicacion={EX.que_cambia}
            value={borrador.que_cambia}
            onChange={(e) => campo('que_cambia', e.target.value)}
          />
        </div>
      </div>
      <PieFormulario estado={estado} />
    </form>
  );
}
