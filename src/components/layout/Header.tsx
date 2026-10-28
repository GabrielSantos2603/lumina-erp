import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Menu, 
  Sparkles, 
  Zap,
  TrendingUp,
  Clock,
  Target,
  DollarSign,
  Activity,
  Timer,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuthStore } from "@/store/authStore";
import { NotificationsDropdown } from "./NotificationsDropdown";
import { UserMenu } from "./UserMenu";
import { ThemeToggle } from "./ThemeToggle";
import { cn } from "@/utils/cn";
import { useDailyMetrics } from "@/hooks/useDailyMetrics";

interface HeaderProps {
  onToggleSidebar?: () => void;
  isSidebarCollapsed?: boolean;
}

export function Header({ onToggleSidebar, isSidebarCollapsed = false }: HeaderProps) {
  const { profile, user } = useAuthStore();
  const navigate = useNavigate();
  const [greeting, setGreeting] = useState("");
  const [currentTime, setCurrentTime] = useState("");
  const [showQuickPanel, setShowQuickPanel] = useState(false);
  
  // Estado do timer ativo
  const [activeTimer, setActiveTimer] = useState<{
    seconds: number;
    isRunning: boolean;
    projectName: string;
    userName?: string;
  } | null>(null);

  // Helper: Gerar chave do localStorage específica para o usuário
  const getTimerStorageKey = useCallback(() => {
    if (!user?.id) return "activeTimer"; // Fallback
    return `activeTimer_${user.id}`;
  }, [user?.id]);
  
  // Buscar métricas reais do banco de dados
  const { metrics, isLoading: metricsLoading } = useDailyMetrics();

  // Carregar e sincronizar timer ativo
  useEffect(() => {
    const loadTimer = () => {
      const storageKey = getTimerStorageKey();
      const savedTimer = localStorage.getItem(storageKey);
      if (savedTimer) {
        const timer = JSON.parse(savedTimer);
        if (timer.projectName) {
          // Usar currentSeconds se disponível (atualizado pelo Timer.tsx)
          // Caso contrário, calcular usando startTime
          let seconds = 0;
          if (timer.currentSeconds !== undefined && timer.isRunning) {
            seconds = timer.currentSeconds;
          } else if (timer.startTime && timer.isRunning) {
            seconds = Math.floor((Date.now() - timer.startTime) / 1000);
          } else {
            seconds = timer.seconds || 0;
          }
          
          setActiveTimer({
            seconds,
            isRunning: timer.isRunning || false,
            projectName: timer.projectName,
            userName: timer.userName,
          });
        } else {
          setActiveTimer(null);
        }
      } else {
        setActiveTimer(null);
      }
    };

    loadTimer();
    
    // Verificar mudanças no localStorage a cada 250ms para sincronização mais rápida
    const interval = setInterval(loadTimer, 250);
    
    return () => clearInterval(interval);
  }, [getTimerStorageKey]);

  // Sincronização entre abas via storage event
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      const storageKey = getTimerStorageKey();
      
      // Apenas processar mudanças na chave do timer deste usuário
      if (e.key === storageKey) {
        if (e.newValue === null) {
          // Timer foi removido em outra aba
          setActiveTimer(null);
        } else {
          // Timer foi iniciado/atualizado em outra aba - ler novo valor
          const timer = JSON.parse(e.newValue);
          let seconds = 0;
          if (timer.currentSeconds !== undefined && timer.isRunning) {
            seconds = timer.currentSeconds;
          } else if (timer.startTime && timer.isRunning) {
            seconds = Math.floor((Date.now() - timer.startTime) / 1000);
          } else {
            seconds = timer.seconds || 0;
          }
          
          setActiveTimer({
            seconds,
            isRunning: timer.isRunning || false,
            projectName: timer.projectName,
            userName: timer.userName,
          });
        }
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, [getTimerStorageKey]); // Re-criar listener se a função mudar

  useEffect(() => {
    const updateGreeting = () => {
      const now = new Date();
      const hour = now.getHours();
      
      // Saudação baseada no horário
      let greetingText = "";
      if (hour >= 5 && hour < 12) {
        greetingText = "Bom dia";
      } else if (hour >= 12 && hour < 18) {
        greetingText = "Boa tarde";
      } else {
        greetingText = "Boa noite";
      }

      setGreeting(greetingText);
      
      // Atualizar hora
      setCurrentTime(
        now.toLocaleTimeString("pt-BR", {
          hour: "2-digit",
          minute: "2-digit",
        })
      );
    };

    updateGreeting();
    // Atualizar a cada segundo para o relógio
    const interval = setInterval(updateGreeting, 1000);
    return () => clearInterval(interval);
  }, []);

  const formatTimer = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${String(hrs).padStart(2, "0")}:${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  // Pegar nome do usuário
  const displayName = profile?.nome || user?.email || "Usuário";
  const firstName = displayName.split(" ")[0];

  const headerPaddingClass = isSidebarCollapsed ? "lg:pl-16" : "lg:pl-64";

  return (
    <header className={`fixed inset-x-0 top-0 z-30 h-14 sm:h-16 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 ${headerPaddingClass} shadow-sm transition-all duration-300`}>
      <div className="flex h-full items-center justify-between px-2 sm:px-4 lg:px-6">
        {/* Left Section - Greeting (Hidden on mobile) */}
        <div className="hidden sm:flex flex-1 items-center gap-3">
          {/* Greeting Icon */}
          <div className="flex items-center justify-center h-10 w-10 rounded-xl bg-gradient-to-br from-lumina-500 to-blue-600 shadow-lg shadow-lumina-500/30">
            <Sparkles className="h-5 w-5 text-white" />
          </div>

          {/* Greeting Text */}
          <div className="hidden md:block">
            <h2 className="text-base font-semibold text-foreground leading-tight">
              {greeting}, {firstName}! 👋
            </h2>
            <p className="text-xs text-muted-foreground leading-tight mt-0.5">
              {currentTime}
            </p>
          </div>
        </div>

        {/* Mobile Menu Toggle & Timer Indicator */}
        <div className="flex items-center gap-2 sm:hidden">
          {activeTimer && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate("/calendar")}
              className={cn(
                "flex items-center gap-1.5 h-8 px-2 border-2 transition-all",
                activeTimer.isRunning 
                  ? "border-lumina-500 bg-lumina-50 dark:bg-lumina-950/30" 
                  : "border-orange-500 bg-orange-50 dark:bg-orange-950/30"
              )}
            >
              <div className={cn(
                "h-1.5 w-1.5 rounded-full",
                activeTimer.isRunning 
                  ? "bg-lumina-500 animate-pulse" 
                  : "bg-orange-500"
              )} />
              <Timer className="h-3 w-3" />
              <span className="font-mono text-[11px] font-semibold">
                {formatTimer(activeTimer.seconds)}
              </span>
            </Button>
          )}
          
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-9 w-9"
            onClick={onToggleSidebar}
          >
            <Menu className="h-5 w-5" />
            <span className="sr-only">Abrir menu de navegação</span>
          </Button>
        </div>

        {/* Timer Indicator - Visible when timer is active */}
        {activeTimer && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate("/calendar")}
            className={cn(
              "hidden sm:flex items-center gap-2 h-9 px-3 border-2 transition-all",
              activeTimer.isRunning 
                ? "border-lumina-500 bg-lumina-50 dark:bg-lumina-950/30 hover:bg-lumina-100 dark:hover:bg-lumina-900/40" 
                : "border-orange-500 bg-orange-50 dark:bg-orange-950/30 hover:bg-orange-100 dark:hover:bg-orange-900/40"
            )}
          >
            <div className={cn(
              "h-2 w-2 rounded-full",
              activeTimer.isRunning 
                ? "bg-lumina-500 animate-pulse" 
                : "bg-orange-500"
            )} />
            <Timer className="h-3.5 w-3.5" />
            <span className="font-mono text-sm font-semibold">
              {formatTimer(activeTimer.seconds)}
            </span>
            <div className="hidden md:flex flex-col items-start">
              <span className="text-xs text-muted-foreground max-w-[120px] truncate">
                {activeTimer.projectName}
              </span>
              {activeTimer.userName && (
                <span className="text-[10px] text-muted-foreground/70 max-w-[120px] truncate">
                  {activeTimer.userName}
                </span>
              )}
            </div>
          </Button>
        )}

        {/* Right Section - Actions */}
        <div className="flex items-center gap-2 ml-auto">
          {/* Quick Panel Dropdown */}
          <DropdownMenu open={showQuickPanel} onOpenChange={setShowQuickPanel} modal={false}>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 relative hover:bg-lumina-100 dark:hover:bg-lumina-900/30"
              >
                <Activity className="h-4 w-4" />
                <span className="sr-only">Painel rápido</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent 
              align="end" 
              className="w-80 max-h-[85vh] overflow-y-auto"
              sideOffset={8}
              collisionPadding={16}
            >
              {/* Header */}
              <div className="px-4 py-3 border-b">
                <h3 className="font-semibold text-sm">Resumo do Dia</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Suas métricas em tempo real
                </p>
              </div>

              {/* Metrics Grid */}
              <div className="p-4 grid grid-cols-2 gap-3">
                {/* Projetos */}
                <div className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-lg">
                    <Target className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs text-muted-foreground">Projetos</span>
                    <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
                      {metrics.projects}
                    </span>
                  </div>
                </div>

                {/* Tarefas */}
                <div className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-950/30 rounded-lg border border-green-200 dark:border-green-800">
                  <div className="p-2 bg-green-100 dark:bg-green-900/50 rounded-lg">
                    <Activity className="h-4 w-4 text-green-600 dark:text-green-400" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs text-muted-foreground">Tarefas</span>
                    <span className="text-lg font-bold text-green-600 dark:text-green-400">
                      {metrics.tasks}
                    </span>
                  </div>
                </div>

                {/* Horas */}
                <div className="flex items-center gap-3 p-3 bg-purple-50 dark:bg-purple-950/30 rounded-lg border border-purple-200 dark:border-purple-800">
                  <div className="p-2 bg-purple-100 dark:bg-purple-900/50 rounded-lg">
                    <Clock className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs text-muted-foreground">Horas</span>
                    <span className="text-lg font-bold text-purple-600 dark:text-purple-400">
                      {metrics.hours}h
                    </span>
                  </div>
                </div>

                {/* Receita */}
                <div className="flex items-center gap-3 p-3 bg-orange-50 dark:bg-orange-950/30 rounded-lg border border-orange-200 dark:border-orange-800">
                  <div className="p-2 bg-orange-100 dark:bg-orange-900/50 rounded-lg">
                    <DollarSign className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs text-muted-foreground">Receita</span>
                    <span className="text-lg font-bold text-orange-600 dark:text-orange-400">
                      ${(metrics.revenue / 1000).toFixed(1)}k
                    </span>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="px-4 pb-3 pt-2 border-t">
                <p className="text-xs font-medium text-muted-foreground mb-2">Ações Rápidas</p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 h-9 text-xs"
                    onClick={() => {
                      setShowQuickPanel(false);
                      navigate('/dashboard');
                    }}
                  >
                    <TrendingUp className="h-3 w-3 mr-1.5" />
                    Dashboard
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 h-9 text-xs"
                    onClick={() => {
                      setShowQuickPanel(false);
                      navigate('/calendar');
                    }}
                  >
                    <Zap className="h-3 w-3 mr-1.5" />
                    Tarefas
                  </Button>
                </div>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Theme Toggle - Desktop only */}
          <div className="hidden sm:block">
            <ThemeToggle />
          </div>

          {/* Notifications - Desktop only */}
          <div className="hidden sm:block">
            <NotificationsDropdown />
          </div>

          {/* Divider - Desktop only */}
          <div className="hidden sm:block h-8 w-px bg-border mx-1" />

          {/* User Menu - Always visible, enhanced on mobile */}
          <UserMenu isMobileOnly={true} metrics={metrics} />
        </div>
      </div>
    </header>
  );
}



