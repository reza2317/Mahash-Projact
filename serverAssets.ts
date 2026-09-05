// Server-side Official Assets & Vector SVGs for Mahash Institution and Youth Club

export const OFFICIAL_MAHASH_LOGO_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 240" width="240" height="240">
  <defs>
    <linearGradient id="mahashNavy" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#1d4ed8"/>
      <stop offset="40%" stop-color="#173b82"/>
      <stop offset="100%" stop-color="#0b1b3d"/>
    </linearGradient>
    <linearGradient id="mahashTeal" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#2dd4bf"/>
      <stop offset="60%" stop-color="#0f766e"/>
      <stop offset="100%" stop-color="#115e59"/>
    </linearGradient>
    <filter id="subtleShadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="#000000" flood-opacity="0.12"/>
    </filter>
  </defs>
  
  <circle cx="120" cy="120" r="116" fill="#ffffff" stroke="#e2e8f0" stroke-width="2.5"/>
  
  <path d="M120 24 C175 24 212 66 212 116 C212 172 162 210 108 210 C54 210 28 168 28 118 C28 76 58 38 102 28" fill="none" stroke="url(#mahashNavy)" stroke-width="18" stroke-linecap="round" filter="url(#subtleShadow)"/>
  
  <path d="M114 54 C150 54 178 80 178 116 C178 152 144 182 108 182" fill="none" stroke="url(#mahashTeal)" stroke-width="11" stroke-linecap="round"/>
  
  <circle cx="114" cy="116" r="26" fill="none" stroke="url(#mahashTeal)" stroke-width="7"/>
  <circle cx="114" cy="116" r="12" fill="url(#mahashNavy)"/>
  
  <text x="120" y="228" fill="#173b82" font-family="Vazirmatn, Vazir, Tahoma, sans-serif" font-size="10.5" font-weight="900" text-anchor="middle" letter-spacing="0.2">موسسه حمایت از افراد با افت شنوایی محاش</text>
</svg>`;

export const OFFICIAL_MAHASH_EMBLEM_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 260 260" width="260" height="260">
  <defs>
    <linearGradient id="clubNavyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#1e3a8a"/>
      <stop offset="50%" stop-color="#172554"/>
      <stop offset="100%" stop-color="#0f172a"/>
    </linearGradient>
    <linearGradient id="clubGoldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#fef08a"/>
      <stop offset="40%" stop-color="#f59e0b"/>
      <stop offset="100%" stop-color="#d97706"/>
    </linearGradient>
    <linearGradient id="clubCyanGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#38bdf8"/>
      <stop offset="100%" stop-color="#0284c7"/>
    </linearGradient>
    <path id="clubTextPathTop" d="M 30,130 A 100,100 0 1,1 230,130" fill="none"/>
    <path id="clubTextPathBottom" d="M 230,130 A 100,100 0 0,1 30,130" fill="none"/>
  </defs>

  <circle cx="130" cy="130" r="126" fill="url(#clubNavyGrad)" stroke="url(#clubGoldGrad)" stroke-width="4.5"/>
  <circle cx="130" cy="130" r="117" fill="none" stroke="url(#clubGoldGrad)" stroke-width="1.5" stroke-dasharray="5 3"/>

  <circle cx="130" cy="130" r="88" fill="#ffffff" stroke="url(#clubGoldGrad)" stroke-width="3"/>
  
  <g transform="translate(130, 126)">
    <path d="M-45 15 C-40 -25 -10 -40 0 -55 C10 -40 40 -25 45 15 C25 22 0 25 -45 15 Z" fill="url(#clubCyanGrad)" opacity="0.9"/>
    <path d="M0 -62 C-15 -35 -12 -15 0 8 C12 -15 15 -35 0 -62 Z" fill="url(#clubGoldGrad)"/>
    <circle cx="0" cy="-20" r="6" fill="#ffffff"/>
    <polygon points="0,-48 3,-40 10,-40 5,-35 7,-28 0,-32 -7,-28 -5,-35 -10,-40 -3,-40" fill="#ffffff"/>
    <path d="M-28 20 Q0 30 28 20" stroke="url(#clubGoldGrad)" stroke-width="4.5" stroke-linecap="round" fill="none"/>
    <line x1="-16" y1="28" x2="16" y2="28" stroke="url(#clubGoldGrad)" stroke-width="3" stroke-linecap="round"/>
  </g>

  <text font-family="Vazirmatn, Vazir, Tahoma, sans-serif" font-size="12" font-weight="900" fill="url(#clubGoldGrad)" letter-spacing="0.8">
    <textPath href="#clubTextPathTop" startOffset="50%" text-anchor="middle">
      ★ باشگاه جوانان موسسه محاش ★
    </textPath>
  </text>
  <text font-family="Vazirmatn, Vazir, Tahoma, sans-serif" font-size="10" font-weight="700" fill="#93c5fd" letter-spacing="0.5">
    <textPath href="#clubTextPathBottom" startOffset="50%" text-anchor="middle">
      کانون پویایی، رشد و همبستگی جوانان
    </textPath>
  </text>
</svg>`;

export const OFFICIAL_NAZI_AVATAR_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200">
  <defs>
    <linearGradient id="nazi_bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#f0fdfa"/>
      <stop offset="100%" stop-color="#ccfbf1"/>
    </linearGradient>
    <linearGradient id="nazi_coat" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#0f766e"/>
      <stop offset="100%" stop-color="#115e59"/>
    </linearGradient>
    <linearGradient id="nazi_skin" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#ffedd5"/>
      <stop offset="100%" stop-color="#fed7aa"/>
    </linearGradient>
    <linearGradient id="nazi_hair" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#334155"/>
      <stop offset="100%" stop-color="#1e293b"/>
    </linearGradient>
  </defs>
  <rect width="200" height="200" rx="32" fill="url(#nazi_bg)"/>
  <circle cx="100" cy="100" r="92" fill="none" stroke="#0d9488" stroke-width="2" stroke-dasharray="6,4" opacity="0.4"/>
  
  <path d="M28 196 C30 148 62 134 100 134 C138 134 170 148 172 196 Z" fill="url(#nazi_coat)"/>
  <path d="M84 134 L100 166 L116 134 Z" fill="#ffffff" opacity="0.95"/>
  <path d="M100 152 L100 196" stroke="#0f766e" stroke-width="2"/>
  <polygon points="100,166 94,152 106,152" fill="#0d9488"/>
  
  <path d="M68 152 C68 174 132 174 132 152" fill="none" stroke="#5eead4" stroke-width="3.5" stroke-linecap="round"/>
  <circle cx="100" cy="174" r="5" fill="#f0fdfa" stroke="#0d9488" stroke-width="2"/>
  
  <rect x="88" y="112" width="24" height="26" rx="6" fill="#fed7aa"/>
  
  <ellipse cx="100" cy="78" rx="42" ry="46" fill="url(#nazi_hair)"/>
  <path d="M62 82 C56 112 60 142 70 148 C76 136 74 116 74 100 Z" fill="url(#nazi_hair)"/>
  <path d="M138 82 C144 112 140 142 130 148 C124 136 126 116 126 100 Z" fill="url(#nazi_hair)"/>
  
  <ellipse cx="100" cy="84" rx="30" ry="34" fill="url(#nazi_skin)"/>
  
  <path d="M68 76 C74 58 100 54 132 64 C126 56 106 50 86 52 C74 54 68 64 68 76 Z" fill="url(#nazi_hair)"/>
  <path d="M70 70 C85 68 98 76 106 82 C98 74 85 70 70 70 Z" fill="#475569"/>

  <rect x="76" y="78" width="20" height="14" rx="4" fill="none" stroke="#0f766e" stroke-width="2.2"/>
  <rect x="104" y="78" width="20" height="14" rx="4" fill="none" stroke="#0f766e" stroke-width="2.2"/>
  <line x1="96" y1="84" x2="104" y2="84" stroke="#0f766e" stroke-width="2"/>
  <line x1="72" y1="83" x2="76" y2="83" stroke="#0f766e" stroke-width="1.8"/>
  <line x1="124" y1="83" x2="128" y2="83" stroke="#0f766e" stroke-width="1.8"/>
  
  <circle cx="86" cy="85" r="2.8" fill="#1e293b"/>
  <circle cx="114" cy="85" r="2.8" fill="#1e293b"/>
  <circle cx="87" cy="84" r="0.9" fill="#ffffff"/>
  <circle cx="115" cy="84" r="0.9" fill="#ffffff"/>
  
  <path d="M92 99 Q100 106 108 99" fill="none" stroke="#ea580c" stroke-width="2" stroke-linecap="round"/>
  <circle cx="78" cy="94" r="3.5" fill="#fca5a5" opacity="0.6"/>
  <circle cx="122" cy="94" r="3.5" fill="#fca5a5" opacity="0.6"/>
  
  <g transform="translate(150, 20)">
    <circle cx="16" cy="16" r="16" fill="#0f766e" stroke="#ffffff" stroke-width="2"/>
    <path d="M16 9 L16 23 M9 16 L23 16" stroke="#ffffff" stroke-width="3.5" stroke-linecap="round"/>
  </g>
</svg>`;

export const OFFICIAL_RADIN_AVATAR_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200">
  <defs>
    <linearGradient id="radin_bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#eff6ff"/>
      <stop offset="100%" stop-color="#dbeafe"/>
    </linearGradient>
    <linearGradient id="radin_suit" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#1e3a8a"/>
      <stop offset="100%" stop-color="#172554"/>
    </linearGradient>
    <linearGradient id="radin_skin" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#ffedd5"/>
      <stop offset="100%" stop-color="#fed7aa"/>
    </linearGradient>
    <linearGradient id="radin_hair" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#1e293b"/>
      <stop offset="100%" stop-color="#0f172a"/>
    </linearGradient>
  </defs>
  <rect width="200" height="200" rx="32" fill="url(#radin_bg)"/>
  <circle cx="100" cy="100" r="92" fill="none" stroke="#2563eb" stroke-width="2" stroke-dasharray="6,4" opacity="0.4"/>
  
  <path d="M28 196 C30 148 62 134 100 134 C138 134 170 148 172 196 Z" fill="url(#radin_suit)"/>
  
  <polygon points="100,134 84,134 92,168 100,186 108,168 116,134" fill="#ffffff"/>
  <polygon points="100,140 105,145 103,178 100,184 97,178 95,145" fill="#0284c7"/>
  <polygon points="96,140 104,140 105,146 95,146" fill="#0369a1"/>
  
  <path d="M68 144 L86 182 L76 196" fill="none" stroke="#3b82f6" stroke-width="2.5" opacity="0.6"/>
  <path d="M132 144 L114 182 L124 196" fill="none" stroke="#3b82f6" stroke-width="2.5" opacity="0.6"/>
  
  <rect x="88" y="112" width="24" height="26" rx="6" fill="#fed7aa"/>
  
  <ellipse cx="100" cy="82" rx="29" ry="33" fill="url(#radin_skin)"/>
  
  <path d="M70 76 C68 54 84 46 102 46 C122 46 134 56 132 76 C130 66 124 56 108 54 C92 52 78 60 70 76 Z" fill="url(#radin_hair)"/>
  <path d="M68 76 C66 84 66 96 72 100 C72 90 72 82 74 76 Z" fill="url(#radin_hair)"/>
  <path d="M132 76 C134 84 134 96 128 100 C128 90 128 82 126 76 Z" fill="url(#radin_hair)"/>
  
  <path d="M78 74 Q86 71 92 74" fill="none" stroke="#1e293b" stroke-width="2.4" stroke-linecap="round"/>
  <path d="M108 74 Q114 71 122 74" fill="none" stroke="#1e293b" stroke-width="2.4" stroke-linecap="round"/>
  
  <circle cx="85" cy="83" r="3" fill="#0f172a"/>
  <circle cx="115" cy="83" r="3" fill="#0f172a"/>
  <circle cx="86" cy="82" r="1" fill="#ffffff"/>
  <circle cx="116" cy="82" r="1" fill="#ffffff"/>
  
  <path d="M91 97 Q100 105 109 97" fill="none" stroke="#b45309" stroke-width="2.2" stroke-linecap="round"/>
  
  <g transform="translate(150, 20)">
    <circle cx="16" cy="16" r="16" fill="#1e40af" stroke="#ffffff" stroke-width="2"/>
    <path d="M16 8 L18.5 13.5 L24.5 14 L20 18 L21.5 24 L16 20.8 L10.5 24 L12 18 L7.5 14 L13.5 13.5 Z" fill="#fbbf24"/>
  </g>
</svg>`;

export const GENERIC_PLACEHOLDER_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200">
  <rect width="200" height="200" rx="24" fill="#0f172a"/>
  <circle cx="100" cy="100" r="70" fill="none" stroke="#0284c7" stroke-width="3" stroke-dasharray="6 4"/>
  <text x="100" y="108" fill="#38bdf8" font-family="sans-serif" font-size="28" font-weight="900" text-anchor="middle">MAHASH</text>
</svg>`;
