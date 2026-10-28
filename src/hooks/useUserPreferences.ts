import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/store/authStore";

export interface UserPreferences {
  // UI Preferences
  ui: {
    defaultRoute: string;
    defaultClientsView: "grid" | "list";
    defaultProjectsView: "grid" | "list";
    sidebarCollapsed: boolean;
    compactMode: boolean;
    showAvatars: boolean;
    cardsPerRow: number;
  };
  
  // Notifications
  notifications: {
    email: boolean;
    push: boolean;
    meetingReminders: boolean;
    taskDeadlines: boolean;
    financialAlerts: boolean;
  };
  
  // Meetings & AI
  meetings: {
    defaultStatus: "all" | "scheduled" | "in_progress" | "completed";
    defaultTemplate: "standard" | "formal" | "informal" | "technical" | "board";
    transcriptionLanguage: string;
    aiProvider: "openai" | "anthropic" | "mock";
    aiModel: string;
    autoGenerateSummary: boolean;
  };
  
  // Calendar & Time
  calendar: {
    defaultView: "timer" | "calendar" | "tasks" | "team";
    workingHoursStart: string;
    workingHoursEnd: string;
    defaultEventDuration: number;
    defaultHourlyRate: number;
    autoStartTimer: boolean;
    floatingTimerMinimized: boolean;
  };
  
  // Finance
  finance: {
    currency: string;
    defaultProfitMargin: number;
    defaultPaymentMethod: "pix" | "boleto" | "card" | "transfer" | "cash";
    monthlyRevenueGoal: number;
    monthlyProfitGoal: number;
    yearlyRevenueGoal: number;
    savingsTarget: number;
    profitMarginGoal: number;
    exportFormat: "pdf" | "excel" | "csv";
  };
  
  // Projects
  projects: {
    defaultCategory: string;
    defaultPriority: "low" | "medium" | "high" | "urgent";
    defaultStatus: "planning" | "in_progress" | "completed" | "paused" | "cancelled";
    sortBy: "date" | "status" | "client" | "priority";
    sortOrder: "asc" | "desc";
  };
  
  // Media & Storage
  media: {
    defaultQuality: "low" | "medium" | "high";
    autoGenerateThumbnails: boolean;
    maxFileSize: number;
    allowedFormats: string[];
  };
}

const DEFAULT_PREFERENCES: UserPreferences = {
  ui: {
    defaultRoute: "/",
    defaultClientsView: "grid",
    defaultProjectsView: "grid",
    sidebarCollapsed: false,
    compactMode: false,
    showAvatars: true,
    cardsPerRow: 4,
  },
  notifications: {
    email: true,
    push: false,
    meetingReminders: true,
    taskDeadlines: true,
    financialAlerts: true,
  },
  meetings: {
    defaultStatus: "all",
    defaultTemplate: "standard",
    transcriptionLanguage: "pt-BR",
    aiProvider: "openai",
    aiModel: "gpt-4o-mini",
    autoGenerateSummary: true,
  },
  calendar: {
    defaultView: "timer",
    workingHoursStart: "08:00",
    workingHoursEnd: "18:00",
    defaultEventDuration: 60,
    defaultHourlyRate: 150,
    autoStartTimer: false,
    floatingTimerMinimized: false,
  },
  finance: {
    currency: "BRL",
    defaultProfitMargin: 30,
    defaultPaymentMethod: "pix",
    monthlyRevenueGoal: 60000,
    monthlyProfitGoal: 20000,
    yearlyRevenueGoal: 720000,
    savingsTarget: 100000,
    profitMarginGoal: 30,
    exportFormat: "pdf",
  },
  projects: {
    defaultCategory: "architecture",
    defaultPriority: "medium",
    defaultStatus: "planning",
    sortBy: "date",
    sortOrder: "desc",
  },
  media: {
    defaultQuality: "medium",
    autoGenerateThumbnails: true,
    maxFileSize: 10485760, // 10MB
    allowedFormats: ["image/jpeg", "image/png", "image/webp", "video/mp4"],
  },
};

export function useUserPreferences() {
  const { user } = useAuthStore();
  const [preferences, setPreferences] = useState<UserPreferences>(DEFAULT_PREFERENCES);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadPreferences();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const loadPreferences = async () => {
    if (!user) return;

    try {
      setLoading(true);
      
      // Tentar buscar do Supabase
      const { data, error } = await supabase
        .from("user_preferences")
        .select("preferences")
        .eq("user_id", user.id)
        .single();

      if (error && error.code !== "PGRST116") {
        console.error("Erro ao carregar preferências:", error);
      }

      if (data?.preferences) {
        setPreferences({ ...DEFAULT_PREFERENCES, ...data.preferences });
      } else {
        // Se não existir, tentar carregar do localStorage (migração)
        const savedPrefs = localStorage.getItem("userPreferences");
        if (savedPrefs) {
          const parsed = JSON.parse(savedPrefs);
          setPreferences({ ...DEFAULT_PREFERENCES, ...parsed });
          // Salvar no banco
          await savePreferences({ ...DEFAULT_PREFERENCES, ...parsed });
        }
      }
    } catch (error) {
      console.error("Erro ao carregar preferências:", error);
    } finally {
      setLoading(false);
    }
  };

  const savePreferences = async (newPreferences: Partial<UserPreferences>) => {
    if (!user) return;

    const updated = { ...preferences, ...newPreferences };
    setPreferences(updated);

    try {
      // Salvar no localStorage como backup
      localStorage.setItem("userPreferences", JSON.stringify(updated));

      // Salvar no Supabase
      const { error } = await supabase
        .from("user_preferences")
        .upsert({
          user_id: user.id,
          preferences: updated,
        });

      if (error) {
        console.error("Erro ao salvar preferências:", error);
        throw error;
      }
    } catch (error) {
      console.error("Erro ao salvar preferências:", error);
      throw error;
    }
  };

  const getPreference = <K extends keyof UserPreferences>(
    section: K,
    key?: keyof UserPreferences[K]
  ) => {
    if (key) {
      return preferences[section][key];
    }
    return preferences[section];
  };

  const setPreference = async <K extends keyof UserPreferences>(
    section: K,
    key: keyof UserPreferences[K],
    value: UserPreferences[K][keyof UserPreferences[K]]
  ) => {
    const updated = {
      ...preferences,
      [section]: {
        ...preferences[section],
        [key]: value,
      },
    };
    await savePreferences(updated);
  };

  const resetPreferences = async () => {
    await savePreferences(DEFAULT_PREFERENCES);
  };

  return {
    preferences,
    loading,
    getPreference,
    setPreference,
    savePreferences,
    resetPreferences,
  };
}
