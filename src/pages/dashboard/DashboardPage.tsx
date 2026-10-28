import { useAuthStore } from "@/store/authStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Clock, 
  AlertCircle, 
  CheckCircle2,
  Calendar,
  FolderKanban,
  Timer,
  Users,
  DollarSign,
  Briefcase,
  FileText,
  Video,
  Activity,
  Target,
  TrendingDown,
  ArrowUpRight,
  Plus,
  CalendarDays,
  UserPlus,
  BarChart3,
  Zap,
  CircleDot
} from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { DynamicContainer, DynamicGrid, DynamicSpacer, ScreenDebug } from "@/components/responsive";
import { projectService } from "@/services/projectService";
import { clientService } from "@/services/clientService";
import { taskService } from "@/services/taskService";
import { meetingService } from "@/services/meetingService";
import { financeService } from "@/services/financeService";
import { timeTrackingService } from "@/services/timeTrackingService";
import { calendarService } from "@/services/calendarService";
import { toast } from "react-hot-toast";

interface DashboardStats {
  projects: {
    total: number;
    in_progress: number;
    completed: number;
    planning: number;
    paused: number;
    by_priority: {
      urgent: number;
      high: number;
      medium: number;
      low: number;
    };
  };
  clients: {
    total: number;
    active: number;
    inactive: number;
    new_this_month: number;
  };
  tasks: {
    total: number;
    today: number;
    this_week: number;
    overdue: number;
    completed_this_month: number;
  };
  meetings: {
    total: number;
    today: number;
    this_week: number;
    this_month: number;
    upcoming: Array<{
      id: string;
      title: string;
      date: string;
      time: string;
    }>;
  };
  finance: {
    revenue_this_month: number;
    revenue_last_month: number;
    expenses_this_month: number;
    profit_this_month: number;
    pending_amount: number;
    received_this_month: number;
  };
  time_tracking: {
    active_timer: {
      id: string;
      start_time: string;
      description?: string;
    } | null;
    today_hours: number;
    this_week_hours: number;
    this_month_hours: number;
    total_value_this_month: number;
  };
  calendar: {
    events_today: number;
    events_this_week: number;
    upcoming_events: Array<{
      id: string;
      title: string;
      start: string;
      end: string;
    }>;
  };
}

export function DashboardPage() {
  const { profile, user } = useAuthStore();
  const navigate = useNavigate();
  const firstName = profile?.nome?.split(" ")[0] || "Usuário";
  
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState("00:00:00");

  // Relógio em tempo real
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      const hours = String(now.getHours()).padStart(2, "0");
      const minutes = String(now.getMinutes()).padStart(2, "0");
      const seconds = String(now.getSeconds()).padStart(2, "0");
      setCurrentTime(`${hours}:${minutes}:${seconds}`);
    }, 1000);
    
    return () => clearInterval(timer);
  }, []);

  // Carregar dados do dashboard
  useEffect(() => {
    if (user) {
      loadDashboardData();
      
      // Atualizar a cada 5 minutos
      const interval = setInterval(loadDashboardData, 300000);
      return () => clearInterval(interval);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const loadDashboardData = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Buscar dados em paralelo
      const [
        projects,
        clients,
        tasks,
        meetings,
        transactions,
        timeEntries,
        calendarEvents
      ] = await Promise.all([
        projectService.getAllProjects(),
        clientService.getAllClients(),
        taskService.getTasks(),
        meetingService.getMeetings(),
        financeService.getTransactions(),
        timeTrackingService.getTimeEntries(),
        calendarService.getEvents()
      ]);

      // Processar estatísticas de projetos
      const projectStats = {
        total: projects.length,
        in_progress: projects.filter(p => p.status === 'in_progress').length,
        completed: projects.filter(p => p.status === 'completed').length,
        planning: projects.filter(p => p.status === 'planning').length,
        paused: projects.filter(p => p.status === 'paused').length,
        by_priority: {
          urgent: projects.filter(p => p.priority === 'urgent').length,
          high: projects.filter(p => p.priority === 'high').length,
          medium: projects.filter(p => p.priority === 'medium').length,
          low: projects.filter(p => p.priority === 'low').length,
        }
      };

      // Processar estatísticas de clientes
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const clientStats = {
        total: clients.length,
        active: clients.filter(c => c.status === 'active').length,
        inactive: clients.filter(c => c.status === 'inactive').length,
        new_this_month: clients.filter(c => 
          c.created_at && new Date(c.created_at) >= startOfMonth
        ).length
      };

      // Processar estatísticas de tarefas
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const weekEnd = new Date(today);
      weekEnd.setDate(weekEnd.getDate() + 7);

      const taskStats = {
        total: tasks.length,
        today: tasks.filter(t => {
          if (!t.due_date) return false;
          const dueDate = new Date(t.due_date);
          return dueDate >= today && dueDate < tomorrow;
        }).length,
        this_week: tasks.filter(t => {
          if (!t.due_date) return false;
          const dueDate = new Date(t.due_date);
          return dueDate >= today && dueDate < weekEnd;
        }).length,
        overdue: tasks.filter(t => {
          if (!t.due_date || t.status === 'completed') return false;
          return new Date(t.due_date) < today;
        }).length,
        completed_this_month: tasks.filter(t => 
          t.status === 'completed' && 
          t.completed_at && 
          new Date(t.completed_at) >= startOfMonth
        ).length
      };

      // Processar estatísticas de reuniões
      const upcomingMeetings = meetings
        .filter(m => new Date(m.meeting_date) >= now && m.status !== 'completed')
        .sort((a, b) => new Date(a.meeting_date).getTime() - new Date(b.meeting_date).getTime())
        .slice(0, 5)
        .map(m => ({
          id: m.id,
          title: m.title,
          date: new Date(m.meeting_date).toLocaleDateString('pt-BR'),
          time: m.start_time || '00:00'
        }));

      const meetingStats = {
        total: meetings.length,
        today: meetings.filter(m => {
          const meetingDate = new Date(m.meeting_date);
          return meetingDate >= today && meetingDate < tomorrow;
        }).length,
        this_week: meetings.filter(m => {
          const meetingDate = new Date(m.meeting_date);
          return meetingDate >= today && meetingDate < weekEnd;
        }).length,
        this_month: meetings.filter(m => 
          new Date(m.meeting_date) >= startOfMonth
        ).length,
        upcoming: upcomingMeetings
      };

      // Processar estatísticas financeiras
      const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
      
      const thisMonthTransactions = transactions.filter(t => 
        new Date(t.due_date) >= startOfMonth
      );
      
      const lastMonthTransactions = transactions.filter(t => {
        const date = new Date(t.due_date);
        return date >= startOfLastMonth && date <= endOfLastMonth;
      });

      const financeStats = {
        revenue_this_month: thisMonthTransactions
          .filter(t => t.type === 'income')
          .reduce((sum, t) => sum + t.amount, 0),
        revenue_last_month: lastMonthTransactions
          .filter(t => t.type === 'income')
          .reduce((sum, t) => sum + t.amount, 0),
        expenses_this_month: thisMonthTransactions
          .filter(t => t.type === 'expense')
          .reduce((sum, t) => sum + t.amount, 0),
        profit_this_month: 0,
        pending_amount: transactions
          .filter(t => t.status === 'pending')
          .reduce((sum, t) => sum + t.amount, 0),
        received_this_month: thisMonthTransactions
          .filter(t => t.type === 'income' && t.status === 'paid')
          .reduce((sum, t) => sum + t.amount, 0)
      };
      financeStats.profit_this_month = financeStats.revenue_this_month - financeStats.expenses_this_month;

      // Processar estatísticas de time tracking
      const activeTimer = timeEntries.find(e => !e.end_time);
      
      const todayEntries = timeEntries.filter(e => {
        const entryDate = new Date(e.start_time);
        return entryDate >= today && entryDate < tomorrow;
      });

      const weekEntries = timeEntries.filter(e => {
        const entryDate = new Date(e.start_time);
        return entryDate >= today && entryDate < weekEnd;
      });

      const monthEntries = timeEntries.filter(e => 
        new Date(e.start_time) >= startOfMonth
      );

      const timeTrackingStats = {
        active_timer: activeTimer || null,
        today_hours: todayEntries.reduce((sum, e) => {
          if (e.end_time) {
            const duration = new Date(e.end_time).getTime() - new Date(e.start_time).getTime();
            return sum + (duration / 1000 / 60 / 60); // Convert to hours
          }
          return sum;
        }, 0),
        this_week_hours: weekEntries.reduce((sum, e) => {
          if (e.end_time) {
            const duration = new Date(e.end_time).getTime() - new Date(e.start_time).getTime();
            return sum + (duration / 1000 / 60 / 60);
          }
          return sum;
        }, 0),
        this_month_hours: monthEntries.reduce((sum, e) => {
          if (e.end_time) {
            const duration = new Date(e.end_time).getTime() - new Date(e.start_time).getTime();
            return sum + (duration / 1000 / 60 / 60);
          }
          return sum;
        }, 0),
        total_value_this_month: monthEntries.reduce((sum, e) => {
          if (e.end_time && e.hourly_rate) {
            const duration = new Date(e.end_time).getTime() - new Date(e.start_time).getTime();
            const hours = duration / 1000 / 60 / 60;
            return sum + (hours * e.hourly_rate);
          }
          return sum;
        }, 0)
      };

      // Processar eventos do calendário
      const todayEvents = calendarEvents.filter(e => {
        const eventDate = new Date(e.start_time);
        return eventDate >= today && eventDate < tomorrow;
      });

      const weekEvents = calendarEvents.filter(e => {
        const eventDate = new Date(e.start_time);
        return eventDate >= today && eventDate < weekEnd;
      });

      const upcomingEvents = calendarEvents
        .filter(e => new Date(e.start_time) >= now)
        .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime())
        .slice(0, 3)
        .map(e => ({
          id: e.id,
          title: e.title,
          start: new Date(e.start_time).toLocaleString('pt-BR'),
          end: e.end_time ? new Date(e.end_time).toLocaleString('pt-BR') : 'Sem término'
        }));

      const calendarStats = {
        events_today: todayEvents.length,
        events_this_week: weekEvents.length,
        upcoming_events: upcomingEvents
      };

      setStats({
        projects: projectStats,
        clients: clientStats,
        tasks: taskStats,
        meetings: meetingStats,
        finance: financeStats,
        time_tracking: timeTrackingStats,
        calendar: calendarStats
      });

    } catch (error) {
      console.error('Erro ao carregar dados do dashboard:', error);
      toast.error('Erro ao carregar dados do dashboard');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatHours = (hours: number) => {
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    return `${h}h ${m}m`;
  };

  const calculatePercentageChange = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  };

  const today = new Date().toLocaleDateString("pt-BR", { 
    day: "2-digit", 
    month: "2-digit",
    year: "numeric"
  });

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Bom dia";
    if (hour < 18) return "Boa tarde";
    return "Boa noite";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-200px)]">
        <div className="text-center space-y-4">
          <div className="animate-spin h-12 w-12 border-4 border-[var(--primary)] border-t-transparent rounded-full mx-auto" />
          <p className="text-[var(--text-secondary)]">Carregando dashboard...</p>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-200px)]">
        <div className="text-center space-y-4">
          <AlertCircle className="h-12 w-12 text-[var(--text-secondary)] mx-auto" />
          <p className="text-[var(--text-secondary)]">Erro ao carregar dados</p>
          <Button onClick={loadDashboardData}>Tentar novamente</Button>
        </div>
      </div>
    );
  }

  const revenueChange = calculatePercentageChange(
    stats.finance.revenue_this_month,
    stats.finance.revenue_last_month
  );

  return (
    <DynamicContainer>
      <ScreenDebug position="bottom-right" />
      
      {/* Header com Saudação */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-[var(--text)]">
            {greeting()}, {firstName}! 👋
          </h1>
          <p className="text-xs sm:text-sm text-[var(--text-secondary)] mt-1">
            {today} • {currentTime}
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => navigate('/projects')} className="gap-2" size="sm">
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Novo Projeto</span>
            <span className="sm:hidden">Projeto</span>
          </Button>
          <Button onClick={() => navigate('/clients')} variant="outline" className="gap-2" size="sm">
            <UserPlus className="h-4 w-4" />
            <span className="hidden sm:inline">Novo Cliente</span>
            <span className="sm:hidden">Cliente</span>
          </Button>
        </div>
      </div>

      <DynamicSpacer size="md" />

      {/* Cards Principais - Resumo Rápido */}
      <DynamicGrid columns={4}>
        {/* Projetos Ativos */}
        <Card 
          className="cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => navigate('/projects')}
        >
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-[var(--text-secondary)]">
                Projetos Ativos
              </CardTitle>
              <FolderKanban className="h-4 w-4 text-[var(--primary)]" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-[var(--text)]">
              {stats.projects.in_progress}
            </div>
            <p className="text-xs text-[var(--text-secondary)] mt-1">
              {stats.projects.total} projetos no total
            </p>
          </CardContent>
        </Card>

        {/* Clientes Ativos */}
        <Card 
          className="cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => navigate('/clients')}
        >
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-[var(--text-secondary)]">
                Clientes Ativos
              </CardTitle>
              <Users className="h-4 w-4 text-[var(--primary)]" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-[var(--text)]">
              {stats.clients.active}
            </div>
            <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
              <ArrowUpRight className="h-3 w-3" />
              +{stats.clients.new_this_month} este mês
            </p>
          </CardContent>
        </Card>

        {/* Receita do Mês */}
        <Card 
          className="cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => navigate('/finance')}
        >
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-[var(--text-secondary)]">
                Receita do Mês
              </CardTitle>
              <DollarSign className="h-4 w-4 text-green-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-[var(--text)]">
              {formatCurrency(stats.finance.revenue_this_month)}
            </div>
            <p className={`text-xs mt-1 flex items-center gap-1 ${
              revenueChange >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {revenueChange >= 0 ? (
                <ArrowUpRight className="h-3 w-3" />
              ) : (
                <TrendingDown className="h-3 w-3" />
              )}
              {Math.abs(revenueChange).toFixed(1)}% vs mês anterior
            </p>
          </CardContent>
        </Card>

        {/* Tarefas Hoje */}
        <Card 
          className="cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => navigate('/calendar')}
        >
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-[var(--text-secondary)]">
                Tarefas Hoje
              </CardTitle>
              <CheckCircle2 className="h-4 w-4 text-[var(--primary)]" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-[var(--text)]">
              {stats.tasks.today}
            </div>
            <p className="text-xs text-[var(--text-secondary)] mt-1">
              {stats.tasks.overdue > 0 && (
                <span className="text-red-600">{stats.tasks.overdue} atrasadas</span>
              )}
              {stats.tasks.overdue === 0 && "Tudo em dia!"}
            </p>
          </CardContent>
        </Card>
      </DynamicGrid>

      <DynamicSpacer size="md" />

      {/* Timer Ativo (se houver) */}
      {stats.time_tracking.active_timer && (
        <Card className="border-2 border-[var(--primary)] bg-gradient-to-r from-[var(--primary)]/5 to-transparent">
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <Timer className="h-8 w-8 text-[var(--primary)]" />
                  <CircleDot className="h-3 w-3 text-red-500 absolute -top-1 -right-1 animate-pulse" />
                </div>
                <div>
                  <p className="font-semibold text-[var(--text)]">
                    Timer em andamento
                  </p>
                  <p className="text-sm text-[var(--text-secondary)]">
                    {stats.time_tracking.active_timer.description || 'Sem descrição'}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-mono font-bold text-[var(--primary)]">
                  {currentTime}
                </p>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => navigate('/calendar')}
                  className="mt-2"
                >
                  Ver Timer
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
        )}

      <DynamicSpacer size="lg" />

      {/* Grid Principal */}
      <DynamicGrid columns={3}>
        
        {/* Coluna 1 - Projetos e Prioridades */}
          <div className="space-y-4">
          {/* Projetos por Status */}
          <Card 
            className="cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => navigate('/projects')}
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="h-5 w-5 text-[var(--primary)]" />
                Status dos Projetos
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-blue-500" />
                  <span className="text-sm">Em Andamento</span>
                </div>
                <span className="font-semibold">{stats.projects.in_progress}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-yellow-500" />
                  <span className="text-sm">Planejamento</span>
                </div>
                <span className="font-semibold">{stats.projects.planning}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                  <span className="text-sm">Concluídos</span>
                </div>
                <span className="font-semibold">{stats.projects.completed}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-gray-500" />
                  <span className="text-sm">Pausados</span>
                </div>
                <span className="font-semibold">{stats.projects.paused}</span>
              </div>
            </CardContent>
          </Card>

          {/* Prioridades */}
          <Card 
            className="cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => navigate('/projects')}
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-orange-500" />
                Por Prioridade
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {stats.projects.by_priority.urgent > 0 && (
                <div className="flex items-center justify-between p-2 bg-red-50 dark:bg-red-900/20 rounded-md">
                  <div className="flex items-center gap-2">
                    <Zap className="h-4 w-4 text-red-600" />
                    <span className="text-sm font-medium">Urgente</span>
                  </div>
                  <Badge variant="destructive">{stats.projects.by_priority.urgent}</Badge>
                </div>
              )}
              {stats.projects.by_priority.high > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-sm">Alta</span>
                  <Badge className="bg-orange-500">{stats.projects.by_priority.high}</Badge>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-sm text-[var(--text-secondary)]">Média</span>
                <span className="font-semibold">{stats.projects.by_priority.medium}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-[var(--text-secondary)]">Baixa</span>
                <span className="font-semibold">{stats.projects.by_priority.low}</span>
              </div>
            </CardContent>
          </Card>

          {/* Time Tracking */}
          <Card 
            className="cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => navigate('/calendar')}
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-[var(--primary)]" />
                Horas Trabalhadas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Hoje</span>
                <span className="font-semibold">{formatHours(stats.time_tracking.today_hours)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Esta Semana</span>
                <span className="font-semibold">{formatHours(stats.time_tracking.this_week_hours)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Este Mês</span>
                <span className="font-semibold">{formatHours(stats.time_tracking.this_month_hours)}</span>
              </div>
              <div className="pt-3 border-t">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Valor do Mês</span>
                  <span className="font-bold text-green-600">
                    {formatCurrency(stats.time_tracking.total_value_this_month)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Coluna 2 - Agenda e Tarefas */}
        <div className="space-y-4">
          {/* Próximas Reuniões */}
          <Card 
            className="cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => navigate('/meetings')}
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-[var(--primary)]" />
                Próximas Reuniões
              </CardTitle>
            </CardHeader>
            <CardContent>
              {stats.meetings.upcoming.length === 0 ? (
                <p className="text-sm text-[var(--text-secondary)] text-center py-4">
                  Nenhuma reunião agendada
                </p>
              ) : (
                <div className="space-y-3">
                  {stats.meetings.upcoming.map((meeting) => (
                    <div 
                      key={meeting.id}
                      className="flex items-start gap-3 p-2 hover:bg-[var(--muted)] rounded-md cursor-pointer transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate('/meetings');
                      }}
                    >
                      <Clock className="h-4 w-4 text-[var(--primary)] mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{meeting.title}</p>
                        <p className="text-xs text-[var(--text-secondary)]">
                          {meeting.date} às {meeting.time}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Tarefas */}
          <Card 
            className="cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => navigate('/calendar')}
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                Resumo de Tarefas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-[var(--muted)] rounded-md">
                  <p className="text-2xl font-bold text-[var(--text)]">{stats.tasks.today}</p>
                  <p className="text-xs text-[var(--text-secondary)]">Hoje</p>
                </div>
                <div className="text-center p-3 bg-[var(--muted)] rounded-md">
                  <p className="text-2xl font-bold text-[var(--text)]">{stats.tasks.this_week}</p>
                  <p className="text-xs text-[var(--text-secondary)]">Esta Semana</p>
                </div>
              </div>
              {stats.tasks.overdue > 0 && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-md border border-red-200 dark:border-red-800">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-red-600" />
                      <span className="text-sm font-medium text-red-600">Atrasadas</span>
                    </div>
                    <Badge variant="destructive">{stats.tasks.overdue}</Badge>
                  </div>
                </div>
              )}
              <div className="pt-3 border-t">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Concluídas este mês</span>
                  <span className="font-semibold text-green-600">
                    {stats.tasks.completed_this_month}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Eventos do Calendário */}
          <Card 
            className="cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => navigate('/calendar')}
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarDays className="h-5 w-5 text-[var(--primary)]" />
                Próximos Eventos
              </CardTitle>
            </CardHeader>
            <CardContent>
              {stats.calendar.upcoming_events.length === 0 ? (
                <p className="text-sm text-[var(--text-secondary)] text-center py-4">
                  Nenhum evento próximo
                </p>
              ) : (
                <div className="space-y-3">
                  {stats.calendar.upcoming_events.map((event) => (
                    <div 
                      key={event.id}
                      className="flex items-start gap-3 p-2 hover:bg-[var(--muted)] rounded-md cursor-pointer transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate('/calendar');
                      }}
                    >
                      <div className="w-2 h-2 rounded-full bg-[var(--primary)] mt-2" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{event.title}</p>
                        <p className="text-xs text-[var(--text-secondary)]">
                          {event.start}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Coluna 3 - Financeiro */}
        <div className="space-y-4">
          {/* Resumo Financeiro */}
          <Card 
            className="cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => navigate('/finance')}
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-green-600" />
                Financeiro - Este Mês
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-xs text-[var(--text-secondary)] mb-1">Receita</p>
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(stats.finance.revenue_this_month)}
                </p>
              </div>
              <div>
                <p className="text-xs text-[var(--text-secondary)] mb-1">Despesas</p>
                <p className="text-2xl font-bold text-red-600">
                  {formatCurrency(stats.finance.expenses_this_month)}
                </p>
              </div>
              <div className="pt-3 border-t">
                <p className="text-xs text-[var(--text-secondary)] mb-1">Lucro</p>
                <p className={`text-2xl font-bold ${
                  stats.finance.profit_this_month >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {formatCurrency(stats.finance.profit_this_month)}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Valores Pendentes */}
          {stats.finance.pending_amount > 0 && (
            <Card 
              className="border-orange-200 dark:border-orange-800 cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => navigate('/finance')}
            >
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-orange-600">
                  <Target className="h-5 w-5" />
                  Valores Pendentes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-orange-600">
                  {formatCurrency(stats.finance.pending_amount)}
                </p>
                <p className="text-xs text-[var(--text-secondary)] mt-2">
                  Aguardando recebimento
                </p>
              </CardContent>
            </Card>
          )}

          {/* Estatísticas Gerais */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-[var(--primary)]" />
                Visão Geral
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FolderKanban className="h-4 w-4 text-[var(--text-secondary)]" />
                  <span className="text-sm">Total de Projetos</span>
                </div>
                <span className="font-semibold">{stats.projects.total}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-[var(--text-secondary)]" />
                  <span className="text-sm">Total de Clientes</span>
                </div>
                <span className="font-semibold">{stats.clients.total}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-[var(--text-secondary)]" />
                  <span className="text-sm">Reuniões este Mês</span>
                </div>
                <span className="font-semibold">{stats.meetings.this_month}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-[var(--text-secondary)]" />
                  <span className="text-sm">Tarefas Totais</span>
                </div>
                <span className="font-semibold">{stats.tasks.total}</span>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Ações Rápidas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button 
                variant="outline" 
                className="w-full justify-start gap-2"
                onClick={() => navigate('/meetings')}
              >
                <Video className="h-4 w-4" />
                Nova Reunião
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start gap-2"
                onClick={() => navigate('/calendar')}
              >
                <CalendarDays className="h-4 w-4" />
                Ver Calendário
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start gap-2"
                onClick={() => navigate('/finance')}
              >
                <DollarSign className="h-4 w-4" />
                Lançamentos
              </Button>
            </CardContent>
          </Card>
        </div>
      </DynamicGrid>

      <DynamicSpacer size="lg" />

      {/* Botão de Atualizar */}
        <div className="flex justify-center">
        <Button 
          variant="outline" 
          onClick={loadDashboardData}
          className="gap-2"
        >
          <Activity className="h-4 w-4" />
          Atualizar Dashboard
        </Button>
      </div>
    </DynamicContainer>
  );
}
