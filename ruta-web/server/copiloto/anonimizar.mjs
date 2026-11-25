/**
 * Enmascarado automático del buzón (1.1) antes de que un texto salga hacia
 * Gemini. Se aplica siempre, también con datos de prueba.
 *
 * Encuentra correos, teléfonos, cédulas y nombres de persona (una lista de
 * nombres comunes y los que siguen a "don", "doña", "señor"…). NO encuentra
 * nombres escritos de formas raras ni frases que reconocen a alguien ("el
 * único soldador del turno noche"): para eso el prompt le pide al modelo que
 * no las cite, y por eso los datos reales siguen bloqueados hasta tener un
 * contrato de datos.
 */

const CORREO = /[\p{L}0-9._%+-]+@[\p{L}0-9.-]+\.[\p{L}]{2,}/gu;
/** Celulares (3xx xxx xxxx) y fijos con indicativo, con espacios, puntos o guiones. */
const TELEFONO = /(?:\+?57[\s.-]?)?(?:\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}|\(?60\d\)?[\s.-]?\d{3}[\s.-]?\d{4})\b/g;
/** Cédulas: 1.234.567.890, 12.345.678 o 6 a 10 dígitos seguidos. */
const CEDULA = /\b(?:\d{1,3}(?:\.\d{3}){2,3}|\d{6,10})\b/g;

const TRATAMIENTOS = 'don|doña|dona|señor|señora|senor|senora|sr\\.?|sra\\.?|ingeniero|ingeniera|ing\\.|doctor|doctora|dr\\.?|dra\\.?|profe|el tal|la tal|compañero|compañera';
const PALABRA_NOMBRE = "\\p{Lu}[\\p{Ll}'’]+(?!\\p{L})";
const CON_TRATAMIENTO = new RegExp(`(?<!\\p{L})(${TRATAMIENTOS})\\s+${PALABRA_NOMBRE}(?:\\s+${PALABRA_NOMBRE}){0,2}`, 'giu');

/** Nombres de pila comunes en Colombia. Un nombre seguido de apellidos con mayúscula se enmascara completo. */
const NOMBRES_COMUNES = [
  'Juan', 'José', 'Jose', 'Carlos', 'Luis', 'Jorge', 'Andrés', 'Andres', 'Pedro', 'Diego', 'Camilo', 'Santiago', 'Sebastián', 'Sebastian',
  'Alejandro', 'Daniel', 'David', 'Felipe', 'Fernando', 'Hernán', 'Hernan', 'Jairo', 'Javier', 'Óscar', 'Oscar', 'Ricardo', 'Mauricio',
  'Fabio', 'Gustavo', 'Héctor', 'Hector', 'Jaime', 'John', 'Jhon', 'Wilson', 'William', 'Édgar', 'Edgar', 'Álvaro', 'Alvaro', 'Rafael',
  'Miguel', 'Manuel', 'Julián', 'Julian', 'Esteban', 'Mateo', 'Nicolás', 'Nicolas', 'Germán', 'German', 'Hugo', 'Iván', 'Ivan', 'Rodrigo',
  'María', 'Maria', 'Ana', 'Luz', 'Martha', 'Marta', 'Gloria', 'Claudia', 'Sandra', 'Patricia', 'Diana', 'Paula', 'Carolina', 'Andrea',
  'Natalia', 'Laura', 'Liliana', 'Adriana', 'Ángela', 'Angela', 'Beatriz', 'Carmen', 'Catalina', 'Daniela', 'Gabriela', 'Juliana',
  'Lorena', 'Mónica', 'Monica', 'Valentina', 'Viviana', 'Yolanda', 'Yaneth', 'Janeth', 'Alejandra', 'Marcela', 'Milena', 'Paola',
  'Rosa', 'Sofía', 'Sofia', 'Tatiana', 'Ximena', 'Leidy', 'Erika', 'Johana', 'Yuliana',
];
const NOMBRE_COMUN = new RegExp(`(?<!\\p{L})(?:${NOMBRES_COMUNES.join('|')})(?:\\s+${PALABRA_NOMBRE}){0,3}(?!\\p{L})`, 'gu');

/** Enmascara un texto. Devuelve el texto y cuántos reemplazos hizo de cada tipo. */
export function enmascarar(texto) {
  const conteo = { correo: 0, telefono: 0, cedula: 0, persona: 0 };
  const contar = (tipo, marca) => () => {
    conteo[tipo] += 1;
    return marca;
  };
  let t = String(texto ?? '');
  t = t.replace(CORREO, contar('correo', '[dato personal]'));
  t = t.replace(TELEFONO, contar('telefono', '[dato personal]'));
  t = t.replace(CEDULA, contar('cedula', '[dato personal]'));
  t = t.replace(CON_TRATAMIENTO, (_, tratamiento) => {
    conteo.persona += 1;
    return `${tratamiento} [persona]`;
  });
  t = t.replace(NOMBRE_COMUN, contar('persona', '[persona]'));
  return { texto: t, conteo };
}

/**
 * Prepara el buzón para enviarlo: textos enmascarados e ids cortos (R01, R02…)
 * que no dicen nada de quien respondió. Devuelve también la tabla para volver
 * del id corto al id original.
 */
export function prepararBuzon(filas) {
  const total = { correo: 0, telefono: 0, cedula: 0, persona: 0 };
  const idOriginal = new Map();
  const enviadas = filas.map((f, i) => {
    const id = `R${String(i + 1).padStart(2, '0')}`;
    idOriginal.set(id, f.id);
    const fila = { id, fecha: f.fecha, area: f.area, grupo: f.grupo };
    for (const p of ['p1', 'p2', 'p3']) {
      const { texto, conteo } = enmascarar(f[p]);
      fila[p] = texto;
      for (const k of Object.keys(total)) total[k] += conteo[k];
    }
    return fila;
  });
  return { filas: enviadas, idOriginal, enmascarados: total };
}
