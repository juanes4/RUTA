import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import type { Almacen } from './lib/almacen/almacen';
import { AlmacenLocal } from './lib/almacen/almacenLocal';
import { AlmacenMemoria } from './lib/almacen/almacenMemoria';
import { ETAPAS } from './config/etapas';
import { ProveedorPasosVistos } from './estado/PasosVistosContexto';
import { ProveedorProyecto } from './estado/ProyectoContexto';
import { ProveedorRuta } from './navegacion/RutaContexto';
import './styles/tokens.css';
import './styles/base.css';

/** Si el navegador bloquea localStorage, la app sigue funcionando en memoria. */
function crearAlmacen(): Almacen {
  try {
    return new AlmacenLocal(window.localStorage);
  } catch {
    return new AlmacenMemoria();
  }
}

const raiz = document.getElementById('root');
if (!raiz) throw new Error('Falta el elemento #root en index.html');

createRoot(raiz).render(
  <StrictMode>
    <ProveedorProyecto almacen={crearAlmacen()}>
      <ProveedorRuta etapas={ETAPAS}>
        <ProveedorPasosVistos>
          <App />
        </ProveedorPasosVistos>
      </ProveedorRuta>
    </ProveedorProyecto>
  </StrictMode>,
);
