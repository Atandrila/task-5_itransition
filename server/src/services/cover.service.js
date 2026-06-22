import { createRng, randomInt, pick } from "../utils/rng.js";

function escapeXml(text) {
  return String(text)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function randomColor(rng, alpha = 1) {
  const h = randomInt(rng, 0, 360);
  const s = randomInt(rng, 45, 85);
  const l = randomInt(rng, 30, 70);

  return `hsla(${h}, ${s}%, ${l}%, ${alpha})`;
}

function shortText(text, max = 28) {
  const value = String(text || "");
  if (value.length <= max) return value;
  return value.slice(0, max - 1) + "…";
}

function splitTitle(title) {
  const words = String(title || "").split(" ");
  const lines = [];
  let current = "";

  for (const word of words) {
    const next = current ? `${current} ${word}` : word;

    if (next.length > 18 && current) {
      lines.push(current);
      current = word;
    } else {
      current = next;
    }
  }

  if (current) lines.push(current);

  return lines.slice(0, 3);
}

export function generateCoverSvg({ seed, locale, index, title, artist, album, genre }) {
  const rng = createRng("cover", seed, locale, index, title, artist, album, genre);

  const width = 700;
  const height = 700;

  const bg1 = randomColor(rng, 1);
  const bg2 = randomColor(rng, 1);
  const bg3 = randomColor(rng, 0.85);
  const textColor = "rgba(255,255,255,0.96)";
  const darkText = "rgba(15,15,25,0.92)";

  const style = pick(rng, ["poster", "vinyl", "photo", "abstract"]);

  let art = "";

  if (style === "poster") {
    for (let i = 0; i < 18; i++) {
      art += `
        <circle 
          cx="${randomInt(rng, -80, width + 80)}" 
          cy="${randomInt(rng, -80, height + 80)}" 
          r="${randomInt(rng, 15, 110)}" 
          fill="${randomColor(rng, 0.28)}" 
        />`;
    }

    for (let i = 0; i < 10; i++) {
      art += `
        <rect 
          x="${randomInt(rng, -100, width)}" 
          y="${randomInt(rng, -100, height)}" 
          width="${randomInt(rng, 80, 260)}" 
          height="${randomInt(rng, 20, 110)}" 
          rx="${randomInt(rng, 8, 40)}" 
          transform="rotate(${randomInt(rng, -35, 35)} ${width / 2} ${height / 2})"
          fill="${randomColor(rng, 0.25)}" 
        />`;
    }
  }

  if (style === "vinyl") {
    art += `
      <circle cx="350" cy="335" r="245" fill="rgba(0,0,0,0.45)" />
      <circle cx="350" cy="335" r="205" fill="none" stroke="rgba(255,255,255,0.16)" stroke-width="6" />
      <circle cx="350" cy="335" r="155" fill="none" stroke="rgba(255,255,255,0.13)" stroke-width="4" />
      <circle cx="350" cy="335" r="95" fill="${randomColor(rng, 0.8)}" />
      <circle cx="350" cy="335" r="24" fill="rgba(255,255,255,0.85)" />
    `;

    for (let i = 0; i < 14; i++) {
      art += `
        <path 
          d="M ${randomInt(rng, 0, 700)} ${randomInt(rng, 0, 700)}
             C ${randomInt(rng, 0, 700)} ${randomInt(rng, 0, 700)},
               ${randomInt(rng, 0, 700)} ${randomInt(rng, 0, 700)},
               ${randomInt(rng, 0, 700)} ${randomInt(rng, 0, 700)}"
          fill="none"
          stroke="${randomColor(rng, 0.25)}"
          stroke-width="${randomInt(rng, 3, 12)}"
        />`;
    }
  }

  if (style === "photo") {
    for (let i = 0; i < 9; i++) {
      art += `
        <rect
          x="${randomInt(rng, 20, 520)}"
          y="${randomInt(rng, 20, 470)}"
          width="${randomInt(rng, 110, 260)}"
          height="${randomInt(rng, 100, 230)}"
          rx="22"
          transform="rotate(${randomInt(rng, -18, 18)} 350 350)"
          fill="${randomColor(rng, 0.52)}"
          stroke="rgba(255,255,255,0.35)"
          stroke-width="4"
        />`;
    }

    for (let i = 0; i < 35; i++) {
      art += `
        <circle
          cx="${randomInt(rng, 0, 700)}"
          cy="${randomInt(rng, 0, 700)}"
          r="${randomInt(rng, 2, 8)}"
          fill="rgba(255,255,255,0.25)"
        />`;
    }
  }

  if (style === "abstract") {
    for (let i = 0; i < 16; i++) {
      art += `
        <path
          d="M ${randomInt(rng, -100, 700)} ${randomInt(rng, -100, 700)}
             Q ${randomInt(rng, 0, 700)} ${randomInt(rng, 0, 700)}
               ${randomInt(rng, 0, 800)} ${randomInt(rng, 0, 800)}
             T ${randomInt(rng, 0, 800)} ${randomInt(rng, 0, 800)}"
          fill="none"
          stroke="${randomColor(rng, 0.35)}"
          stroke-width="${randomInt(rng, 8, 35)}"
          stroke-linecap="round"
        />`;
    }

    for (let i = 0; i < 7; i++) {
      art += `
        <polygon
          points="${randomInt(rng, 0, 700)},${randomInt(rng, 0, 700)}
                  ${randomInt(rng, 0, 700)},${randomInt(rng, 0, 700)}
                  ${randomInt(rng, 0, 700)},${randomInt(rng, 0, 700)}"
          fill="${randomColor(rng, 0.25)}"
        />`;
    }
  }

  const titleLines = splitTitle(title);
  const titleSvg = titleLines
    .map((line, i) => {
      return `<tspan x="52" dy="${i === 0 ? 0 : 58}">${escapeXml(line)}</tspan>`;
    })
    .join("");

  return `
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${bg1}" />
      <stop offset="55%" stop-color="${bg2}" />
      <stop offset="100%" stop-color="${bg3}" />
    </linearGradient>

    <filter id="shadow">
      <feDropShadow dx="0" dy="12" stdDeviation="16" flood-color="rgba(0,0,0,0.35)" />
    </filter>

    <filter id="grain">
      <feTurbulence type="fractalNoise" baseFrequency="0.75" numOctaves="2" stitchTiles="stitch"/>
      <feColorMatrix type="saturate" values="0"/>
      <feComponentTransfer>
        <feFuncA type="table" tableValues="0 0.14"/>
      </feComponentTransfer>
      <feBlend mode="multiply"/>
    </filter>
  </defs>

  <rect width="700" height="700" fill="url(#bg)" />
  <rect width="700" height="700" filter="url(#grain)" opacity="0.38" />

  ${art}

  <rect x="34" y="430" width="632" height="218" rx="34" fill="rgba(0,0,0,0.38)" filter="url(#shadow)" />
  <rect x="52" y="448" width="596" height="182" rx="25" fill="rgba(255,255,255,0.10)" />

  <text x="52" y="510"
        font-family="Arial, Helvetica, sans-serif"
        font-size="48"
        font-weight="900"
        fill="${textColor}"
        letter-spacing="-1">
    ${titleSvg}
  </text>

  <text x="56" y="604"
        font-family="Arial, Helvetica, sans-serif"
        font-size="25"
        font-weight="700"
        fill="${textColor}">
    ${escapeXml(shortText(artist, 34))}
  </text>

  <text x="56" y="637"
        font-family="Arial, Helvetica, sans-serif"
        font-size="18"
        font-weight="600"
        fill="rgba(255,255,255,0.72)">
    ${escapeXml(shortText(album === "Single" ? genre : album, 42))}
  </text>

  <rect x="515" y="65" width="120" height="44" rx="22" fill="rgba(255,255,255,0.75)" />
  <text x="575" y="94"
        text-anchor="middle"
        font-family="Arial, Helvetica, sans-serif"
        font-size="18"
        font-weight="800"
        fill="${darkText}">
    ${escapeXml(shortText(genre, 12))}
  </text>
</svg>
`.trim();
}