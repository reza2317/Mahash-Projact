import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { ThemeMode, TextSizeScale, UserPreferences } from '../types';
import { safeSetLocalStorage, safeGetLocalStorage } from '../utils/storage';

interface ThemeContextType {
  theme: ThemeMode;
  resolvedTheme: 'light' | 'dark';
  highContrast: boolean;
  textSize: TextSizeScale;
  userPreferences: UserPreferences;
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
  setHighContrast: (enabled: boolean) => void;
  toggleHighContrast: () => void;
  setTextSize: (size: TextSizeScale) => void;
  resetPreferences: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const STORAGE_THEME_KEY = 'mahash_theme_mode';
export const STORAGE_CONTRAST_KEY = 'mahash_high_contrast';
export const STORAGE_TEXT_SIZE_KEY = 'mahash_text_size';
export const STORAGE_USER_PREFS_KEY = 'mahash_user_preferences';

function getStoredTheme(): ThemeMode {
  if (typeof window === 'undefined') return 'system';
  try {
    const direct = safeGetLocalStorage(STORAGE_THEME_KEY) as ThemeMode | null;
    if (direct && ['light', 'dark', 'system'].includes(direct)) {
      return direct;
    }
    const combined = safeGetLocalStorage(STORAGE_USER_PREFS_KEY);
    if (combined) {
      const parsed = JSON.parse(combined);
      if (parsed.theme && ['light', 'dark', 'system'].includes(parsed.theme)) {
        return parsed.theme;
      }
    }
  } catch (err) {
    console.warn('Error reading theme from storage:', err);
  }
  return 'system';
}

function getStoredContrast(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const direct = safeGetLocalStorage(STORAGE_CONTRAST_KEY);
    if (direct !== null) {
      return direct === 'true';
    }
    const combined = safeGetLocalStorage(STORAGE_USER_PREFS_KEY);
    if (combined) {
      const parsed = JSON.parse(combined);
      if (typeof parsed.highContrast === 'boolean') {
        return parsed.highContrast;
      }
    }
  } catch (err) {
    console.warn('Error reading contrast from storage:', err);
  }
  return false;
}

function getStoredTextSize(): TextSizeScale {
  if (typeof window === 'undefined') return 'normal';
  try {
    const direct = safeGetLocalStorage(STORAGE_TEXT_SIZE_KEY) as TextSizeScale | null;
    if (direct && ['normal', 'large', 'xlarge'].includes(direct)) {
      return direct;
    }
    const combined = safeGetLocalStorage(STORAGE_USER_PREFS_KEY);
    if (combined) {
      const parsed = JSON.parse(combined);
      if (parsed.textSize && ['normal', 'large', 'xlarge'].includes(parsed.textSize)) {
        return parsed.textSize;
      }
    }
  } catch (err) {
    console.warn('Error reading text size from storage:', err);
  }
  return 'normal';
}

function syncPreferencesToStorage(theme: ThemeMode, highContrast: boolean, textSize: TextSizeScale) {
  if (typeof window === 'undefined') return;
  try {
    safeSetLocalStorage(STORAGE_THEME_KEY, theme);
    safeSetLocalStorage(STORAGE_CONTRAST_KEY, String(highContrast));
    safeSetLocalStorage(STORAGE_TEXT_SIZE_KEY, textSize);

    const prefs: UserPreferences & { updatedAt: number } = {
      theme,
      highContrast,
      textSize,
      updatedAt: Date.now(),
    };
    safeSetLocalStorage(STORAGE_USER_PREFS_KEY, JSON.stringify(prefs));
  } catch (err) {
    console.warn('Error writing user preferences to storage:', err);
  }
}

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<ThemeMode>(() => getStoredTheme());
  const [highContrast, setHighContrastState] = useState<boolean>(() => getStoredContrast());
  const [textSize, setTextSizeState] = useState<TextSizeScale>(() => getStoredTextSize());
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light');

  // Apply DOM attributes & classes synchronously
  const applyDOMStyles = useCallback((activeTheme: 'light' | 'dark', contrast: boolean, size: TextSizeScale) => {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;

    // Theme class & data attribute
    if (activeTheme === 'dark') {
      root.classList.add('dark');
      root.setAttribute('data-theme', 'dark');
      root.style.colorScheme = 'dark';
    } else {
      root.classList.remove('dark');
      root.setAttribute('data-theme', 'light');
      root.style.colorScheme = 'light';
    }

    // Contrast
    if (contrast) {
      root.classList.add('high-contrast');
      root.setAttribute('data-contrast', 'high');
    } else {
      root.classList.remove('high-contrast');
      root.removeAttribute('data-contrast');
    }

    // Text size scaling
    root.classList.remove('text-scale-normal', 'text-scale-large', 'text-scale-xlarge');
    root.classList.add(`text-scale-${size}`);
  }, []);

  // Compute resolved theme & apply to DOM
  useEffect(() => {
    const computeTheme = (): 'light' | 'dark' => {
      if (theme === 'system') {
        return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
          ? 'dark'
          : 'light';
      }
      return theme;
    };

    const active = computeTheme();
    setResolvedTheme(active);
    applyDOMStyles(active, highContrast, textSize);

    // Listen for OS system theme changes if theme === 'system'
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleSystemChange = (e: MediaQueryListEvent) => {
      if (theme === 'system') {
        const sysActive = e.matches ? 'dark' : 'light';
        setResolvedTheme(sysActive);
        applyDOMStyles(sysActive, highContrast, textSize);
      }
    };

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleSystemChange);
      return () => mediaQuery.removeEventListener('change', handleSystemChange);
    }
  }, [theme, highContrast, textSize, applyDOMStyles]);

  // Sync across tabs via window 'storage' event
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (
        e.key === STORAGE_THEME_KEY ||
        e.key === STORAGE_CONTRAST_KEY ||
        e.key === STORAGE_TEXT_SIZE_KEY ||
        e.key === STORAGE_USER_PREFS_KEY
      ) {
        setThemeState(getStoredTheme());
        setHighContrastState(getStoredContrast());
        setTextSizeState(getStoredTextSize());
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const setTheme = (newTheme: ThemeMode) => {
    setThemeState(newTheme);
    syncPreferencesToStorage(newTheme, highContrast, textSize);
  };

  const toggleTheme = () => {
    const next: ThemeMode = resolvedTheme === 'dark' ? 'light' : 'dark';
    setTheme(next);
  };

  const setHighContrast = (enabled: boolean) => {
    setHighContrastState(enabled);
    syncPreferencesToStorage(theme, enabled, textSize);
  };

  const toggleHighContrast = () => {
    setHighContrast(!highContrast);
  };

  const setTextSize = (size: TextSizeScale) => {
    setTextSizeState(size);
    syncPreferencesToStorage(theme, highContrast, size);
  };

  const resetPreferences = () => {
    setThemeState('system');
    setHighContrastState(false);
    setTextSizeState('normal');
    syncPreferencesToStorage('system', false, 'normal');
  };

  const userPreferences: UserPreferences = {
    theme,
    highContrast,
    textSize,
  };

  return (
    <ThemeContext.Provider
      value={{
        theme,
        resolvedTheme,
        highContrast,
        textSize,
        userPreferences,
        setTheme,
        toggleTheme,
        setHighContrast,
        toggleHighContrast,
        setTextSize,
        resetPreferences,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
