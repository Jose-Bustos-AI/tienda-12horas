// Dibuja el reloj 12horas Uno en SVG a partir de su configuración y mueve sus agujas con la hora real.
import { CONFIG } from './datos.js';

const CX = 150;
const CY = 230;
let contador = 0;
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const busca = (grupo, id) => CONFIG[grupo].find((x) => x.id === id) || CONFIG[grupo][0];

function medidas(c) {
  const R = c.tamano === '41' ? 100 : 92;
  return { R, ancho: c.tamano === '41' ? 78 : 72 };
}

function defs(u, caja, esfera, correa) {
  return `<defs>
    <linearGradient id="metal${u}" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${caja.claro}"/><stop offset=".45" stop-color="${caja.oscuro}"/><stop offset=".7" stop-color="${caja.claro}"/><stop offset="1" stop-color="${caja.oscuro}"/>
    </linearGradient>
    <radialGradient id="esfera${u}" cx=".4" cy=".35" r=".8">
      <stop offset="0" stop-color="#fff" stop-opacity=".12"/><stop offset=".6" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".28"/>
    </radialGradient>
    <linearGradient id="correa${u}" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#000" stop-opacity=".35"/><stop offset=".18" stop-color="#000" stop-opacity="0"/><stop offset=".82" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".35"/>
    </linearGradient>
    <pattern id="malla${u}" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
      <rect width="6" height="6" fill="${correa.color}"/><path d="M0 0h6M0 3h6" stroke="#6f7378" stroke-width="1"/>
    </pattern>
    <pattern id="caucho${u}" width="10" height="12" patternUnits="userSpaceOnUse">
      <rect width="10" height="12" fill="${correa.color}"/><rect y="9" width="10" height="2" fill="#0e0e0f"/>
    </pattern>
    <path id="arco${u}" d="M ${CX} ${CY} m -64 0 a 64 64 0 1 1 128 0 a 64 64 0 1 1 -128 0"/>
  </defs>`;
}

function correaSVG(u, c, R, ancho, correa, caja) {
  const relleno = correa.tipo === 'malla' ? `url(#malla${u})` : correa.tipo === 'caucho' ? `url(#caucho${u})` : correa.color;
  const x = CX - ancho / 2;
  const arriba = CY - R + 14;
  const abajo = CY + R - 14;
  const pesp = correa.tipo === 'cuero';
  const puntadas = (y1, y2) => pesp ? `<path d="M${x + 7} ${y1}V${y2}M${x + ancho - 7} ${y1}V${y2}" stroke="#f3e2c8" stroke-opacity=".55" stroke-width="1.4" stroke-dasharray="5 4"/>` : '';
  return `<g>
    <rect x="${x}" y="-10" width="${ancho}" height="${arriba + 10}" rx="10" fill="${relleno}"/>
    <rect x="${x}" y="-10" width="${ancho}" height="${arriba + 10}" rx="10" fill="url(#correa${u})"/>
    ${puntadas(0, arriba - 6)}
    <rect x="${x}" y="${abajo}" width="${ancho}" height="${470 - abajo}" rx="10" fill="${relleno}"/>
    <rect x="${x}" y="${abajo}" width="${ancho}" height="${470 - abajo}" rx="10" fill="url(#correa${u})"/>
    ${puntadas(abajo + 6, 460)}
    ${correa.tipo === 'malla' ? '' : `<rect x="${x - 4}" y="${abajo + 70}" width="${ancho + 8}" height="12" rx="4" fill="url(#metal${u})"/>`}
    ${correa.tipo === 'cuero' ? [0, 1, 2].map((i) => `<circle cx="${CX}" cy="${abajo + 108 + i * 22}" r="3.2" fill="#000" fill-opacity=".45"/>`).join('') : ''}
    <rect x="${x + 4}" y="${CY - R - 8}" width="16" height="30" rx="5" fill="url(#metal${u})"/>
    <rect x="${x + ancho - 20}" y="${CY - R - 8}" width="16" height="30" rx="5" fill="url(#metal${u})"/>
    <rect x="${x + 4}" y="${CY + R - 22}" width="16" height="30" rx="5" fill="url(#metal${u})"/>
    <rect x="${x + ancho - 20}" y="${CY + R - 22}" width="16" height="30" rx="5" fill="url(#metal${u})"/>
  </g>`;
}

function marcas(R, tinta) {
  let s = '';
  for (let i = 0; i < 60; i++) {
    const hora = i % 5 === 0;
    const a = (i * 6 * Math.PI) / 180;
    const r1 = R - 16;
    const r2 = hora ? R - (i % 15 === 0 ? 34 : 30) : R - 21;
    if (i === 0) continue;
    const x1 = CX + Math.sin(a) * r1, y1 = CY - Math.cos(a) * r1;
    const x2 = CX + Math.sin(a) * r2, y2 = CY - Math.cos(a) * r2;
    s += `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="${tinta}" stroke-width="${hora ? 3.4 : 1}" stroke-linecap="round" opacity="${hora ? 1 : 0.55}"/>`;
  }
  return s;
}

/** SVG del frente: esfera, índices, fecha y agujas (se mueven con animar()). */
export function relojFrente(c, { vivo = true } = {}) {
  const u = `r${++contador}`;
  const caja = busca('caja', c.caja), esfera = busca('esfera', c.esfera), correa = busca('correa', c.correa);
  const { R, ancho } = medidas(c);
  const acento = c.caja === 'oro' ? '#c9a45c' : '#d1462f';
  const metalMano = esfera.tinta;
  const dia = new Date().getDate();
  return `<svg class="reloj-svg" viewBox="0 0 300 460" role="img" aria-label="Reloj 12horas Uno" ${vivo ? 'data-reloj-vivo' : ''}>
    ${defs(u, caja, esfera, correa)}
    ${correaSVG(u, c, R, ancho, correa, caja)}
    <rect x="${CX + R - 6}" y="${CY - 11}" width="16" height="22" rx="4" fill="url(#metal${u})"/>
    <circle cx="${CX}" cy="${CY}" r="${R}" fill="url(#metal${u})"/>
    <circle cx="${CX}" cy="${CY}" r="${R - 7}" fill="${caja.oscuro}" opacity=".55"/>
    <circle cx="${CX}" cy="${CY}" r="${R - 10}" fill="${esfera.color}"/>
    <circle cx="${CX}" cy="${CY}" r="${R - 10}" fill="url(#esfera${u})"/>
    ${marcas(R, esfera.tinta)}
    <text x="${CX}" y="${CY - R + 46}" text-anchor="middle" font-family="Cormorant Garamond, Georgia, serif" font-size="26" font-weight="600" fill="${esfera.tinta}">12</text>
    <text x="${CX}" y="${CY - 22}" text-anchor="middle" font-family="Manrope, sans-serif" font-size="10.5" letter-spacing="2.2" font-weight="700" fill="${esfera.tinta}">12HORAS</text>
    <text x="${CX}" y="${CY + 40}" text-anchor="middle" font-family="Manrope, sans-serif" font-size="6.5" letter-spacing="1.6" fill="${esfera.tinta}" opacity=".7">MURCIA</text>
    <rect x="${CX + R - 46}" y="${CY - 9}" width="20" height="18" rx="2" fill="#fbf8f2" stroke="${caja.oscuro}" stroke-width="1"/>
    <text x="${CX + R - 36}" y="${CY + 4.5}" text-anchor="middle" font-family="Manrope, sans-serif" font-size="11" font-weight="700" fill="#1d1b18">${dia}</text>
    <g class="aguja-h"><path d="M${CX - 3.6} ${CY + 14} L${CX - 2.4} ${CY - R * 0.48} L${CX} ${CY - R * 0.54} L${CX + 2.4} ${CY - R * 0.48} L${CX + 3.6} ${CY + 14}Z" fill="${metalMano}"/></g>
    <g class="aguja-m"><path d="M${CX - 2.6} ${CY + 18} L${CX - 1.6} ${CY - R * 0.74} L${CX} ${CY - R * 0.8} L${CX + 1.6} ${CY - R * 0.74} L${CX + 2.6} ${CY + 18}Z" fill="${metalMano}"/></g>
    <g class="aguja-s"><line x1="${CX}" y1="${CY + 24}" x2="${CX}" y2="${CY - R + 18}" stroke="${acento}" stroke-width="1.4" stroke-linecap="round"/><circle cx="${CX}" cy="${CY + 20}" r="3" fill="${acento}"/></g>
    <circle cx="${CX}" cy="${CY}" r="4.2" fill="${acento}"/><circle cx="${CX}" cy="${CY}" r="1.6" fill="${esfera.color}"/>
    <ellipse cx="${CX - R * 0.28}" cy="${CY - R * 0.42}" rx="${R * 0.62}" ry="${R * 0.3}" fill="#fff" opacity=".07" transform="rotate(-28 ${CX} ${CY})"/>
  </svg>`;
}

/** SVG del dorso: tapa trasera de acero con texto en círculo y el grabado del cliente. */
export function relojDorso(c) {
  const u = `r${++contador}`;
  const caja = busca('caja', c.caja), esfera = busca('esfera', c.esfera), correa = busca('correa', c.correa);
  const { R, ancho } = medidas(c);
  const texto = (c.grabado || '').trim();
  const tam = texto.length > 14 ? 15 : texto.length > 9 ? 19 : 24;
  return `<svg class="reloj-svg" viewBox="0 0 300 460" role="img" aria-label="Tapa trasera del reloj${texto ? ` con el grabado ${esc(texto)}` : ''}">
    ${defs(u, caja, esfera, correa)}
    ${correaSVG(u, c, R, ancho, correa, caja)}
    <rect x="${CX - R - 10}" y="${CY - 11}" width="16" height="22" rx="4" fill="url(#metal${u})"/>
    <circle cx="${CX}" cy="${CY}" r="${R}" fill="url(#metal${u})"/>
    <circle cx="${CX}" cy="${CY}" r="${R - 9}" fill="#c9cbcd"/>
    <circle cx="${CX}" cy="${CY}" r="${R - 9}" fill="url(#metal${u})" opacity=".55"/>
    <circle cx="${CX}" cy="${CY}" r="${R - 24}" fill="none" stroke="#7d8084" stroke-width="1"/>
    <circle cx="${CX}" cy="${CY}" r="${R - 30}" fill="none" stroke="#7d8084" stroke-width=".6"/>
    <text font-family="Manrope, sans-serif" font-size="7.2" letter-spacing="1.5" fill="#55585c" font-weight="700">
      <textPath href="#arco${u}" startOffset="0">ACERO INOXIDABLE 316L · CRISTAL DE ZAFIRO · 5 ATM · HECHO EN MURCIA · </textPath>
    </text>
    ${texto
      ? `<text x="${CX}" y="${CY + tam * 0.35 + 1}" text-anchor="middle" font-family="Cormorant Garamond, Georgia, serif" font-style="italic" font-weight="600" font-size="${tam}" fill="#ffffff" opacity=".55">${esc(texto)}</text>
         <text x="${CX}" y="${CY + tam * 0.35}" text-anchor="middle" font-family="Cormorant Garamond, Georgia, serif" font-style="italic" font-weight="600" font-size="${tam}" fill="#4a4c50">${esc(texto)}</text>`
      : `<text x="${CX}" y="${CY + 5}" text-anchor="middle" font-family="Cormorant Garamond, Georgia, serif" font-style="italic" font-size="17" fill="#55585c" opacity=".55">Tu grabado aquí</text>`}
  </svg>`;
}

/* ---------- Agujas en hora real (todas las esferas visibles a la vez) ---------- */
let enMarcha = false;
export function animarRelojes() {
  if (enMarcha) return;
  enMarcha = true;
  const reducir = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const paso = () => {
    const d = new Date();
    const ms = d.getMilliseconds();
    const s = d.getSeconds() + (reducir ? 0 : ms / 1000);
    const m = d.getMinutes() + s / 60;
    const h = (d.getHours() % 12) + m / 60;
    document.querySelectorAll('[data-reloj-vivo]').forEach((svg) => {
      svg.querySelector('.aguja-h')?.setAttribute('transform', `rotate(${(h * 30).toFixed(3)} ${CX} ${CY})`);
      svg.querySelector('.aguja-m')?.setAttribute('transform', `rotate(${(m * 6).toFixed(3)} ${CX} ${CY})`);
      svg.querySelector('.aguja-s')?.setAttribute('transform', `rotate(${(s * 6).toFixed(3)} ${CX} ${CY})`);
    });
    if (reducir) setTimeout(paso, 1000); else requestAnimationFrame(paso);
  };
  paso();
}
