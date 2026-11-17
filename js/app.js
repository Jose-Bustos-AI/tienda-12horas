import { PRODUCTOS, CATEGORIAS, ENVIO_GRATIS, COSTE_ENVIO, CUPONES, CONFIG, CONFIG_INICIAL, precioConfig, textoConfig, buscar, euros } from './datos.js';
import { relojFrente, relojDorso, animarRelojes } from './reloj.js';

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const app = $('#app');
const reducir = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- Estado guardado en el navegador ---------- */
const leer = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } };
const guardar = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* sin almacenamiento */ } };
let carrito = leer('12h-carrito', []);
let favoritos = leer('12h-favoritos', []);
let disenio = { ...CONFIG_INICIAL, ...leer('12h-disenio', {}) };
let cupon = leer('12h-cupon', null);
if (!CUPONES[cupon]) cupon = null;

const categoria = (id) => CATEGORIAS.find((c) => c.id === id)?.nombre || '';
const subtotal = () => carrito.reduce((n, l) => n + l.precio * l.cantidad, 0);
const unidades = () => carrito.reduce((n, l) => n + l.cantidad, 0);
const descuento = () => (cupon ? Math.round(subtotal() * CUPONES[cupon] * 100) / 100 : 0);
// Importe que cuenta para el envío gratis: lo que se paga por los productos.
const base = () => subtotal() - descuento();

function tostada(texto) {
  const t = $('#tostada');
  t.textContent = texto;
  t.classList.add('ver');
  clearTimeout(tostada.t);
  tostada.t = setTimeout(() => t.classList.remove('ver'), 2600);
}

function burbuja(id, n) {
  const b = $(id);
  b.hidden = n === 0;
  if (b.textContent !== String(n)) {
    b.textContent = n;
    b.classList.remove('salta');
    void b.offsetWidth;
    b.classList.add('salta');
  }
}
function actualizarContadores() {
  burbuja('#num-carrito', unidades());
  burbuja('#num-fav', favoritos.length);
}

/* ---------- Carrito ---------- */
function añadir(id, { opcion = null, config = null, abrir = true } = {}) {
  const p = buscar(id);
  const precio = config ? precioConfig(config) : p.precio;
  const clave = `${id}|${opcion || ''}|${config ? JSON.stringify(config) : ''}`;
  const linea = carrito.find((l) => l.clave === clave);
  if (linea) linea.cantidad += 1;
  else carrito.push({ clave, id, opcion, config, precio, cantidad: 1 });
  guardar('12h-carrito', carrito);
  actualizarContadores();
  pintarCajon();
  if (abrir) abrirCajon();
}

function cambiar(i, delta) {
  carrito[i].cantidad += delta;
  if (carrito[i].cantidad <= 0) carrito.splice(i, 1);
  guardar('12h-carrito', carrito);
  actualizarContadores();
  pintarCajon();
}

function barraEnvio() {
  const falta = ENVIO_GRATIS - base();
  const pct = Math.min(base() / ENVIO_GRATIS, 1) * 100;
  const texto = carrito.length === 0
    ? `Envío gratis a partir de ${euros(ENVIO_GRATIS)}`
    : falta > 0 ? `Te faltan <b>${euros(falta)}</b> para el envío gratis` : '<b>Tienes el envío gratis</b>';
  return `${texto}<div class="envio__barra"><span style="width:${pct}%"></span></div>`;
}

function miniatura(l) {
  if (l.config) return `<div class="linea__reloj">${relojFrente(l.config, { vivo: false })}</div>`;
  return `<img src="${buscar(l.id).imagen}" alt="">`;
}

function lineaHTML(l, i, editable = true) {
  const p = buscar(l.id);
  const detalle = l.config ? textoConfig(l.config) : l.opcion || '';
  return `<div class="linea">
    ${miniatura(l)}
    <div>
      <h3>${esc(p.nombre)}</h3>
      ${detalle ? `<small>${esc(detalle)}</small>` : ''}
      ${editable ? `<div class="cantidad"><button type="button" data-cant="${i}" data-delta="-1" aria-label="Quitar una unidad">−</button><span>${l.cantidad}</span><button type="button" data-cant="${i}" data-delta="1" aria-label="Añadir una unidad">+</button></div>` : `<small>${l.cantidad} ${l.cantidad === 1 ? 'unidad' : 'unidades'}</small>`}
    </div>
    <div><b>${euros(l.precio * l.cantidad)}</b>${editable ? `<br><button class="quitar" type="button" data-quitar="${i}">Quitar</button>` : ''}</div>
  </div>`;
}

function pintarCajon() {
  $('#envio').innerHTML = barraEnvio();
  if (!carrito.length) {
    $('#lineas').innerHTML = '<div class="vacio"><b>Tu carrito está vacío</b>Diseña tu reloj o elige una joya y vuelve por aquí.</div>';
    $('#cajon-pie').innerHTML = '<a class="btn btn--ancho" href="#/disena" data-cerrar>Diseñar mi reloj</a>';
    return;
  }
  $('#lineas').innerHTML = carrito.map((l, i) => lineaHTML(l, i)).join('') + sugerenciaHTML();
  $('#cajon-pie').innerHTML = `${cuponHTML()}
    <dl class="cuentas"><dt>Subtotal</dt><dd>${euros(subtotal())}</dd>${descuento() ? `<dt>Descuento</dt><dd>−${euros(descuento())}</dd>` : ''}</dl>
    <div class="total"><span>Total sin envío</span><span>${euros(base())}</span></div>
    <a class="btn btn--ancho" href="#/pago" data-cerrar>Finalizar compra</a>`;
}

/* Con un reloj en el carrito y sin estuche de viaje, se propone el estuche. */
function sugerenciaHTML() {
  const estuche = buscar('estuche');
  const hayReloj = carrito.some((l) => buscar(l.id).categoria === 'relojes');
  if (!estuche || !hayReloj || carrito.some((l) => l.id === 'estuche')) return '';
  return `<div class="sugerencia">
    <img src="${estuche.imagen}" alt="">
    <div><small>Para llevarlo de viaje</small><b>${esc(estuche.nombre)}</b><span>${euros(estuche.precio)}</span></div>
    <button class="btn btn--hueco" type="button" data-sugerir="estuche">Añadir</button>
  </div>`;
}

function cuponHTML() {
  if (cupon) {
    return `<div class="cupon cupon--puesto"><span>Código <b>${esc(cupon)}</b>: −${Math.round(CUPONES[cupon] * 100)} %</span><button class="quitar" type="button" data-quitar-cupon>Quitar</button></div>`;
  }
  return `<form class="cupon" data-cupon novalidate>
    <label class="visual-oculto" for="campo-cupon">Código de descuento</label>
    <input id="campo-cupon" name="cupon" type="text" placeholder="Código de descuento" autocomplete="off" autocapitalize="characters">
    <button class="btn btn--hueco" type="submit">Aplicar</button>
  </form><p class="cupon__error" id="cupon-error" role="alert"></p>`;
}

let focoPrevio = null;
function abrirCajon() {
  focoPrevio = document.activeElement;
  $('#cajon').classList.add('abierto');
  $('#cajon').setAttribute('aria-hidden', 'false');
  document.body.classList.add('bloqueado');
  setTimeout(() => $('#cajon [data-cerrar].icono')?.focus(), 50);
}
function cerrarCajon() {
  $('#cajon').classList.remove('abierto');
  $('#cajon').setAttribute('aria-hidden', 'true');
  document.body.classList.remove('bloqueado');
  focoPrevio?.focus?.();
}
$('#cajon').addEventListener('click', (e) => {
  const c = e.target.closest('[data-cant]');
  if (c) return cambiar(+c.dataset.cant, +c.dataset.delta);
  const q = e.target.closest('[data-quitar]');
  if (q) return cambiar(+q.dataset.quitar, -999);
  const sug = e.target.closest('[data-sugerir]');
  if (sug) { const p = buscar(sug.dataset.sugerir); añadir(p.id, { abrir: false }); tostada(`${p.nombre} añadido al carrito`); return; }
  if (e.target.closest('[data-quitar-cupon]')) { cupon = null; guardar('12h-cupon', cupon); pintarCajon(); return; }
  if (e.target.closest('[data-cerrar]')) cerrarCajon();
});
$('#cajon').addEventListener('submit', (e) => {
  const f = e.target.closest('[data-cupon]');
  if (!f) return;
  e.preventDefault();
  const codigo = f.cupon.value.trim().toUpperCase();
  if (CUPONES[codigo]) {
    cupon = codigo;
    guardar('12h-cupon', cupon);
    pintarCajon();
    tostada(`Código aplicado: ${Math.round(CUPONES[codigo] * 100)} % de descuento`);
  } else {
    $('#cupon-error').textContent = codigo ? 'Ese código no existe. Prueba con BIENVENIDA10.' : 'Escribe un código.';
    f.cupon.focus();
  }
});
$('#btn-carrito').addEventListener('click', () => { pintarCajon(); abrirCajon(); });
document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && $('#cajon').classList.contains('abierto')) cerrarCajon(); });

/* ---------- Favoritos ---------- */
function alternarFavorito(id) {
  const i = favoritos.indexOf(id);
  if (i >= 0) favoritos.splice(i, 1); else favoritos.push(id);
  guardar('12h-favoritos', favoritos);
  actualizarContadores();
  tostada(i >= 0 ? 'Quitado de favoritos' : 'Guardado en favoritos');
  $$(`[data-fav="${id}"]`).forEach((b) => b.setAttribute('aria-pressed', String(i < 0)));
}
const CORAZON = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/></svg>';

/* ---------- Tarjetas ---------- */
function fotoProducto(p) {
  if (p.configurable) return `<div class="tarjeta__reloj">${relojFrente(disenio)}</div>`;
  return `<img src="${p.imagen}" alt="" loading="lazy">`;
}
function tarjeta(p) {
  const fav = favoritos.includes(p.id);
  const enlace = p.configurable ? '#/disena' : `#/producto/${p.id}`;
  return `<article class="tarjeta revela">
    <a class="tarjeta__foto ${p.configurable ? 'tarjeta__foto--oscura' : ''}" href="${enlace}" tabindex="-1" aria-hidden="true">${fotoProducto(p)}</a>
    <div class="tarjeta__marcas">
      ${p.configurable ? '<span class="marca marca--oro">Diséñalo</span>' : ''}
      ${p.nuevo && !p.configurable ? '<span class="marca">Nuevo</span>' : ''}
      ${p.antes ? `<span class="marca marca--oferta">−${Math.round((1 - p.precio / p.antes) * 100)} %</span>` : ''}
    </div>
    <button class="corazon" type="button" data-fav="${p.id}" aria-pressed="${fav}" aria-label="Guardar ${esc(p.nombre)} en favoritos">${CORAZON}</button>
    <div class="tarjeta__cuerpo">
      <span class="tarjeta__cat">${categoria(p.categoria)}</span>
      <h3 class="tarjeta__nombre"><a href="${enlace}">${esc(p.nombre)}</a></h3>
      <span class="tarjeta__lema">${esc(p.lema)}</span>
      <span class="precio-linea">${p.configurable ? 'Desde ' : ''}${euros(p.precio)}${p.antes ? `<s>${euros(p.antes)}</s>` : ''}</span>
    </div>
  </article>`;
}

/* ---------- Configurador del reloj ---------- */
function muestra(grupo, x, actual) {
  let estilo = '';
  if (grupo === 'caja') estilo = `background:linear-gradient(135deg, ${x.claro}, ${x.oscuro} 55%, ${x.claro})`;
  if (grupo === 'esfera') estilo = `background:${x.color}`;
  if (grupo === 'correa') estilo = x.tipo === 'malla' ? `background:repeating-linear-gradient(45deg, ${x.color} 0 3px, #6f7378 3px 4px)` : x.tipo === 'caucho' ? `background:repeating-linear-gradient(180deg, ${x.color} 0 6px, #0e0e0f 6px 8px)` : `background:${x.color}`;
  return `<button class="muestra" type="button" data-grupo="${grupo}" data-valor="${x.id}" aria-pressed="${x.id === actual}" style="${estilo}" aria-label="${esc(x.nombre)}${x.extra ? ` (más ${euros(x.extra)})` : ''}" title="${esc(x.nombre)}"></button>`;
}

function htmlConfigurador(enFicha = false) {
  const nombre = (g) => CONFIG[g].find((x) => x.id === disenio[g])?.nombre;
  const extra = (g) => CONFIG[g].find((x) => x.id === disenio[g])?.extra;
  const etiqueta = (g, titulo) => `<div class="grupo__cab"><span>${titulo}</span><b data-nombre="${g}">${esc(nombre(g))}${extra(g) ? ` · +${euros(extra(g))}` : ''}</b></div>`;
  return `<section class="disena ${enFicha ? 'disena--ficha' : ''}" id="disena" aria-labelledby="disena-titulo">
    <div class="disena__in envoltura">
      <div class="disena__escena" id="escena">
        <div class="disena__halo" aria-hidden="true"></div>
        <div class="reloj3d" id="reloj3d">
          <div class="cara cara--frente" id="cara-frente">${relojFrente(disenio)}</div>
          <div class="cara cara--dorso" id="cara-dorso">${relojDorso(disenio)}</div>
        </div>
        <div class="disena__girar" role="group" aria-label="Ver el reloj">
          <button type="button" data-cara="frente" aria-pressed="true">Frente</button>
          <button type="button" data-cara="dorso" aria-pressed="false">Dorso y grabado</button>
        </div>
        <p class="disena__hora" aria-live="off"><span class="punto-vivo"></span>Marca la hora real: <b id="hora-real"></b></p>
      </div>
      <div class="disena__panel">
        <span class="etiqueta">Configurador</span>
        <${enFicha ? 'h1' : 'h2'} class="bloque__titulo" id="disena-titulo">Diseña tu <em>12horas Uno</em></${enFicha ? 'h1' : 'h2'}>
        <p class="disena__texto">Elige cada pieza y míralo montado al momento. Lo ensamblamos a mano en el taller y te lo enviamos en 48 horas.</p>
        <div class="grupo">${etiqueta('caja', 'Caja')}<div class="muestras">${CONFIG.caja.map((x) => muestra('caja', x, disenio.caja)).join('')}</div></div>
        <div class="grupo">${etiqueta('esfera', 'Esfera')}<div class="muestras">${CONFIG.esfera.map((x) => muestra('esfera', x, disenio.esfera)).join('')}</div></div>
        <div class="grupo">${etiqueta('correa', 'Correa')}<div class="muestras">${CONFIG.correa.map((x) => muestra('correa', x, disenio.correa)).join('')}</div></div>
        <div class="grupo"><div class="grupo__cab"><span>Tamaño</span><b data-nombre="tamano">${esc(nombre('tamano'))}</b></div>
          <div class="segmento" role="group" aria-label="Tamaño de la caja">${CONFIG.tamano.map((x) => `<button type="button" data-grupo="tamano" data-valor="${x.id}" aria-pressed="${x.id === disenio.tamano}">${x.nombre}${x.extra ? ` <small>+${euros(x.extra)}</small>` : ''}</button>`).join('')}</div></div>
        <div class="grupo"><label class="grupo__cab" for="grabado"><span>Grabado en la tapa</span><b>+${euros(CONFIG.grabado)}</b></label>
          <input class="grabado" id="grabado" type="text" maxlength="20" placeholder="Por ejemplo: Siempre a tiempo" value="${esc(disenio.grabado)}" autocomplete="off">
          <small class="grabado__ayuda">Te quedan <span id="grabado-quedan">${20 - disenio.grabado.length}</span> caracteres. Lo grabamos a mano en letra cursiva.</small></div>
        <div class="disena__compra">
          <div><small>Tu reloj</small><div class="disena__precio" id="precio-disenio">${euros(precioConfig(disenio))}</div></div>
          <button class="btn" type="button" id="btn-disenio">Añadir al carrito</button>
        </div>
        <ul class="disena__garantias"><li>Cristal de zafiro</li><li>2 años de garantía</li><li>Montado en Murcia</li></ul>
      </div>
    </div>
  </section>`;
}

function activarConfigurador() {
  const raiz = $('#disena');
  if (!raiz) return;
  const r3d = $('#reloj3d');
  let cara = 'frente';
  let precioMostrado = precioConfig(disenio);

  const verCara = (c) => {
    cara = c;
    r3d.classList.toggle('girado', c === 'dorso');
    $$('[data-cara]', raiz).forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.cara === c)));
  };
  const animarPrecio = () => {
    const fin = precioConfig(disenio);
    const ini = precioMostrado;
    precioMostrado = fin;
    const el = $('#precio-disenio');
    if (reducir || ini === fin) { el.textContent = euros(fin); return; }
    const t0 = performance.now();
    (function paso(t) {
      const k = Math.min((t - t0) / 450, 1);
      el.textContent = euros(Math.round(ini + (fin - ini) * (1 - Math.pow(1 - k, 3))));
      if (k < 1) requestAnimationFrame(paso);
    })(t0);
    el.classList.remove('late'); void el.offsetWidth; el.classList.add('late');
  };
  const repintar = () => {
    $('#cara-frente').innerHTML = relojFrente(disenio);
    $('#cara-dorso').innerHTML = relojDorso(disenio);
    ['caja', 'esfera', 'correa', 'tamano'].forEach((g) => {
      const x = CONFIG[g].find((o) => o.id === disenio[g]);
      const b = $(`[data-nombre="${g}"]`, raiz);
      if (b) b.textContent = x.nombre + (x.extra && g !== 'tamano' ? ` · +${euros(x.extra)}` : '');
    });
    $$('.tarjeta__reloj').forEach((t) => { t.innerHTML = relojFrente(disenio); });
    guardar('12h-disenio', disenio);
    animarPrecio();
  };

  raiz.addEventListener('click', (e) => {
    const op = e.target.closest('[data-grupo]');
    if (op) {
      disenio[op.dataset.grupo] = op.dataset.valor;
      $$(`[data-grupo="${op.dataset.grupo}"]`, raiz).forEach((b) => b.setAttribute('aria-pressed', String(b === op)));
      if (cara === 'dorso') verCara('frente');
      repintar();
      return;
    }
    const c = e.target.closest('[data-cara]');
    if (c) verCara(c.dataset.cara);
  });
  const campo = $('#grabado');
  campo.addEventListener('focus', () => verCara('dorso'));
  campo.addEventListener('input', () => {
    disenio.grabado = campo.value.replace(/\s+/g, ' ').slice(0, 20);
    $('#grabado-quedan').textContent = 20 - disenio.grabado.length;
    verCara('dorso');
    repintar();
  });
  $('#btn-disenio').addEventListener('click', () => {
    añadir('uno', { config: { ...disenio, grabado: disenio.grabado.trim() } });
  });

  // El reloj se inclina siguiendo el puntero.
  const escena = $('#escena');
  if (!reducir) {
    escena.addEventListener('pointermove', (e) => {
      const r = escena.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5;
      const y = (e.clientY - r.top) / r.height - 0.5;
      escena.style.setProperty('--rx', `${(-y * 12).toFixed(2)}deg`);
      escena.style.setProperty('--ry', `${(x * 16).toFixed(2)}deg`);
    });
    escena.addEventListener('pointerleave', () => { escena.style.setProperty('--rx', '0deg'); escena.style.setProperty('--ry', '0deg'); });
  }
  horaReal();
}

function horaReal() {
  const pinta = () => {
    const el = $('#hora-real');
    if (!el) return;
    el.textContent = new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setTimeout(pinta, 1000);
  };
  pinta();
}

/* ---------- Medidor de talla de anillo ---------- */
const MONEDA_MM = 23.25; // Diámetro de una moneda de 1 euro.
function htmlMedidor() {
  return `<div class="medidor revela" id="medidor">
    <div class="medidor__tabs" role="tablist" aria-label="Cómo medir">
      <button type="button" role="tab" id="tab-hilo" aria-controls="panel-hilo" aria-selected="true">Con un hilo</button>
      <button type="button" role="tab" id="tab-anillo" aria-controls="panel-anillo" aria-selected="false" tabindex="-1">Con un anillo tuyo</button>
    </div>
    <div class="medidor__cuerpo">
      <div class="medidor__aro" aria-hidden="true"><div class="aro" id="aro"><span id="aro-diam"></span></div></div>
      <div>
        <div role="tabpanel" id="panel-hilo" aria-labelledby="tab-hilo">
          <ol class="medidor__pasos"><li>Rodea la base de tu dedo con un hilo o una tira de papel.</li><li>Marca donde se cruza y mide el trozo con una regla.</li><li>Mueve el control hasta esa medida.</li></ol>
          <label class="medidor__label" for="circ">Contorno del dedo <b id="circ-txt"></b></label>
          <input class="rango" id="circ" type="range" min="46" max="64" step="0.5" value="54">
        </div>
        <div role="tabpanel" id="panel-anillo" aria-labelledby="tab-anillo" hidden>
          <ol class="medidor__pasos"><li>Pon una moneda de 1 € sobre el círculo y ajústalo hasta que coincida con el borde: así sabemos el tamaño de tu pantalla.</li><li>Después pon un anillo que te quede bien y ajusta el círculo a su borde interior.</li></ol>
          <div class="segmento" role="group" aria-label="Qué estás ajustando"><button type="button" data-fase="moneda" aria-pressed="true">1. Moneda</button><button type="button" data-fase="anillo" aria-pressed="false">2. Anillo</button></div>
          <label class="medidor__label" for="tam-circulo">Tamaño del círculo</label>
          <input class="rango" id="tam-circulo" type="range" min="40" max="260" step="1" value="120">
        </div>
        <div class="medidor__resultado" aria-live="polite"><div><small>Tu talla</small><b id="talla-es">14</b></div><div><small>Diámetro</small><b id="talla-diam">17,2 mm</b></div><div><small>Contorno</small><b id="talla-circ">54 mm</b></div></div>
        <p class="medidor__nota" id="talla-nota"></p>
        <a class="btn btn--hueco" href="#/catalogo/joyas">Ver anillos</a>
      </div>
    </div>
  </div>`;
}

function activarMedidor() {
  const raiz = $('#medidor');
  if (!raiz) return;
  const aro = $('#aro');
  let modo = 'hilo';
  let fase = 'moneda';
  let pxMoneda = leer('12h-moneda', 0);
  let pxAnillo = 0;
  const circ = $('#circ');
  const tam = $('#tam-circulo');

  const resultado = (mm) => {
    const talla = Math.round(mm - 40);
    $('#talla-es').textContent = talla;
    $('#talla-diam').textContent = `${(mm / Math.PI).toLocaleString('es-ES', { maximumFractionDigits: 1, minimumFractionDigits: 1 })} mm`;
    $('#talla-circ').textContent = `${mm.toLocaleString('es-ES', { maximumFractionDigits: 1 })} mm`;
    $('#talla-nota').textContent = talla < 10 || talla > 20
      ? 'Nuestros anillos van de la talla 10 a la 20: escríbenos y te lo hacemos a medida.'
      : `Pide la talla ${talla}. Si estás entre dos, elige la mayor: los dedos se hinchan con el calor.`;
  };
  const pintar = () => {
    if (modo === 'hilo') {
      const mm = +circ.value;
      $('#circ-txt').textContent = `${mm.toLocaleString('es-ES')} mm`;
      const d = (mm / Math.PI) * 6;
      aro.style.setProperty('--d', `${d}px`);
      $('#aro-diam').textContent = `Ø ${(mm / Math.PI).toLocaleString('es-ES', { maximumFractionDigits: 1 })} mm`;
      resultado(mm);
    } else {
      const px = +tam.value;
      aro.style.setProperty('--d', `${px}px`);
      if (fase === 'moneda') {
        pxMoneda = px; guardar('12h-moneda', px);
        $('#aro-diam').textContent = 'Ajusta a la moneda';
      } else {
        pxAnillo = px;
        const mmDiam = (px / pxMoneda) * MONEDA_MM;
        $('#aro-diam').textContent = `Ø ${mmDiam.toLocaleString('es-ES', { maximumFractionDigits: 1 })} mm`;
        resultado(mmDiam * Math.PI);
      }
    }
  };
  $$('[role=tab]', raiz).forEach((t) => t.addEventListener('click', () => {
    modo = t.id === 'tab-hilo' ? 'hilo' : 'anillo';
    $$('[role=tab]', raiz).forEach((x) => { const a = x === t; x.setAttribute('aria-selected', String(a)); x.tabIndex = a ? 0 : -1; });
    $('#panel-hilo').hidden = modo !== 'hilo';
    $('#panel-anillo').hidden = modo !== 'anillo';
    raiz.classList.toggle('medidor--pantalla', modo === 'anillo');
    if (modo === 'anillo') tam.value = fase === 'moneda' ? (pxMoneda || 120) : (pxAnillo || Math.round((pxMoneda || 120) * 0.75));
    pintar();
  }));
  $$('[data-fase]', raiz).forEach((b) => b.addEventListener('click', () => {
    fase = b.dataset.fase;
    $$('[data-fase]', raiz).forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
    tam.value = fase === 'moneda' ? (pxMoneda || 120) : (pxAnillo || Math.round((pxMoneda || 120) * 0.75));
    pintar();
  }));
  circ.addEventListener('input', pintar);
  tam.addEventListener('input', pintar);
  pintar();
}

/* ---------- Vistas ---------- */
let despiece = null;
async function montarDespiece() {
  const seccion = $('#portada');
  if (!seccion) return;
  const fases = [$('#fase-0'), $('#fase-1'), $('#fase-2')], pista = $('#despiece-pista');
  seccion.style.setProperty('--cab-real', `${$('#cab').offsetHeight}px`);
  const suave = (a, b, v) => { const t = Math.min(1, Math.max(0, (v - a) / (b - a))); return t * t * (3 - 2 * t); };
  const poner = (el, v) => { el.style.opacity = v.toFixed(3); el.style.pointerEvents = v > 0.6 ? '' : 'none'; el.style.visibility = v < 0.01 ? 'hidden' : 'visible'; };
  try {
    const { Despiece } = await import('./despiece.js');
    if (!seccion.isConnected) return;
    despiece = new Despiece(seccion, $('#despiece'), $('#despiece-etiquetas'), {
      alCambiar: (p) => {
        poner(fases[0], 1 - suave(0.02, 0.11, p));
        poner(fases[1], suave(0.3, 0.46, p) * (1 - suave(0.68, 0.78, p)));
        poner(fases[2], suave(0.9, 0.985, p));
        pista.style.opacity = (1 - suave(0, 0.05, p)).toFixed(3);
        seccion.style.setProperty('--velo', ((1 - suave(0.04, 0.16, p)) + suave(0.86, 0.97, p)).toFixed(3));
      }
    });
    seccion.classList.add('lista');
  } catch (err) {
    console.warn('No se pudo cargar el reloj en 3D', err);
    seccion.classList.add('sin-3d');
    $('#reloj-respaldo').hidden = false;
  }
}

function vistaInicio() {
  if (despiece) { despiece.destruir(); despiece = null; }
  const relojes = PRODUCTOS.filter((p) => p.categoria === 'relojes' && !p.configurable);
  const joyas = PRODUCTOS.filter((p) => p.categoria === 'joyas').slice(0, 4);
  app.innerHTML = `
  <section class="portada portada--despiece" id="portada">
   <div class="portada__pegado">
    <div class="portada__fondo" aria-hidden="true"><span>12</span></div>
    <canvas class="despiece__lienzo" id="despiece" aria-hidden="true"></canvas>
    <div class="despiece__etiquetas" id="despiece-etiquetas" aria-hidden="true"></div>
    <div class="portada__grid envoltura" id="fase-0">
      <div class="portada__copia">
        <span class="etiqueta">Relojes y joyas · Taller en Murcia</span>
        <h1 class="portada__titulo"><span class="portada__l">El tiempo,</span> <em class="portada__l">a tu manera.</em></h1>
        <p class="portada__texto">Diseña tu reloj pieza a pieza y míralo montado en directo, con un grabado en la tapa que solo tú conoces. Y joyas de plata para acompañarlo.</p>
        <div class="portada__acciones">
          <a class="btn" href="#disena" data-ir="disena">Diseñar mi reloj</a>
          <a class="btn btn--hueco" href="#/catalogo/todo">Ver la colección</a>
        </div>
        <ul class="portada__datos"><li><b>120</b> combinaciones posibles</li><li><b>48 h</b> montado a mano</li><li><b>2 años</b> de garantía</li></ul>
      </div>
      <div class="portada__reloj" id="reloj-respaldo" aria-hidden="true" hidden>${relojFrente(disenio)}</div>
    </div>
    <div class="despiece__fase despiece__fase--dentro envoltura" id="fase-1" aria-hidden="true">
      <span class="etiqueta">Por dentro</span>
      <h2 class="despiece__titulo">Más de cien piezas, <em>un solo latido.</em></h2>
    </div>
    <div class="despiece__fase despiece__fase--fin envoltura" id="fase-2">
      <span class="etiqueta">Montado a mano en 48 h</span>
      <h2 class="despiece__titulo">Y vuelven a ser <em>uno.</em></h2>
      <p class="portada__texto">Cada reloj se monta, se ajusta y se comprueba durante 24 horas en nuestro taller antes de salir hacia tu muñeca.</p>
      <div class="portada__acciones"><a class="btn" href="#disena" data-ir="disena">Diseñar mi reloj</a></div>
    </div>
    <div class="despiece__pista" id="despiece-pista" aria-hidden="true">Desliza para desmontarlo <span>↓</span></div>
   </div>
  </section>
  <div class="cinta" aria-hidden="true"><div class="cinta__pista">${Array(2).fill('<span>Diseña tu reloj en directo</span><span>Grabado a mano</span><span>Envío gratis desde 100 €</span><span>Cristal de zafiro</span><span>10 % con el código BIENVENIDA10</span><span>Joyas de plata de ley</span>').join('')}</div></div>
  ${htmlConfigurador()}
  <section class="bloque envoltura">
    <div class="bloque__cab"><div><span class="etiqueta">La colección</span><h2 class="bloque__titulo">Relojes para <em>cada día</em></h2></div><a class="btn btn--hueco" href="#/catalogo/relojes">Ver todos</a></div>
    <div class="rejilla">${relojes.map(tarjeta).join('')}</div>
  </section>
  <section class="editorial revela">
    <img src="img/muneca.webp" alt="Muñeca con camisa blanca y un reloj de esfera azul y correa de cuero" id="parallax" loading="lazy">
    <div class="editorial__texto envoltura">
      <span class="etiqueta">Hechos para durar</span>
      <h2 class="bloque__titulo">Un reloj no se cambia <em>cada temporada.</em></h2>
      <p>Cristal de zafiro que no se raya, acero 316L que no se oscurece y correas que se cambian en diez segundos. Y si algún día falla, lo arreglamos en nuestro taller.</p>
      <a class="btn" href="#/disena">Diseñar el mío</a>
    </div>
  </section>
  <section class="bloque envoltura">
    <div class="bloque__cab"><div><span class="etiqueta">Plata de ley y oro</span><h2 class="bloque__titulo">Joyas para <em>regalar</em></h2></div><a class="btn btn--hueco" href="#/catalogo/joyas">Ver todas</a></div>
    <div class="rejilla">${joyas.map(tarjeta).join('')}</div>
  </section>
  <section class="bloque envoltura" id="talla-anillo">
    <div class="bloque__cab"><div><span class="etiqueta">Sin dudas con la talla</span><h2 class="bloque__titulo">Mide tu talla de anillo <em>en casa</em></h2></div></div>
    ${htmlMedidor()}
  </section>
  <section class="taller envoltura">
    <div class="taller__foto revela"><img src="img/taller.webp" alt="Manos de un relojero montando un mecanismo bajo la lupa" loading="lazy"></div>
    <div class="taller__texto revela">
      <span class="etiqueta">El taller</span>
      <h2 class="bloque__titulo">Cada reloj pasa por <em>unas manos.</em></h2>
      <ol class="pasos-taller"><li><b>Lo montamos</b><span>Ajustamos la caja, la esfera y la correa que elegiste y comprobamos la marcha 24 horas.</span></li><li><b>Lo grabamos</b><span>Tu mensaje, a mano y en cursiva, en la tapa trasera.</span></li><li><b>Te lo enviamos</b><span>En su estuche, en 48 horas, con 2 años de garantía.</span></li></ol>
    </div>
  </section>
  <section class="bloque envoltura" style="padding-top:0">
    <div class="faq">
      <div><span class="etiqueta">Antes de pedir</span><h2 class="bloque__titulo">Preguntas <em>frecuentes</em></h2></div>
      <div>
        <details class="acordeon" open><summary>¿Cuánto tarda un reloj diseñado por mí?</summary><p>Lo montamos y lo grabamos a mano en 48 horas, y después sale con el envío que elijas: estándar en 48-72 h o exprés en 24 h.</p></details>
        <details class="acordeon"><summary>¿Puedo devolver un reloj con grabado?</summary><p>Los relojes y las joyas se pueden devolver en 30 días. Las piezas con grabado no, porque están hechas solo para ti; por eso ves el texto escrito en la tapa antes de comprar.</p></details>
        <details class="acordeon"><summary>¿Cómo sé mi talla de anillo?</summary><p>Con el medidor de esta página: rodea el dedo con un hilo y pon la medida, o calibra la pantalla con una moneda de 1 € y coloca encima un anillo que te quede bien.</p></details>
        <details class="acordeon"><summary>¿Hay algún descuento?</summary><p>Sí: con el código BIENVENIDA10 tienes un 10 % en tu primer pedido. Se escribe en el carrito.</p></details>
        <details class="acordeon"><summary>¿Es una tienda de verdad?</summary><p>No. Es una tienda de demostración hecha por Dania360: la marca y los productos son inventados y el pago es de prueba, no se cobra nada.</p></details>
      </div>
    </div>
  </section>`;
  activarConfigurador();
  activarMedidor();
  montarDespiece();
}

function vistaDisena() {
  const p = buscar('uno');
  app.innerHTML = `${htmlConfigurador(true)}
  <section class="bloque envoltura detalles-uno">
    <details class="acordeon" open><summary>Descripción</summary><p>${esc(p.descripcion)}</p></details>
    <details class="acordeon"><summary>Detalles técnicos</summary><ul>${p.detalles.map((d) => `<li>${esc(d)}</li>`).join('')}</ul></details>
    <details class="acordeon"><summary>Envíos y garantía</summary><ul><li>Estándar: ${euros(COSTE_ENVIO.estandar)}, gratis desde ${euros(ENVIO_GRATIS)}.</li><li>Exprés en 24 h: ${euros(COSTE_ENVIO.expres)}.</li><li>2 años de garantía y 30 días para devolverlo (los grabados no se devuelven).</li></ul></details>
  </section>`;
  activarConfigurador();
}

function vistaCatalogo(cat) {
  let orden = 'destacados';
  const pintar = () => {
    let lista = PRODUCTOS.filter((p) => cat === 'todo' || p.categoria === cat);
    if (orden === 'precio-asc') lista = [...lista].sort((a, b) => a.precio - b.precio);
    if (orden === 'precio-desc') lista = [...lista].sort((a, b) => b.precio - a.precio);
    if (orden === 'novedades') lista = [...lista].sort((a, b) => Number(b.nuevo) - Number(a.nuevo));
    $('#rejilla').innerHTML = lista.map(tarjeta).join('');
    $('#total').textContent = `${lista.length} ${lista.length === 1 ? 'producto' : 'productos'}`;
    revelar();
  };
  app.innerHTML = `<section class="bloque envoltura">
    <div class="bloque__cab"><div><span class="etiqueta" id="total"></span><h1 class="bloque__titulo">${cat === 'todo' ? 'Toda la <em>colección</em>' : esc(categoria(cat))}</h1></div></div>
    <div class="filtros">
      <nav class="chips" aria-label="Filtrar por categoría">${CATEGORIAS.map((c) => `<a class="chip" href="#/catalogo/${c.id}" ${c.id === cat ? 'aria-current="page"' : ''}>${c.nombre}</a>`).join('')}</nav>
      <label><span class="visual-oculto">Ordenar</span><select class="orden" id="orden">
        <option value="destacados">Destacados</option><option value="novedades">Novedades primero</option>
        <option value="precio-asc">Precio: de menor a mayor</option><option value="precio-desc">Precio: de mayor a menor</option>
      </select></label>
    </div>
    <div class="rejilla" id="rejilla"></div>
  </section>`;
  $('#orden').addEventListener('change', (e) => { orden = e.target.value; pintar(); });
  pintar();
}

function vistaProducto(id) {
  const p = buscar(id);
  if (!p) return vistaNoEncontrada();
  if (p.configurable) { location.hash = '#/disena'; return; }
  let opcion = null;
  const tiene = p.tallas ? { nombre: 'Talla', opciones: p.tallas } : p.variantes;
  const relacionados = PRODUCTOS.filter((x) => x.id !== p.id && x.categoria === p.categoria).slice(0, 4);
  app.innerHTML = `<div class="envoltura">
    <section class="producto">
      <div class="producto__media"><img src="${p.imagen}" alt="${esc(p.nombre)}"></div>
      <div>
        <nav class="migas" aria-label="Estás en"><a href="#/">Inicio</a> / <a href="#/catalogo/${p.categoria}">${categoria(p.categoria)}</a> / ${esc(p.nombre)}</nav>
        <span class="etiqueta">${p.nuevo ? 'Nuevo' : categoria(p.categoria)}</span>
        <h1>${esc(p.nombre)}</h1>
        <p class="producto__lema">${esc(p.lema)}</p>
        <div class="producto__precio">${euros(p.precio)}${p.antes ? `<s>${euros(p.antes)}</s>` : ''}</div>
        ${tiene ? `<div class="opciones__cab"><span>${tiene.nombre}</span>${p.tallas ? '<a href="#/tallas">¿Cuál es mi talla?</a>' : ''}</div>
          <div class="opciones ${tiene.opciones.length > 8 ? 'opciones--letras' : ''}" role="group" aria-label="${tiene.nombre}">${tiene.opciones.map((o) => `<button class="opcion-btn" type="button" data-opcion="${esc(o)}" aria-pressed="false">${esc(o)}</button>`).join('')}</div>
          <div class="error-opcion" id="error-opcion" role="alert"></div>` : ''}
        <div class="fila-compra">
          <button class="btn" type="button" id="btn-añadir">Añadir al carrito</button>
          <button class="corazon corazon--grande" type="button" data-fav="${p.id}" aria-pressed="${favoritos.includes(p.id)}" aria-label="Guardar en favoritos">${CORAZON}</button>
        </div>
        <div class="ventajas-mini"><span>Envío gratis desde ${euros(ENVIO_GRATIS)}</span><span>2 años de garantía</span><span>Estuche de regalo incluido</span></div>
        <details class="acordeon" open><summary>Descripción</summary><p>${esc(p.descripcion)}</p></details>
        <details class="acordeon"><summary>Detalles</summary><ul>${p.detalles.map((d) => `<li>${esc(d)}</li>`).join('')}</ul></details>
        <details class="acordeon"><summary>Envíos y devoluciones</summary><ul><li>Estándar: ${euros(COSTE_ENVIO.estandar)}, gratis desde ${euros(ENVIO_GRATIS)}.</li><li>Exprés en 24 h: ${euros(COSTE_ENVIO.expres)}.</li><li>30 días para devolverlo.</li></ul></details>
      </div>
    </section>
    ${relacionados.length ? `<section class="bloque" style="padding-top:0"><div class="bloque__cab"><h2 class="bloque__titulo">También te puede <em>gustar</em></h2></div><div class="rejilla">${relacionados.map(tarjeta).join('')}</div></section>` : ''}
  </div>`;
  $$('[data-opcion]').forEach((b) => b.addEventListener('click', () => {
    opcion = b.dataset.opcion;
    $$('[data-opcion]').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
    $('#error-opcion').textContent = '';
  }));
  $('#btn-añadir').addEventListener('click', () => {
    if (tiene && !opcion) { $('#error-opcion').textContent = `Elige ${tiene.nombre.toLowerCase()} para continuar.`; return; }
    añadir(p.id, { opcion: tiene ? `${tiene.nombre}: ${opcion}` : null });
  });
}

function vistaTallas() {
  app.innerHTML = `<section class="bloque envoltura"><div class="bloque__cab"><div><span class="etiqueta">Guía de tallas</span><h1 class="bloque__titulo">Mide tu talla de <em>anillo</em></h1></div></div>${htmlMedidor()}</section>`;
  activarMedidor();
}

function vistaFavoritos() {
  const lista = PRODUCTOS.filter((p) => favoritos.includes(p.id));
  app.innerHTML = `<section class="bloque envoltura"><div class="bloque__cab"><div><span class="etiqueta">${lista.length} guardados</span><h1 class="bloque__titulo">Tus <em>favoritos</em></h1></div></div>
    ${lista.length ? `<div class="rejilla">${lista.map(tarjeta).join('')}</div>` : '<div class="vacio"><b>Todavía no has guardado nada</b>Pulsa el corazón de cualquier producto para tenerlo aquí.<br><br><a class="btn" href="#/catalogo/todo">Ver la colección</a></div>'}</section>`;
}

/* ---------- Pago en tres pasos (de demostración) ---------- */
function vistaPago() {
  if (!carrito.length) { location.hash = '#/catalogo/todo'; return; }
  let paso = 1;
  const datos = leer('12h-envio', { nombre: '', email: '', direccion: '', cp: '', ciudad: '', telefono: '' });
  let metodo = 'estandar';
  let regalo = false;
  const gastos = () => (metodo === 'expres' ? COSTE_ENVIO.expres : base() >= ENVIO_GRATIS ? 0 : COSTE_ENVIO.estandar);

  const resumen = () => `<aside class="caja resumen"><h2>Resumen</h2>${carrito.map((l, i) => lineaHTML(l, i, false)).join('')}
    <dl><dt>Subtotal</dt><dd>${euros(subtotal())}</dd>${descuento() ? `<dt>Descuento (${esc(cupon)})</dt><dd>−${euros(descuento())}</dd>` : ''}<dt>Envío</dt><dd>${gastos() === 0 ? 'Gratis' : euros(gastos())}</dd>${regalo ? '<dt>Estuche de regalo</dt><dd>Gratis</dd>' : ''}</dl>
    <div class="total"><span>Total</span><span>${euros(base() + gastos())}</span></div></aside>`;
  const campo = (id, etiqueta, tipo = 'text', ancho = false, extra = '') => `<label class="campo ${ancho ? 'campo--ancho' : ''}">${etiqueta}<input id="${id}" name="${id}" type="${tipo}" value="${esc(datos[id] || '')}" ${extra} required></label>`;

  const pintar = () => {
    const etapas = ['Envío', 'Entrega', 'Pago'];
    let cuerpo = '';
    if (paso === 1) {
      cuerpo = `<form class="caja" id="form-paso" novalidate><h2>¿Dónde te lo enviamos?</h2>
        <div class="nota-prueba">Es una tienda de prueba: puedes inventarte los datos, no se guardan en ningún servidor.</div>
        <div class="campos">${campo('nombre', 'Nombre y apellidos', 'text', true, 'autocomplete="name"')}${campo('email', 'Correo electrónico', 'email', false, 'autocomplete="email"')}${campo('telefono', 'Teléfono', 'tel', false, 'autocomplete="tel"')}${campo('direccion', 'Dirección', 'text', true, 'autocomplete="street-address"')}${campo('cp', 'Código postal', 'text', false, 'inputmode="numeric" pattern="[0-9]{5}" autocomplete="postal-code"')}${campo('ciudad', 'Ciudad', 'text', false, 'autocomplete="address-level2"')}</div>
        <div class="botones-pago"><a class="btn btn--hueco" href="#/catalogo/todo">Seguir comprando</a><button class="btn" type="submit">Continuar</button></div></form>`;
    } else if (paso === 2) {
      cuerpo = `<form class="caja" id="form-paso"><h2>¿Cómo lo quieres?</h2>
        <label class="opcion"><input type="radio" name="metodo" value="estandar" ${metodo === 'estandar' ? 'checked' : ''}><span>Estándar<small>Entrega en 48-72 h (los relojes diseñados, en 48 h de taller más el envío)</small></span><b>${base() >= ENVIO_GRATIS ? 'Gratis' : euros(COSTE_ENVIO.estandar)}</b></label>
        <label class="opcion"><input type="radio" name="metodo" value="expres" ${metodo === 'expres' ? 'checked' : ''}><span>Exprés<small>Entrega en 24 h desde que sale del taller</small></span><b>${euros(COSTE_ENVIO.expres)}</b></label>
        <label class="opcion"><input type="checkbox" name="regalo" ${regalo ? 'checked' : ''}><span>Es para regalar<small>Estuche de regalo con lazo y sin precio en el paquete</small></span><b>Gratis</b></label>
        <div class="botones-pago"><button class="btn btn--hueco" type="button" data-atras>Atrás</button><button class="btn" type="submit">Continuar</button></div></form>`;
    } else {
      cuerpo = `<form class="caja" id="form-paso"><h2>Pago</h2>
        <div class="nota-prueba">Pago de demostración: no se pide tarjeta y no se cobra nada. Al confirmar verás cómo termina un pedido real.</div>
        <label class="opcion"><input type="radio" name="pago" value="demo" checked><span>Pago de prueba<small>Simula un pago con tarjeta aceptado</small></span></label>
        <p class="pago__envio">Enviamos a <b>${esc(datos.nombre)}</b>, ${esc(datos.direccion)}, ${esc(datos.cp)} ${esc(datos.ciudad)}.</p>
        <div class="botones-pago"><button class="btn btn--hueco" type="button" data-atras>Atrás</button><button class="btn" type="submit">Pagar ${euros(base() + gastos())}</button></div></form>`;
    }
    app.innerHTML = `<div class="envoltura"><section class="pago"><div>
      <ol class="pasos">${etapas.map((e, i) => `<li class="${i + 1 === paso ? 'activo' : i + 1 < paso ? 'hecho' : ''}">${i + 1}. ${e}</li>`).join('')}</ol>
      ${cuerpo}</div>${resumen()}</section></div>`;
    const f = $('#form-paso');
    f.querySelector('[data-atras]')?.addEventListener('click', () => { paso -= 1; pintar(); });
    f.addEventListener('change', (e) => {
      if (e.target.name === 'metodo') { metodo = e.target.value; pintar(); }
      if (e.target.name === 'regalo') { regalo = e.target.checked; pintar(); }
    });
    f.addEventListener('submit', (e) => {
      e.preventDefault();
      if (paso === 1) {
        let ok = true;
        $$('input', f).forEach((i) => {
          datos[i.name] = i.value.trim();
          const valido = i.checkValidity() && i.value.trim() !== '';
          i.setAttribute('aria-invalid', String(!valido));
          if (!valido) ok = false;
        });
        if (!ok) { tostada('Revisa los campos marcados en rojo'); f.querySelector('[aria-invalid=true]')?.focus(); return; }
        guardar('12h-envio', datos);
      }
      if (paso === 3) return confirmar(base() + gastos());
      paso += 1;
      pintar();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
    window.scrollTo({ top: 0 });
  };
  pintar();
}

function confirmar(total) {
  const numero = '12H-' + Math.floor(100000 + Math.random() * 900000);
  const grabados = carrito.filter((l) => l.config?.grabado).map((l) => l.config.grabado);
  carrito = [];
  guardar('12h-carrito', carrito);
  cupon = null;
  guardar('12h-cupon', cupon);
  actualizarContadores();
  sessionStorage.setItem('12h-pedido', JSON.stringify({ numero, total, grabados }));
  location.hash = '#/gracias';
}

function vistaGracias() {
  let pedido = null;
  try { pedido = JSON.parse(sessionStorage.getItem('12h-pedido')); } catch { /* nada */ }
  app.innerHTML = `<section class="gracias envoltura">
    <div class="gracias__check"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg></div>
    <h1>Pedido confirmado</h1>
    <p>${pedido ? `Tu pedido <b>${pedido.numero}</b> por ${euros(pedido.total)} ya está en el taller. ` : ''}${pedido?.grabados?.length ? `Grabaremos a mano "${esc(pedido.grabados[0])}" en la tapa. ` : ''}Como es una tienda de prueba no se ha cobrado nada ni se enviará nada, pero así termina una compra de verdad.</p>
    <a class="btn" href="#/">Volver a la tienda</a>
  </section>`;
}

function vistaNoEncontrada() {
  app.innerHTML = '<section class="gracias envoltura"><h1>Esta página se ha parado</h1><p>No encontramos lo que buscabas.</p><a class="btn" href="#/">Volver al inicio</a></section>';
}

/* ---------- Efectos ---------- */
let observador;
function revelar() {
  observador?.disconnect();
  if (reducir || !('IntersectionObserver' in window)) { $$('.revela').forEach((el) => el.classList.add('dentro')); return; }
  observador = new IntersectionObserver((es) => es.forEach((e) => {
    if (!e.isIntersecting) return;
    e.target.classList.add('dentro');
    observador.unobserve(e.target);
  }), { threshold: 0.12 });
  $$('.revela:not(.dentro)').forEach((el, i) => { el.style.transitionDelay = `${(i % 4) * 70}ms`; observador.observe(el); });
}
window.addEventListener('scroll', () => {
  $('#cab').classList.toggle('on', scrollY > 10);
  const img = $('#parallax');
  if (img && !reducir) {
    const r = img.parentElement.getBoundingClientRect();
    img.style.transform = `translateY(${(r.top / innerHeight) * -60}px) scale(1.1)`;
  }
}, { passive: true });

/* ---------- Buscador ---------- */
$('#btn-buscar').addEventListener('click', () => {
  const b = $('#buscador');
  b.hidden = !b.hidden;
  if (!b.hidden) $('#campo-buscar').focus();
});
$('#campo-buscar').addEventListener('input', (e) => {
  const q = e.target.value.trim().toLowerCase();
  const lista = q.length < 2 ? [] : PRODUCTOS.filter((p) => `${p.nombre} ${p.lema} ${categoria(p.categoria)}`.toLowerCase().includes(q));
  $('#resultados').innerHTML = q.length < 2 ? '' : lista.length
    ? lista.map((p) => `<a href="${p.configurable ? '#/disena' : `#/producto/${p.id}`}">${p.configurable ? `<span class="resultado__reloj">${relojFrente(disenio, { vivo: false })}</span>` : `<img src="${p.imagen}" alt="">`}<span>${esc(p.nombre)}<small>${euros(p.precio)}</small></span></a>`).join('')
    : '<p class="resultados__nada">No hay resultados. Prueba con "reloj", "anillo" o "collar".</p>';
});

/* ---------- Eventos globales ---------- */
document.addEventListener('click', (e) => {
  const fav = e.target.closest('[data-fav]');
  if (fav) { e.preventDefault(); alternarFavorito(fav.dataset.fav); return; }
  const ir = e.target.closest('[data-ir]');
  if (ir) { e.preventDefault(); document.getElementById(ir.dataset.ir)?.scrollIntoView({ behavior: reducir ? 'auto' : 'smooth' }); }
});

/* ---------- Rutas ---------- */
function ruta() {
  if (/^#[a-z-]+$/.test(location.hash) && document.getElementById(location.hash.slice(1))) return; // ancla dentro de la página
  const partes = location.hash.replace(/^#\/?/, '').split('/');
  $('#buscador').hidden = true;
  if (despiece) { despiece.destruir(); despiece = null; }
  if ($('#cajon').classList.contains('abierto')) cerrarCajon();
  $$('.cab__nav a, .cab__movil a').forEach((a) => (a.getAttribute('href') === location.hash ? a.setAttribute('aria-current', 'page') : a.removeAttribute('aria-current')));
  switch (partes[0]) {
    case '': vistaInicio(); break;
    case 'disena': vistaDisena(); break;
    case 'catalogo': vistaCatalogo(CATEGORIAS.some((c) => c.id === partes[1]) ? partes[1] : 'todo'); break;
    case 'producto': vistaProducto(partes[1]); break;
    case 'tallas': vistaTallas(); break;
    case 'favoritos': vistaFavoritos(); break;
    case 'pago': vistaPago(); break;
    case 'gracias': vistaGracias(); break;
    default: vistaNoEncontrada();
  }
  revelar();
  if (partes[0] !== 'pago') window.scrollTo({ top: 0 });
  app.focus({ preventScroll: true });
}
window.addEventListener('hashchange', ruta);
actualizarContadores();
pintarCajon();
ruta();
animarRelojes();
setTimeout(() => $('#carga').classList.add('fuera'), reducir ? 0 : 900);
