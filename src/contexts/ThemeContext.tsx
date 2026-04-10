import React, { createContext, useContext, useState, useEffect } from 'react';

// ─── Theme definitions ──────────────────────────────────────────────────────
export type ThemeName = 'basic' | 'light' | 'dark' | 'aurora' | 'nebula' | 'geometric';
export type BgType = 'particles' | 'orbs' | 'darkgrid' | 'aurora' | 'nebula' | 'geometric';

interface ThemeMeta {
  label: string;
  desc: string;
  icon: string;
  isDark: boolean;
  bg: BgType;          // every theme now has a live background
  previewGradient: string;
}

export const THEMES: Record<ThemeName, ThemeMeta> = {
  basic: {
    label: 'Basic',
    desc: 'Minimal particles',
    icon: '◻️',
    isDark: false,
    bg: 'particles',
    previewGradient: 'from-gray-100 to-white',
  },
  light: {
    label: 'Light',
    desc: 'Soft colour orbs',
    icon: '☀️',
    isDark: false,
    bg: 'orbs',
    previewGradient: 'from-blue-50 to-indigo-50',
  },
  dark: {
    label: 'Dark',
    desc: 'Glowing grid',
    icon: '🌙',
    isDark: true,
    bg: 'darkgrid',
    previewGradient: 'from-slate-800 to-slate-900',
  },
  aurora: {
    label: 'Aurora',
    desc: 'Northern lights',
    icon: '🌌',
    isDark: true,
    bg: 'aurora',
    previewGradient: 'from-[#0f0c29] to-[#302b63]',
  },
  nebula: {
    label: 'Nebula',
    desc: 'Deep space',
    icon: '🪐',
    isDark: true,
    bg: 'nebula',
    previewGradient: 'from-[#020617] to-[#1e0035]',
  },
  geometric: {
    label: 'Geometric',
    desc: '3D wireframe',
    icon: '🔷',
    isDark: false,
    bg: 'geometric',
    previewGradient: 'from-indigo-50 to-blue-100',
  },
};

// ─── Context ────────────────────────────────────────────────────────────────
interface ThemeContextValue {
  theme: ThemeName;
  meta: ThemeMeta;
  setTheme: (t: ThemeName) => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: 'light',
  meta: THEMES.light,
  setTheme: () => {},
});

export const useTheme = () => useContext(ThemeContext);

// ─── Provider ────────────────────────────────────────────────────────────────
export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<ThemeName>(() => {
    return (localStorage.getItem('sb_theme') as ThemeName) ?? 'light';
  });

  const applyTheme = (t: ThemeName) => {
    const meta = THEMES[t];
    const root = document.documentElement;
    // Tailwind dark class
    meta.isDark ? root.classList.add('dark') : root.classList.remove('dark');
    // CSS variable set
    root.setAttribute('data-theme', t);
    // Persist
    localStorage.setItem('sb_theme', t);
  };

  useEffect(() => { applyTheme(theme); }, [theme]);

  const setTheme = (t: ThemeName) => {
    setThemeState(t);
    applyTheme(t);
  };

  return (
    <ThemeContext.Provider value={{ theme, meta: THEMES[theme], setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

// Backward-compat exports
export type ColorMode = 'light' | 'dark';
export type Bg3D = 'none' | 'aurora' | 'nebula' | 'geometric';
