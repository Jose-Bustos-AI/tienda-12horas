// Reloj 12horas Uno en 3D para el configurador: caja, esfera, correa y tamaño cambian al momento,
// las agujas dan la hora real y al girarlo se ve la tapa con el grabado.
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { CONFIG } from './datos.js';
import { extruir, disco, dentado, rectRedondo, fundir } from './despiece.js';

const TAU = Math.PI * 2;
const busca = (grupo, id) => CONFIG[grupo].find((x) => x.id === id) || CONFIG[grupo][0];
const METALES = {
  acero: { color: 0xd4d6d9, rugosidad: 0.17, metal: 1 },
  oro: { color: 0xdcb565, rugosidad: 0.2, metal: 1 },
  negro: { color: 0x1c1c1f, rugosidad: 0.5, metal: 0.85 }
};

function tela(ancho, alto, pintar) {
  const c = document.createElement('canvas');
  c.width = ancho; c.height = alto;
  pintar(c.getContext('2d'), ancho, alto);
  const t = new THREE.CanvasTexture(c);
  t.anisotropy = 8;
  return t;
}
const azar = (() => { let s = 7; return () => { s = (s * 16807) % 2147483647; return s / 2147483647; }; })();

/* ---------- Texturas de las correas: color y relieve ---------- */
function texturasCorrea(correa, larga) {
  const W = 256, H = 1024;
  const pintar = (relieve) => (g) => {
    const tipo = correa.tipo;
    if (tipo === 'cuero') {
      g.fillStyle = relieve ? '#808080' : correa.color; g.fillRect(0, 0, W, H);
      for (let i = 0; i < 9000; i++) { // grano de la piel
        const x = azar() * W, y = azar() * H, r = 0.6 + azar() * 1.6;
        g.fillStyle = relieve ? (azar() > 0.5 ? 'rgba(255,255,255,.12)' : 'rgba(0,0,0,.16)') : (azar() > 0.5 ? 'rgba(255,255,255,.035)' : 'rgba(0,0,0,.09)');
        g.beginPath(); g.ellipse(x, y, r * 1.4, r, azar() * 3, 0, TAU); g.fill();
      }
      const borde = g.createLinearGradient(0, 0, W, 0); // cantos quemados
      const osc = relieve ? 'rgba(0,0,0,.5)' : 'rgba(0,0,0,.42)';
      borde.addColorStop(0, osc); borde.addColorStop(0.1, 'rgba(0,0,0,0)'); borde.addColorStop(0.9, 'rgba(0,0,0,0)'); borde.addColorStop(1, osc);
      g.fillStyle = borde; g.fillRect(0, 0, W, H);
      const hilo = relieve ? '#f2f2f2' : (correa.id === 'negro' ? '#8f8a80' : '#ecd9b4');
      const puntada = (x, y, giro) => { g.save(); g.translate(x, y); g.rotate(giro); g.fillStyle = hilo; g.beginPath(); g.ellipse(0, 0, 3.4, 10, 0, 0, TAU); g.fill(); g.restore(); };
      for (let y = 26; y < H - (larga ? 70 : 20); y += 30) { puntada(W * 0.13, y, 0.12); puntada(W * 0.87, y, -0.12); }
      for (let x = W * 0.22; x < W * 0.8; x += 30) puntada(x, 22, Math.PI / 2 + 0.1);
    } else if (tipo === 'caucho') {
      g.fillStyle = relieve ? '#808080' : correa.color; g.fillRect(0, 0, W, H);
      for (let i = 0; i < 2500; i++) { g.fillStyle = relieve ? 'rgba(255,255,255,.06)' : 'rgba(255,255,255,.02)'; g.fillRect(azar() * W, azar() * H, 2, 2); }
      for (let y = 30; y < H * 0.34; y += 34) { // acanaladuras junto a la caja
        g.fillStyle = relieve ? '#2a2a2a' : 'rgba(0,0,0,.55)'; g.fillRect(W * 0.1, y, W * 0.8, 14);
        g.fillStyle = relieve ? '#b0b0b0' : 'rgba(255,255,255,.06)'; g.fillRect(W * 0.1, y + 14, W * 0.8, 4);
      }
      g.fillStyle = relieve ? '#a8a8a8' : 'rgba(255,255,255,.035)'; g.fillRect(W * 0.3, H * 0.36, W * 0.4, H * 0.64); // nervio central
    } else { // malla milanesa
      g.fillStyle = relieve ? '#707070' : '#9da1a6'; g.fillRect(0, 0, W, H);
      const paso = 10;
      for (let y = -paso; y < H + paso; y += paso) for (let x = -paso; x < W + paso; x += paso) {
        const impar = (Math.round(y / paso) % 2) * (paso / 2);
        g.save(); g.translate(x + impar, y); g.rotate(0.9);
        g.strokeStyle = relieve ? '#f0f0f0' : '#e9ecef'; g.lineWidth = 3; g.lineCap = 'round';
        g.beginPath(); g.moveTo(-4, 0); g.lineTo(4, 0); g.stroke();
        g.strokeStyle = relieve ? '#303030' : 'rgba(40,44,50,.75)'; g.lineWidth = 1.4;
        g.beginPath(); g.moveTo(-4, 2.6); g.lineTo(4, 2.6); g.stroke();
        g.restore();
      }
    }
    if (larga && tipo !== 'malla') { // agujeros de la hebilla
      for (let i = 0; i < 6; i++) {
        const y = H * (0.5 + i * 0.062);
        g.fillStyle = relieve ? '#000' : '#070707'; g.beginPath(); g.ellipse(W / 2, y, 9, 11, 0, 0, TAU); g.fill();
        if (!relieve) { g.strokeStyle = 'rgba(255,255,255,.12)'; g.lineWidth = 1.5; g.beginPath(); g.ellipse(W / 2, y + 1, 10, 12, 0, 0.2, Math.PI - 0.2); g.stroke(); }
      }
    }
  };
  const mapa = tela(W, H, pintar(false)); mapa.colorSpace = THREE.SRGBColorSpace;
  return { mapa, relieve: tela(W, H, pintar(true)) };
}

/* ---------- Geometría de un tramo de correa: sección abombada que cae y se estrecha ---------- */
function tramoCorrea({ largo, ancho, anchoFin, grosor, grosorFin, sentido, punta }) {
  const N = 56, M = 12; // estaciones a lo largo y puntos por sección
  const pos = [], uv = [], ind = [];
  let y = 0.9, z = -0.07;
  const marcos = [];
  for (let i = 0; i <= N; i++) {
    const k = i / N;
    const caida = 0.22 + 1.2 * Math.pow(k, 1.15);
    let w = THREE.MathUtils.lerp(ancho, anchoFin, Math.min(1, k * 1.6));
    if (punta && k > 0.88) w *= Math.sqrt(Math.max(0.02, 1 - Math.pow((k - 0.88) / 0.12, 2) * 0.86)); // punta redondeada
    const t = THREE.MathUtils.lerp(grosor, grosorFin, Math.min(1, k * 2.2));
    const N3 = new THREE.Vector3(0, sentido * Math.sin(caida), Math.cos(caida));
    const P = new THREE.Vector3(0, sentido * y, z);
    marcos.push({ P: P.clone(), N: N3.clone(), caida, w, t });
    for (let j = 0; j < M; j++) {
      let x, h, u;
      if (j <= 8) { const a = j / 8; x = -w / 2 + w * a; h = t * (0.42 + 0.58 * Math.pow(Math.sin(Math.PI * a), 0.55)); u = a; }
      else { const a = (j - 8) / 4; x = w / 2 - w * a; h = 0; u = 1 - a; } // cara interior plana
      pos.push(P.x + x, P.y + N3.y * h, P.z + N3.z * h);
      uv.push(u, 1 - k);
    }
    if (i < N) { y += Math.cos(caida) * largo / N; z -= Math.sin(caida) * largo / N; }
  }
  for (let i = 0; i < N; i++) for (let j = 0; j < M; j++) {
    const a = i * M + j, b = i * M + (j + 1) % M, c = (i + 1) * M + j, d = (i + 1) * M + (j + 1) % M;
    ind.push(a, c, b, b, c, d);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(ind);
  g.computeVertexNormals();
  return { geometria: g, marcos };
}

export class Reloj3D {
  constructor(lienzoEl) {
    this.lienzo = lienzoEl;
    this.reducir = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.renderer = new THREE.WebGLRenderer({ canvas: lienzoEl, antialias: true, alpha: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.12;
    this.escena = new THREE.Scene();
    const pmrem = new THREE.PMREMGenerator(this.renderer);
    this.escena.environment = pmrem.fromScene(new RoomEnvironment(), 0.03).texture;
    pmrem.dispose();
    const luz = new THREE.DirectionalLight(0xfff3e0, 2.4); luz.position.set(-3, 4, 6); this.escena.add(luz);
    const contra = new THREE.DirectionalLight(0xc9a45c, 1.2); contra.position.set(4, -2, -5); this.escena.add(contra);
    this.camara = new THREE.PerspectiveCamera(28, 1, 0.1, 100);
    this.pivote = new THREE.Group(); this.escena.add(this.pivote);
    this.reloj = new THREE.Group(); this.pivote.add(this.reloj);
    this.giro = 0; this.giroMeta = 0; this.arrastre = 0; this.raton = { x: 0, y: 0 };

    // Arrastrar para girarlo; al soltar vuelve a la cara elegida
    let desde = null;
    lienzoEl.addEventListener('pointerdown', (e) => { desde = e.clientX; lienzoEl.setPointerCapture(e.pointerId); });
    lienzoEl.addEventListener('pointermove', (e) => {
      const r = lienzoEl.getBoundingClientRect();
      this.raton.x = ((e.clientX - r.left) / r.width - 0.5) * 2; this.raton.y = ((e.clientY - r.top) / r.height - 0.5) * 2;
      if (desde !== null) this.arrastre = (e.clientX - desde) / r.width * 4;
    });
    const soltar = () => { desde = null; this.arrastre = 0; };
    lienzoEl.addEventListener('pointerup', soltar); lienzoEl.addEventListener('pointercancel', soltar);
    lienzoEl.addEventListener('pointerleave', () => { this.raton.x = this.raton.y = 0; });

    this.ro = new ResizeObserver(() => this.ajustar()); this.ro.observe(lienzoEl);
    this.visible = true;
    this.io = new IntersectionObserver(([e]) => { this.visible = e.isIntersecting; }); this.io.observe(lienzoEl);
    this.ajustar();
    this.bucle = this.bucle.bind(this);
    this.frame = requestAnimationFrame(this.bucle);
  }

  limpiar() {
    this.reloj.traverse((o) => {
      if (o.geometry) o.geometry.dispose();
      const mats = Array.isArray(o.material) ? o.material : o.material ? [o.material] : [];
      mats.forEach((m) => { ['map', 'bumpMap'].forEach((k) => m[k] && m[k].dispose()); m.dispose(); });
    });
    this.reloj.clear();
  }

  configurar(c) {
    this.limpiar();
    this.config = { ...c };
    const caja = busca('caja', c.caja), esfera = busca('esfera', c.esfera), correa = busca('correa', c.correa);
    const m = METALES[caja.id] || METALES.acero;
    const metal = new THREE.MeshStandardMaterial({ color: m.color, roughness: m.rugosidad, metalness: m.metal, envMapIntensity: 1.3 });
    const metalCepillado = new THREE.MeshStandardMaterial({ color: m.color, roughness: m.rugosidad + 0.2, metalness: m.metal });
    const aplique = caja.id === 'negro' ? new THREE.MeshStandardMaterial({ color: 0xd4d6d9, roughness: 0.18, metalness: 1 }) : metal;
    const acento = new THREE.MeshStandardMaterial({ color: caja.id === 'oro' ? 0xc9a45c : 0xd1462f, roughness: 0.35, metalness: 0.4 });
    const escala = c.tamano === '41' ? 1.05 : 0.97;
    const cabeza = new THREE.Group(); cabeza.scale.setScalar(escala); this.reloj.add(cabeza);

    /* Caja: carrura torneada con bisel pulido, asas y corona */
    const perfil = [[0.8, -0.2], [0.93, -0.2], [0.985, -0.15], [1, -0.02], [0.985, 0.08], [0.95, 0.12], [0.93, 0.15], [0.9, 0.185], [0.87, 0.2], [0.845, 0.2], [0.845, 0.1]].map(([x, y]) => new THREE.Vector2(x, y));
    const carrura = new THREE.Mesh(new THREE.LatheGeometry(perfil, 96), metal); carrura.rotation.x = Math.PI / 2; cabeza.add(carrura);
    for (const sx of [-1, 1]) for (const sy of [-1, 1]) {
      const asa = new THREE.Mesh(extruir(rectRedondo(0.14, 0.44, 0.065), 0.16, 0.03), metal);
      asa.position.set(sx * 0.615, sy * 0.92, -0.07); asa.rotation.set(sy * 0.4, 0, -sx * sy * 0.09);
      cabeza.add(asa);
    }
    const corona = new THREE.Mesh(extruir(dentado(0.105, 24, 0.01), 0.12, 0.008), metal);
    corona.rotation.y = Math.PI / 2; corona.position.set(1.06, 0, -0.03); cabeza.add(corona);

    /* Esfera */
    const tinta = esfera.tinta, dia = new Date().getDate();
    const texEsfera = tela(1024, 1024, (g, W) => {
      const r = W / 2; g.translate(r, r);
      g.fillStyle = esfera.color; g.fillRect(-r, -r, W, W);
      for (let i = 0; i < 300; i++) { g.save(); g.rotate((i / 300) * TAU); g.fillStyle = `rgba(255,255,255,${0.01 + azar() * 0.035})`; g.fillRect(-1.5, 0, 3, r); g.restore(); }
      const sombra = g.createRadialGradient(-r * 0.25, -r * 0.3, r * 0.1, 0, 0, r);
      sombra.addColorStop(0, 'rgba(255,255,255,.1)'); sombra.addColorStop(0.6, 'rgba(255,255,255,0)'); sombra.addColorStop(1, 'rgba(0,0,0,.3)');
      g.fillStyle = sombra; g.fillRect(-r, -r, W, W);
      g.fillStyle = tinta;
      for (let i = 0; i < 60; i++) { if (i % 5 === 0) continue; g.save(); g.rotate((i / 60) * TAU); g.globalAlpha = 0.6; g.fillRect(-1.5, -r * 0.95, 3, r * 0.045); g.restore(); }
      g.textAlign = 'center'; g.textBaseline = 'middle';
      g.font = `600 ${r * 0.24}px "Cormorant Garamond", Georgia, serif`; g.fillText('12', 0, -r * 0.66);
      g.font = `700 ${r * 0.066}px Manrope, Arial, sans-serif`;
      [...'12HORAS'].forEach((l, i) => g.fillText(l, (i - 3) * r * 0.07, -r * 0.3));
      g.globalAlpha = 0.7; g.font = `600 ${r * 0.04}px Manrope, Arial, sans-serif`;
      [...'MURCIA'].forEach((l, i) => g.fillText(l, (i - 2.5) * r * 0.05, r * 0.42)); g.globalAlpha = 1;
      // ventana de fecha a las 3
      g.fillStyle = '#fbf8f2'; g.fillRect(r * 0.5, -r * 0.085, r * 0.2, r * 0.17);
      g.strokeStyle = 'rgba(0,0,0,.45)'; g.lineWidth = 4; g.strokeRect(r * 0.5, -r * 0.085, r * 0.2, r * 0.17);
      g.fillStyle = '#1d1b18'; g.font = `700 ${r * 0.115}px Manrope, Arial, sans-serif`; g.fillText(String(dia), r * 0.6, r * 0.008);
    });
    texEsfera.colorSpace = THREE.SRGBColorSpace;
    const dial = new THREE.Mesh(extruir(disco(0.848), 0.02, 0, 0.848), [new THREE.MeshStandardMaterial({ map: texEsfera, roughness: 0.42, metalness: 0.35 }), metalCepillado]);
    dial.position.z = 0.1; cabeza.add(dial);
    const indices = new THREE.Group();
    for (let i = 1; i < 12; i++) {
      if (i === 3) continue;
      const a = Math.PI / 2 - (i / 12) * TAU;
      const largo = i % 3 === 0 ? 0.2 : 0.15;
      const baston = new THREE.Mesh(extruir(rectRedondo(0.034, largo, 0.008), 0.022, 0.006), aplique);
      baston.position.set(Math.cos(a) * (0.76 - largo / 2), Math.sin(a) * (0.76 - largo / 2), 0); baston.rotation.z = a - Math.PI / 2;
      indices.add(baston);
    }
    fundir(indices); indices.position.z = 0.123; cabeza.add(indices);

    /* Agujas dauphine */
    const aguja = (largo, ancho, mat) => {
      const f = new THREE.Shape();
      f.moveTo(0, -largo * 0.2); f.lineTo(ancho / 2, 0); f.lineTo(0, largo); f.lineTo(-ancho / 2, 0); f.closePath();
      return new THREE.Mesh(extruir(f, 0.012, 0.004), mat);
    };
    this.horas = aguja(0.46, 0.085, aplique); this.horas.position.z = 0.142; cabeza.add(this.horas);
    this.minutos = aguja(0.7, 0.062, aplique); this.minutos.position.z = 0.156; cabeza.add(this.minutos);
    this.segundos = new THREE.Group();
    const varilla = new THREE.Mesh(extruir(rectRedondo(0.012, 0.98, 0.004), 0.006, 0), acento); varilla.position.y = 0.27; this.segundos.add(varilla);
    const contrapeso = new THREE.Mesh(extruir(disco(0.03), 0.006, 0), acento); contrapeso.position.y = -0.17; this.segundos.add(contrapeso);
    const eje = new THREE.Mesh(extruir(disco(0.042), 0.02, 0.004), acento); this.segundos.add(eje);
    this.segundos.position.z = 0.17; cabeza.add(this.segundos);

    /* Cristal abombado */
    const R = 2.9, alfa = Math.asin(0.845 / R);
    const cristal = new THREE.Mesh(new THREE.SphereGeometry(R, 48, 10, 0, TAU, 0, alfa),
      new THREE.MeshPhysicalMaterial({ color: 0xffffff, roughness: 0.02, metalness: 0, transparent: true, opacity: 0.1, envMapIntensity: 2.4, clearcoat: 1, clearcoatRoughness: 0, depthWrite: false }));
    cristal.rotation.x = Math.PI / 2; cristal.position.z = 0.2 - R * Math.cos(alfa); cabeza.add(cristal);

    /* Tapa con el grabado */
    this.texTapa = tela(1024, 1024, () => {}); this.texTapa.colorSpace = THREE.SRGBColorSpace;
    this.grabar(c.grabado || '');
    const tapa = new THREE.Mesh(extruir(disco(0.93), 0.04, 0.01, 0.93), [new THREE.MeshStandardMaterial({ map: this.texTapa, roughness: 0.3, metalness: 0.9 }), metalCepillado]);
    tapa.rotation.y = Math.PI; tapa.position.z = -0.21; cabeza.add(tapa);

    /* Correa */
    const anchoBase = 1.04 * escala, esMalla = correa.tipo === 'malla';
    for (const sentido of [1, -1]) {
      const larga = sentido < 0;
      const { mapa, relieve } = texturasCorrea(correa, larga);
      const { geometria, marcos } = tramoCorrea({
        largo: larga ? 3.5 : 2.5, ancho: anchoBase, anchoFin: anchoBase * 0.84,
        grosor: esMalla ? 0.07 : correa.tipo === 'caucho' ? 0.17 : 0.16, grosorFin: esMalla ? 0.06 : 0.085,
        sentido, punta: larga && !esMalla
      });
      const mat = esMalla
        ? new THREE.MeshStandardMaterial({ map: mapa, bumpMap: relieve, bumpScale: 2.2, roughness: 0.34, metalness: 1, side: THREE.DoubleSide })
        : new THREE.MeshPhysicalMaterial({ map: mapa, bumpMap: relieve, bumpScale: correa.tipo === 'cuero' ? 2.6 : 3.2, roughness: correa.tipo === 'cuero' ? 0.62 : 0.78, metalness: 0, clearcoat: correa.tipo === 'cuero' ? 0.25 : 0, clearcoatRoughness: 0.5, side: THREE.DoubleSide });
      this.reloj.add(new THREE.Mesh(geometria, mat));
      const en = (k) => marcos[Math.round(k * (marcos.length - 1))];
      const colocar = (obj, marco, alto = 0) => {
        obj.position.copy(marco.P).addScaledVector(marco.N, alto);
        obj.rotation.x = -sentido * marco.caida; this.reloj.add(obj);
      };
      if (!larga && !esMalla) { // hebilla y dos pasadores en el tramo corto
        const fin = en(1);
        const hebilla = new THREE.Group();
        const marcoH = rectRedondo(fin.w + 0.2, 0.42, 0.08); marcoH.holes.push(rectRedondo(fin.w + 0.04, 0.24, 0.04));
        hebilla.add(new THREE.Mesh(extruir(marcoH, 0.07, 0.02), metal));
        const hebijon = new THREE.Mesh(extruir(rectRedondo(0.06, 0.4, 0.025), 0.04, 0.012), metal); hebijon.position.set(0, -0.02, 0.05); hebilla.add(hebijon);
        colocar(hebilla, fin, fin.t * 0.5); hebilla.translateY(sentido * 0.16);
        for (const k of [0.72, 0.86]) {
          const mk = en(k);
          const pasador = new THREE.Mesh(new THREE.TorusGeometry(mk.w / 2 + 0.035, 0.03, 6, 20), mat);
          colocar(pasador, mk, mk.t * 0.35); pasador.scale.set(1, 0.34, 1); pasador.rotateX(Math.PI / 2);
        }
      }
      if (esMalla && !larga) { // cierre deslizante de la malla
        const mk = en(0.82);
        const cierre = new THREE.Mesh(extruir(rectRedondo(mk.w + 0.08, 0.55, 0.05), 0.09, 0.02), metal);
        colocar(cierre, mk, mk.t * 0.6);
      }
    }
    this.ajustar();
  }

  grabar(texto) {
    const c = this.texTapa.image, g = c.getContext('2d'), r = c.width / 2;
    g.setTransform(1, 0, 0, 1, r, r);
    g.fillStyle = '#c2c5c9'; g.fillRect(-r, -r, c.width, c.height);
    for (let i = 0; i < 700; i++) { g.strokeStyle = `rgba(${azar() > 0.5 ? 255 : 70},${azar() > 0.5 ? 255 : 70},${azar() > 0.5 ? 255 : 80},0.045)`; g.beginPath(); g.arc(0, 0, azar() * r, 0, TAU); g.stroke(); }
    const rotulo = 'ACERO INOXIDABLE 316L  ·  CRISTAL DE ZAFIRO  ·  5 ATM  ·  HECHO EN MURCIA  ·  ';
    g.fillStyle = '#4d5157'; g.font = `700 ${r * 0.06}px Manrope, Arial, sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle';
    [...rotulo].forEach((l, i) => { g.save(); g.rotate((i / rotulo.length) * TAU); g.fillText(l, 0, -r * 0.8); g.restore(); });
    g.strokeStyle = '#6a6e74'; g.lineWidth = 2.5; g.beginPath(); g.arc(0, 0, r * 0.68, 0, TAU); g.stroke();
    g.lineWidth = 1.5; g.beginPath(); g.arc(0, 0, r * 0.64, 0, TAU); g.stroke();
    const t = (texto || '').trim();
    const tam = t.length > 14 ? 0.165 : t.length > 9 ? 0.21 : 0.26;
    g.font = `italic 600 ${r * (t ? tam : 0.13)}px "Cormorant Garamond", Georgia, serif`;
    if (t) { g.fillStyle = 'rgba(255,255,255,.6)'; g.fillText(t, 0, 3); g.fillStyle = '#3f4247'; g.fillText(t, 0, 0); }
    else { g.fillStyle = 'rgba(77,81,87,.55)'; g.fillText('Tu grabado aquí', 0, 0); }
    this.texTapa.needsUpdate = true;
  }

  verCara(cara) { this.giroMeta = cara === 'dorso' ? Math.PI : 0; }

  ajustar() {
    const w = this.lienzo.clientWidth || 1, h = this.lienzo.clientHeight || 1;
    this.renderer.setSize(w, h, false);
    this.camara.aspect = w / h;
    const tan = Math.tan(14 * Math.PI / 180);
    this.camara.position.set(0, 0, Math.max(5.1 / (2 * tan), 2.75 / (2 * tan * this.camara.aspect)));
    this.camara.lookAt(0, 0.05, 0);
    this.camara.updateProjectionMatrix();
  }

  bucle(t) {
    this.frame = requestAnimationFrame(this.bucle);
    if (!this.visible || !this.horas) return;
    const dt = Math.min(0.1, (t - (this.antes || t)) / 1000); this.antes = t;
    this.giro += (this.giroMeta - this.giro) * (this.reducir ? 1 : 1 - Math.exp(-dt * 5));
    const vaiven = this.reducir ? 0 : Math.sin(t / 2600) * 0.1;
    this.pivote.rotation.y = this.giro + this.arrastre + vaiven + this.raton.x * 0.18;
    this.pivote.rotation.x = 0.1 + this.raton.y * 0.1;
    const d = new Date();
    const s = d.getSeconds() + d.getMilliseconds() / 1000, m = d.getMinutes() + s / 60, h = (d.getHours() % 12) + m / 60;
    this.segundos.rotation.z = -(s / 60) * TAU; this.minutos.rotation.z = -(m / 60) * TAU; this.horas.rotation.z = -(h / 12) * TAU;
    this.renderer.render(this.escena, this.camara);
  }

  destruir() {
    cancelAnimationFrame(this.frame);
    this.ro.disconnect(); this.io.disconnect();
    this.limpiar();
    this.renderer.dispose();
  }
}
