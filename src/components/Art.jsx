/* ==========================================================
   Product illustrations (used until real photos are added).
   Square 400x400 artwork per product type, coloured per variant.
   Ported from legacy-site/assets/js/art.js.
   ========================================================== */
let n = 0;
const HEX = /^#[0-9a-f]{6}$/i;
const safe = (hex, fallback = "#333333") => (HEX.test(hex || "") ? hex : fallback);

export const shade = (hex, a) => {
  const v = parseInt(safe(hex).slice(1), 16);
  const c = (x) => Math.max(0, Math.min(255, x + a));
  return "#" + ((1 << 24) + (c(v >> 16) << 16) + (c((v >> 8) & 255) << 8) + c(v & 255)).toString(16).slice(1);
};
const BG = { shoes: "#F1EEE9", sunglass: "#EAF1F6", perfumes: "#F6EEF3", clothing: "#EEF2EC", watches: "#EFEFF4", essentials: "#F5F0E8" };

const D = {
  sneaker: (c, d) => `<path d="M60 250 C60 205 92 186 132 182 L196 178 C222 176 240 158 262 156 C300 152 344 196 344 236 L344 262 C344 274 336 280 324 280 L72 280 C64 280 60 272 60 262 Z" fill="${c}"/>
    <path d="M60 262 H344 V282 C344 292 336 298 326 298 H74 C66 298 60 292 60 284 Z" fill="#fff" stroke="${d}" stroke-width="2"/>
    <path d="M150 182 L178 236 M180 180 L206 230 M206 178 L230 222" stroke="#fff" stroke-width="6" stroke-linecap="round"/>
    <path d="M250 206 C276 214 300 232 316 250" stroke="${d}" stroke-width="5" fill="none" stroke-linecap="round"/><path d="M88 238 C120 228 150 236 170 252" stroke="#fff" stroke-width="5" fill="none" opacity=".6"/>`,
  sandal: (c, d) => `<path d="M70 268 C66 250 80 238 110 236 L310 226 C340 224 352 244 340 262 L330 276 C326 282 318 286 308 286 H92 C80 286 72 280 70 268Z" fill="${d}"/>
    <path d="M74 262 L336 248" stroke="${shade(d, 40)}" stroke-width="6"/>
    <path d="M150 236 C150 190 190 168 230 170 C262 172 280 196 282 228" stroke="${c}" stroke-width="20" fill="none" stroke-linecap="round"/>
    <path d="M118 236 C110 200 120 170 150 160" stroke="${c}" stroke-width="16" fill="none" stroke-linecap="round"/><rect x="138" y="150" width="22" height="18" rx="3" fill="#C9A44C"/>`,
  boot: (c, d) => `<path d="M120 90 H220 V214 C252 216 300 222 330 240 C350 252 350 272 338 280 H112 C104 280 100 274 100 266 V110 C100 98 108 90 120 90Z" fill="${c}"/>
    <rect x="100" y="270" width="248" height="22" rx="8" fill="${d}"/><path d="M196 96 V200" stroke="${shade(c, -30)}" stroke-width="5"/>
    <rect x="196" y="110" width="22" height="60" rx="6" fill="${shade(c, -45)}"/><path d="M122 120 C140 150 140 200 126 250" stroke="#fff" stroke-width="5" opacity=".3" fill="none"/>`,
  loafer: (c, d) => `<path d="M64 252 C64 214 96 200 140 198 L250 196 C300 194 344 220 344 252 V266 C344 274 338 278 330 278 H76 C68 278 64 274 64 266Z" fill="${c}"/>
    <rect x="62" y="264" width="284" height="18" rx="7" fill="${d}"/><path d="M150 200 C190 214 240 214 280 200" stroke="${shade(c, -40)}" stroke-width="6" fill="none"/>
    <rect x="196" y="212" width="40" height="12" rx="4" fill="#C9A44C"/><path d="M90 236 C120 226 150 230 170 244" stroke="#fff" stroke-width="5" opacity=".35" fill="none"/>`,
  slide: (c, d) => `<ellipse cx="200" cy="268" rx="150" ry="26" fill="${d}"/><ellipse cx="200" cy="258" rx="146" ry="22" fill="${shade(d, 30)}"/>
    <path d="M140 258 C140 196 260 196 260 258" fill="${c}"/><path d="M160 216 H240" stroke="#fff" stroke-width="8" stroke-linecap="round"/>`,
  aviator: (c, d) => `<path d="M80 170 C80 150 104 144 140 146 C176 148 186 160 182 186 C176 230 150 246 120 244 C92 242 80 214 80 170Z" fill="${c}" opacity=".9"/>
    <path d="M320 170 C320 150 296 144 260 146 C224 148 214 160 218 186 C224 230 250 246 280 244 C308 242 320 214 320 170Z" fill="${c}" opacity=".9"/>
    <path d="M80 160 C80 140 120 136 150 140 L250 140 C280 136 320 140 320 160" stroke="${d}" stroke-width="6" fill="none"/><path d="M182 160 Q200 148 218 160" stroke="${d}" stroke-width="6" fill="none"/>
    <path d="M100 168 C110 160 130 160 140 166" stroke="#fff" stroke-width="5" opacity=".5" fill="none"/><path d="M240 168 C250 160 270 160 280 166" stroke="#fff" stroke-width="5" opacity=".5" fill="none"/>`,
  wayfarer: (c, d) => `<path d="M70 150 H186 L178 220 C176 236 164 244 148 244 H104 C88 244 78 234 76 220Z" fill="${d}"/><path d="M84 162 H174 L168 214 C166 226 158 232 146 232 H106 C94 232 88 226 86 216Z" fill="${c}"/>
    <path d="M330 150 H214 L222 220 C224 236 236 244 252 244 H296 C312 244 322 234 324 220Z" fill="${d}"/><path d="M316 162 H226 L232 214 C234 226 242 232 254 232 H294 C306 232 312 226 314 216Z" fill="${c}"/>
    <path d="M186 164 Q200 154 214 164" stroke="${d}" stroke-width="10" fill="none"/>`,
  round: (c, d) => `<circle cx="140" cy="196" r="54" fill="${c}" stroke="${d}" stroke-width="8"/><circle cx="260" cy="196" r="54" fill="${c}" stroke="${d}" stroke-width="8"/>
    <path d="M190 186 Q200 176 210 186" stroke="${d}" stroke-width="7" fill="none"/><path d="M112 178 C120 166 136 162 148 166" stroke="#fff" stroke-width="5" opacity=".5" fill="none"/><path d="M232 178 C240 166 256 162 268 166" stroke="#fff" stroke-width="5" opacity=".5" fill="none"/>`,
  sport: (c, d) => `<path d="M60 170 C120 140 280 140 340 170 C330 220 290 240 240 236 C214 234 206 214 200 204 C194 214 186 234 160 236 C110 240 70 220 60 170Z" fill="${c}"/>
    <path d="M60 170 C120 140 280 140 340 170" stroke="${d}" stroke-width="10" fill="none"/><path d="M90 180 C140 168 180 172 196 190" stroke="#fff" stroke-width="5" opacity=".45" fill="none"/>`,
  bottle: (c, d) => `<rect x="172" y="70" width="56" height="44" rx="6" fill="#2A2A2A"/><rect x="186" y="110" width="28" height="20" fill="#C9A44C"/>
    <rect x="122" y="128" width="156" height="190" rx="26" fill="${c}" opacity=".9"/><rect x="122" y="128" width="156" height="190" rx="26" fill="none" stroke="${d}" stroke-width="4"/>
    <rect x="150" y="200" width="100" height="54" rx="6" fill="#fff" opacity=".85"/><path d="M162 220 H238 M172 236 H228" stroke="${d}" stroke-width="4"/><path d="M140 150 V290" stroke="#fff" stroke-width="10" opacity=".35" stroke-linecap="round"/>`,
  flacon: (c, d) => `<path d="M200 70 L230 110 H170 Z" fill="#C9A44C"/><rect x="186" y="106" width="28" height="24" fill="#C9A44C"/>
    <path d="M200 128 L300 228 L200 328 L100 228 Z" fill="${c}" opacity=".9" stroke="${d}" stroke-width="4"/><path d="M200 168 L260 228 L200 288 L140 228Z" fill="#fff" opacity=".25"/>`,
  mist: (c, d) => `<rect x="170" y="62" width="60" height="60" rx="10" fill="${d}"/><rect x="146" y="118" width="108" height="210" rx="20" fill="${c}"/>
    <rect x="146" y="200" width="108" height="56" fill="#fff" opacity=".8"/><path d="M160 214 H240 M176 232 H224" stroke="${d}" stroke-width="4"/><path d="M164 140 V310" stroke="#fff" stroke-width="8" opacity=".35"/>`,
  tshirt: (c, d) => `<path d="M140 90 C160 110 240 110 260 90 L330 124 L306 184 L276 170 V320 H124 V170 L94 184 L70 124 Z" fill="${c}"/>
    <path d="M160 92 C180 118 220 118 240 92" stroke="${d}" stroke-width="8" fill="none"/><path d="M276 170 L306 184 L330 124" stroke="${d}" stroke-width="3" fill="none" opacity=".4"/>`,
  shirt: (c, d) => `<path d="M150 84 L200 104 L250 84 L330 120 L310 190 L278 178 V322 H122 V178 L90 190 L70 120 Z" fill="${c}"/>
    <path d="M150 84 L178 132 L200 104 L222 132 L250 84" fill="#fff" stroke="${d}" stroke-width="3"/><path d="M200 108 V320" stroke="${d}" stroke-width="3"/>
    ${[150, 186, 222, 258, 294].map((y) => `<circle cx="200" cy="${y}" r="5" fill="#fff" stroke="${d}" stroke-width="2"/>`).join("")}<rect x="226" y="160" width="34" height="30" rx="3" fill="none" stroke="${d}" stroke-width="3"/>`,
  hoodie: (c, d) => `<path d="M150 104 C150 60 250 60 250 104 L330 140 L310 220 L282 206 V320 H118 V206 L90 220 L70 140 Z" fill="${c}"/>
    <path d="M160 104 C170 140 230 140 240 104" fill="${d}"/><path d="M186 140 V190 M214 140 V190" stroke="#fff" stroke-width="4" stroke-linecap="round"/><rect x="150" y="240" width="100" height="50" rx="10" fill="${d}" opacity=".5"/>`,
  jeans: (c, d) => `<path d="M120 70 H280 L300 330 H218 L200 160 L182 330 H100 Z" fill="${c}"/><rect x="120" y="70" width="160" height="22" fill="${d}"/>
    <path d="M200 92 V150" stroke="${d}" stroke-width="3"/><path d="M134 104 C150 128 176 128 186 106 M266 104 C250 128 224 128 214 106" stroke="#E2B04A" stroke-width="3" fill="none"/>`,
  analog: (c, d) => `<rect x="168" y="40" width="64" height="100" rx="12" fill="${d}"/><rect x="168" y="260" width="64" height="100" rx="12" fill="${d}"/>
    <circle cx="200" cy="200" r="92" fill="${c}"/><circle cx="200" cy="200" r="76" fill="#FAFAF7"/>${[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((a) => `<rect x="197" y="130" width="6" height="${a % 90 ? 10 : 18}" fill="${d}" transform="rotate(${a} 200 200)"/>`).join("")}
    <path d="M200 200 L200 148" stroke="${d}" stroke-width="7" stroke-linecap="round"/><path d="M200 200 L238 214" stroke="${d}" stroke-width="5" stroke-linecap="round"/><circle cx="200" cy="200" r="8" fill="${c}"/><rect x="290" y="190" width="14" height="20" rx="3" fill="${c}"/>`,
  smart: (c, d) => `<rect x="160" y="40" width="80" height="100" rx="18" fill="${c}"/><rect x="160" y="260" width="80" height="100" rx="18" fill="${c}"/>
    <rect x="120" y="110" width="160" height="180" rx="40" fill="#1B1B1F"/><rect x="134" y="124" width="132" height="152" rx="30" fill="#0E0E12"/>
    <text x="200" y="196" text-anchor="middle" fill="#fff" font-family="sans-serif" font-size="40" font-weight="700">10:09</text><circle cx="200" cy="240" r="16" fill="none" stroke="${c}" stroke-width="5"/><rect x="280" y="170" width="10" height="34" rx="4" fill="${d}"/>`,
  wallet: (c, d) => `<rect x="80" y="120" width="240" height="170" rx="18" fill="${c}"/><rect x="80" y="120" width="240" height="60" rx="18" fill="${shade(c, 20)}"/>
    <rect x="230" y="180" width="100" height="56" rx="12" fill="${d}"/><circle cx="262" cy="208" r="9" fill="#C9A44C"/><path d="M96 270 H304" stroke="${d}" stroke-width="3" stroke-dasharray="6 6"/>`,
  belt: (c, d) => `<path d="M60 230 C120 150 280 150 340 230" stroke="${c}" stroke-width="40" fill="none" stroke-linecap="round"/><rect x="170" y="140" width="64" height="54" rx="8" fill="none" stroke="#C9A44C" stroke-width="9"/>
    <path d="M200 140 V194" stroke="#C9A44C" stroke-width="6"/>${[250, 274, 298].map((x) => `<circle cx="${x}" cy="${174 + (x - 250) * 0.9}" r="4" fill="${d}"/>`).join("")}`,
  cap: (c, d) => `<path d="M100 230 C100 140 300 140 300 230 Z" fill="${c}"/><path d="M200 140 V230 M140 170 C160 190 160 214 150 230 M260 170 C240 190 240 214 250 230" stroke="${d}" stroke-width="3" fill="none"/>
    <path d="M90 230 H310 C330 230 340 240 330 252 C300 268 200 270 150 260 L90 246 Z" fill="${d}"/><circle cx="200" cy="140" r="8" fill="${d}"/>`,
  bag: (c, d) => `<path d="M150 110 C150 70 250 70 250 110" stroke="${d}" stroke-width="12" fill="none"/><rect x="110" y="110" width="180" height="210" rx="34" fill="${c}"/>
    <rect x="140" y="210" width="120" height="80" rx="16" fill="${shade(c, -25)}"/><path d="M140 236 H260" stroke="${d}" stroke-width="4"/><rect x="186" y="140" width="28" height="12" rx="4" fill="#C9A44C"/>`,
};

/* Returns SVG markup. Inputs are whitelisted (kind/cat via lookup tables, colour via HEX), so the string is safe to inject. */
export function artSvg(kind, color = "#333333", category = "shoes", viewBox = "0 0 400 400") {
  const c = safe(color), d = shade(c, -55), id = "sh" + ++n;
  const body = (D[kind] || D.sneaker)(c, d);
  return `<svg viewBox="${viewBox}" xmlns="http://www.w3.org/2000/svg" role="img" aria-hidden="true" preserveAspectRatio="xMidYMid slice">
    <defs><radialGradient id="${id}" cx=".5" cy=".42" r=".7"><stop offset="0" stop-color="#fff"/><stop offset="1" stop-color="${BG[category] || "#F2F2F2"}"/></radialGradient></defs>
    <rect width="400" height="400" fill="url(#${id})"/><ellipse cx="200" cy="330" rx="140" ry="14" fill="#000" opacity=".07"/>
    <g style="filter:drop-shadow(0 14px 14px rgba(0,0,0,.14))">${body}</g></svg>`;
}

/* Matches the original markup: <span data-art style="display:block;width:100%;height:100%"> */
export default function Art({ kind, color, category, viewBox }) {
  return (
    <span style={{ display: "block", width: "100%", height: "100%" }}
      dangerouslySetInnerHTML={{ __html: artSvg(kind, color, category, viewBox) }} />
  );
}
