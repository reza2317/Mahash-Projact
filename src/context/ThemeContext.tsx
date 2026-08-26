import React, { createContext, useContext, useEffect, useState } from 'react';
import { ThemeMode, TextSizeScale } from '../types';

interface ThemeContextType {
  theme: ThemeMode;
  resolvedTheme: 'light' | 'dark';
  highContrast: boolean;
  textSize: TextSizeScale;
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
  setHighContrast: (enabled: boolean) => void;
  toggleHighContrast: () => void;
  setTextSize: (size: TextSizeScale) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const STORAGE_THEME_KEY = 'mahash_theme_mode';
const STORAGE_CONTRAST_KEY = 'mahash_high_contrast';
const STORAGE_TEXT_SIZE_KEY = 'mahash_text_size';

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<ThemeMode>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_THEME_KEY) as ThemeMode | null;
      if (saved && ['light', 'dark', 'system'].includes(saved)) {
        return saved;
      }
    } catch {
      // ignore
    }
    return 'system';
  });

  const [highContrast, setHighContrastState] = useState<boolean>(() => {
    try {
      return localStorage.getItem(STORAGE_CONTRAST_KEY) === 'true';
    } catch {
      return false;
    }
  });

  const [textSize, setTextSizeState] = useState<TextSizeScale>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_TEXT_SIZE_KEY) as TextSizeScale | null;
      if (saved && ['normal', 'large', 'xlarge'].includes(saved)) {
        return saved;
      }
    } catch {
      // ignore
    }
    return 'normal';
  });

  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light');

  // Compute resolved theme
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

    const root = document.documentElement;
    if (active === 'dark') {
      root.classList.add('dark');
      root.setAttribute('data-theme', 'dark');
      root.style.colorScheme = 'dark';
    } else {
      root.classList.remove('dark');
      root.setAttribute('data-theme', 'light');
      root.style.colorScheme = 'light';
    }

    if (highContrast) {
      root.classList.add('high-contrast');
      root.setAttribute('data-contrast', 'high');
    } else {
      root.classList.remove('high-contrast');
      root.removeAttribute('data-contrast');
    }

    // Text size scaling on root
    root.classList.remove('text-scale-normal', 'text-scale-large', 'text-scale-xlarge');
    root.classList.add(`text-scale-${textSize}`);

    // System preference change listener
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      if (theme === 'system') {
        const sysActive = mediaQuery.matches ? 'dark' : 'light';
        setResolvedTheme(sysActive);
        if (sysActive === 'dark') {
          root.classList.add('dark');
          root.setAttribute('data-theme', 'dark');
          root.style.colorScheme = 'dark';
        } else {
          root.classList.remove('dark');
          root.setAttribute('data-theme', 'light');
          root.style.colorScheme = 'light';
        }
      }
    };

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, [theme, highContrast, textSize]);

  const setTheme = (newTheme: ThemeMode) => {
    setThemeState(newTheme);
    try {
      localStorage.setItem(STORAGE_THEME_KEY, newTheme);
    } catch {
      // ignore
    }
  };

  const toggleTheme = () => {
    const next: ThemeMode = resolvedTheme === 'dark' ? 'light' : 'dark';
    setTheme(next);
  };

  const setHighContrast = (enabled: boolean) => {
    setHighContrastState(enabled);
    try {
      localStorage.setItem(STORAGE_CONTRAST_KEY, String(enabled));
    } catch {
      // ignore
    }
  };

  const toggleHighContrast = () => {
    setHighContrast(!highContrast);
  };

  const setTextSize = (size: TextSizeScale) => {
    setTextSizeState(size);
    try {
      localStorage.setItem(STORAGE_TEXT_SIZE_KEY, size);
    } catch {
      // ignore
    }
  };

  return (
    <ThemeContext.Provider
      value={{
        theme,
        resolvedTheme,
        highContrast,
        textSize,
        setTheme,
        toggleTheme,
        setHighContrast,
        toggleHighContrast,
        setTextSize,
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
