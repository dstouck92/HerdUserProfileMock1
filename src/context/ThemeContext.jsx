import React, { createContext, useContext, useState, useEffect, useCallback } from "react";

const STORAGE_KEY = "herd_app_theme";

export const themes = {
  dark: {
    id: "dark",
    bg: "linear-gradient(180deg, #0f0f12 0%, #1a1a1f 50%, #151518 100%)",
    cardBg: "rgba(255,255,255,0.08)",
    cardBorder: "1px solid rgba(255,255,255,0.12)",
    cardShadow: "0 2px 20px rgba(0,0,0,0.3)",
    text: "#f1f5f9",
    textMuted: "rgba(241,245,249,0.7)",
    textSoft: "rgba(241,245,249,0.5)",
    accent: "#2dd4bf",
    accentLight: "rgba(45,212,191,0.25)",
    btnPrimaryBg: "linear-gradient(135deg, #0d9488, #14b8a6)",
    btnPrimaryText: "#fff",
    btnPrimaryShadow: "0 4px 16px rgba(13,148,136,0.4)",
    btnSecondaryBg: "rgba(255,255,255,0.1)",
    btnSecondaryBorder: "1px solid rgba(45,212,191,0.4)",
    btnSecondaryText: "#2dd4bf",
    inputBg: "rgba(255,255,255,0.08)",
    inputBorder: "1px solid rgba(255,255,255,0.15)",
    inputText: "#f1f5f9",
    label: "#94a3b8",
    tabBarBorder: "rgba(255,255,255,0.1)",
    tabActive: "#f1f5f9",
    tabInactive: "rgba(241,245,249,0.5)",
    tabIndicator: "linear-gradient(90deg, #0d9488, #14b8a6)",
    navBg: "rgba(15,15,18,0.95)",
    navBorder: "1px solid rgba(255,255,255,0.08)",
    navShadow: "0 -8px 24px rgba(0,0,0,0.4)",
    navActive: "#2dd4bf",
    navInactive: "rgba(241,245,249,0.5)",
    navActiveBg: "rgba(45,212,191,0.15)",
    modalOverlay: "rgba(0,0,0,0.6)",
    modalBg: "rgba(26,26,31,0.98)",
    modalBorder: "1px solid rgba(255,255,255,0.12)",
    modalText: "#f1f5f9",
    statDivider: "rgba(45,212,191,0.25)",
    avatarFallbackBg: "linear-gradient(135deg, #0d9488, #14b8a6)",
  },
  bright: {
    id: "bright",
    bg: "linear-gradient(165deg, #e0f2fe 0%, #cffafe 22%, #ccfbf1 45%, #d1fae5 70%, #dcfce7 100%)",
    cardBg: "rgba(255,255,255,0.65)",
    cardBorder: "1px solid rgba(255,255,255,0.6)",
    cardShadow: "0 2px 16px rgba(13,148,136,0.08)",
    text: "#1e1b4b",
    textMuted: "rgba(55,48,107,0.7)",
    textSoft: "rgba(55,48,107,0.55)",
    accent: "#0d9488",
    accentLight: "rgba(13,148,136,0.15)",
    btnPrimaryBg: "linear-gradient(135deg, #0d9488, #10b981)",
    btnPrimaryText: "#fff",
    btnPrimaryShadow: "0 4px 16px rgba(13,148,136,0.35)",
    btnSecondaryBg: "rgba(255,255,255,0.7)",
    btnSecondaryBorder: "1px solid rgba(13,148,136,0.3)",
    btnSecondaryText: "#0d9488",
    inputBg: "rgba(255,255,255,0.8)",
    inputBorder: "1px solid rgba(13,148,136,0.25)",
    inputText: "#1e1b4b",
    label: "#0f766e",
    tabBarBorder: "rgba(255,255,255,0.15)",
    tabActive: "#0f766e",
    tabInactive: "rgba(55,48,107,0.55)",
    tabIndicator: "linear-gradient(90deg, #0d9488, #10b981)",
    navBg: "linear-gradient(180deg, rgba(240,253,250,0.96), rgba(224,242,254,0.96))",
    navBorder: "1px solid rgba(15,118,110,0.15)",
    navShadow: "0 -8px 24px rgba(15,118,110,0.16)",
    navActive: "#0f766e",
    navInactive: "rgba(55,48,107,0.6)",
    navActiveBg: "rgba(16,185,129,0.12)",
    modalOverlay: "rgba(15,23,42,0.55)",
    modalBg: "rgba(255,255,255,0.98)",
    modalBorder: "1px solid rgba(13,148,136,0.2)",
    modalText: "#1e1b4b",
    statDivider: "rgba(13,148,136,0.2)",
    avatarFallbackBg: "linear-gradient(135deg, #0d9488, #10b981, #34d399)",
  },
};

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [mode, setModeState] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === "bright" || stored === "dark") return stored;
    } catch (_) {}
    return "dark";
  });

  const setMode = useCallback((next) => {
    setModeState(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch (_) {}
  }, []);

  const theme = themes[mode] || themes.dark;

  const value = {
    mode,
    setMode,
    theme,
    isDark: mode === "dark",
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    return {
      mode: "dark",
      setMode: () => {},
      theme: themes.dark,
      isDark: true,
    };
  }
  return ctx;
}
