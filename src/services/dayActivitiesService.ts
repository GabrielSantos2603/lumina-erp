import { supabase } from "@/lib/supabase";

export interface DayActivity {
  id: string;
  type: 'client' | 'project' | 'timer' | 'task' | 'transaction' | 'team' | 'meeting';
  action: 'created' | 'updated' | 'completed' | 'status_changed' | 'deleted';
  title: string;
  description?: string;
  metadata?: Record<string, string | number | boolean | null>;
  created_at: string;
  data: unknown;
}

export interface DayActivitiesSummary {
  date: string;
  clients: {
    created: number;
    updated: number;
  };
  projects: {
    created: number;
    updated: number;
    completed: number;
    status_changed: number;
  };
  timers: {
    count: number;
    total_hours: number;
    total_cost: number;
  };
  tasks: {
    created: number;
    completed: number;
    updated: number;
  };
  transactions: {
    income: {
      count: number;
      total: number;
    };
    expense: {
      count: number;
      total: number;
    };
  };
  team: {
    added: number;
  };
  meetings: {
    scheduled: number;
    completed: number;
  };
}

class DayActivitiesService {
  /**
   * Buscar todas as atividades de um dia (OTIMIZADO COM PROMISE.ALL)
   */
  async getDayActivities(date: Date): Promise<DayActivity[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Usuário não autenticado");

    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const activities: DayActivity[] = [];

    // EXECUTAR TODAS AS QUERIES EM PARALELO
    const [
      clientsRes,
      projectsRes,
      timeEntriesRes,
      tasksRes,
      transactionsRes,
      teamRes,
      meetingsRes,
    ] = await Promise.all([
      // Clientes (apenas criados no dia)
      supabase
        .from("clients")
        .select("id, name, type, city, status, created_at, updated_at")
        .eq("user_id", user.id)
        .gte("created_at", startOfDay.toISOString())
        .lte("created_at", endOfDay.toISOString())
        .order("created_at", { ascending: false })
        .limit(100),

      // Projetos (apenas criados no dia)
      supabase
        .from("projects")
        .select("id, name, status, category, budget, created_at, updated_at, client:clients(name)")
        .eq("user_id", user.id)
        .gte("created_at", startOfDay.toISOString())
        .lte("created_at", endOfDay.toISOString())
        .order("created_at", { ascending: false })
        .limit(100),

      // Time entries
      supabase
        .from("time_entries")
        .select("id, description, duration, total_cost, start_time, project:projects(name)")
        .eq("user_id", user.id)
        .gte("start_time", startOfDay.toISOString())
        .lte("start_time", endOfDay.toISOString())
        .order("start_time", { ascending: false })
        .limit(200),

      // Tarefas (apenas criadas no dia)
      supabase
        .from("tasks")
        .select("id, title, status, priority, project_id, created_at, updated_at")
        .eq("user_id", user.id)
        .gte("created_at", startOfDay.toISOString())
        .lte("created_at", endOfDay.toISOString())
        .order("created_at", { ascending: false })
        .limit(100),

      // Transações
      supabase
        .from("transactions")
        .select("id, description, type, amount, category, created_at")
        .eq("user_id", user.id)
        .gte("created_at", startOfDay.toISOString())
        .lte("created_at", endOfDay.toISOString())
        .order("created_at", { ascending: false })
        .limit(100),

      // Equipe
      supabase
        .from("team")
        .select("id, name, role, email, status, created_at")
        .eq("user_id", user.id)
        .gte("created_at", startOfDay.toISOString())
        .lte("created_at", endOfDay.toISOString())
        .order("created_at", { ascending: false })
        .limit(50),

      // Reuniões
      supabase
        .from("meetings")
        .select("id, title, type, platform, status, participants_count, meeting_time, created_at")
        .eq("user_id", user.id)
        .eq("meeting_date", date.toISOString().split("T")[0])
        .order("meeting_time", { ascending: false })
        .limit(50),
    ]);

    // Processar clientes
    clientsRes.data?.forEach((client) => {
      const isNew = new Date(client.created_at).getTime() === new Date(client.updated_at).getTime();
      activities.push({
        id: client.id,
        type: "client",
        action: isNew ? "created" : "updated",
        title: client.name,
        description: `${client.type === 'residential' ? 'Residencial' : 'Comercial'} - ${client.city}`,
        metadata: { status: client.status, type: client.type },
        created_at: client.created_at,
        data: client,
      });
    });

    // Processar projetos
    projectsRes.data?.forEach((project) => {
      const isNew = new Date(project.created_at).getTime() === new Date(project.updated_at).getTime();
      activities.push({
        id: project.id,
        type: "project",
        action: isNew ? "created" : "updated",
        title: project.name,
        description: `${(project.client as any)?.name || 'Sem cliente'} - ${project.status}`,
        metadata: { 
          status: project.status, 
          category: project.category,
          budget: project.budget 
        },
        created_at: project.created_at,
        data: project,
      });
    });

    // Processar time entries (agrupados)
    if (timeEntriesRes.data && timeEntriesRes.data.length > 0) {
      const entries = timeEntriesRes.data;
      const totalHours = entries.reduce((sum, entry) => sum + ((entry.duration || 0) / 3600), 0);
      const totalCost = entries.reduce((sum, entry) => sum + (entry.total_cost || 0), 0);

      activities.push({
        id: `timers-${date.toISOString()}`,
        type: "timer",
        action: "created",
        title: `${entries.length} timer${entries.length > 1 ? 's' : ''} registrado${entries.length > 1 ? 's' : ''}`,
        description: `${totalHours.toFixed(2)}h trabalhadas - R$ ${totalCost.toFixed(2)}`,
        metadata: { count: entries.length, hours: totalHours, cost: totalCost },
        created_at: entries[0].start_time,
        data: entries,
      });
    }

    // Processar tarefas
    tasksRes.data?.forEach((task) => {
      const isNew = new Date(task.created_at).getTime() === new Date(task.updated_at).getTime();
      const isCompleted = task.status === "done" && 
        new Date(task.updated_at) >= startOfDay && 
        new Date(task.updated_at) <= endOfDay;

      activities.push({
        id: task.id,
        type: "task",
        action: isCompleted ? "completed" : isNew ? "created" : "status_changed",
        title: task.title,
        description: `Status: ${task.status} - Prioridade: ${task.priority}`,
        metadata: { 
          status: task.status, 
          priority: task.priority,
          project_id: task.project_id 
        },
        created_at: isNew ? task.created_at : task.updated_at,
        data: task,
      });
    });

    // Processar transações
    transactionsRes.data?.forEach((t) => {
      activities.push({
        id: t.id,
        type: "transaction",
        action: "created",
        title: t.description,
        description: `${t.type === "income" ? "Receita" : "Despesa"} - R$ ${t.amount.toFixed(2)}`,
        metadata: { type: t.type, amount: t.amount, category: t.category },
        created_at: t.created_at,
        data: t,
      });
    });

    // Processar equipe
    teamRes.data?.forEach((member) => {
      activities.push({
        id: member.id,
        type: "team",
        action: "created",
        title: member.name,
        description: `${member.role} - ${member.email}`,
        metadata: { role: member.role, email: member.email, status: member.status },
        created_at: member.created_at,
        data: member,
      });
    });

    // Processar reuniões
    meetingsRes.data?.forEach((meeting) => {
      activities.push({
        id: meeting.id,
        type: "meeting",
        action: meeting.status === "completed" ? "completed" : "created",
        title: meeting.title,
        description: `${meeting.type} - ${meeting.platform} - ${meeting.meeting_time || 'Sem horário'}`,
        metadata: {
          type: meeting.type,
          platform: meeting.platform,
          status: meeting.status,
          participants_count: meeting.participants_count,
        },
        created_at: meeting.meeting_time 
          ? `${date.toISOString().split("T")[0]}T${meeting.meeting_time}`
          : meeting.created_at,
        data: meeting,
      });
    });

    // Ordenar por timestamp
    return activities.sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }

  /**
   * Gerar resumo das atividades do dia
   */
  async getDaySummary(date: Date): Promise<DayActivitiesSummary> {
    const activities = await this.getDayActivities(date);

    const summary: DayActivitiesSummary = {
      date: date.toISOString().split('T')[0],
      clients: { created: 0, updated: 0 },
      projects: { created: 0, updated: 0, completed: 0, status_changed: 0 },
      timers: { count: 0, total_hours: 0, total_cost: 0 },
      tasks: { created: 0, completed: 0, updated: 0 },
      transactions: { 
        income: { count: 0, total: 0 },
        expense: { count: 0, total: 0 }
      },
      team: { added: 0 },
      meetings: { scheduled: 0, completed: 0 },
    };

    activities.forEach(activity => {
      switch (activity.type) {
        case 'client':
          if (activity.action === 'created') summary.clients.created++;
          else if (activity.action === 'updated') summary.clients.updated++;
          break;

        case 'project':
          if (activity.action === 'created') summary.projects.created++;
          else if (activity.action === 'completed') summary.projects.completed++;
          else if (activity.action === 'status_changed') summary.projects.status_changed++;
          else if (activity.action === 'updated') summary.projects.updated++;
          break;

        case 'timer':
          summary.timers.count = Number(activity.metadata?.count) || 0;
          summary.timers.total_hours = Number(activity.metadata?.hours) || 0;
          summary.timers.total_cost = Number(activity.metadata?.cost) || 0;
          break;

        case 'task':
          if (activity.action === 'created') summary.tasks.created++;
          else if (activity.action === 'completed') summary.tasks.completed++;
          else if (activity.action === 'updated' || activity.action === 'status_changed') {
            summary.tasks.updated++;
          }
          break;

        case 'transaction': {
          const type = activity.metadata?.type as string;
          const amount = Number(activity.metadata?.amount) || 0;
          if (type === 'income') {
            summary.transactions.income.count++;
            summary.transactions.income.total += amount;
          } else if (type === 'expense') {
            summary.transactions.expense.count++;
            summary.transactions.expense.total += amount;
          }
          break;
        }

        case 'team':
          summary.team.added++;
          break;

        case 'meeting':
          if (activity.action === 'completed') summary.meetings.completed++;
          else summary.meetings.scheduled++;
          break;
      }
    });

    return summary;
  }

  /**
   * Buscar contagem de atividades por dia do mês (OTIMIZADO)
   */
  async getMonthActivities(year: number, month: number): Promise<Map<string, number>> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return new Map();

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59, 999);

    // Executar contagens em paralelo (COUNT é muito mais rápido que SELECT *)
    const [
      clientsCount,
      projectsCount,
      timeEntriesCount,
      tasksCount,
      transactionsCount,
      teamCount,
      meetingsCount,
    ] = await Promise.all([
      supabase
        .from("clients")
        .select("created_at", { count: 'exact', head: false })
        .eq("user_id", user.id)
        .gte("created_at", startDate.toISOString())
        .lte("created_at", endDate.toISOString()),

      supabase
        .from("projects")
        .select("created_at", { count: 'exact', head: false })
        .eq("user_id", user.id)
        .gte("created_at", startDate.toISOString())
        .lte("created_at", endDate.toISOString()),

      supabase
        .from("time_entries")
        .select("start_time", { count: 'exact', head: false })
        .eq("user_id", user.id)
        .gte("start_time", startDate.toISOString())
        .lte("start_time", endDate.toISOString()),

      supabase
        .from("tasks")
        .select("created_at", { count: 'exact', head: false })
        .eq("user_id", user.id)
        .gte("created_at", startDate.toISOString())
        .lte("created_at", endDate.toISOString()),

      supabase
        .from("transactions")
        .select("created_at", { count: 'exact', head: false })
        .eq("user_id", user.id)
        .gte("created_at", startDate.toISOString())
        .lte("created_at", endDate.toISOString()),

      supabase
        .from("team")
        .select("created_at", { count: 'exact', head: false })
        .eq("user_id", user.id)
        .gte("created_at", startDate.toISOString())
        .lte("created_at", endDate.toISOString()),

      supabase
        .from("meetings")
        .select("meeting_date", { count: 'exact', head: false })
        .eq("user_id", user.id)
        .gte("meeting_date", startDate.toISOString().split('T')[0])
        .lte("meeting_date", endDate.toISOString().split('T')[0]),
    ]);

    // Agrupar por dia
    const counts = new Map<string, number>();

    const addToCount = (data: Array<Record<string, unknown>>, dateField: string) => {
      data?.forEach(item => {
        const date = new Date(item[dateField] as string).toISOString().split('T')[0];
        counts.set(date, (counts.get(date) || 0) + 1);
      });
    };

    addToCount(clientsCount.data || [], 'created_at');
    addToCount(projectsCount.data || [], 'created_at');
    addToCount(timeEntriesCount.data || [], 'start_time');
    addToCount(tasksCount.data || [], 'created_at');
    addToCount(transactionsCount.data || [], 'created_at');
    addToCount(teamCount.data || [], 'created_at');
    addToCount(meetingsCount.data || [], 'meeting_date');

    return counts;
  }

  /**
   * Buscar atividades categorizadas do mês (para exibição no calendário)
   */
  async getMonthActivitiesCategorized(year: number, month: number): Promise<Map<string, {
    total: number;
    tasks: number;
    meetings: number;
    transactions: number;
    clients: number;
    projects: number;
  }>> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return new Map();

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59, 999);

    // Executar queries em paralelo
    const [
      clientsData,
      projectsData,
      tasksData,
      transactionsData,
      meetingsData,
    ] = await Promise.all([
      supabase
        .from("clients")
        .select("created_at")
        .eq("user_id", user.id)
        .gte("created_at", startDate.toISOString())
        .lte("created_at", endDate.toISOString()),

      supabase
        .from("projects")
        .select("created_at")
        .eq("user_id", user.id)
        .gte("created_at", startDate.toISOString())
        .lte("created_at", endDate.toISOString()),

      supabase
        .from("tasks")
        .select("created_at, due_date")
        .eq("user_id", user.id)
        .or(`created_at.gte.${startDate.toISOString()},due_date.gte.${startDate.toISOString().split('T')[0]}`)
        .or(`created_at.lte.${endDate.toISOString()},due_date.lte.${endDate.toISOString().split('T')[0]}`),

      supabase
        .from("transactions")
        .select("created_at")
        .eq("user_id", user.id)
        .gte("created_at", startDate.toISOString())
        .lte("created_at", endDate.toISOString()),

      supabase
        .from("meetings")
        .select("meeting_date")
        .eq("user_id", user.id)
        .gte("meeting_date", startDate.toISOString().split('T')[0])
        .lte("meeting_date", endDate.toISOString().split('T')[0]),
    ]);

    // Agrupar por dia
    const categorized = new Map<string, {
      total: number;
      tasks: number;
      meetings: number;
      transactions: number;
      clients: number;
      projects: number;
    }>();

    const addToCategorized = (
      data: Array<Record<string, unknown>> | null,
      dateField: string,
      category: 'tasks' | 'meetings' | 'transactions' | 'clients' | 'projects'
    ) => {
      data?.forEach(item => {
        const dateValue = item[dateField] as string;
        if (!dateValue) return;
        
        const date = new Date(dateValue).toISOString().split('T')[0];
        
        if (!categorized.has(date)) {
          categorized.set(date, {
            total: 0,
            tasks: 0,
            meetings: 0,
            transactions: 0,
            clients: 0,
            projects: 0,
          });
        }
        
        const current = categorized.get(date)!;
        current[category]++;
        current.total++;
      });
    };

    addToCategorized(clientsData.data, 'created_at', 'clients');
    addToCategorized(projectsData.data, 'created_at', 'projects');
    addToCategorized(tasksData.data, 'created_at', 'tasks');
    // Adicionar tarefas também por due_date
    tasksData.data?.forEach(task => {
      if (task.due_date) {
        const date = new Date(task.due_date as string).toISOString().split('T')[0];
        if (!categorized.has(date)) {
          categorized.set(date, {
            total: 0,
            tasks: 0,
            meetings: 0,
            transactions: 0,
            clients: 0,
            projects: 0,
          });
        }
        const current = categorized.get(date)!;
        current.tasks++;
        current.total++;
      }
    });
    addToCategorized(transactionsData.data, 'created_at', 'transactions');
    addToCategorized(meetingsData.data, 'meeting_date', 'meetings');

    return categorized;
  }
}

export const dayActivitiesService = new DayActivitiesService();
