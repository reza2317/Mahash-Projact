import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  getAllTeams, 
  getAllScores, 
  getTeamOverrides, 
  saveTeamLogo as saveTeamLogoStore, 
  resetTeamLogo as resetTeamLogoStore,
  getMahashLogo,
  setMahashLogo as setMahashLogoStore,
  resetMahashLogo as resetMahashLogoStore,
  subscribeToStoreUpdates,
  getGlobalCacheVersion,
  triggerGlobalCacheBust,
  isCustomImageDataUrlOrUrl
} from '../utils/reportsStore';
import { compressImageToDataUrl } from '../utils/imageCompressor';
import { getTeamLogoPlaceholder, MAHESH_LOGO_SVG } from '../utils/assets';
import { SCORES_DATA, TEAMS_DATA } from '../data/mahashData';

export interface TeamLogoItem {
  id: string;
  slug: string;
  name: string;
  manager?: string;
  logo: string;
  isCustom: boolean;
  score?: number;
}

/**
 * Validates whether localStorage is accessible in the current execution context
 */
export function isLocalStorageAvailable(): boolean {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return false;
    const testKey = '__mahash_ls_test__';
    window.localStorage.setItem(testKey, '1');
    window.localStorage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
}

/**
 * Validates whether an image payload is a valid Data URL, SVG, or safe web resource URL
 */
export function isValidImageFormat(data: unknown): boolean {
  if (typeof data !== 'string') return false;
  const trimmed = data.trim();
  if (!trimmed || trimmed.length < 10) return false;

  // Base64 image data URL
  if (/^data:image\/(png|jpe?g|webp|gif|svg\+xml);base64,/i.test(trimmed)) {
    return true;
  }

  // Raw inline SVG
  if (trimmed.startsWith('<svg') && trimmed.endsWith('</svg>')) {
    return true;
  }

  // Safe HTTP/HTTPS or local assets
  if (/^https?:\/\/.+/i.test(trimmed) || /^\/(img|assets|images)\/.+/i.test(trimmed)) {
    return true;
  }

  return isCustomImageDataUrlOrUrl(trimmed);
}

/**
 * Validates and reads a logo key from localStorage with strict format checking
 */
export function validateAndReadLogoKey(key: string): string | null {
  if (!isLocalStorageAvailable()) return null;
  try {
    const val = localStorage.getItem(key);
    if (val && isValidImageFormat(val)) {
      return val;
    }
  } catch (err) {
    console.warn(`[useTeamLogos] Error reading key ${key} from localStorage:`, err);
  }
  return null;
}

// Generate immutable deterministic fallback maps for all 5 teams
function buildDeterministicFallbacks(): { map: Record<string, string>; list: TeamLogoItem[] } {
  const officialSlugs = ['team-thinker', 'team-tomorrow', 'team-angels', 'team-ghorbani', 'team-silence'];
  const fallbackMap: Record<string, string> = {
    mahash: MAHESH_LOGO_SVG,
    'team-mahash': MAHESH_LOGO_SVG
  };
  const fallbackList: TeamLogoItem[] = [];

  officialSlugs.forEach((slug) => {
    const shortId = slug.replace(/^team-/, '');
    const defaultTeam = TEAMS_DATA[slug];
    const defaultScore = SCORES_DATA.find((s) => s.id === shortId || s.id === slug);
    const defaultLogo = defaultTeam?.logo || defaultScore?.logo || getTeamLogoPlaceholder(shortId, defaultTeam?.name || shortId);

    fallbackMap[slug] = defaultLogo;
    fallbackMap[shortId] = defaultLogo;

    if (defaultTeam) {
      fallbackList.push({
        id: shortId,
        slug,
        name: defaultTeam.name,
        manager: defaultTeam.manager,
        logo: defaultLogo,
        isCustom: false,
        score: defaultScore?.score ?? 0
      });
    }
  });

  return { map: fallbackMap, list: fallbackList };
}

export function useTeamLogos() {
  const [cacheVersion, setCacheVersion] = useState<number>(() => {
    try {
      return getGlobalCacheVersion();
    } catch {
      return 1;
    }
  });

  // Pre-seed with guaranteed deterministic defaults so UI is never empty
  const [logosMap, setLogosMap] = useState<Record<string, string>>(() => buildDeterministicFallbacks().map);
  const [mahashLogo, setMahashLogoState] = useState<string>(() => {
    try {
      const validated = validateAndReadLogoKey('mahash_site_logo') || validateAndReadLogoKey('club_emblem_logo');
      if (validated) return validated;
      return getMahashLogo() || MAHESH_LOGO_SVG;
    } catch (err) {
      console.warn('[useTeamLogos] Storage inaccessible for Mahash logo, using default:', err);
      return MAHESH_LOGO_SVG;
    }
  });
  const [teamsList, setTeamsList] = useState<TeamLogoItem[]>(() => buildDeterministicFallbacks().list);
  const isInitialMount = useRef(true);

  const loadAllLogos = useCallback(() => {
    const { map: fallbackMap, list: fallbackList } = buildDeterministicFallbacks();

    try {
      const overrides = getTeamOverrides();
      const allTeams = getAllTeams();
      const scores = getAllScores();
      const validatedMahash = validateAndReadLogoKey('mahash_site_logo') || validateAndReadLogoKey('club_emblem_logo') || getMahashLogo() || MAHESH_LOGO_SVG;

      const map: Record<string, string> = { ...fallbackMap };
      const list: TeamLogoItem[] = [];
      const officialSlugs = ['team-thinker', 'team-tomorrow', 'team-angels', 'team-ghorbani', 'team-silence'];

      officialSlugs.forEach((slug) => {
        const shortId = slug.replace(/^team-/, '');
        const teamData = allTeams[slug] || TEAMS_DATA[slug];
        const baseScore = scores.find((s) => s.id === shortId || s.id === slug) || SCORES_DATA.find((s) => s.id === shortId || s.id === slug);
        
        const override = overrides[slug] || overrides[shortId];
        
        // 1. Determine if there is a validated custom image from overrides
        let customLogo = override?.logo && isValidImageFormat(override.logo) ? override.logo : undefined;
        
        // 2. Check baseScore
        if (!customLogo && baseScore?.logo && isValidImageFormat(baseScore.logo)) {
          customLogo = baseScore.logo;
        }
        
        // 3. Check localStorage keys with strict validation
        if (!customLogo) {
          customLogo = validateAndReadLogoKey(`mahash_team_logo_${shortId}`) 
            || validateAndReadLogoKey(`mahash_team_logo_${slug}`) 
            || validateAndReadLogoKey(`team_logo_${shortId}`)
            || validateAndReadLogoKey(`team_logo_${slug}`)
            || undefined;
        }

        const isCustom = !!customLogo;
        const effectiveLogo = customLogo || teamData?.logo || baseScore?.logo || fallbackMap[slug] || getTeamLogoPlaceholder(shortId, teamData?.name || shortId);

        map[slug] = effectiveLogo;
        map[shortId] = effectiveLogo;

        if (teamData) {
          list.push({
            id: shortId,
            slug,
            name: teamData.name,
            manager: teamData.manager,
            logo: effectiveLogo,
            isCustom,
            score: baseScore?.score ?? 0
          });
        }
      });

      // Ensure list is never empty
      const finalList = list.length > 0 ? list : fallbackList;

      setLogosMap(map);
      setTeamsList(finalList);
      setMahashLogoState(validatedMahash);
      setCacheVersion(getGlobalCacheVersion());
    } catch (error) {
      console.warn('[useTeamLogos] Critical error reading storage/logos. Recovering with fallback vector logos:', error);
      setLogosMap(fallbackMap);
      setTeamsList(fallbackList);
      setMahashLogoState(MAHESH_LOGO_SVG);
    }
  }, []);

  // Sync to localStorage reactively whenever logosMap changes and is valid
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    if (!isLocalStorageAvailable()) return;

    try {
      Object.entries(logosMap).forEach(([key, val]) => {
        const logoUrl = String(val || '');
        // Only persist custom validated image URLs (not pure default placeholders)
        if (isValidImageFormat(logoUrl) && !logoUrl.startsWith('data:image/svg+xml') && !logoUrl.includes('<svg')) {
          const shortKey = key.replace(/^team-/, '');
          localStorage.setItem(`mahash_team_logo_${shortKey}`, logoUrl);
          localStorage.setItem(`mahash_team_logo_${key}`, logoUrl);
        }
      });
    } catch (err) {
      console.warn('[useTeamLogos] Reactive localStorage write warning:', err);
    }
  }, [logosMap]);

  // Sync Mahash logo to localStorage reactively
  useEffect(() => {
    if (!isLocalStorageAvailable()) return;
    if (mahashLogo && isValidImageFormat(mahashLogo) && !mahashLogo.startsWith('data:image/svg+xml') && !mahashLogo.includes('<svg')) {
      try {
        localStorage.setItem('mahash_site_logo', mahashLogo);
        localStorage.setItem('club_emblem_logo', mahashLogo);
      } catch (err) {
        console.warn('[useTeamLogos] Reactive Mahash logo localStorage write warning:', err);
      }
    }
  }, [mahashLogo]);

  useEffect(() => {
    loadAllLogos();
    const unsub = subscribeToStoreUpdates(() => {
      loadAllLogos();
    });
    return () => unsub();
  }, [loadAllLogos]);

  const getLogo = useCallback(
    (teamIdOrSlug: string): string => {
      if (!teamIdOrSlug) return MAHESH_LOGO_SVG;
      const normSlug = teamIdOrSlug.startsWith('team-') ? teamIdOrSlug : `team-${teamIdOrSlug}`;
      const shortId = teamIdOrSlug.replace(/^team-/, '');
      return logosMap[normSlug] || logosMap[shortId] || getTeamLogoPlaceholder(shortId, shortId);
    },
    [logosMap]
  );

  const updateTeamLogo = useCallback(
    async (teamIdOrSlug: string, fileOrDataUrl: File | Blob | string): Promise<string> => {
      try {
        let finalDataUrl = '';
        if (typeof fileOrDataUrl === 'string') {
          finalDataUrl = fileOrDataUrl;
        } else {
          finalDataUrl = await compressImageToDataUrl(fileOrDataUrl, 512, 0.88);
        }

        // Validate image format before storing
        if (!isValidImageFormat(finalDataUrl)) {
          console.warn('[useTeamLogos] Invalid image format supplied for team logo, aborting save');
          return '';
        }

        try {
          saveTeamLogoStore(teamIdOrSlug, finalDataUrl);
        } catch (storageErr) {
          console.warn('[useTeamLogos] Storage serialization/quota error during saveTeamLogo:', storageErr);
        }

        loadAllLogos();
        return finalDataUrl;
      } catch (err) {
        console.error('[useTeamLogos] Failed to compress and update team logo:', err);
        loadAllLogos();
        return '';
      }
    },
    [loadAllLogos]
  );

  const resetTeamLogo = useCallback(
    (teamIdOrSlug: string) => {
      try {
        resetTeamLogoStore(teamIdOrSlug);
      } catch (storageErr) {
        console.warn('[useTeamLogos] Error during resetTeamLogo:', storageErr);
      }
      loadAllLogos();
    },
    [loadAllLogos]
  );

  const updateMahashLogo = useCallback(
    async (fileOrDataUrl: File | Blob | string): Promise<string> => {
      try {
        let finalDataUrl = '';
        if (typeof fileOrDataUrl === 'string') {
          finalDataUrl = fileOrDataUrl;
        } else {
          finalDataUrl = await compressImageToDataUrl(fileOrDataUrl, 512, 0.88);
        }

        if (!isValidImageFormat(finalDataUrl)) {
          console.warn('[useTeamLogos] Invalid image format for Mahash logo');
          return '';
        }

        try {
          setMahashLogoStore(finalDataUrl);
        } catch (storageErr) {
          console.warn('[useTeamLogos] Storage quota error during setMahashLogo:', storageErr);
        }

        loadAllLogos();
        return finalDataUrl;
      } catch (err) {
        console.error('[useTeamLogos] Failed to update Mahash logo:', err);
        loadAllLogos();
        return '';
      }
    },
    [loadAllLogos]
  );

  const resetMahashLogo = useCallback(() => {
    try {
      resetMahashLogoStore();
    } catch (storageErr) {
      console.warn('[useTeamLogos] Error during resetMahashLogo:', storageErr);
    }
    loadAllLogos();
  }, [loadAllLogos]);

  const refreshLogos = useCallback(() => {
    triggerGlobalCacheBust();
    loadAllLogos();
  }, [loadAllLogos]);

  return {
    logos: logosMap,
    teamsList,
    mahashLogo,
    cacheVersion,
    getLogo,
    updateTeamLogo,
    resetTeamLogo,
    updateMahashLogo,
    resetMahashLogo,
    refreshLogos
  };
}

