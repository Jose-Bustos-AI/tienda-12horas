// Catálogo de la tienda de ejemplo 12horas. Todos los precios en euros.
export const ENVIO_GRATIS = 100;
export const COSTE_ENVIO = { estandar: 5.95, expres: 9.95 };

export const CATEGORIAS = [
  { id: 'todo', nombre: 'Todo' },
  { id: 'relojes', nombre: 'Relojes' },
  { id: 'joyas', nombre: 'Joyas' },
  { id: 'accesorios', nombre: 'Accesorios' }
];

/* ---------- Configurador del reloj 12horas Uno ---------- */
export const CONFIG = {
  base: 189,
  caja: [
    { id: 'acero', nombre: 'Acero pulido', extra: 0, claro: '#f4f4f2', oscuro: '#8d8f93' },
    { id: 'oro', nombre: 'Acero dorado', extra: 40, claro: '#f6e2a8', oscuro: '#a77f35' },
    { id: 'negro', nombre: 'Negro mate', extra: 20, claro: '#4a4a4c', oscuro: '#121213' }
  ],
  esfera: [
    { id: 'marfil', nombre: 'Marfil', color: '#efe9dd', tinta: '#1d1b18', extra: 0 },
    { id: 'azul', nombre: 'Azul noche', color: '#1b2c47', tinta: '#f3eee4', extra: 0 },
    { id: 'verde', nombre: 'Verde bosque', color: '#1e3a2c', tinta: '#f3eee4', extra: 0 },
    { id: 'negra', nombre: 'Negra', color: '#121212', tinta: '#f3eee4', extra: 0 },
    { id: 'salmon', nombre: 'Salmón', color: '#e7b49c', tinta: '#2a1d16', extra: 10 }
  ],
  correa: [
    { id: 'conac', nombre: 'Cuero coñac', tipo: 'cuero', color: '#8a4b23', extra: 0 },
    { id: 'negro', nombre: 'Cuero negro', tipo: 'cuero', color: '#1c1b1a', extra: 0 },
    { id: 'malla', nombre: 'Malla de acero', tipo: 'malla', color: '#b9bcc0', extra: 25 },
    { id: 'caucho', nombre: 'Caucho negro', tipo: 'caucho', color: '#222324', extra: 10 }
  ],
  tamano: [
    { id: '38', nombre: '38 mm', extra: 0 },
    { id: '41', nombre: '41 mm', extra: 10 }
  ],
  grabado: 15
};

export const CONFIG_INICIAL = { caja: 'acero', esfera: 'azul', correa: 'conac', tamano: '38', grabado: '' };

export function precioConfig(c) {
  const ex = (grupo, id) => CONFIG[grupo].find((x) => x.id === id)?.extra || 0;
  return CONFIG.base + ex('caja', c.caja) + ex('esfera', c.esfera) + ex('correa', c.correa) + ex('tamano', c.tamano) + (c.grabado ? CONFIG.grabado : 0);
}

export function textoConfig(c) {
  const n = (grupo, id) => CONFIG[grupo].find((x) => x.id === id)?.nombre || '';
  return `${n('caja', c.caja)} · Esfera ${n('esfera', c.esfera).toLowerCase()} · ${n('correa', c.correa)} · ${n('tamano', c.tamano)}${c.grabado ? ` · Grabado "${c.grabado}"` : ''}`;
}

/* ---------- Productos ---------- */
const TALLAS_ANILLO = ['10', '11', '12', '13', '14', '15', '16', '17', '18', '19', '20'];

export const PRODUCTOS = [
  {
    id: 'uno', nombre: '12horas Uno', lema: 'El reloj que diseñas tú', categoria: 'relojes',
    precio: 189, antes: null, nuevo: true, configurable: true,
    descripcion: 'Nuestro reloj insignia, montado a tu gusto: eliges la caja, la esfera, la correa, el tamaño y un grabado en la tapa trasera. Lo vemos montado en directo antes de que lo compres y lo ajustamos a mano en el taller.',
    detalles: ['Movimiento de cuarzo japonés con 3 años de pila', 'Cristal de zafiro antirreflejos', 'Resistente al agua 5 ATM', 'Caja de acero 316L de 38 o 41 mm']
  },
  {
    id: 'mar', nombre: 'Mar Diver', lema: 'Buceo de verdad, 200 metros', categoria: 'relojes',
    precio: 249, antes: null, nuevo: true, imagen: 'img/mar.webp',
    variantes: { nombre: 'Correa', opciones: ['Caucho negro', 'Malla de acero'] },
    descripcion: 'Reloj de buceo automático con bisel giratorio unidireccional, índices luminosos y corona roscada. Igual de cómodo en el agua que en la oficina.',
    detalles: ['Movimiento automático con 40 h de reserva', 'Resistente al agua 20 ATM', 'Bisel cerámico giratorio', 'Caja de 42 mm']
  },
  {
    id: 'ruta', nombre: 'Ruta Cronógrafo', lema: 'Esfera panda de inspiración clásica', categoria: 'relojes',
    precio: 239, antes: 279, nuevo: false, imagen: 'img/ruta.webp',
    variantes: { nombre: 'Correa', opciones: ['Cuero coñac perforado', 'Cuero negro'] },
    descripcion: 'Cronógrafo de cuarzo con tres subesferas para medir tiempos, inspirado en los relojes de carreras de los años sesenta. Ahora con 40 € de descuento.',
    detalles: ['Cronógrafo con precisión de 1/10 s', 'Cristal de zafiro', 'Resistente al agua 10 ATM', 'Caja de 40 mm']
  },
  {
    id: 'luna', nombre: 'Luna Mini', lema: 'Fase lunar en 36 mm', categoria: 'relojes',
    precio: 169, antes: null, nuevo: true, imagen: 'img/luna.webp',
    variantes: { nombre: 'Correa', opciones: ['Cuero crema', 'Cuero negro'] },
    descripcion: 'Un reloj pequeño y delicado con esfera de nácar y una luna dorada que marca la fase lunar real. Para muñecas finas y para quien busca algo distinto.',
    detalles: ['Indicador de fase lunar', 'Esfera de nácar natural', 'Caja dorada de 36 mm', 'Resistente al agua 3 ATM']
  },
  {
    id: 'clasico', nombre: 'Clásico Automático', lema: 'Mira cómo late por detrás', categoria: 'relojes',
    precio: 349, antes: null, nuevo: false, imagen: 'img/clasico.webp',
    variantes: { nombre: 'Correa', opciones: ['Cuero azul', 'Cuero marrón'] },
    descripcion: 'Automático de esfera crema con números romanos azules y tapa trasera transparente para ver el movimiento. No necesita pila: se carga con el movimiento de tu muñeca.',
    detalles: ['Movimiento automático con 42 h de reserva', 'Tapa trasera de cristal', 'Agujas azuladas', 'Caja de 39 mm']
  },
  {
    id: 'solitario', nombre: 'Anillo solitario', lema: 'Plata de ley y circonita', categoria: 'joyas',
    precio: 79, antes: null, nuevo: false, imagen: 'img/solitario.webp', tallas: TALLAS_ANILLO,
    descripcion: 'Un clásico que nunca falla: aro fino de plata de ley 925 con una circonita talla brillante de 6 mm engastada en cuatro garras.',
    detalles: ['Plata de ley 925 rodiada', 'Circonita de 6 mm', 'Tallas de la 10 a la 20', 'Se entrega en estuche']
  },
  {
    id: 'trenzado', nombre: 'Anillo trenzado', lema: 'Para llevar a diario', categoria: 'joyas',
    precio: 59, antes: null, nuevo: true, imagen: 'img/trenzado.webp', tallas: TALLAS_ANILLO,
    descripcion: 'Aro de plata de ley trenzado a mano de 4 mm de ancho. Cómodo, discreto y perfecto para combinar con otros anillos.',
    detalles: ['Plata de ley 925', 'Ancho de 4 mm', 'Tallas de la 10 a la 20']
  },
  {
    id: 'inicial', nombre: 'Collar con inicial', lema: 'Tu letra, grabada a mano', categoria: 'joyas',
    precio: 69, antes: null, nuevo: false, imagen: 'img/inicial.webp',
    variantes: { nombre: 'Letra', opciones: 'ABCDEFGHIJKLMNÑOPQRSTUVWXYZ'.split('') },
    descripcion: 'Cadena fina con un colgante redondo de 12 mm en plata bañada en oro de 18 quilates, con la letra que elijas grabada a mano.',
    detalles: ['Plata bañada en oro de 18 k', 'Colgante de 12 mm', 'Cadena de 45 cm con extensión de 5 cm']
  },
  {
    id: 'aros', nombre: 'Pendientes de aro', lema: 'Gruesos y ligeros', categoria: 'joyas',
    precio: 45, antes: null, nuevo: false, imagen: 'img/aros.webp',
    descripcion: 'Aros huecos de 20 mm en plata bañada en oro: tienen volumen pero apenas pesan. Cierre de bisagra fácil de poner.',
    detalles: ['Plata bañada en oro de 18 k', 'Diámetro de 20 mm', 'Cierre de bisagra']
  },
  {
    id: 'pulsera', nombre: 'Pulsera de eslabones', lema: 'Plata maciza, presencia', categoria: 'joyas',
    precio: 75, antes: 89, nuevo: false, imagen: 'img/pulsera.webp',
    variantes: { nombre: 'Largo', opciones: ['18 cm', '20 cm'] },
    descripcion: 'Pulsera de eslabones barbados de plata de ley maciza con cierre de mosquetón. Ahora con 14 € de descuento.',
    detalles: ['Plata de ley 925 maciza', 'Eslabones de 7 mm', 'Cierre de mosquetón']
  },
  {
    id: 'estuche', nombre: 'Estuche de viaje', lema: 'Para tres relojes', categoria: 'accesorios',
    precio: 39, antes: null, nuevo: false, imagen: 'img/estuche.webp',
    descripcion: 'Estuche enrollable de piel con tres almohadillas para que tus relojes viajen protegidos y sin rozarse.',
    detalles: ['Piel curtida vegetal', 'Interior de ante', 'Cierre de hebilla']
  },
  {
    id: 'correas', nombre: 'Correa de cuero intercambiable', lema: 'Cambia de reloj en 10 segundos', categoria: 'accesorios',
    precio: 29, antes: null, nuevo: true, imagen: 'img/correas.webp',
    variantes: { nombre: 'Color', opciones: ['Coñac', 'Negro', 'Verde oliva'] },
    descripcion: 'Correa de 20 mm con pasadores de cambio rápido: se quita y se pone sin herramientas. Vale para el 12horas Uno de 38 mm y para cualquier reloj de 20 mm.',
    detalles: ['Cuero italiano', 'Ancho de 20 mm', 'Pasadores de cambio rápido']
  }
];

export const buscar = (id) => PRODUCTOS.find((p) => p.id === id);
export const euros = (n) => n.toLocaleString('es-ES', { minimumFractionDigits: n % 1 ? 2 : 0, maximumFractionDigits: 2 }) + ' €';
