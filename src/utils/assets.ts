// Official Vector SVGs for Mahash Institution and Youth Club Teams

export const TEAM_THINKER_LOGO_SVG = `data:image/svg+xml;utf8,${encodeURIComponent(`
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 240" width="240" height="240">
    <defs>
      <radialGradient id="thinkerBg" cx="50%" cy="45%" r="60%">
        <stop offset="0%" stop-color="#1f1d1a"/>
        <stop offset="80%" stop-color="#0a0a0a"/>
        <stop offset="100%" stop-color="#000000"/>
      </radialGradient>
      <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#fef08a"/>
        <stop offset="35%" stop-color="#f59e0b"/>
        <stop offset="70%" stop-color="#d97706"/>
        <stop offset="100%" stop-color="#b45309"/>
      </linearGradient>
      <linearGradient id="bulbGlow" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="#fffbeb"/>
        <stop offset="100%" stop-color="#fef08a"/>
      </linearGradient>
    </defs>
    
    <!-- Outer Gold Border -->
    <circle cx="120" cy="120" r="114" fill="url(#thinkerBg)" stroke="url(#goldGrad)" stroke-width="5"/>
    <circle cx="120" cy="120" r="105" fill="none" stroke="url(#goldGrad)" stroke-width="1.5" stroke-dasharray="6 3"/>
    
    <!-- Brain-Lightbulb Icon Motif -->
    <g transform="translate(120, 102)">
      <!-- Glowing bulb background -->
      <path d="M0 -48 C-30 -48 -48 -26 -48 2 C-48 18 -38 32 -26 42 L-26 56 C-26 62 -20 66 -14 66 L14 66 C20 66 26 62 26 56 L26 42 C38 32 48 18 48 2 C48 -26 30 -48 0 -48 Z" fill="url(#goldGrad)" opacity="0.95"/>
      
      <!-- Inner brain folds -->
      <path d="M-15 -32 C-26 -32 -34 -20 -32 -8 C-30 4 -22 10 -15 12" fill="none" stroke="#1f1d1a" stroke-width="3.5" stroke-linecap="round"/>
      <path d="M15 -32 C26 -32 34 -20 32 -8 C30 4 22 10 15 12" fill="none" stroke="#1f1d1a" stroke-width="3.5" stroke-linecap="round"/>
      <path d="M0 -36 L0 20" stroke="#1f1d1a" stroke-width="3.5" stroke-linecap="round"/>
      <path d="M-12 -12 Q0 2 12 -12" stroke="#1f1d1a" stroke-width="3.5" fill="none" stroke-linecap="round"/>
      <path d="M-14 20 Q0 30 14 20" stroke="#1f1d1a" stroke-width="3.5" fill="none" stroke-linecap="round"/>
      
      <!-- Screw base -->
      <line x1="-16" y1="72" x2="16" y2="72" stroke="url(#goldGrad)" stroke-width="4" stroke-linecap="round"/>
      <line x1="-10" y1="79" x2="10" y2="79" stroke="url(#goldGrad)" stroke-width="3.5" stroke-linecap="round"/>
      
      <!-- Sparkles / Ideas -->
      <circle cx="-42" cy="-35" r="3" fill="url(#bulbGlow)"/>
      <circle cx="42" cy="-35" r="3" fill="url(#bulbGlow)"/>
      <circle cx="0" cy="-58" r="3.5" fill="url(#bulbGlow)"/>
    </g>
    
    <!-- Typography -->
    <text x="120" y="208" fill="url(#goldGrad)" font-family="Vazirmatn, Vazir, Tahoma, sans-serif" font-size="18" font-weight="900" text-anchor="middle" letter-spacing="0.5">تیم مغز متفکر</text>
  </svg>
`)}`;

export const TEAM_TOMORROW_LOGO_SVG = `data:image/svg+xml;utf8,${encodeURIComponent(`
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 240" width="240" height="240">
    <defs>
      <linearGradient id="greenRim" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#22c55e"/>
        <stop offset="50%" stop-color="#16a34a"/>
        <stop offset="100%" stop-color="#15803d"/>
      </linearGradient>
      <linearGradient id="leafGrad" x1="0%" y1="100%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="#15803d"/>
        <stop offset="50%" stop-color="#16a34a"/>
        <stop offset="100%" stop-color="#4ade80"/>
      </linearGradient>
    </defs>
    
    <!-- Circular Shield -->
    <circle cx="120" cy="120" r="114" fill="#ffffff" stroke="url(#greenRim)" stroke-width="6"/>
    <circle cx="120" cy="120" r="106" fill="none" stroke="#dcfce7" stroke-width="2"/>
    
    <!-- Soaring Leaf Motif -->
    <g transform="translate(120, 108)">
      <path d="M-60 40 C-50 -20 20 -45 60 -65 C40 -20 -10 30 -60 40 Z" fill="url(#leafGrad)"/>
      <path d="M-45 32 C-20 0 15 -25 50 -55" stroke="#ffffff" stroke-width="2.5" fill="none" opacity="0.6" stroke-linecap="round"/>
      
      <!-- 3 Colored Energy Spheres (Red, Green, Yellow) -->
      <circle cx="-25" cy="8" r="11" fill="#e11d48" stroke="#ffffff" stroke-width="2"/>
      <circle cx="8" cy="-16" r="12" fill="#16a34a" stroke="#ffffff" stroke-width="2"/>
      <circle cx="42" cy="8" r="11" fill="#eab308" stroke="#ffffff" stroke-width="2"/>
      
      <!-- Smiling Horizon Arc -->
      <path d="M-40 46 C-20 28 20 28 40 46" fill="none" stroke="#1e3a8a" stroke-width="5" stroke-linecap="round"/>
    </g>
    
    <!-- Typography -->
    <text x="120" y="210" fill="#15803d" font-family="Vazirmatn, Vazir, Tahoma, sans-serif" font-size="19" font-weight="900" text-anchor="middle">باشگاه فردا</text>
  </svg>
`)}`;

export const TEAM_ANGELS_LOGO_SVG = `data:image/svg+xml;utf8,${encodeURIComponent(`
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 240" width="240" height="240">
    <defs>
      <linearGradient id="purpleRim" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#a855f7"/>
        <stop offset="50%" stop-color="#9333ea"/>
        <stop offset="100%" stop-color="#7e22ce"/>
      </linearGradient>
      <linearGradient id="blueWing" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#60a5fa"/>
        <stop offset="100%" stop-color="#2563eb"/>
      </linearGradient>
      <linearGradient id="redWing" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#f87171"/>
        <stop offset="100%" stop-color="#dc2626"/>
      </linearGradient>
    </defs>
    
    <!-- Circular Shield -->
    <circle cx="120" cy="120" r="114" fill="#ffffff" stroke="url(#purpleRim)" stroke-width="6"/>
    <circle cx="120" cy="120" r="106" fill="none" stroke="#f3e8ff" stroke-width="2"/>
    
    <!-- Angel Wings Motif -->
    <g transform="translate(120, 106)">
      <!-- Head / Center Core -->
      <circle cx="0" cy="-45" r="15" fill="#9333ea"/>
      <path d="M0 -25 C-14 -25 -24 -12 -24 8 C-24 24 -12 36 0 42 C12 36 24 24 24 8 C24 -12 14 -25 0 -25 Z" fill="url(#blueWing)"/>
      
      <!-- Left Wing (Red) -->
      <path d="M-15 0 C-50 -30 -80 -5 -75 48 C-45 42 -25 24 -15 0 Z" fill="url(#redWing)"/>
      
      <!-- Right Wing (Dark Slate/Navy) -->
      <path d="M15 0 C50 -30 80 -5 75 48 C45 42 25 24 15 0 Z" fill="#1e293b"/>
      
      <!-- Halo Crown -->
      <ellipse cx="0" cy="-62" rx="20" ry="6" fill="none" stroke="#eab308" stroke-width="3"/>
    </g>
    
    <!-- Typography -->
    <text x="120" y="210" fill="#7e22ce" font-family="Vazirmatn, Vazir, Tahoma, sans-serif" font-size="17" font-weight="900" text-anchor="middle">فرشتگان ناشنوایان</text>
  </svg>
`)}`;

export const TEAM_GHORBANI_LOGO_SVG = `data:image/svg+xml;utf8,${encodeURIComponent(`
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 240" width="240" height="240">
    <defs>
      <linearGradient id="skyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#38bdf8"/>
        <stop offset="50%" stop-color="#0284c7"/>
        <stop offset="100%" stop-color="#0369a1"/>
      </linearGradient>
    </defs>
    
    <!-- Outer Blue Shield -->
    <circle cx="120" cy="120" r="114" fill="url(#skyGrad)" stroke="#0284c7" stroke-width="6"/>
    
    <!-- White Character Face Disk -->
    <circle cx="120" cy="112" r="62" fill="#ffffff" stroke="#e0f2fe" stroke-width="2"/>
    
    <!-- Horns / Fun Amber Hair -->
    <path d="M72 65 C60 46 48 58 60 76" stroke="#f59e0b" stroke-width="7" fill="none" stroke-linecap="round"/>
    <path d="M168 65 C180 46 192 58 180 76" stroke="#f59e0b" stroke-width="7" fill="none" stroke-linecap="round"/>
    
    <!-- Eyes & Smile -->
    <circle cx="92" cy="98" r="7" fill="#0f172a"/>
    <circle cx="148" cy="98" r="7" fill="#0f172a"/>
    <circle cx="90" cy="95" r="2.5" fill="#ffffff"/>
    <circle cx="146" cy="95" r="2.5" fill="#ffffff"/>
    
    <!-- Cheeks -->
    <circle cx="78" cy="115" r="7" fill="#fecdd3" opacity="0.8"/>
    <circle cx="162" cy="115" r="7" fill="#fecdd3" opacity="0.8"/>
    
    <!-- Smile Curve -->
    <path d="M102 120 Q120 144 138 120" stroke="#0f172a" stroke-width="5" fill="none" stroke-linecap="round"/>
    
    <!-- Typography -->
    <text x="120" y="210" fill="#ffffff" font-family="Vazirmatn, Vazir, Tahoma, sans-serif" font-size="20" font-weight="900" text-anchor="middle">تیم قربونی</text>
  </svg>
`)}`;

export const TEAM_SILENCE_LOGO_SVG = `data:image/svg+xml;utf8,${encodeURIComponent(`
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 240" width="240" height="240">
    <defs>
      <linearGradient id="tealRim" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#2dd4bf"/>
        <stop offset="50%" stop-color="#0f766e"/>
        <stop offset="100%" stop-color="#115e59"/>
      </linearGradient>
      <linearGradient id="waveGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#5eead4"/>
        <stop offset="100%" stop-color="#0d9488"/>
      </linearGradient>
    </defs>
    
    <!-- Outer Teal Shield -->
    <circle cx="120" cy="120" r="114" fill="#ffffff" stroke="url(#tealRim)" stroke-width="6"/>
    <circle cx="120" cy="120" r="106" fill="none" stroke="#ccfbf1" stroke-width="2"/>
    
    <!-- Sound Wave & Hand Arc Contour -->
    <g transform="translate(120, 108)">
      <!-- Silhouette Curve of Head/Ear Listening -->
      <path d="M0 -65 C-42 -65 -65 -30 -65 12 C-65 65 -25 88 0 88 C25 88 65 65 65 12 C65 -30 42 -65 0 -65 Z" fill="none" stroke="url(#tealRim)" stroke-width="5" stroke-linecap="round"/>
      
      <!-- Resonating sound gesture lines -->
      <path d="M-30 40 L-10 15 L10 -5 L35 -30" stroke="url(#waveGrad)" stroke-width="6" stroke-linecap="round"/>
      <path d="M-20 50 L0 25 L20 5 L45 -20" stroke="url(#waveGrad)" stroke-width="4.5" stroke-linecap="round" opacity="0.7"/>
      <circle cx="35" cy="-32" r="8" fill="#0d9488"/>
    </g>
    
    <!-- Typography -->
    <text x="120" y="210" fill="#0f766e" font-family="Vazirmatn, Vazir, Tahoma, sans-serif" font-size="19" font-weight="900" text-anchor="middle">تیم آوای سکوت</text>
  </svg>
`)}`;

/**
 * Returns the official vector SVG for each team, guaranteed to load instantly.
 */
export function getTeamLogoPlaceholder(teamId: string, teamName: string = ''): string {
  const normalized = (teamId || '').toLowerCase() + ' ' + (teamName || '');

  if (normalized.includes('thinker') || normalized.includes('متفکر')) {
    return TEAM_THINKER_LOGO_SVG;
  }
  if (normalized.includes('tomorrow') || normalized.includes('فردا')) {
    return TEAM_TOMORROW_LOGO_SVG;
  }
  if (normalized.includes('angels') || normalized.includes('فرشتگان')) {
    return TEAM_ANGELS_LOGO_SVG;
  }
  if (normalized.includes('ghorbani') || normalized.includes('قربونی')) {
    return TEAM_GHORBANI_LOGO_SVG;
  }
  return TEAM_SILENCE_LOGO_SVG;
}

/**
 * Official Mahash Institution Vector Logo (Exact Official Emblem)
 */
export const MAHESH_LOGO_SVG = `data:image/svg+xml;utf8,${encodeURIComponent(`
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 240" width="240" height="240">
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
    
    <!-- Outer Clean White Disk -->
    <circle cx="120" cy="120" r="116" fill="#ffffff" stroke="#e2e8f0" stroke-width="2.5"/>
    
    <!-- Outer Navy Crescent Ear Contour (Listening Orbit) -->
    <path d="M120 24 C175 24 212 66 212 116 C212 172 162 210 108 210 C54 210 28 168 28 118 C28 76 58 38 102 28" fill="none" stroke="url(#mahashNavy)" stroke-width="18" stroke-linecap="round" filter="url(#subtleShadow)"/>
    
    <!-- Inner Teal Sound Frequency Waves -->
    <path d="M114 54 C150 54 178 80 178 116 C178 152 144 182 108 182" fill="none" stroke="url(#mahashTeal)" stroke-width="11" stroke-linecap="round"/>
    
    <!-- Acoustic Node / Inner Ring -->
    <circle cx="114" cy="116" r="26" fill="none" stroke="url(#mahashTeal)" stroke-width="7"/>
    <circle cx="114" cy="116" r="12" fill="url(#mahashNavy)"/>
    
    <!-- Foundation Text Badge -->
    <text x="120" y="228" fill="#173b82" font-family="Vazirmatn, Vazir, Tahoma, sans-serif" font-size="10.5" font-weight="900" text-anchor="middle" letter-spacing="0.2">موسسه حمایت از افراد با افت شنوایی محاش</text>
  </svg>
`)}`;

/**
 * Official Mahash Youth Club Circular Emblem (نشان حلقوی رسمی باشگاه جوانان محاش)
 */
export const MAHESH_CLUB_EMBLEM_SVG = `data:image/svg+xml;utf8,${encodeURIComponent(`
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 260 260" width="260" height="260">
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

    <!-- Outer Gold Ring with Dash Pattern -->
    <circle cx="130" cy="130" r="126" fill="url(#clubNavyGrad)" stroke="url(#clubGoldGrad)" stroke-width="4.5"/>
    <circle cx="130" cy="130" r="117" fill="none" stroke="url(#clubGoldGrad)" stroke-width="1.5" stroke-dasharray="5 3"/>

    <!-- Inner Core Disk -->
    <circle cx="130" cy="130" r="88" fill="#ffffff" stroke="url(#clubGoldGrad)" stroke-width="3"/>
    
    <!-- Central Motif: Torch & Wings of Growth -->
    <g transform="translate(130, 126)">
      <!-- Growth Wings -->
      <path d="M-45 15 C-40 -25 -10 -40 0 -55 C10 -40 40 -25 45 15 C25 22 0 25 -45 15 Z" fill="url(#clubCyanGrad)" opacity="0.9"/>
      <!-- Inner Gold Flame -->
      <path d="M0 -62 C-15 -35 -12 -15 0 8 C12 -15 15 -35 0 -62 Z" fill="url(#clubGoldGrad)"/>
      <circle cx="0" cy="-20" r="6" fill="#ffffff"/>
      <!-- 5 Team Stars -->
      <polygon points="0,-48 3,-40 10,-40 5,-35 7,-28 0,-32 -7,-28 -5,-35 -10,-40 -3,-40" fill="#ffffff"/>
      <!-- Support Base -->
      <path d="M-28 20 Q0 30 28 20" stroke="url(#clubGoldGrad)" stroke-width="4.5" stroke-linecap="round" fill="none"/>
      <line x1="-16" y1="28" x2="16" y2="28" stroke="url(#clubGoldGrad)" stroke-width="3" stroke-linecap="round"/>
    </g>

    <!-- Circular Badge Inscriptions -->
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
  </svg>
`)}`;

/**
 * Pre-designed Vector Circular Badges for Custom Selection in Admin Panel
 */
export interface CircularBadgePreset {
  id: string;
  name: string;
  title?: string;
  category: string;
  description?: string;
  svg: string;
  svgDataUri?: string;
}

export const CIRCULAR_BADGE_PRESETS: CircularBadgePreset[] = [
  {
    id: 'preset-mahash-official',
    name: 'لوگوی رسمی موسسه محاش',
    category: 'سازمانی',
    svg: MAHESH_LOGO_SVG
  },
  {
    id: 'preset-club-official',
    name: 'نشان طلایی باشگاه جوانان',
    category: 'باشگاهی',
    svg: MAHESH_CLUB_EMBLEM_SVG
  },
  {
    id: 'preset-thinker',
    name: 'نشان زرین متفکر و نوآوری',
    category: 'تیمی',
    svg: TEAM_THINKER_LOGO_SVG
  },
  {
    id: 'preset-tomorrow',
    name: 'نشان سبز رشد و امید',
    category: 'تیمی',
    svg: TEAM_TOMORROW_LOGO_SVG
  },
  {
    id: 'preset-angels',
    name: 'نشان بنفش بال‌های فرشتگان',
    category: 'تیمی',
    svg: TEAM_ANGELS_LOGO_SVG
  },
  {
    id: 'preset-ghorbani',
    name: 'نشان آبی پویا و پرانرژی',
    category: 'تیمی',
    svg: TEAM_GHORBANI_LOGO_SVG
  },
  {
    id: 'preset-silence',
    name: 'نشان فیروزه‌ای آوای شنیداری',
    category: 'تیمی',
    svg: TEAM_SILENCE_LOGO_SVG
  },
  {
    id: 'preset-diamond',
    name: 'نشان الماس درخشان مهارت',
    category: 'ویژه',
    svg: `data:image/svg+xml;utf8,${encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 240" width="240" height="240">
        <defs>
          <linearGradient id="diamondBg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#0f172a"/>
            <stop offset="100%" stop-color="#1e293b"/>
          </linearGradient>
          <linearGradient id="diaGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#e0f2fe"/>
            <stop offset="40%" stop-color="#38bdf8"/>
            <stop offset="100%" stop-color="#0284c7"/>
          </linearGradient>
        </defs>
        <circle cx="120" cy="120" r="114" fill="url(#diamondBg)" stroke="url(#diaGrad)" stroke-width="5"/>
        <circle cx="120" cy="120" r="105" fill="none" stroke="#38bdf8" stroke-width="1.5" stroke-dasharray="6 3"/>
        <g transform="translate(120, 110)">
          <polygon points="0,-48 45,-20 30,35 -30,35 -45,-20" fill="url(#diaGrad)"/>
          <line x1="-45" y1="-20" x2="45" y2="-20" stroke="#ffffff" stroke-width="2.5"/>
          <line x1="0" y1="-48" x2="-20" y2="-20" stroke="#ffffff" stroke-width="2"/>
          <line x1="0" y1="-48" x2="20" y2="-20" stroke="#ffffff" stroke-width="2"/>
          <line x1="-20" y1="-20" x2="-15" y2="35" stroke="#ffffff" stroke-width="2"/>
          <line x1="20" y1="-20" x2="15" y2="35" stroke="#ffffff" stroke-width="2"/>
          <line x1="0" y1="-20" x2="0" y2="35" stroke="#ffffff" stroke-width="2"/>
        </g>
        <text x="120" y="208" fill="#38bdf8" font-family="Vazirmatn, Vazir, Tahoma, sans-serif" font-size="16" font-weight="900" text-anchor="middle">نشان الماس درخشان</text>
      </svg>
    `)}`
  },
  {
    id: 'preset-phoenix',
    name: 'نشان سیمرغ و پرواز بالنده',
    category: 'ویژه',
    svg: `data:image/svg+xml;utf8,${encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 240" width="240" height="240">
        <defs>
          <radialGradient id="phoenixBg" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stop-color="#450a0a"/>
            <stop offset="100%" stop-color="#180303"/>
          </radialGradient>
          <linearGradient id="fireGrad" x1="0%" y1="100%" x2="0%" y2="0%">
            <stop offset="0%" stop-color="#dc2626"/>
            <stop offset="50%" stop-color="#ea580c"/>
            <stop offset="100%" stop-color="#fbbf24"/>
          </linearGradient>
        </defs>
        <circle cx="120" cy="120" r="114" fill="url(#phoenixBg)" stroke="#f59e0b" stroke-width="5"/>
        <circle cx="120" cy="120" r="105" fill="none" stroke="#dc2626" stroke-width="2"/>
        <g transform="translate(120, 110)">
          <!-- Phoenix Head & Flames -->
          <path d="M0 -55 C-35 -30 -50 0 -50 35 C-30 25 -15 35 0 20 C15 35 30 25 50 35 C50 0 35 -30 0 -55 Z" fill="url(#fireGrad)"/>
          <circle cx="0" cy="-25" r="7" fill="#ffffff"/>
          <circle cx="0" cy="-25" r="3.5" fill="#7f1d1d"/>
        </g>
        <text x="120" y="208" fill="#fbbf24" font-family="Vazirmatn, Vazir, Tahoma, sans-serif" font-size="16" font-weight="900" text-anchor="middle">نشان سیمرغ پرواز</text>
      </svg>
    `)}`
  }
];

export const NAZI_AVATAR_SVG = `data:image/svg+xml;utf8,${encodeURIComponent(`
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200">
    <rect width="200" height="200" rx="30" fill="#f0fdfa"/>
    <circle cx="100" cy="80" r="42" fill="#ccfbf1" stroke="#0f766e" stroke-width="3"/>
    <path d="M35 180 C35 135 65 125 100 125 C135 125 165 135 165 180 Z" fill="#0f766e"/>
    <text x="100" y="94" font-size="38" text-anchor="middle">👩‍⚕️</text>
  </svg>
`)}`;

export const RADIN_AVATAR_SVG = `data:image/svg+xml;utf8,${encodeURIComponent(`
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200">
    <rect width="200" height="200" rx="30" fill="#eff6ff"/>
    <circle cx="100" cy="80" r="42" fill="#dbeafe" stroke="#1d4ed8" stroke-width="3"/>
    <path d="M35 180 C35 135 65 125 100 125 C135 125 165 135 165 180 Z" fill="#173b82"/>
    <text x="100" y="94" font-size="38" text-anchor="middle">👨‍💼</text>
  </svg>
`)}`;
