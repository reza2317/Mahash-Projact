// Official Vector SVGs for Mahash Institution and Youth Club Teams

export const TEAM_THINKER_LOGO_SVG = `data:image/svg+xml;utf8,${encodeURIComponent(`
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 240" width="240" height="240">
    <defs>
      <radialGradient id="thinkerBg" cx="50%" cy="45%" r="60%">
        <stop offset="0%" stop-color="#1e293b"/>
        <stop offset="70%" stop-color="#0f172a"/>
        <stop offset="100%" stop-color="#020617"/>
      </radialGradient>
      <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#fef08a"/>
        <stop offset="35%" stop-color="#f59e0b"/>
        <stop offset="70%" stop-color="#d97706"/>
        <stop offset="100%" stop-color="#b45309"/>
      </linearGradient>
      <linearGradient id="bulbGlow" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="#ffffff"/>
        <stop offset="100%" stop-color="#fef08a"/>
      </linearGradient>
    </defs>
    
    <!-- Outer Gold Border -->
    <circle cx="120" cy="120" r="114" fill="url(#thinkerBg)" stroke="url(#goldGrad)" stroke-width="5"/>
    <circle cx="120" cy="120" r="105" fill="none" stroke="url(#goldGrad)" stroke-width="1.5" stroke-dasharray="6 3"/>
    
    <!-- Brain-Lightbulb Icon Motif -->
    <g transform="translate(120, 100)">
      <!-- Glowing bulb background -->
      <path d="M0 -48 C-30 -48 -48 -26 -48 2 C-48 18 -38 32 -26 42 L-26 56 C-26 62 -20 66 -14 66 L14 66 C20 66 26 62 26 56 L26 42 C38 32 48 18 48 2 C48 -26 30 -48 0 -48 Z" fill="url(#goldGrad)" opacity="0.95"/>
      
      <!-- Inner brain folds -->
      <path d="M-15 -32 C-26 -32 -34 -20 -32 -8 C-30 4 -22 10 -15 12" fill="none" stroke="#0f172a" stroke-width="3.5" stroke-linecap="round"/>
      <path d="M15 -32 C26 -32 34 -20 32 -8 C30 4 22 10 15 12" fill="none" stroke="#0f172a" stroke-width="3.5" stroke-linecap="round"/>
      <path d="M0 -36 L0 20" stroke="#0f172a" stroke-width="3.5" stroke-linecap="round"/>
      <path d="M-12 -12 Q0 2 12 -12" stroke="#0f172a" stroke-width="3.5" fill="none" stroke-linecap="round"/>
      <path d="M-14 20 Q0 30 14 20" stroke="#0f172a" stroke-width="3.5" fill="none" stroke-linecap="round"/>
      
      <!-- Screw base -->
      <line x1="-16" y1="72" x2="16" y2="72" stroke="url(#goldGrad)" stroke-width="4" stroke-linecap="round"/>
      <line x1="-10" y1="79" x2="10" y2="79" stroke="url(#goldGrad)" stroke-width="3.5" stroke-linecap="round"/>
      
      <!-- Sparkles / Ideas -->
      <circle cx="-42" cy="-35" r="3" fill="url(#bulbGlow)"/>
      <circle cx="42" cy="-35" r="3" fill="url(#bulbGlow)"/>
      <circle cx="0" cy="-58" r="3.5" fill="url(#bulbGlow)"/>
    </g>
    
    <!-- Typography -->
    <text x="120" y="206" fill="url(#goldGrad)" font-family="Vazirmatn, Vazir, Tahoma, sans-serif" font-size="17" font-weight="900" text-anchor="middle" letter-spacing="0.5">تیم مغز متفکر</text>
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
    <g transform="translate(120, 106)">
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
    <text x="120" y="208" fill="#15803d" font-family="Vazirmatn, Vazir, Tahoma, sans-serif" font-size="18" font-weight="900" text-anchor="middle">باشگاه فردا</text>
  </svg>
`)}`;

export const TEAM_ANGELS_LOGO_SVG = `data:image/svg+xml;utf8,${encodeURIComponent(`
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 240" width="240" height="240">
    <defs>
      <linearGradient id="purpleRim" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#c084fc"/>
        <stop offset="50%" stop-color="#9333ea"/>
        <stop offset="100%" stop-color="#6b21a8"/>
      </linearGradient>
      <linearGradient id="purpleCore" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#faf5ff"/>
        <stop offset="100%" stop-color="#f3e8ff"/>
      </linearGradient>
      <linearGradient id="wingGold" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#fde047"/>
        <stop offset="100%" stop-color="#eab308"/>
      </linearGradient>
      <linearGradient id="wingBlue" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#60a5fa"/>
        <stop offset="100%" stop-color="#2563eb"/>
      </linearGradient>
    </defs>
    
    <!-- Circular Shield -->
    <circle cx="120" cy="120" r="114" fill="url(#purpleCore)" stroke="url(#purpleRim)" stroke-width="6"/>
    <circle cx="120" cy="120" r="106" fill="none" stroke="#e9d5ff" stroke-width="2"/>
    
    <!-- Angel Wings Motif -->
    <g transform="translate(120, 102)">
      <!-- Halo Crown -->
      <ellipse cx="0" cy="-56" rx="24" ry="7" fill="none" stroke="url(#wingGold)" stroke-width="4"/>
      
      <!-- Head / Center Core -->
      <circle cx="0" cy="-38" r="16" fill="#7e22ce"/>
      <circle cx="0" cy="-38" r="12" fill="#9333ea"/>
      
      <!-- Left Wing (Golden/Rose) -->
      <path d="M-12 -12 C-55 -40 -85 -10 -78 46 C-48 40 -26 20 -12 -12 Z" fill="url(#wingGold)"/>
      
      <!-- Right Wing (Blue) -->
      <path d="M12 -12 C55 -40 85 -10 78 46 C48 40 26 20 12 -12 Z" fill="url(#wingBlue)"/>
      
      <!-- Heart & Body in Center -->
      <path d="M0 -18 C-16 -18 -24 0 -18 18 C-12 36 0 46 0 46 C0 46 12 36 18 18 C24 0 16 -18 0 -18 Z" fill="#7e22ce"/>
      <circle cx="0" cy="8" r="6" fill="#ffffff"/>
    </g>
    
    <!-- Typography -->
    <text x="120" y="208" fill="#6b21a8" font-family="Vazirmatn, Vazir, Tahoma, sans-serif" font-size="16" font-weight="900" text-anchor="middle">فرشتگان ناشنوایان</text>
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
      <linearGradient id="shieldGold" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#fef08a"/>
        <stop offset="100%" stop-color="#f59e0b"/>
      </linearGradient>
    </defs>
    
    <!-- Outer Blue Shield -->
    <circle cx="120" cy="120" r="114" fill="url(#skyGrad)" stroke="#ffffff" stroke-width="4"/>
    <circle cx="120" cy="120" r="106" fill="none" stroke="url(#shieldGold)" stroke-width="2" stroke-dasharray="6 3"/>
    
    <!-- Central Energetic Team Symbol (Emblem & Starburst) -->
    <g transform="translate(120, 102)">
      <!-- White Badge Base -->
      <circle cx="0" cy="0" r="54" fill="#ffffff" stroke="#e0f2fe" stroke-width="3"/>
      
      <!-- Energy Flame & Collaborative Torch -->
      <path d="M0 -42 C-22 -15 -18 10 0 34 C18 10 22 -15 0 -42 Z" fill="url(#skyGrad)"/>
      <circle cx="0" cy="0" r="12" fill="url(#shieldGold)"/>
      <polygon points="0,-32 4,-20 16,-20 7,-12 10,0 0,-6 -10,0 -7,-12 -16,-20 -4,-20" fill="#ffffff"/>
      
      <!-- Dynamic Smile / Harmony Arc -->
      <path d="M-30 20 Q0 38 30 20" stroke="#0284c7" stroke-width="4.5" fill="none" stroke-linecap="round"/>
    </g>
    
    <!-- Typography -->
    <text x="120" y="208" fill="#ffffff" font-family="Vazirmatn, Vazir, Tahoma, sans-serif" font-size="18" font-weight="900" text-anchor="middle">تیم قربونی</text>
  </svg>
`)}`;

export const TEAM_SILENCE_LOGO_SVG = `data:image/svg+xml;utf8,${encodeURIComponent(`
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 240" width="240" height="240">
    <rect width="240" height="240" fill="#1e3a8a"/>
    <g stroke-linecap="round" stroke-linejoin="round">
      <path d="M100 45 C150 45 180 80 180 120 C180 160 150 190 120 190 C100 190 85 175 85 155 C85 140 95 130 110 130 C130 130 140 145 140 160 C140 120 115 85 85 85 C65 85 55 105 55 125" fill="none" stroke="#ffffff" stroke-width="16"/>
      <path d="M90 75 C115 75 130 95 130 125" fill="none" stroke="#ffffff" stroke-width="12"/>
    </g>
    <line x1="30" y1="210" x2="210" y2="30" stroke="#1e3a8a" stroke-width="56"/>
    <line x1="20" y1="220" x2="220" y2="20" stroke="#ffffff" stroke-width="36"/>
  </svg>`)}`;

/**
 * Official Mahash Youth Club Fallback Logo SVG (نشان گرافیکی پیش‌فرض باشگاه جوانان محاش)
 * Used as a stylish, high-contrast vector fallback for any team with unuploaded or pending logos.
 */
export const MAHASH_YOUTH_CLUB_FALLBACK_LOGO_SVG = `data:image/svg+xml;utf8,${encodeURIComponent(`
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 240" width="240" height="240">
    <defs>
      <linearGradient id="fallbackNavyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#1e3a8a"/>
        <stop offset="50%" stop-color="#172554"/>
        <stop offset="100%" stop-color="#0f172a"/>
      </linearGradient>
      <linearGradient id="fallbackGoldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#fef08a"/>
        <stop offset="50%" stop-color="#f59e0b"/>
        <stop offset="100%" stop-color="#b45309"/>
      </linearGradient>
      <linearGradient id="fallbackCyanGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#38bdf8"/>
        <stop offset="100%" stop-color="#0284c7"/>
      </linearGradient>
      <linearGradient id="fallbackInnerDisk" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#ffffff"/>
        <stop offset="100%" stop-color="#f0f9ff"/>
      </linearGradient>
      <filter id="fallbackDropShadow" x="-10%" y="-10%" width="120%" height="120%">
        <feDropShadow dx="0" dy="3" stdDeviation="3" flood-color="#000000" flood-opacity="0.2"/>
      </filter>
    </defs>

    <!-- Outer Navy & Gold Circular Shield -->
    <circle cx="120" cy="120" r="114" fill="url(#fallbackNavyGrad)" stroke="url(#fallbackGoldGrad)" stroke-width="4.5" filter="url(#fallbackDropShadow)"/>
    <circle cx="120" cy="120" r="106" fill="none" stroke="url(#fallbackGoldGrad)" stroke-width="1.5" stroke-dasharray="5 3"/>

    <!-- Central Clean White Disk -->
    <circle cx="120" cy="110" r="68" fill="url(#fallbackInnerDisk)" stroke="#bae6fd" stroke-width="2"/>

    <!-- Mahash Listening Contour & Youth Energy Torch Motif -->
    <g transform="translate(120, 106)">
      <!-- Listening Arc Orbit Contour -->
      <path d="M-36 -32 C-20 -54 20 -54 36 -32 C48 -14 44 18 24 34 C8 46 -12 46 -24 36" fill="none" stroke="#1e3a8a" stroke-width="5.5" stroke-linecap="round"/>
      
      <!-- Youth Soaring Wings of Growth -->
      <path d="M-32 6 C-25 -16 -5 -28 0 -38 C5 -28 25 -16 32 6 C16 12 0 14 -32 6 Z" fill="url(#fallbackCyanGrad)" opacity="0.95"/>

      <!-- Golden Flame of Ambition -->
      <path d="M0 -44 C-10 -26 -8 -10 0 6 C8 -10 10 -26 0 -44 Z" fill="url(#fallbackGoldGrad)"/>
      <circle cx="0" cy="-14" r="4" fill="#ffffff"/>

      <!-- 5 Team Unity Stars/Dots -->
      <circle cx="-16" cy="22" r="3" fill="#f59e0b"/>
      <circle cx="-8" cy="25" r="3" fill="#0284c7"/>
      <circle cx="0" cy="26" r="3.5" fill="#10b981"/>
      <circle cx="8" cy="25" r="3" fill="#8b5cf6"/>
      <circle cx="16" cy="22" r="3" fill="#f43f5e"/>
    </g>

    <!-- Top Badge Header -->
    <text x="120" y="32" fill="url(#fallbackGoldGrad)" font-family="Vazirmatn, Vazir, Tahoma, sans-serif" font-size="11" font-weight="900" text-anchor="middle" letter-spacing="0.5">★ باشگاه جوانان محاش ★</text>

    <!-- Bottom Emblem Ribbon -->
    <rect x="34" y="192" width="172" height="26" rx="13" fill="url(#fallbackGoldGrad)" filter="url(#fallbackDropShadow)"/>
    <text x="120" y="210" fill="#0f172a" font-family="Vazirmatn, Vazir, Tahoma, sans-serif" font-size="11.5" font-weight="900" text-anchor="middle" letter-spacing="0.2">نشان رسمی تیم‌های جوانان</text>
  </svg>
`)}`;

/**
 * Returns dynamic Mahash Youth Club fallback SVG customized with team name if provided
 */
export function getMahashYouthClubFallbackBadge(teamId: string = '', teamName: string = ''): string {
  const safeName = (teamName || teamId || 'تیم جوانان محاش')
    .replace(/[<>&"]/g, '')
    .trim();
    
  return `data:image/svg+xml;utf8,${encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 240" width="240" height="240">
      <defs>
        <linearGradient id="dynNavyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#1e3a8a"/>
          <stop offset="50%" stop-color="#172554"/>
          <stop offset="100%" stop-color="#0f172a"/>
        </linearGradient>
        <linearGradient id="dynGoldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#fef08a"/>
          <stop offset="50%" stop-color="#f59e0b"/>
          <stop offset="100%" stop-color="#b45309"/>
        </linearGradient>
        <linearGradient id="dynCyanGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#38bdf8"/>
          <stop offset="100%" stop-color="#0284c7"/>
        </linearGradient>
        <linearGradient id="dynDiskGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#ffffff"/>
          <stop offset="100%" stop-color="#f0fdfa"/>
        </linearGradient>
        <filter id="dynShadow" x="-10%" y="-10%" width="120%" height="120%">
          <feDropShadow dx="0" dy="3" stdDeviation="3" flood-color="#000000" flood-opacity="0.22"/>
        </filter>
      </defs>

      <!-- Outer Shield -->
      <circle cx="120" cy="120" r="114" fill="url(#dynNavyGrad)" stroke="url(#dynGoldGrad)" stroke-width="4.5" filter="url(#dynShadow)"/>
      <circle cx="120" cy="120" r="106" fill="none" stroke="url(#dynGoldGrad)" stroke-width="1.5" stroke-dasharray="5 3"/>

      <!-- Inner Disk -->
      <circle cx="120" cy="110" r="68" fill="url(#dynDiskGrad)" stroke="#99f6e4" stroke-width="2"/>

      <!-- Mahash Listening Ear Arc & Youth Torch -->
      <g transform="translate(120, 105)">
        <path d="M-36 -32 C-20 -54 20 -54 36 -32 C48 -14 44 18 24 34 C8 46 -12 46 -24 36" fill="none" stroke="#1e3a8a" stroke-width="5.5" stroke-linecap="round"/>
        <path d="M-32 6 C-25 -16 -5 -28 0 -38 C5 -28 25 -16 32 6 C16 12 0 14 -32 6 Z" fill="url(#dynCyanGrad)" opacity="0.95"/>
        <path d="M0 -44 C-10 -26 -8 -10 0 6 C8 -10 10 -26 0 -44 Z" fill="url(#dynGoldGrad)"/>
        <circle cx="0" cy="-14" r="4" fill="#ffffff"/>
        <circle cx="-16" cy="22" r="3" fill="#f59e0b"/>
        <circle cx="-8" cy="25" r="3" fill="#0284c7"/>
        <circle cx="0" cy="26" r="3.5" fill="#10b981"/>
        <circle cx="8" cy="25" r="3" fill="#8b5cf6"/>
        <circle cx="16" cy="22" r="3" fill="#f43f5e"/>
      </g>

      <!-- Top Header -->
      <text x="120" y="32" fill="url(#dynGoldGrad)" font-family="Vazirmatn, Vazir, Tahoma, sans-serif" font-size="11" font-weight="900" text-anchor="middle" letter-spacing="0.5">★ باشگاه جوانان محاش ★</text>

      <!-- Bottom Badge with Safe Team Name -->
      <rect x="28" y="192" width="184" height="26" rx="13" fill="url(#dynGoldGrad)" filter="url(#dynShadow)"/>
      <text x="120" y="210" fill="#0f172a" font-family="Vazirmatn, Vazir, Tahoma, sans-serif" font-size="${safeName.length > 16 ? 10 : 11.5}" font-weight="900" text-anchor="middle" letter-spacing="0.2">${safeName}</text>
    </svg>
  `)}`;
}

/**
 * Returns the official vector SVG for each team, guaranteed to load instantly.
 * If team has no custom logo or is unrecognized, seamlessly falls back to Mahash Youth Club graphical emblem.
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
  if (normalized.includes('silence') || normalized.includes('سکوت')) {
    return TEAM_SILENCE_LOGO_SVG;
  }
  return getMahashYouthClubFallbackBadge(teamId, teamName) || MAHASH_YOUTH_CLUB_FALLBACK_LOGO_SVG;
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
    <!-- Background Circle -->
    <rect width="200" height="200" rx="32" fill="url(#nazi_bg)"/>
    <circle cx="100" cy="100" r="92" fill="none" stroke="#0d9488" stroke-width="2" stroke-dasharray="6,4" opacity="0.4"/>
    
    <!-- Professional Coat / Shoulders -->
    <path d="M28 196 C30 148 62 134 100 134 C138 134 170 148 172 196 Z" fill="url(#nazi_coat)"/>
    <path d="M84 134 L100 166 L116 134 Z" fill="#ffffff" opacity="0.95"/>
    <path d="M100 152 L100 196" stroke="#0f766e" stroke-width="2"/>
    <polygon points="100,166 94,152 106,152" fill="#0d9488"/>
    
    <!-- Stethoscope / Medical Badge -->
    <path d="M68 152 C68 174 132 174 132 152" fill="none" stroke="#5eead4" stroke-width="3.5" stroke-linecap="round"/>
    <circle cx="100" cy="174" r="5" fill="#f0fdfa" stroke="#0d9488" stroke-width="2"/>
    
    <!-- Neck -->
    <rect x="88" y="112" width="24" height="26" rx="6" fill="#fed7aa"/>
    
    <!-- Hair Back -->
    <ellipse cx="100" cy="78" rx="42" ry="46" fill="url(#nazi_hair)"/>
    <path d="M62 82 C56 112 60 142 70 148 C76 136 74 116 74 100 Z" fill="url(#nazi_hair)"/>
    <path d="M138 82 C144 112 140 142 130 148 C124 136 126 116 126 100 Z" fill="url(#nazi_hair)"/>
    
    <!-- Head / Face -->
    <ellipse cx="100" cy="84" rx="30" ry="34" fill="url(#nazi_skin)"/>
    
    <!-- Hair Front / Bangs -->
    <path d="M68 76 C74 58 100 54 132 64 C126 56 106 50 86 52 C74 54 68 64 68 76 Z" fill="url(#nazi_hair)"/>
    <path d="M70 70 C85 68 98 76 106 82 C98 74 85 70 70 70 Z" fill="#475569"/>

    <!-- Eyeglasses (Professional Psychologist) -->
    <rect x="76" y="78" width="20" height="14" rx="4" fill="none" stroke="#0f766e" stroke-width="2.2"/>
    <rect x="104" y="78" width="20" height="14" rx="4" fill="none" stroke="#0f766e" stroke-width="2.2"/>
    <line x1="96" y1="84" x2="104" y2="84" stroke="#0f766e" stroke-width="2"/>
    <line x1="72" y1="83" x2="76" y2="83" stroke="#0f766e" stroke-width="1.8"/>
    <line x1="124" y1="83" x2="128" y2="83" stroke="#0f766e" stroke-width="1.8"/>
    
    <!-- Eyes -->
    <circle cx="86" cy="85" r="2.8" fill="#1e293b"/>
    <circle cx="114" cy="85" r="2.8" fill="#1e293b"/>
    <circle cx="87" cy="84" r="0.9" fill="#ffffff"/>
    <circle cx="115" cy="84" r="0.9" fill="#ffffff"/>
    
    <!-- Warm Smile & Cheeks -->
    <path d="M92 99 Q100 106 108 99" fill="none" stroke="#ea580c" stroke-width="2" stroke-linecap="round"/>
    <circle cx="78" cy="94" r="3.5" fill="#fca5a5" opacity="0.6"/>
    <circle cx="122" cy="94" r="3.5" fill="#fca5a5" opacity="0.6"/>
    
    <!-- Medical Cross Badge -->
    <g transform="translate(150, 20)">
      <circle cx="16" cy="16" r="16" fill="#0f766e" stroke="#ffffff" stroke-width="2"/>
      <path d="M16 9 L16 23 M9 16 L23 16" stroke="#ffffff" stroke-width="3.5" stroke-linecap="round"/>
    </g>
  </svg>
`)}`;

export const RADIN_AVATAR_SVG = `data:image/svg+xml;utf8,${encodeURIComponent(`
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200">
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
    <!-- Background Circle -->
    <rect width="200" height="200" rx="32" fill="url(#radin_bg)"/>
    <circle cx="100" cy="100" r="92" fill="none" stroke="#2563eb" stroke-width="2" stroke-dasharray="6,4" opacity="0.4"/>
    
    <!-- Modern Blazer / Suit -->
    <path d="M28 196 C30 148 62 134 100 134 C138 134 170 148 172 196 Z" fill="url(#radin_suit)"/>
    
    <!-- Shirt & Necktie -->
    <polygon points="100,134 84,134 92,168 100,186 108,168 116,134" fill="#ffffff"/>
    <!-- Youth Counselor Tie -->
    <polygon points="100,140 105,145 103,178 100,184 97,178 95,145" fill="#0284c7"/>
    <polygon points="96,140 104,140 105,146 95,146" fill="#0369a1"/>
    
    <!-- Blazer Lapels -->
    <path d="M68 144 L86 182 L76 196" fill="none" stroke="#3b82f6" stroke-width="2.5" opacity="0.6"/>
    <path d="M132 144 L114 182 L124 196" fill="none" stroke="#3b82f6" stroke-width="2.5" opacity="0.6"/>
    
    <!-- Neck -->
    <rect x="88" y="112" width="24" height="26" rx="6" fill="#fed7aa"/>
    
    <!-- Head / Face -->
    <ellipse cx="100" cy="82" rx="29" ry="33" fill="url(#radin_skin)"/>
    
    <!-- Modern Stylist Hair -->
    <path d="M70 76 C68 54 84 46 102 46 C122 46 134 56 132 76 C130 66 124 56 108 54 C92 52 78 60 70 76 Z" fill="url(#radin_hair)"/>
    <path d="M68 76 C66 84 66 96 72 100 C72 90 72 82 74 76 Z" fill="url(#radin_hair)"/>
    <path d="M132 76 C134 84 134 96 128 100 C128 90 128 82 126 76 Z" fill="url(#radin_hair)"/>
    
    <!-- Eyebrows -->
    <path d="M78 74 Q86 71 92 74" fill="none" stroke="#1e293b" stroke-width="2.4" stroke-linecap="round"/>
    <path d="M108 74 Q114 71 122 74" fill="none" stroke="#1e293b" stroke-width="2.4" stroke-linecap="round"/>
    
    <!-- Eyes -->
    <circle cx="85" cy="83" r="3" fill="#0f172a"/>
    <circle cx="115" cy="83" r="3" fill="#0f172a"/>
    <circle cx="86" cy="82" r="1" fill="#ffffff"/>
    <circle cx="116" cy="82" r="1" fill="#ffffff"/>
    
    <!-- Friendly Smile -->
    <path d="M91 97 Q100 105 109 97" fill="none" stroke="#b45309" stroke-width="2.2" stroke-linecap="round"/>
    
    <!-- Mentor / Leadership Star Badge -->
    <g transform="translate(150, 20)">
      <circle cx="16" cy="16" r="16" fill="#1e40af" stroke="#ffffff" stroke-width="2"/>
      <path d="M16 8 L18.5 13.5 L24.5 14 L20 18 L21.5 24 L16 20.8 L10.5 24 L12 18 L7.5 14 L13.5 13.5 Z" fill="#fbbf24"/>
    </g>
  </svg>
`)}`;

/**
 * Normalizes an image source string so raw SVG strings (<svg ...)
 * are correctly transformed into data URIs that <img> tags and Image() preloader can render cleanly.
 */
export function normalizeImageSrc(src: unknown, fallback: string = ''): string {
  if (!src || typeof src !== 'string') return fallback;
  const s = src.trim();
  if (!s) return fallback;

  if (s.startsWith('<svg') && s.includes('</svg>')) {
    return `data:image/svg+xml;utf8,${encodeURIComponent(s)}`;
  }

  return s;
}

