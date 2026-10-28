import { useState, useEffect } from "react";
import {
  getUserThemePreferences,
  updateThemePreferences,
  resetThemePreferences,
  applyThemeColors,
  DEFAULT_LIGHT_THEME,
  DEFAULT_DARK_THEME,
} from "@/services/themeService";
import type { ThemePreferences, ThemeColors } from "@/services/themeService";

export function useThemePreferences() {
  const [preferences, setPreferences] = useState<ThemePreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDark, setIsDark] = useState(false);

  // Carregar preferências ao montar
  useEffect(() => {
    loadPreferences();
  }, []);

  // Detectar mudança de tema (claro/escuro)
  useEffect(() => {
    const checkTheme = () => {
      const dark = document.documentElement.classList.contains("dark");
      setIsDark(dark);
    };

    checkTheme();

    // Observar mudanças no classList
    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => observer.disconnect();
  }, []);

  // Aplicar cores quando preferências ou tema mudam
  useEffect(() => {
    if (preferences) {
      const colors = isDark ? preferences.darkTheme : preferences.lightTheme;
      applyThemeColors(colors, isDark);
    }
  }, [preferences, isDark]);

  const loadPreferences = async () => {
    setLoading(true);
    try {
      const prefs = await getUserThemePreferences();
      setPreferences(prefs);
    } catch (error) {
      console.error("Erro ao carregar preferências:", error);
    } finally {
      setLoading(false);
    }
  };

  const updateColors = async (
    lightTheme: Partial<ThemeColors>,
    darkTheme: Partial<ThemeColors>
  ) => {
    try {
      const updated = await updateThemePreferences(lightTheme, darkTheme);
      if (updated) {
        setPreferences(updated);
        // Aplicar imediatamente
        const colors = isDark ? updated.darkTheme : updated.lightTheme;
        applyThemeColors(colors, isDark);
        return true;
      }
      return false;
    } catch (error) {
      console.error("Erro ao atualizar cores:", error);
      return false;
    }
  };

  const resetColors = async () => {
    try {
      const reset = await resetThemePreferences();
      if (reset) {
        setPreferences(reset);
        // Aplicar cores padrão
        const colors = isDark ? DEFAULT_DARK_THEME : DEFAULT_LIGHT_THEME;
        applyThemeColors(colors, isDark);
        return true;
      }
      return false;
    } catch (error) {
      console.error("Erro ao resetar cores:", error);
      return false;
    }
  };

  const getCurrentColors = (): ThemeColors => {
    if (!preferences) {
      return isDark ? DEFAULT_DARK_THEME : DEFAULT_LIGHT_THEME;
    }
    return isDark ? preferences.darkTheme : preferences.lightTheme;
  };

  return {
    preferences,
    loading,
    isDark,
    currentColors: getCurrentColors(),
    updateColors,
    resetColors,
    refreshPreferences: loadPreferences,
  };
}
