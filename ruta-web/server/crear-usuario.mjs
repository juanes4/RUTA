// Uso: node server/crear-usuario.mjs <usuario> "<Nombre completo>" <lider|empleado> <clave>
import { abrirBase } from './db.mjs';
import { hashClave } from './clave.mjs';

const [usuario, nombre, rol, clave] = process.argv.slice(2);
if (!usuario || !nombre || !['lider', 'empleado'].includes(rol) || !clave || clave.length < 8) {
  console.error('Uso: node server/crear-usuario.mjs <usuario> "<Nombre>" <lider|empleado> <clave de 8+ caracteres>');
  process.exit(1);
}
const db = await abrirBase();
try {
  db.prepare('INSERT INTO usuarios (usuario, nombre, rol, clave_hash) VALUES (?, ?, ?, ?)').run(usuario, nombre, rol, hashClave(clave));
  console.log(`Usuario "${usuario}" creado como ${rol}.`);
} catch (e) {
  console.error(String(e.message).includes('UNIQUE') ? `Ya existe el usuario "${usuario}".` : e.message);
  process.exit(1);
}
