import { supabase } from "@/lib/supabase";

export interface ThemeColors {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  textColor: string;
  iconColor: string;
}

export interface ThemePreferences {
  id: string;
  userId: string;
  lightTheme: ThemeColors;
  darkTheme: ThemeColors;
  createdAt: string;
  updatedAt: string;
}

interface ThemePreferencesDB {
  id: string;
  user_id: string;
  light_primary_color: string;
  light_secondary_color: string;
  light_accent_color: string;
  light_text_color: string;
  light_icon_color: string;
  dark_primary_color: string;
  dark_secondary_color: string;
  dark_accent_color: string;
  dark_text_color: string;
  dark_icon_color: string;
  created_at: string;
  updated_at: string;
}

// Cores padrão
export const DEFAULT_LIGHT_THEME: ThemeColors = {
  primaryColor: "#6366f1", // Indigo-500
  secondaryColor: "#8b5cf6", // Violet-500
  accentColor: "#06b6d4", // Cyan-500
  textColor: "#0f172a", // Slate-900
  iconColor: "#64748b", // Slate-500
};

export const DEFAULT_DARK_THEME: ThemeColors = {
  primaryColor: "#818cf8", // Indigo-400
  secondaryColor: "#a78bfa", // Violet-400
  accentColor: "#22d3ee", // Cyan-400
  textColor: "#f1f5f9", // Slate-100
  iconColor: "#94a3b8", // Slate-400
};

// Mapear DB para interface
function mapDBToThemePreferences(
  db: ThemePreferencesDB
): ThemePreferences {
  return {
    id: db.id,
    userId: db.user_id,
    lightTheme: {
      primaryColor: db.light_primary_color,
      secondaryColor: db.light_secondary_color,
      accentColor: db.light_accent_color,
      textColor: db.light_text_color,
      iconColor: db.light_icon_color,
    },
    darkTheme: {
      primaryColor: db.dark_primary_color,
      secondaryColor: db.dark_secondary_color,
      accentColor: db.dark_accent_color,
      textColor: db.dark_text_color,
      iconColor: db.dark_icon_color,
    },
    createdAt: db.created_at,
    updatedAt: db.updated_at,
  };
}

// Buscar preferências do usuário
export async function getUserThemePreferences(): Promise<ThemePreferences | null> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Usuário não autenticado");

    const { data, error } = await supabase
      .from("theme_preferences")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (error) {
      // Se não existir, criar preferências padrão
      if (error.code === "PGRST116") {
        return await createDefaultThemePreferences();
      }
      throw error;
    }

    return data ? mapDBToThemePreferences(data) : null;
  } catch (error) {
    console.error("Erro ao buscar preferências de tema:", error);
    return null;
  }
}

// Criar preferências padrão
export async function createDefaultThemePreferences(): Promise<ThemePreferences | null> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Usuário não autenticado");

    const { data, error } = await supabase
      .from("theme_preferences")
      .insert({
        user_id: user.id,
        light_primary_color: DEFAULT_LIGHT_THEME.primaryColor,
        light_secondary_color: DEFAULT_LIGHT_THEME.secondaryColor,
        light_accent_color: DEFAULT_LIGHT_THEME.accentColor,
        light_text_color: DEFAULT_LIGHT_THEME.textColor,
        light_icon_color: DEFAULT_LIGHT_THEME.iconColor,
        dark_primary_color: DEFAULT_DARK_THEME.primaryColor,
        dark_secondary_color: DEFAULT_DARK_THEME.secondaryColor,
        dark_accent_color: DEFAULT_DARK_THEME.accentColor,
        dark_text_color: DEFAULT_DARK_THEME.textColor,
        dark_icon_color: DEFAULT_DARK_THEME.iconColor,
      })
      .select()
      .single();

    if (error) throw error;

    return data ? mapDBToThemePreferences(data) : null;
  } catch (error) {
    console.error("Erro ao criar preferências padrão:", error);
    return null;
  }
}

// Atualizar preferências de tema
export async function updateThemePreferences(
  lightTheme: Partial<ThemeColors>,
  darkTheme: Partial<ThemeColors>
): Promise<ThemePreferences | null> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Usuário não autenticado");

    // Buscar preferências atuais
    const current = await getUserThemePreferences();
    if (!current) {
      // Criar se não existir
      return await createDefaultThemePreferences();
    }

    // Merge com valores atuais
    const updatedData: Partial<ThemePreferencesDB> = {};

    if (lightTheme.primaryColor) updatedData.light_primary_color = lightTheme.primaryColor;
    if (lightTheme.secondaryColor) updatedData.light_secondary_color = lightTheme.secondaryColor;
    if (lightTheme.accentColor) updatedData.light_accent_color = lightTheme.accentColor;
    if (lightTheme.textColor) updatedData.light_text_color = lightTheme.textColor;
    if (lightTheme.iconColor) updatedData.light_icon_color = lightTheme.iconColor;

    if (darkTheme.primaryColor) updatedData.dark_primary_color = darkTheme.primaryColor;
    if (darkTheme.secondaryColor) updatedData.dark_secondary_color = darkTheme.secondaryColor;
    if (darkTheme.accentColor) updatedData.dark_accent_color = darkTheme.accentColor;
    if (darkTheme.textColor) updatedData.dark_text_color = darkTheme.textColor;
    if (darkTheme.iconColor) updatedData.dark_icon_color = darkTheme.iconColor;

    const { data, error } = await supabase
      .from("theme_preferences")
      .update(updatedData)
      .eq("user_id", user.id)
      .select()
      .single();

    if (error) throw error;

    return data ? mapDBToThemePreferences(data) : null;
  } catch (error) {
    console.error("Erro ao atualizar preferências de tema:", error);
    return null;
  }
}

// Resetar para cores padrão
export async function resetThemePreferences(): Promise<ThemePreferences | null> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Usuário não autenticado");

    const { data, error } = await supabase
      .from("theme_preferences")
      .update({
        light_primary_color: DEFAULT_LIGHT_THEME.primaryColor,
        light_secondary_color: DEFAULT_LIGHT_THEME.secondaryColor,
        light_accent_color: DEFAULT_LIGHT_THEME.accentColor,
        light_text_color: DEFAULT_LIGHT_THEME.textColor,
        light_icon_color: DEFAULT_LIGHT_THEME.iconColor,
        dark_primary_color: DEFAULT_DARK_THEME.primaryColor,
        dark_secondary_color: DEFAULT_DARK_THEME.secondaryColor,
        dark_accent_color: DEFAULT_DARK_THEME.accentColor,
        dark_text_color: DEFAULT_DARK_THEME.textColor,
        dark_icon_color: DEFAULT_DARK_THEME.iconColor,
      })
      .eq("user_id", user.id)
      .select()
      .single();

    if (error) throw error;

    return data ? mapDBToThemePreferences(data) : null;
  } catch (error) {
    console.error("Erro ao resetar preferências de tema:", error);
    return null;
  }
}

// Aplicar cores CSS customizadas
export function applyThemeColors(colors: ThemeColors, isDark: boolean) {
  const root = document.documentElement;
  const prefix = isDark ? "dark" : "light";

  // Aplicar cores como CSS variables
  root.style.setProperty(`--${prefix}-primary`, colors.primaryColor);
  root.style.setProperty(`--${prefix}-secondary`, colors.secondaryColor);
  root.style.setProperty(`--${prefix}-accent`, colors.accentColor);
  root.style.setProperty(`--${prefix}-text`, colors.textColor);
  root.style.setProperty(`--${prefix}-icon`, colors.iconColor);

  // Aplicar no tema atual se corresponder
  const currentIsDark = root.classList.contains("dark");
  if (currentIsDark === isDark) {
    root.style.setProperty("--color-primary", colors.primaryColor);
    root.style.setProperty("--color-secondary", colors.secondaryColor);
    root.style.setProperty("--color-accent", colors.accentColor);
    root.style.setProperty("--color-text", colors.textColor);
    root.style.setProperty("--color-icon", colors.iconColor);
  }
}
