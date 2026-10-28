import { supabase } from "@/lib/supabase";

export interface TimeEntry {
  id: string;
  user_id: string;
  project_id?: string;
  task_id?: string;
  start_time: string;
  end_time?: string;
  duration?: number;
  description?: string;
  notes?: string;
  hourly_rate?: number;
  total_cost?: number;
  billable: boolean;
  created_at: string;
  updated_at: string;
}

export interface TimeEntryInsert extends Omit<TimeEntry, 'id' | 'created_at' | 'updated_at' | 'duration' | 'total_cost'> {
  user_id: string;
  start_time: string;
}

export interface TimeEntrySummary {
  project_id: string;
  project_name: string;
  user_id: string;
  user_name: string;
  entry_count: number;
  total_hours: number;
  total_cost: number;
  billable_hours: number;
  non_billable_hours: number;
}

class TimeTrackingService {
  /**
   * Iniciar rastreamento de tempo
   */
  async startTimer(data: {
    project_id?: string;
    task_id?: string;
    description?: string;
    hourly_rate?: number;
  }) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Usuário não autenticado");

    // Verificar se usuário tem empresa configurada
    // Primeiro tentar buscar da tabela companies
    const { data: company } = await supabase
      .from("companies")
      .select("company_name")
      .eq("user_id", user.id)
      .single();

    // Se não tem empresa cadastrada, buscar do profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("empresa")
      .eq("id", user.id)
      .single();

    // Determinar qual nome de empresa usar
    let empresaNome: string | null = null;
    
    if (company?.company_name) {
      empresaNome = company.company_name;
      
      // Se o profile.empresa está diferente, sincronizar
      if (profile?.empresa !== company.company_name) {
        await supabase
          .from("profiles")
          .update({ empresa: company.company_name })
          .eq("id", user.id);
      }
    } else if (profile?.empresa) {
      empresaNome = profile.empresa;
    }

    if (!empresaNome) {
      throw new Error("EMPRESA_NAO_CONFIGURADA");
    }

    const entry: TimeEntryInsert = {
      user_id: user.id,
      project_id: data.project_id,
      task_id: data.task_id,
      start_time: new Date().toISOString(),
      description: data.description,
      hourly_rate: data.hourly_rate,
      billable: true,
    };

    const { data: timeEntry, error } = await supabase
      .from("time_entries")
      .insert(entry)
      .select()
      .single();

    if (error) throw error;
    return timeEntry as TimeEntry;
  }

  /**
   * Parar timer ativo
   */
  async stopTimer(entryId: string) {
    // Primeiro, buscar a entrada para calcular a duração
    const { data: entry, error: fetchError } = await supabase
      .from("time_entries")
      .select("*")
      .eq("id", entryId)
      .single();

    if (fetchError) throw fetchError;

    const endTime = new Date();
    const startTime = new Date(entry.start_time);
    const durationSeconds = Math.floor((endTime.getTime() - startTime.getTime()) / 1000);
    const hourlyRate = entry.hourly_rate || 0;
    const totalCost = (durationSeconds / 3600) * hourlyRate;

    // Atualizar com end_time, duration e total_cost
    const { data, error } = await supabase
      .from("time_entries")
      .update({
        end_time: endTime.toISOString(),
        duration: durationSeconds,
        total_cost: totalCost,
      })
      .eq("id", entryId)
      .select()
      .single();

    if (error) throw error;
    
    console.log("⏱️ Timer parado:", {
      entryId,
      duration: durationSeconds,
      totalCost,
      hourlyRate
    });
    
    return data as TimeEntry;
  }

  /**
   * Obter timer ativo do usuário
   */
  async getActiveTimer() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from("time_entries")
      .select("*")
      .eq("user_id", user.id)
      .is("end_time", null)
      .order("start_time", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') throw error;
    return data as TimeEntry | null;
  }

  /**
   * Obter entradas de tempo
   */
  async getTimeEntries(filters?: {
    project_id?: string;
    task_id?: string;
    start_date?: string;
    end_date?: string;
  }) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Usuário não autenticado");

    let query = supabase
      .from("time_entries")
      .select("*")
      .eq("user_id", user.id)
      .order("start_time", { ascending: false });

    if (filters?.project_id) {
      query = query.eq("project_id", filters.project_id);
    }

    if (filters?.task_id) {
      query = query.eq("task_id", filters.task_id);
    }

    if (filters?.start_date) {
      query = query.gte("start_time", filters.start_date);
    }

    if (filters?.end_date) {
      query = query.lte("start_time", filters.end_date);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data as TimeEntry[];
  }

  /**
   * Obter resumo de tempo por projeto (apenas do usuário atual)
   */
  async getProjectTimeSummary(projectId?: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Usuário não autenticado");

    let query = supabase
      .from("project_time_summary")
      .select("*")
      .eq("user_id", user.id);

    if (projectId) {
      query = query.eq("project_id", projectId);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data as TimeEntrySummary[];
  }

  /**
   * Obter resumo de tempo da equipe inteira (todos os usuários da empresa)
   */
  async getTeamTimeSummary(dateRange?: { start: string; end: string }) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Usuário não autenticado");

    // Buscar a empresa do usuário
    const { data: profile } = await supabase
      .from("profiles")
      .select("empresa")
      .eq("id", user.id)
      .single();

    if (!profile?.empresa) {
      throw new Error("Usuário sem empresa associada");
    }

    // Buscar todas as entradas de tempo dos usuários da mesma empresa
    let query = supabase
      .from("time_entries")
      .select(`
        *,
        project:projects(id, name),
        user:profiles!time_entries_user_id_fkey(id, nome)
      `)
      .not("end_time", "is", null); // Apenas entradas finalizadas

    // Filtrar por empresa através do join com profiles
    const { data: companyUsers } = await supabase
      .from("profiles")
      .select("id")
      .eq("empresa", profile.empresa);

    if (companyUsers && companyUsers.length > 0) {
      const userIds = companyUsers.map(u => u.id);
      query = query.in("user_id", userIds);
    }

    // Aplicar filtro de data se fornecido
    if (dateRange) {
      query = query
        .gte("start_time", `${dateRange.start}T00:00:00`)
        .lte("start_time", `${dateRange.end}T23:59:59`);
    }

    const { data, error } = await query;

    if (error) throw error;

    // Processar e agrupar os dados
    interface TimeEntryWithRelations extends TimeEntry {
      project?: { id: string; name: string };
      user?: { id: string; nome: string };
    }
    
    const entries = data as TimeEntryWithRelations[];
    const summary: TimeEntrySummary[] = [];

    entries.forEach((entry) => {
      if (!entry.user || !entry.project) return;

      const duration = entry.duration || 0;
      const hours = duration / 3600; // Converter segundos para horas
      const cost = entry.total_cost || 0;

      // Buscar se já existe um resumo para este usuário + projeto
      const existing = summary.find(
        s => s.user_id === entry.user_id && s.project_id === entry.project_id
      );

      if (existing) {
        existing.entry_count++;
        existing.total_hours += hours;
        existing.total_cost += cost;
        if (entry.billable) {
          existing.billable_hours += hours;
        } else {
          existing.non_billable_hours += hours;
        }
      } else {
        summary.push({
          project_id: entry.project_id || "unknown",
          project_name: entry.project?.name || "Sem Projeto",
          user_id: entry.user_id,
          user_name: entry.user?.nome || "Usuário",
          entry_count: 1,
          total_hours: hours,
          total_cost: cost,
          billable_hours: entry.billable ? hours : 0,
          non_billable_hours: entry.billable ? 0 : hours,
        });
      }
    });

    return summary;
  }

  /**
   * Obter entradas detalhadas de tempo da equipe (para visualização expandida)
   */
  async getTeamTimeEntries(dateRange?: { start: string; end: string }) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Usuário não autenticado");

    // Primeiro tentar buscar da tabela companies
    const { data: company } = await supabase
      .from("companies")
      .select("company_name")
      .eq("user_id", user.id)
      .single();

    // Se não tem empresa cadastrada, buscar do profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("empresa")
      .eq("id", user.id)
      .single();

    // Determinar qual nome de empresa usar
    let empresaNome: string | null = null;
    
    console.log("🔍 Debug getTeamTimeEntries:", {
      company: company?.company_name,
      profile: profile?.empresa,
      hasCompany: !!company,
      hasProfile: !!profile
    });
    
    if (company?.company_name) {
      empresaNome = company.company_name;
      
      // Se o profile.empresa está diferente, sincronizar
      if (profile?.empresa !== company.company_name) {
        console.log("🔄 Sincronizando profile.empresa:", company.company_name);
        await supabase
          .from("profiles")
          .update({ empresa: company.company_name })
          .eq("id", user.id);
      }
    } else if (profile?.empresa) {
      empresaNome = profile.empresa;
    }

    if (!empresaNome) {
      console.error("❌ Nenhuma empresa encontrada!");
      throw new Error("EMPRESA_NAO_CONFIGURADA");
    }
    
    console.log("✅ Empresa encontrada:", empresaNome);

    // Buscar todas as entradas de tempo dos usuários da mesma empresa
    let query = supabase
      .from("time_entries")
      .select(`
        id,
        user_id,
        project_id,
        start_time,
        end_time,
        duration,
        description,
        hourly_rate,
        total_cost,
        billable,
        project:projects(id, name),
        user:profiles!time_entries_user_id_fkey(id, nome)
      `)
      .not("end_time", "is", null) // Apenas entradas finalizadas
      .order("start_time", { ascending: false });

    // Filtrar por empresa através do join com profiles
    const { data: companyUsers } = await supabase
      .from("profiles")
      .select("id")
      .eq("empresa", empresaNome);
    
    console.log("👥 Usuários da empresa:", companyUsers);

    if (companyUsers && companyUsers.length > 0) {
      const userIds = companyUsers.map(u => u.id);
      console.log("🔑 IDs dos usuários filtrados:", userIds);
      query = query.in("user_id", userIds);
    } else {
      console.warn("⚠️ Nenhum usuário encontrado na empresa!");
    }

    // Aplicar filtro de data se fornecido
    if (dateRange) {
      console.log("📅 Filtro de data aplicado:", dateRange);
      query = query
        .gte("start_time", `${dateRange.start}T00:00:00`)
        .lte("start_time", `${dateRange.end}T23:59:59`);
    }

    const { data, error } = await query;

    console.log("⏱️ Time entries retornadas:", {
      count: data?.length || 0,
      entries: data,
      error
    });

    if (error) throw error;

    return data;
  }

  /**
   * Atualizar entrada de tempo
   */
  async updateTimeEntry(entryId: string, updates: Partial<TimeEntryInsert>) {
    const { data, error } = await supabase
      .from("time_entries")
      .update(updates)
      .eq("id", entryId)
      .select()
      .single();

    if (error) throw error;
    return data as TimeEntry;
  }

  /**
   * Deletar entrada de tempo
   */
  async deleteTimeEntry(entryId: string) {
    const { error } = await supabase
      .from("time_entries")
      .delete()
      .eq("id", entryId);

    if (error) throw error;
  }

  /**
   * Adicionar entrada manual de tempo
   */
  async addManualEntry(data: {
    project_id?: string;
    task_id?: string;
    start_time: string;
    end_time: string;
    description?: string;
    notes?: string;
    hourly_rate?: number;
    billable?: boolean;
  }) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Usuário não autenticado");

    const entry: TimeEntryInsert = {
      user_id: user.id,
      ...data,
      billable: data.billable ?? true,
    };

    const { data: timeEntry, error } = await supabase
      .from("time_entries")
      .insert(entry)
      .select()
      .single();

    if (error) throw error;
    return timeEntry as TimeEntry;
  }
}

export const timeTrackingService = new TimeTrackingService();

