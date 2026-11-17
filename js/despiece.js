// Reloj automático en 3D construido pieza a pieza con three.js.
// Al hacer scroll se desmonta en capas (cristal, bisel, agujas, esfera, calibre, rotor, tapa) y se vuelve a montar.
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

const TAU = Math.PI * 2;
const sujetar = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const suave = (a, b, v) => { const t = sujetar((v - a) / (b - a)); return t * t * (3 - 2 * t); };
const mezcla = (a, b, t) => a + (b - a) * t;

/* ---------- Texturas dibujadas ---------- */
function lienzo(lado, pintar) {
  const c = document.createElement('canvas');
  c.width = c.height = lado;
  const g = c.getContext('2d');
  g.translate(lado / 2, lado / 2);
  pintar(g, lado / 2);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

function texturaEsfera() {
  return lienzo(1024, (g, r) => {
    const fondo = g.createRadialGradient(0, -r * 0.3, r * 0.05, 0, 0, r);
    fondo.addColorStop(0, '#1b2a3d'); fondo.addColorStop(0.55, '#0d1622'); fondo.addColorStop(1, '#05090f');
    g.fillStyle = fondo; g.fillRect(-r, -r, r * 2, r * 2);
    // rayos de sol
    for (let i = 0; i < 240; i++) {
      g.save(); g.rotate((i / 240) * TAU);
      g.fillStyle = `rgba(255,255,255,${0.012 + Math.random() * 0.03})`;
      g.fillRect(-1, 0, 2, r); g.restore();
    }
    // minutería
    for (let i = 0; i < 60; i++) {
      g.save(); g.rotate((i / 60) * TAU);
      g.fillStyle = '#e9e4d6';
      const largo = i % 5 === 0 ? 0 : r * 0.045;
      if (largo) g.fillRect(-1.5, -r * 0.965, 3, largo);
      g.restore();
    }
    g.fillStyle = '#e9e4d6'; g.textAlign = 'center';
    g.font = `600 ${r * 0.085}px "Cormorant Garamond", Georgia, serif`;
    g.fillText('12horas', 0, -r * 0.36);
    g.font = `600 ${r * 0.036}px Manrope, Arial, sans-serif`;
    g.fillStyle = '#c9a45c';
    g.fillText('A U T O M Á T I C O', 0, -r * 0.27);
    g.fillStyle = '#b9b3a4';
    g.fillText('300 m  ·  ZAFIRO', 0, r * 0.42);
    g.font = `500 ${r * 0.028}px Manrope, Arial, sans-serif`;
    g.fillText('HECHO EN MURCIA', 0, r * 0.49);
  });
}

function texturaBisel() {
  return lienzo(1024, (g, r) => {
    g.fillStyle = '#0a0d12'; g.fillRect(-r, -r, r * 2, r * 2);
    g.fillStyle = '#e4dfd2'; g.textAlign = 'center'; g.textBaseline = 'middle';
    for (let i = 0; i < 60; i++) {
      g.save(); g.rotate((i / 60) * TAU);
      if (i === 0) {
        g.beginPath(); g.moveTo(0, -r * 0.83); g.lineTo(-r * 0.055, -r * 0.955); g.lineTo(r * 0.055, -r * 0.955); g.closePath(); g.fill();
        g.fillStyle = '#c9a45c'; g.beginPath(); g.arc(0, -r * 0.915, r * 0.02, 0, TAU); g.fill(); g.fillStyle = '#e4dfd2';
      } else if (i % 10 === 0) {
        g.font = `700 ${r * 0.1}px Manrope, Arial, sans-serif`;
        g.fillText(String(i), 0, -r * 0.89);
      } else if (i % 5 === 0) {
        g.fillRect(-r * 0.014, -r * 0.955, r * 0.028, r * 0.12);
      } else if (i < 15) {
        g.fillRect(-r * 0.006, -r * 0.94, r * 0.012, r * 0.05);
      }
      g.restore();
    }
  });
}

function texturaFecha() {
  return lienzo(1024, (g, r) => {
    g.fillStyle = '#f1ece0'; g.fillRect(-r, -r, r * 2, r * 2);
    g.fillStyle = '#16140f'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.font = `700 ${r * 0.085}px Manrope, Arial, sans-serif`;
    for (let i = 0; i < 31; i++) {
      g.save(); g.rotate((i / 31) * TAU + Math.PI / 2); // el día de hoy cae a las 3
      g.fillText(String(((new Date().getDate() - 1 + i) % 31) + 1), 0, -r * 0.84);
      g.restore();
    }
  });
}

function texturaTapa() {
  return lienzo(1024, (g, r) => {
    g.fillStyle = '#b9bcc0'; g.fillRect(-r, -r, r * 2, r * 2);
    for (let i = 0; i < 900; i++) { // cepillado circular
      g.strokeStyle = `rgba(${Math.random() > 0.5 ? 255 : 60},${Math.random() > 0.5 ? 255 : 60},${Math.random() > 0.5 ? 255 : 70},0.05)`;
      g.beginPath(); g.arc(0, 0, Math.random() * r, 0, TAU); g.stroke();
    }
    const texto = '12HORAS  ·  ACERO 316L  ·  CRISTAL DE ZAFIRO  ·  300 M  ·  AUTOMÁTICO  ·  ';
    g.fillStyle = '#4b4f55'; g.font = `700 ${r * 0.062}px Manrope, Arial, sans-serif`; g.textAlign = 'center';
    [...texto].forEach((letra, i) => {
      g.save(); g.rotate((i / texto.length) * TAU); g.fillText(letra, 0, -r * 0.78); g.restore();
    });
    g.strokeStyle = '#5a5e64'; g.lineWidth = 3;
    g.beginPath(); g.arc(0, 0, r * 0.66, 0, TAU); g.stroke();
    g.font = `600 ${r * 0.26}px "Cormorant Garamond", Georgia, serif`; g.textBaseline = 'middle';
    g.fillText('12', 0, r * 0.01);
  });
}

function texturaRayas() { // côtes de Genève
  return lienzo(512, (g, r) => {
    g.rotate(0.5);
    for (let x = -r * 2; x < r * 2; x += 36) {
      const grad = g.createLinearGradient(x, 0, x + 36, 0);
      grad.addColorStop(0, '#b3b8be'); grad.addColorStop(0.5, '#f2f4f6'); grad.addColorStop(1, '#b3b8be');
      g.fillStyle = grad; g.fillRect(x, -r * 2, 36, r * 4);
    }
  });
}

function texturaPerlado() {
  return lienzo(512, (g, r) => {
    g.fillStyle = '#b89b5a'; g.fillRect(-r, -r, r * 2, r * 2);
    for (let y = -r; y < r; y += 26) for (let x = -r; x < r; x += 26) {
      const grad = g.createRadialGradient(x, y, 1, x, y, 20);
      grad.addColorStop(0, 'rgba(255,240,200,0.55)'); grad.addColorStop(1, 'rgba(90,70,30,0.25)');
      g.fillStyle = grad; g.beginPath(); g.arc(x, y, 20, 0, TAU); g.fill();
    }
  });
}

/* ---------- Geometrías ---------- */
function extruir(forma, fondo, bisel = 0.006, uvRadio = 1) {
  const g = new THREE.ExtrudeGeometry(forma, { depth: fondo, bevelEnabled: bisel > 0, bevelThickness: bisel, bevelSize: bisel, bevelSegments: 1, curveSegments: 28 });
  g.translate(0, 0, -fondo / 2);
  // las tapas llevan la textura vista desde arriba: uv = posición
  const uv = g.attributes.uv, pos = g.attributes.position;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, pos.getX(i) / (2 * uvRadio) + 0.5, pos.getY(i) / (2 * uvRadio) + 0.5);
  return g;
}
const circulo = (r, x = 0, y = 0) => { const p = new THREE.Path(); p.absarc(x, y, r, 0, TAU, true); return p; };
function disco(r, hueco = 0) {
  const f = new THREE.Shape(); f.absarc(0, 0, r, 0, TAU, false);
  if (hueco) f.holes.push(circulo(hueco));
  return f;
}
function dentado(rFuera, dientes, alto, hueco = 0, radios = 0) {
  const f = new THREE.Shape();
  const rRaiz = rFuera - alto;
  for (let i = 0; i < dientes; i++) {
    const a = (i / dientes) * TAU, paso = TAU / dientes;
    const p = (rad, ang) => [Math.cos(ang) * rad, Math.sin(ang) * rad];
    const pts = [p(rRaiz, a), p(rRaiz, a + paso * 0.25), p(rFuera, a + paso * 0.4), p(rFuera, a + paso * 0.6), p(rRaiz, a + paso * 0.75)];
    pts.forEach(([x, y], k) => (i === 0 && k === 0 ? f.moveTo(x, y) : f.lineTo(x, y)));
  }
  f.closePath();
  if (hueco) f.holes.push(circulo(hueco));
  if (radios) { // ventanas entre los radios
    const r1 = rRaiz * 0.34, r2 = rRaiz * 0.8;
    for (let i = 0; i < radios; i++) {
      const a0 = (i / radios) * TAU + 0.16, a1 = ((i + 1) / radios) * TAU - 0.16;
      const v = new THREE.Path();
      v.absarc(0, 0, r2, a0, a1, false); v.absarc(0, 0, r1, a1, a0, true); v.closePath();
      f.holes.push(v);
    }
  }
  return f;
}
function rectRedondo(w, h, r) {
  const f = new THREE.Shape(), x = -w / 2, y = -h / 2;
  f.moveTo(x + r, y); f.lineTo(x + w - r, y); f.quadraticCurveTo(x + w, y, x + w, y + r);
  f.lineTo(x + w, y + h - r); f.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  f.lineTo(x + r, y + h); f.quadraticCurveTo(x, y + h, x, y + h - r);
  f.lineTo(x, y + r); f.quadraticCurveTo(x, y, x + r, y);
  return f;
}

// Funde en una sola malla las piezas de un grupo que comparten material: muchas menos llamadas de dibujo.
function fundir(grupo) {
  grupo.updateMatrixWorld(true);
  const inversa = grupo.matrixWorld.clone().invert();
  const porMaterial = new Map();
  const quitar = [];
  grupo.traverse((o) => {
    if (!o.isMesh || Array.isArray(o.material)) return;
    let g = o.geometry.index ? o.geometry.toNonIndexed() : o.geometry.clone();
    for (const nombre of Object.keys(g.attributes)) if (!['position', 'normal', 'uv'].includes(nombre)) g.deleteAttribute(nombre);
    g.applyMatrix4(new THREE.Matrix4().multiplyMatrices(inversa, o.matrixWorld));
    if (!porMaterial.has(o.material)) porMaterial.set(o.material, []);
    porMaterial.get(o.material).push(g);
    quitar.push(o);
  });
  for (const o of quitar) { o.geometry.dispose(); o.parent.remove(o); }
  for (const [material, lista] of porMaterial) {
    const unida = mergeGeometries(lista, false);
    lista.forEach((g) => g.dispose());
    grupo.add(new THREE.Mesh(unida, material));
  }
  return grupo;
}

/* ---------- El reloj ---------- */
export class Despiece {
  constructor(seccion, lienzoEl, etiquetasEl, { alCambiar } = {}) {
    this.seccion = seccion;
    this.etiquetasEl = etiquetasEl;
    this.alCambiar = alCambiar;
    this.reducir = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.renderer = new THREE.WebGLRenderer({ canvas: lienzoEl, antialias: true, alpha: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.1;

    this.escena = new THREE.Scene();
    const pmrem = new THREE.PMREMGenerator(this.renderer);
    this.escena.environment = pmrem.fromScene(new RoomEnvironment(), 0.03).texture;
    pmrem.dispose();
    const luz = new THREE.DirectionalLight(0xfff1dc, 2.2); luz.position.set(-3, 5, 6); this.escena.add(luz);
    const contra = new THREE.DirectionalLight(0xc9a45c, 1.4); contra.position.set(5, -2, -4); this.escena.add(contra);

    this.camara = new THREE.PerspectiveCamera(28, 1, 0.1, 100);
    this.reloj = new THREE.Group();
    this.escena.add(this.reloj);
    this.piezas = [];
    this.giran = [];
    this.construir();

    this.progreso = 0; this.visto = 0;
    this.raton = { x: 0, y: 0 };
    this.alMover = (e) => { this.raton.x = (e.clientX / window.innerWidth - 0.5) * 2; this.raton.y = (e.clientY / window.innerHeight - 0.5) * 2; };
    window.addEventListener('pointermove', this.alMover, { passive: true });
    this.alScroll = () => this.medir();
    window.addEventListener('scroll', this.alScroll, { passive: true });
    this.ro = new ResizeObserver(() => { this.ajustar(); this.medir(); });
    this.ro.observe(lienzoEl.parentElement);
    this.visible = true;
    this.io = new IntersectionObserver(([e]) => { this.visible = e.isIntersecting; });
    this.io.observe(seccion);
    this.ajustar(); this.medir();
    this.visto = this.progreso;
    this.bucle = this.bucle.bind(this);
    this.frame = requestAnimationFrame(this.bucle);
  }

  material(color, rugosidad = 0.3, metal = 1, extra = {}) {
    return new THREE.MeshStandardMaterial({ color, roughness: rugosidad, metalness: metal, ...extra });
  }

  // Añade una pieza: z de montaje, desplazamiento al desmontar y turno de salida (0 = la primera)
  pieza(nombre, objeto, z, fuera, turno, etiqueta) {
    objeto.position.z = z;
    const p = { nombre, objeto, base: objeto.position.clone(), fuera: new THREE.Vector3(...fuera), turno, etiqueta };
    this.piezas.push(p);
    this.reloj.add(objeto);
    return p;
  }

  construir() {
    const acero = this.material(0xc9ccd1, 0.24);
    const aceroCepillado = this.material(0xb4b8be, 0.42);
    const oro = this.material(0xd9b46a, 0.25);
    const laton = this.material(0xc8a55a, 0.33);
    const negro = this.material(0x0b0d10, 0.5, 0.2);
    const azul = this.material(0x2740a8, 0.25);
    const rubi = this.material(0xc1123a, 0.12, 0.1, { emissive: 0x5a0015, emissiveIntensity: 0.6 });
    const lume = this.material(0xf2f0e2, 0.6, 0, { emissive: 0xbfe8c4, emissiveIntensity: 0.18 });

    /* Cristal de zafiro con lupa de fecha */
    const cristal = new THREE.Group();
    const vidrio = new THREE.MeshPhysicalMaterial({ color: 0xffffff, roughness: 0.02, metalness: 0, transparent: true, opacity: 0.13, envMapIntensity: 2.2, clearcoat: 1, clearcoatRoughness: 0, side: THREE.DoubleSide, depthWrite: false });
    cristal.add(new THREE.Mesh(extruir(disco(0.8), 0.05, 0.012), vidrio));
    const lupa = new THREE.Mesh(new THREE.SphereGeometry(0.12, 24, 12, 0, TAU, 0, Math.PI / 2.4), vidrio);
    lupa.rotation.x = Math.PI / 2; lupa.scale.set(1.15, 1, 0.8); lupa.position.set(0.56, 0, 0.0);
    cristal.add(lupa);
    this.pieza('cristal', cristal, 0.3, [0, 0, 3.5], 0, 'Cristal de zafiro');

    /* Bisel giratorio de 120 clics */
    const bisel = new THREE.Group();
    bisel.add(new THREE.Mesh(extruir(dentado(1.045, 120, 0.02, 0.8), 0.1, 0.008), acero));
    const inserto = new THREE.Mesh(new THREE.RingGeometry(0.815, 1.005, 96), new THREE.MeshStandardMaterial({ map: texturaBisel(), roughness: 0.18, metalness: 0.3 }));
    inserto.position.z = 0.059;
    const uvI = inserto.geometry.attributes.uv, posI = inserto.geometry.attributes.position;
    for (let i = 0; i < uvI.count; i++) uvI.setXY(i, posI.getX(i) / 2.01 + 0.5, posI.getY(i) / 2.01 + 0.5);
    bisel.add(inserto);
    this.pieza('bisel', bisel, 0.25, [0, 0, 2.75], 0.06, 'Bisel giratorio');

    /* Agujas */
    const aguja = (largo, ancho, cola, mat, conLume) => {
      const g = new THREE.Group();
      const f = new THREE.Shape();
      f.moveTo(-ancho / 2, -cola); f.lineTo(ancho / 2, -cola); f.lineTo(ancho / 2, largo * 0.82); f.lineTo(0, largo); f.lineTo(-ancho / 2, largo * 0.82); f.closePath();
      g.add(new THREE.Mesh(extruir(f, 0.012, 0.003), mat));
      if (conLume) {
        const l = new THREE.Shape();
        l.moveTo(-ancho * 0.28, largo * 0.25); l.lineTo(ancho * 0.28, largo * 0.25); l.lineTo(ancho * 0.28, largo * 0.8); l.lineTo(-ancho * 0.28, largo * 0.8); l.closePath();
        const m = new THREE.Mesh(extruir(l, 0.004, 0), lume); m.position.z = 0.009; g.add(m);
      }
      const eje = new THREE.Mesh(extruir(disco(ancho * 0.85), 0.016, 0.003), mat); g.add(eje);
      return g;
    };
    this.horas = aguja(0.42, 0.075, 0.1, acero, true);
    this.minutos = aguja(0.66, 0.058, 0.12, acero, true);
    this.segundos = aguja(0.7, 0.014, 0.2, this.material(0xd9b46a, 0.3), false);
    const punto = new THREE.Mesh(extruir(disco(0.03), 0.004, 0), lume); punto.position.set(0, 0.5, 0.008); this.segundos.add(punto);
    this.pieza('horas', this.horas, 0.125, [0, 0, 1.85], 0.12);
    this.pieza('minutos', this.minutos, 0.143, [0, 0, 2.02], 0.12, 'Agujas con luminiscencia');
    this.pieza('segundos', this.segundos, 0.161, [0, 0, 2.19], 0.12);

    /* Esfera con índices aplicados */
    const esfera = new THREE.Group();
    const fEsfera = disco(0.815);
    const ventana = new THREE.Path(); // ventana de fecha a las 3
    ventana.moveTo(0.5, -0.06); ventana.lineTo(0.63, -0.06); ventana.lineTo(0.63, 0.06); ventana.lineTo(0.5, 0.06); ventana.closePath();
    fEsfera.holes.push(ventana);
    const matEsfera = [new THREE.MeshStandardMaterial({ map: texturaEsfera(), roughness: 0.35, metalness: 0.55 }), negro];
    esfera.add(new THREE.Mesh(extruir(fEsfera, 0.02, 0, 0.815), matEsfera));
    for (let i = 0; i < 12; i++) {
      if (i === 3) continue;
      const a = Math.PI / 2 - (i / 12) * TAU;
      const grupo = new THREE.Group();
      let forma, relleno;
      if (i === 0) {
        forma = new THREE.Shape(); forma.moveTo(-0.075, 0.07); forma.lineTo(0.075, 0.07); forma.lineTo(0, -0.07); forma.closePath();
        relleno = new THREE.Shape(); relleno.moveTo(-0.05, 0.055); relleno.lineTo(0.05, 0.055); relleno.lineTo(0, -0.04); relleno.closePath();
      } else if (i === 6 || i === 9) {
        forma = rectRedondo(0.07, 0.17, 0.01); relleno = rectRedondo(0.045, 0.14, 0.008);
      } else {
        forma = disco(0.052); relleno = disco(0.038);
      }
      grupo.add(new THREE.Mesh(extruir(forma, 0.016, 0.003), acero));
      const l = new THREE.Mesh(extruir(relleno, 0.004, 0), lume); l.position.z = 0.011; grupo.add(l);
      grupo.position.set(Math.cos(a) * 0.68, Math.sin(a) * 0.68, 0.017);
      grupo.rotation.z = a - Math.PI / 2;
      esfera.add(grupo);
    }
    fundir(esfera);
    this.pieza('esfera', esfera, 0.095, [0, 0, 1.2], 0.2, 'Esfera con índices aplicados');

    /* Disco de fecha */
    const fecha = new THREE.Mesh(new THREE.RingGeometry(0.47, 0.67, 96), new THREE.MeshStandardMaterial({ map: texturaFecha(), roughness: 0.6, metalness: 0 }));
    const uvF = fecha.geometry.attributes.uv, posF = fecha.geometry.attributes.position;
    for (let i = 0; i < uvF.count; i++) uvF.setXY(i, posF.getX(i) / 1.34 + 0.5, posF.getY(i) / 1.34 + 0.5);
    this.pieza('fecha', fecha, 0.078, [0, 0, 0.62], 0.27, 'Disco de fecha');

    /* Caja de acero con asas y corona roscada */
    const caja = new THREE.Group();
    const perfil = [[0.83, -0.26], [0.96, -0.26], [1.02, -0.2], [1.04, 0.05], [1.01, 0.2], [0.83, 0.2]].map(([x, y]) => new THREE.Vector2(x, y));
    const carrura = new THREE.Mesh(new THREE.LatheGeometry(perfil, 96), aceroCepillado);
    carrura.rotation.x = Math.PI / 2;
    caja.add(carrura);
    for (const sx of [-1, 1]) for (const sy of [-1, 1]) {
      const asa = new THREE.Mesh(extruir(rectRedondo(0.17, 0.5, 0.07), 0.2, 0.03), aceroCepillado);
      asa.position.set(sx * 0.63, sy * 0.96, -0.07); asa.rotation.z = -sx * sy * 0.1; asa.rotation.x = sy * 0.28;
      caja.add(asa);
    }
    this.corona = new THREE.Group();
    const cabeza = new THREE.Mesh(extruir(dentado(0.13, 26, 0.012), 0.14, 0.008), acero);
    cabeza.rotation.y = Math.PI / 2; this.corona.add(cabeza);
    const tija = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.5, 16), acero);
    tija.rotation.z = Math.PI / 2; tija.position.x = -0.3; this.corona.add(tija);
    this.corona.position.set(1.12, 0, -0.03);
    caja.add(this.corona);
    this.pieza('caja', caja, 0, [0, 0, 0], 1, 'Caja de acero 316L');

    /* Brazalete tipo Oyster: eslabones abombados, trabados como ladrillos, que se estrechan y caen hacia la muñeca */
    this.matBrazalete = this.material(0xc3c7cc, 0.34, 1, { transparent: true, envMapIntensity: 1.25 });
    this.matBrazaleteCentro = this.material(0xd6d9dd, 0.24, 1, { transparent: true, envMapIntensity: 1.5 });
    const eslabon = (ancho, largo, alto, mat) => {
      // perfil lateral en forma de píldora, extruido a lo ancho del brazalete
      const g = new THREE.ExtrudeGeometry(rectRedondo(largo, alto, alto * 0.49), { depth: ancho - 0.03, bevelEnabled: true, bevelThickness: 0.015, bevelSize: 0.012, bevelSegments: 2, curveSegments: 6 });
      g.translate(0, 0, -(ancho - 0.03) / 2);
      g.rotateY(Math.PI / 2); g.rotateX(Math.PI / 2);
      return new THREE.Mesh(g, mat);
    };
    const paso = 0.236, filas = 11;
    for (const sy of [-1, 1]) {
      const mitad = new THREE.Group();
      let y = 1.0, z = -0.07;
      for (let n = 0; n <= filas * 2; n++) {
        const s = n * paso / 2;
        const caida = 0.08 + s * 0.26; // ángulo con el que cae hacia la muñeca
        const ancho = mezcla(1.07, 0.84, sujetar(s / (filas * paso)));
        const nodo = new THREE.Group();
        if (n === 0) { // eslabón final, macizo, que encaja entre las asas
          nodo.add(eslabon(ancho, 0.3, 0.125, this.matBrazalete));
        } else if (n % 2 === 0) {
          nodo.add(eslabon(ancho * 0.4, 0.25, 0.115, this.matBrazaleteCentro));
        } else {
          for (const sx of [-1, 1]) {
            const l = eslabon(ancho * 0.29, 0.25, 0.115, this.matBrazalete);
            l.position.x = sx * ancho * 0.355; nodo.add(l);
          }
        }
        nodo.position.set(0, sy * y, z);
        nodo.rotation.x = sy * caida;
        mitad.add(nodo);
        y += Math.cos(caida) * paso / 2; z -= Math.sin(caida) * paso / 2;
      }
      fundir(mitad);
      this.pieza(sy > 0 ? 'brazalete-a' : 'brazalete-b', mitad, 0, [0, sy * 2.6, -0.6], 0, null);
    }
    this.brazaletes = this.piezas.filter((x) => x.nombre.startsWith('brazalete'));

    /* Platina con perlado */
    const perlado = texturaPerlado(); perlado.wrapS = perlado.wrapT = THREE.RepeatWrapping; perlado.repeat.set(3, 3);
    const platina = new THREE.Group();
    platina.add(new THREE.Mesh(extruir(disco(0.8, 0.03), 0.05, 0.006), [new THREE.MeshStandardMaterial({ map: perlado, roughness: 0.3, metalness: 0.9 }), laton]));
    this.pieza('platina', platina, 0.03, [0, 0, -0.75], 0.27, 'Platina perlada');

    /* Tren de rodaje: barrilete, ruedas y escape */
    const rueda = (x, y, r, dientes, radios, mat, vel, z) => {
      const g = new THREE.Group();
      g.add(new THREE.Mesh(extruir(dentado(r, dientes, r * 0.09, r * 0.09, radios), 0.022, 0.003), mat));
      const eje = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.1, r * 0.1, 0.1, 12), acero); eje.rotation.x = Math.PI / 2; g.add(eje);
      g.position.set(x, y, z);
      this.giran.push({ objeto: g, vel });
      return g;
    };
    const tren = new THREE.Group();
    const barrilete = rueda(-0.36, 0.3, 0.33, 72, 0, laton, 0.05, 0);
    const tambor = new THREE.Mesh(new THREE.CylinderGeometry(0.27, 0.27, 0.07, 48), oro); tambor.rotation.x = Math.PI / 2; barrilete.add(tambor);
    tren.add(barrilete);
    tren.add(rueda(0, 0, 0.24, 60, 5, oro, -0.12, 0.03));
    tren.add(rueda(0.33, 0.28, 0.2, 54, 5, laton, 0.3, -0.005));
    tren.add(rueda(0.5, -0.02, 0.15, 44, 4, oro, -0.8, 0.03));
    const escape = rueda(0.36, -0.3, 0.1, 15, 4, acero, 2.4, -0.005);
    tren.add(escape);
    this.pieza('tren', tren, -0.03, [0, 0, -1.4], 0.2, 'Tren de rodaje');

    /* Volante con espiral */
    const organo = new THREE.Group();
    this.volante = new THREE.Group();
    this.volante.add(new THREE.Mesh(extruir(disco(0.24, 0.2), 0.03, 0.004), oro));
    for (const a of [0, Math.PI / 2]) {
      const brazo = new THREE.Mesh(extruir(rectRedondo(0.42, 0.03, 0.01), 0.02, 0), oro); brazo.rotation.z = a; this.volante.add(brazo);
    }
    for (let i = 0; i < 4; i++) { // tornillos de regulación
      const t = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.04, 10), acero);
      t.position.set(Math.cos(i * Math.PI / 2 + 0.78) * 0.22, Math.sin(i * Math.PI / 2 + 0.78) * 0.22, 0); t.rotation.x = Math.PI / 2; this.volante.add(t);
    }
    const puntos = [];
    for (let i = 0; i <= 260; i++) { const a = (i / 260) * TAU * 6; const rr = 0.02 + (i / 260) * 0.13; puntos.push(new THREE.Vector3(Math.cos(a) * rr, Math.sin(a) * rr, 0.022)); }
    this.volante.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(puntos), 300, 0.0035, 5), azul));
    fundir(this.volante);
    organo.add(this.volante);
    organo.position.set(-0.26, -0.36, 0);
    this.pieza('volante', organo, -0.06, [0, 0, -1.95], 0.14, 'Volante y espiral');

    /* Puentes con côtes de Genève, rubíes y tornillos azulados */
    const rayas = texturaRayas();
    const puentes = new THREE.Group();
    const fPuente = new THREE.Shape();
    fPuente.absarc(0, 0, 0.78, -0.25, Math.PI * 1.12, false);
    fPuente.lineTo(-0.2, -0.05); fPuente.lineTo(0.2, -0.42); fPuente.closePath();
    const matPuente = [new THREE.MeshStandardMaterial({ map: rayas, roughness: 0.22, metalness: 0.95 }), acero];
    puentes.add(new THREE.Mesh(extruir(fPuente, 0.04, 0.006, 0.8), matPuente));
    const gallo = new THREE.Mesh(extruir(rectRedondo(0.5, 0.17, 0.08), 0.04, 0.006, 0.4), matPuente); // puente del volante
    gallo.position.set(-0.4, -0.5, 0); gallo.rotation.z = 0.95; puentes.add(gallo);
    const joya = (x, y, r = 0.035) => {
      const g = new THREE.Group();
      const engaste = new THREE.Mesh(new THREE.CylinderGeometry(r * 1.5, r * 1.5, 0.012, 20), oro); engaste.rotation.x = Math.PI / 2; g.add(engaste);
      const piedra = new THREE.Mesh(new THREE.SphereGeometry(r, 16, 10), rubi); piedra.scale.z = 0.5; g.add(piedra);
      g.position.set(x, y, -0.024); return g;
    };
    [[0, 0, 0.045], [0.33, 0.28], [0.5, -0.02], [-0.36, 0.3, 0.05], [-0.26, -0.36, 0.04], [0.36, -0.3, 0.03]].forEach(([x, y, r]) => puentes.add(joya(x, y, r)));
    const tornillo = (x, y) => {
      const g = new THREE.Group();
      const cabezaT = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.02, 20), azul); cabezaT.rotation.x = Math.PI / 2; g.add(cabezaT);
      const ranura = new THREE.Mesh(new THREE.BoxGeometry(0.075, 0.012, 0.006), negro); ranura.position.z = -0.011; g.add(ranura);
      g.position.set(x, y, -0.028); g.rotation.z = Math.random() * 3; return g;
    };
    [[0.62, 0.3], [-0.05, 0.68], [-0.66, 0.22], [0.62, -0.12], [-0.6, -0.38], [0.18, 0.5]].forEach(([x, y]) => puentes.add(tornillo(x, y)));
    fundir(puentes);
    this.pieza('puentes', puentes, -0.1, [0, 0, -2.5], 0.08, 'Puentes y rubíes');

    /* Masa oscilante */
    const rotor = new THREE.Group();
    this.rotor = new THREE.Group();
    const fAla = new THREE.Shape(); fAla.absarc(0, 0, 0.6, 0, Math.PI, false); fAla.absarc(0, 0, 0.1, Math.PI, 0, true); fAla.closePath();
    for (let i = 0; i < 3; i++) { // ventanas del ala
      const v = new THREE.Path(), a0 = 0.25 + i * 0.95, a1 = a0 + 0.7;
      v.absarc(0, 0, 0.5, a0, a1, false); v.absarc(0, 0, 0.22, a1, a0, true); v.closePath(); fAla.holes.push(v);
    }
    this.rotor.add(new THREE.Mesh(extruir(fAla, 0.02, 0.004, 0.8), [new THREE.MeshStandardMaterial({ map: rayas, roughness: 0.25, metalness: 0.95 }), acero]));
    const fMasa = new THREE.Shape(); fMasa.absarc(0, 0, 0.77, 0, Math.PI, false); fMasa.absarc(0, 0, 0.6, Math.PI, 0, true); fMasa.closePath();
    this.rotor.add(new THREE.Mesh(extruir(fMasa, 0.06, 0.01), oro));
    const buje = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.04, 24), acero); buje.rotation.x = Math.PI / 2; this.rotor.add(buje);
    const tBuje = tornillo(0, 0); tBuje.position.z = -0.03; this.rotor.add(tBuje);
    fundir(this.rotor);
    rotor.add(this.rotor);
    this.pieza('rotor', rotor, -0.16, [0, 0, -3.1], 0.04, 'Masa oscilante');

    /* Junta y tapa roscada */
    const junta = new THREE.Mesh(new THREE.TorusGeometry(0.86, 0.016, 10, 96), negro);
    this.pieza('junta', junta, -0.225, [0, 0, -3.55], 0.02);
    const tapa = new THREE.Group();
    const cuerpo = new THREE.Mesh(extruir(dentado(0.95, 36, 0.03), 0.06, 0.012, 0.95), [new THREE.MeshStandardMaterial({ map: texturaTapa(), roughness: 0.32, metalness: 0.95 }), acero]);
    cuerpo.rotation.y = Math.PI; // la cara grabada mira hacia atrás
    tapa.add(cuerpo);
    this.pieza('tapa', tapa, -0.27, [0, 0, -4], 0, 'Tapa roscada, 300 m');

    this.etiquetas = this.piezas.filter((p) => p.etiqueta).map((p) => {
      const el = document.createElement('span');
      el.className = 'despiece__etiqueta';
      el.textContent = p.etiqueta;
      this.etiquetasEl.appendChild(el);
      return { pieza: p, el };
    });
  }

  ajustar() {
    const caja = this.renderer.domElement.parentElement;
    const w = caja.clientWidth || 1, h = caja.clientHeight || 1;
    this.renderer.setSize(w, h, false);
    this.camara.aspect = w / h;
    this.camara.updateProjectionMatrix();
    this.ancho = w; this.alto = h;
    this.arriba = parseFloat(getComputedStyle(caja).top) || 0;
    this.vertical = w / h < 0.95;
    this.estrecho = w < 900;
  }

  medir() {
    const r = this.seccion.getBoundingClientRect();
    const recorrido = r.height - this.alto;
    this.progreso = recorrido > 0 ? sujetar((this.arriba - r.top) / recorrido) : 0;
  }

  bucle(t) {
    this.frame = requestAnimationFrame(this.bucle);
    if (!this.visible) return;
    const dt = Math.min(0.1, (t - (this.antes || t)) / 1000); this.antes = t;
    // Si el equipo no llega a 45 fotogramas por segundo, se baja la resolución del lienzo poco a poco
    this.lento = dt > 0.024 ? (this.lento || 0) + 1 : Math.max(0, (this.lento || 0) - 2);
    if (this.lento > 45 && this.renderer.getPixelRatio() > 0.7) {
      this.renderer.setPixelRatio(Math.max(0.7, this.renderer.getPixelRatio() * 0.82));
      this.ajustar(); this.lento = 0;
    }
    this.visto += (this.progreso - this.visto) * (this.reducir ? 1 : 1 - Math.exp(-dt * 7));
    const p = this.visto;
    const abrir = suave(0.03, 0.44, p) * (1 - suave(0.62, 0.93, p));
    const tan = Math.tan((this.camara.fov / 2) * Math.PI / 180);

    // Cada pieza sale en su turno
    for (const pz of this.piezas) {
      const k = suave(0, 1, sujetar(abrir * 1.3 - pz.turno * 0.3));
      pz.k = k;
      pz.objeto.position.set(pz.base.x + pz.fuera.x * k, pz.base.y + pz.fuera.y * k, pz.base.z + pz.fuera.z * k);
    }
    this.corona.position.x = 1.12 + abrir * 0.55;
    this.matBrazalete.opacity = this.matBrazaleteCentro.opacity = 1 - suave(0.15, 0.7, abrir);
    const brazaleteVisible = this.matBrazalete.opacity > 0.02;
    for (const x of this.brazaletes) x.objeto.visible = brazaleteVisible;

    // Mecanismo siempre en marcha
    const s = t / 1000;
    if (!this.reducir) {
      for (const g of this.giran) g.objeto.rotation.z = s * g.vel;
      this.volante.rotation.z = Math.sin(s * 9) * 1.1;
      this.rotor.rotation.z = Math.sin(s * 0.7) * 1.4 + abrir * 2;
    }
    const ahora = new Date();
    const seg = ahora.getSeconds() + ahora.getMilliseconds() / 1000, min = ahora.getMinutes() + seg / 60, hor = (ahora.getHours() % 12) + min / 60;
    this.segundos.rotation.z = -(seg / 60) * TAU;
    this.minutos.rotation.z = -(min / 60) * TAU;
    this.horas.rotation.z = -(hor / 12) * TAU;

    // Encuadre: el reloj montado va a un lado y el despiece ocupa toda la pantalla
    const aUnLado = (1 - suave(0.02, 0.2, p)) + suave(0.72, 0.95, p);
    const inclinX = this.reducir ? 0 : this.raton.y * 0.06, inclinY = this.reducir ? 0 : this.raton.x * 0.1;
    const largo = 7.5, centro = -0.25; // el despiece va de z=-4 a z=3,5
    let distMontado, distAbierto;
    if (this.vertical) {
      this.reloj.rotation.set(mezcla(-0.12, -1.02, abrir) + inclinX, mezcla(0.32, 0.5, abrir) + (p - 0.5) * 0.5 + inclinY, 0);
      distMontado = 3.5 / (2 * tan * this.camara.aspect);
      distAbierto = Math.max((largo * 0.86 + 4.6) / (2 * tan), 3.1 / (2 * tan * this.camara.aspect));
      this.reloj.position.set(0, distMontado * tan * 0.5 * sujetar(aUnLado) + abrir * 0.2, 0);
    } else {
      this.reloj.rotation.set(mezcla(0.1, 0.16, abrir) + inclinX, mezcla(-0.4, -1.05, abrir) + (p - 0.5) * 0.45 + inclinY, mezcla(0.12, 0, abrir));
      distMontado = 5.4 / (2 * tan) * 1.05;
      distAbierto = Math.max((largo * 0.87 + 3.4) / (2 * tan * this.camara.aspect), 3.6 / (2 * tan));
      const lado = distMontado * tan * this.camara.aspect * 0.5;
      this.reloj.position.set(lado * sujetar(aUnLado) + abrir * 0.75, 0, 0);
    }
    // se compensa el centro del despiece para que quede centrado al abrirse
    const eje = new THREE.Vector3(0, 0, centro * abrir).applyEuler(this.reloj.rotation);
    this.reloj.position.sub(eje);
    this.camara.position.set(0, 0, mezcla(distMontado, distAbierto, abrir));
    this.camara.lookAt(0, 0, 0);
    this.renderer.render(this.escena, this.camara);

    // Etiquetas sobre cada pieza
    const v = new THREE.Vector3();
    this.etiquetas.forEach(({ pieza, el }, i) => {
      const ver = suave(0.82, 1, pieza.nombre === 'caja' ? abrir : pieza.k) * suave(0.6, 0.9, abrir);
      el.style.opacity = ver.toFixed(3);
      if (ver < 0.01) return;
      pieza.objeto.getWorldPosition(v); v.project(this.camara);
      const x = (v.x * 0.5 + 0.5) * this.ancho, y = (-v.y * 0.5 + 0.5) * this.alto;
      if (this.vertical) {
        el.style.transform = `translate(${i % 2 ? 12 : this.ancho - 12}px, ${y}px) translate(${i % 2 ? '0' : '-100%'}, -50%)`;
      } else {
        const radio = (1.15 / (this.camara.position.z * tan)) * this.alto * 0.5;
        const arriba = i % 2 === 0;
        el.style.transform = `translate(${x}px, ${y + (arriba ? -radio - 14 : radio + 14)}px) translate(-50%, ${arriba ? '-100%' : '0'})`;
      }
    });
    if (this.alCambiar) this.alCambiar(p, abrir);
  }

  destruir() {
    cancelAnimationFrame(this.frame);
    window.removeEventListener('pointermove', this.alMover);
    window.removeEventListener('scroll', this.alScroll);
    this.ro.disconnect(); this.io.disconnect();
    this.escena.traverse((o) => {
      if (o.geometry) o.geometry.dispose();
      const mats = Array.isArray(o.material) ? o.material : o.material ? [o.material] : [];
      mats.forEach((m) => { if (m.map) m.map.dispose(); m.dispose(); });
    });
    this.renderer.dispose();
  }
}
