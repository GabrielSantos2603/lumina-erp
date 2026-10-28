import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import {
  Play,
  Pause,
  Clock,
  Search,
  DollarSign,
  FileText,
  CheckCircle2,
  Zap,
  Activity,
} from "lucide-react";
import { timeTrackingService } from "@/services/timeTrackingService";
import type { TimeEntry } from "@/services/timeTrackingService";
import { projectService } from "@/services/projectService";
import { toast } from "react-hot-toast";
import { cn } from "@/utils/cn";
import { useAuthStore } from "@/store/authStore";

interface Project {
  id: string;
  name: string;
  client_id?: string;
  clientName?: string;
}

export function Timer() {
  const { user, profile } = useAuthStore();
  const [isRunning, setIsRunning] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [activeEntry, setActiveEntry] = useState<TimeEntry | null>(null);
  
  // Form states
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [description, setDescription] = useState("");
  const [hourlyRate, setHourlyRate] = useState<number>(0);
  
  // Projects
  const [projects, setProjects] = useState<Project[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showProjectSelect, setShowProjectSelect] = useState(false);

  // Helper: Gerar chave do localStorage específica para o usuário
  const getTimerStorageKey = useCallback(() => {
    if (!user?.id) return "activeTimer"; // Fallback
    return `activeTimer_${user.id}`;
  }, [user?.id]);

  // Helper: Obter nome do usuário para exibição
  const getUserDisplayName = useCallback(() => {
    return profile?.nome || user?.email?.split("@")[0] || "Usuário";
  }, [profile?.nome, user?.email]);
  
  // Timer tick - Atualiza display E localStorage para sincronização perfeita
  // IMPORTANTE: Este useEffect mantém o timer rodando mesmo quando o componente desmonta
  useEffect(() => {
    let interval: number;
    
    if (isRunning && activeEntry) {
      const updateTimer = () => {
        const start = new Date(activeEntry.start_time);
        const now = new Date();
        const diff = Math.floor((now.getTime() - start.getTime()) / 1000);
        
        // Atualizar apenas o elapsedTime local se o componente ainda está montado
        setElapsedTime(diff);
        
        // SEMPRE atualizar localStorage para sincronização com outros componentes
        const storageKey = getTimerStorageKey();
        const savedTimer = localStorage.getItem(storageKey);
        if (savedTimer) {
          const timerData = JSON.parse(savedTimer);
          timerData.currentSeconds = diff; // Tempo atual calculado
          localStorage.setItem(storageKey, JSON.stringify(timerData));
        }
      };
      
      // Atualizar imediatamente
      updateTimer();
      
      // Continuar atualizando a cada segundo
      interval = window.setInterval(updateTimer, 1000);
    }
    
    return () => {
      // Limpar o interval quando o componente desmonta
      if (interval) clearInterval(interval);
    };
  }, [isRunning, activeEntry, getTimerStorageKey]);

  const loadActiveTimer = useCallback(async () => {
    try {
      // Primeiro, verificar se há timer no localStorage (específico do usuário)
      const storageKey = getTimerStorageKey();
      const savedTimer = localStorage.getItem(storageKey);
      let foundProject: Project | undefined;
      
      if (savedTimer) {
        const timerData = JSON.parse(savedTimer);
        
        // Buscar o projeto associado
        const projectData = projects.find(p => p.id === timerData.projectId);
        if (projectData) {
          setSelectedProject(projectData);
          foundProject = projectData;
        } else {
          // Se não encontrou nos projetos carregados, buscar todos novamente
          const allProjects = await projectService.getAllProjects();
          foundProject = allProjects.find(p => p.id === timerData.projectId);
          if (foundProject) {
            setSelectedProject(foundProject);
          }
        }
        
        setDescription(timerData.description || "");
        setHourlyRate(timerData.hourlyRate || 0);
        
        // Calcular tempo decorrido desde o início
        if (timerData.startTime && timerData.isRunning) {
          const elapsed = Math.floor((Date.now() - timerData.startTime) / 1000);
          setElapsedTime(elapsed);
        } else {
          setElapsedTime(timerData.seconds || 0);
        }
      }
      
      // Buscar timer ativo do banco de dados
      const active = await timeTrackingService.getActiveTimer();
      if (active) {
        setActiveEntry(active);
        setIsRunning(true);
        
        // Se não tem dados do localStorage, usar do banco
        if (!savedTimer) {
          setDescription(active.description || "");
          setHourlyRate(active.hourly_rate || 0);
          
          // Calculate elapsed time
          const start = new Date(active.start_time);
          const now = new Date();
          const diff = Math.floor((now.getTime() - start.getTime()) / 1000);
          setElapsedTime(diff);
          
          // Buscar projeto
          const projectData = projects.find(p => p.id === active.project_id);
          if (projectData) {
            setSelectedProject(projectData);
            foundProject = projectData;
          } else {
            const allProjects = await projectService.getAllProjects();
            foundProject = allProjects.find(p => p.id === active.project_id);
            if (foundProject) {
              setSelectedProject(foundProject);
            }
          }
          
          // Salvar no localStorage para próximas vezes (específico do usuário)
          const storageKey = getTimerStorageKey();
          const timerData = {
            seconds: diff,
            isRunning: true,
            projectName: foundProject?.name || "Projeto",
            projectId: active.project_id,
            entryId: active.id,
            startTime: new Date(active.start_time).getTime(),
            description: active.description || "",
            hourlyRate: active.hourly_rate || 0,
            userName: getUserDisplayName(), // Nome do usuário para exibição
            userId: user?.id, // ID do usuário para validação
          };
          localStorage.setItem(storageKey, JSON.stringify(timerData));
        }
      } else if (savedTimer) {
        // Se tem no localStorage mas não no banco, limpar localStorage (específico do usuário)
        const storageKey = getTimerStorageKey();
        localStorage.removeItem(storageKey);
        setIsRunning(false);
        setActiveEntry(null);
      }
    } catch (error) {
      console.error("Erro ao carregar timer ativo:", error);
    }
  }, [projects, getTimerStorageKey, getUserDisplayName, user?.id]);

  const loadProjects = async () => {
    try {
      const data = await projectService.getAllProjects();
      setProjects(data);
    } catch (error) {
      console.error("Erro ao carregar projetos:", error);
    }
  };

  // Load active timer on mount
  useEffect(() => {
    const init = async () => {
      await loadProjects();
      await loadActiveTimer();
    };
    init();
  }, [loadActiveTimer]); // loadActiveTimer já tem todas as dependências

  // Sincronização entre abas via storage event
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      const storageKey = getTimerStorageKey();
      
      // Apenas processar mudanças na chave do timer deste usuário
      if (e.key === storageKey) {
        if (e.newValue === null) {
          // Timer foi removido em outra aba
          setIsRunning(false);
          setActiveEntry(null);
          setElapsedTime(0);
        } else {
          // Timer foi iniciado/atualizado em outra aba
          loadActiveTimer();
        }
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, [getTimerStorageKey, loadActiveTimer]); // Re-criar listener se as funções mudarem

  const handleStart = async () => {
    if (!selectedProject) {
      toast.error("Selecione um projeto");
      return;
    }

    try {
      const entry = await timeTrackingService.startTimer({
        project_id: selectedProject.id,
        description,
        hourly_rate: hourlyRate > 0 ? hourlyRate : undefined,
      });

      setActiveEntry(entry);
      setIsRunning(true);
      setElapsedTime(0);
      
      // Salvar no localStorage para sincronização (específico do usuário)
      // Usar o startTime do banco de dados para garantir precisão
      const startTime = new Date(entry.start_time).getTime();
      const storageKey = getTimerStorageKey();
      const timerData = {
        seconds: 0,
        isRunning: true,
        projectName: selectedProject.name,
        projectId: selectedProject.id,
        entryId: entry.id,
        startTime: startTime, // Timestamp exato do banco
        description,
        hourlyRate: hourlyRate > 0 ? hourlyRate : 0,
        userName: getUserDisplayName(), // Nome do usuário para exibição
        userId: user?.id, // ID do usuário para validação
      };
      localStorage.setItem(storageKey, JSON.stringify(timerData));
      
      toast.success("Timer iniciado!");
    } catch (error) {
      console.error("Erro ao iniciar timer:", error);
      
      // Tratamento específico para empresa não configurada
      if (error instanceof Error && error.message === "EMPRESA_NAO_CONFIGURADA") {
        toast.error(
          "Configure sua empresa primeiro! Acesse o menu 'Minha Empresa'.",
          { duration: 6000 }
        );
        // Redirecionar após 2 segundos
        setTimeout(() => {
          window.location.href = '/company';
        }, 2000);
      } else {
        toast.error("Erro ao iniciar timer");
      }
    }
  };

  const handleStop = async () => {
    if (!activeEntry) return;

    try {
      await timeTrackingService.stopTimer(activeEntry.id);
      
      const hours = (elapsedTime / 3600).toFixed(2);
      const cost = hourlyRate > 0 ? (elapsedTime / 3600) * hourlyRate : 0;
      
      // Remover do localStorage (específico do usuário)
      const storageKey = getTimerStorageKey();
      localStorage.removeItem(storageKey);
      
      toast.success(
        `Timer parado! ${hours}h trabalhadas` +
        (cost > 0 ? ` - R$ ${cost.toFixed(2)}` : "")
      );

      setActiveEntry(null);
      setIsRunning(false);
      setElapsedTime(0);
      setDescription("");
      setSelectedProject(null);
    } catch (error) {
      console.error("Erro ao parar timer:", error);
      toast.error("Erro ao parar timer");
    }
  };

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const calculateCost = () => {
    if (hourlyRate <= 0) return 0;
    return (elapsedTime / 3600) * hourlyRate;
  };

  const filteredProjects = projects.filter((project) =>
    project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    project.clientName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header with animated status */}
      <Card className="p-6 overflow-hidden relative">
        {isRunning && (
          <div className="absolute inset-0 bg-gradient-to-r from-lumina-500/5 via-green-500/5 to-lumina-500/5 animate-pulse" />
        )}
        <div className="relative">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className={cn(
                "p-3 rounded-xl transition-all duration-300",
                isRunning 
                  ? "bg-gradient-to-br from-green-500 to-emerald-600 shadow-lg shadow-green-500/50 animate-pulse" 
                  : "bg-gradient-to-br from-lumina-500 to-blue-600 shadow-lg shadow-lumina-500/30"
              )}>
                {isRunning ? (
                  <Activity className="h-6 w-6 text-white animate-pulse" />
                ) : (
                  <Clock className="h-6 w-6 text-white" />
                )}
              </div>
              <div>
                <h3 className="text-xl font-bold">
                  {isRunning ? "Timer Ativo" : "Rastreamento de Tempo"}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {isRunning ? "Registrando tempo..." : "Comece a rastrear seu tempo"}
                </p>
              </div>
            </div>
            {isRunning && (
              <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full shadow-lg shadow-green-500/30 animate-pulse">
                <Zap className="h-4 w-4 text-white" />
                <span className="text-sm font-bold text-white">
                  EM EXECUÇÃO
                </span>
              </div>
            )}
          </div>

          {/* Timer Display - Grande e Dinâmico */}
          {isRunning && (
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-lumina-500/10 to-green-500/10 blur-3xl" />
              <div className="relative text-center py-12 bg-gradient-to-br from-lumina-50 via-blue-50 to-green-50 dark:from-lumina-950 dark:via-blue-950 dark:to-green-950 rounded-2xl border-2 border-lumina-300 dark:border-lumina-700 shadow-2xl">
                {/* Animated rings */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="h-48 w-48 rounded-full border-4 border-lumina-300 dark:border-lumina-700 opacity-20 animate-ping" />
                  <div className="absolute h-40 w-40 rounded-full border-4 border-green-300 dark:border-green-700 opacity-20 animate-pulse" />
                </div>
                
                <div className="relative">
                  <div className="text-7xl md:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-r from-lumina-600 via-blue-600 to-green-600 dark:from-lumina-400 dark:via-blue-400 dark:to-green-400 font-mono tracking-tight mb-4 animate-pulse">
                    {formatTime(elapsedTime)}
                  </div>
                  
                  <div className="flex items-center justify-center gap-2 mb-6">
                    <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse shadow-lg shadow-green-500/50" />
                    <p className="text-lg font-semibold text-lumina-700 dark:text-lumina-300">
                      {selectedProject?.name || "Sem projeto"}
                    </p>
                  </div>
                  
                  {hourlyRate > 0 && (
                    <div className="mt-6 inline-flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full shadow-lg shadow-green-500/30 text-white">
                      <DollarSign className="h-5 w-5" />
                      <div className="text-left">
                        <div className="text-2xl font-bold">
                          R$ {calculateCost().toFixed(2)}
                        </div>
                        <div className="text-xs opacity-90">
                          {(elapsedTime / 3600).toFixed(2)}h × R$ {hourlyRate.toFixed(2)}/h
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

        </div>
      </Card>

      {/* Form Controls - Modernizado */}
      <Card className="p-6">
        <div className="space-y-6">
          {/* Project Selection - Melhorado */}
          {!isRunning && (
            <div className="space-y-3">
              <Label htmlFor="project" className="text-base font-semibold flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-lumina-100 dark:bg-lumina-900/30">
                  <FileText className="h-4 w-4 text-lumina-600 dark:text-lumina-400" />
                </div>
                Projeto *
              </Label>
              <div className="relative">
                <Button
                  type="button"
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal h-12 text-base transition-all",
                    "hover:bg-lumina-50 dark:hover:bg-lumina-950/30 hover:border-lumina-400",
                    selectedProject && "border-lumina-300 dark:border-lumina-700"
                  )}
                  onClick={() => setShowProjectSelect(!showProjectSelect)}
                >
                  {selectedProject ? (
                    <div className="flex-1 flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-green-500" />
                      <span className="font-medium">{selectedProject.name}</span>
                      {selectedProject.clientName && (
                        <span className="text-muted-foreground">
                          • {selectedProject.clientName}
                        </span>
                      )}
                    </div>
                  ) : (
                    <span className="text-muted-foreground flex items-center gap-2">
                      <Search className="h-4 w-4" />
                      Selecione um projeto...
                    </span>
                  )}
                </Button>

                {showProjectSelect && (
                  <div className="absolute z-10 w-full mt-2 bg-popover border-2 border-lumina-200 dark:border-lumina-800 rounded-xl shadow-2xl max-h-80 overflow-auto">
                    {/* Search */}
                    <div className="p-3 border-b border-lumina-100 dark:border-lumina-900 sticky top-0 bg-popover backdrop-blur">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-lumina-500" />
                        <Input
                          placeholder="Buscar projeto..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="pl-9 border-lumina-200 dark:border-lumina-800 focus:border-lumina-400"
                          autoFocus
                        />
                      </div>
                    </div>

                    {/* Project List */}
                    <div className="p-2">
                      {filteredProjects.length === 0 ? (
                        <div className="p-6 text-center text-sm text-muted-foreground">
                          <FileText className="h-12 w-12 mx-auto mb-2 opacity-30" />
                          Nenhum projeto encontrado
                        </div>
                      ) : (
                        filteredProjects.map((project) => (
                          <button
                            key={project.id}
                            className={cn(
                              "w-full text-left px-4 py-3 rounded-lg transition-all mb-1",
                              "hover:bg-lumina-100 dark:hover:bg-lumina-900/30",
                              "hover:scale-[1.02] active:scale-[0.98]",
                              selectedProject?.id === project.id && "bg-lumina-100 dark:bg-lumina-900/30 border-2 border-lumina-400"
                            )}
                            onClick={() => {
                              setSelectedProject(project);
                              setShowProjectSelect(false);
                              setSearchQuery("");
                            }}
                          >
                            <div className="font-semibold text-base">{project.name}</div>
                            {project.clientName && (
                              <div className="text-sm text-muted-foreground mt-0.5">
                                {project.clientName}
                              </div>
                            )}
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Description - Melhorado */}
          <div className="space-y-3">
            <Label htmlFor="description" className="text-base font-semibold flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                <FileText className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </div>
              O que você está fazendo?
            </Label>
            <Input
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ex: Desenvolvendo funcionalidade X..."
              disabled={isRunning}
              className="h-12 text-base transition-all hover:border-blue-400 disabled:opacity-60"
            />
          </div>

          {/* Hourly Rate - Melhorado */}
          <div className="space-y-3">
            <Label htmlFor="hourlyRate" className="text-base font-semibold flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-green-100 dark:bg-green-900/30">
                <DollarSign className="h-4 w-4 text-green-600 dark:text-green-400" />
              </div>
              Taxa por Hora (opcional)
            </Label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">R$</span>
              <Input
                id="hourlyRate"
                type="number"
                step="0.01"
                min="0"
                value={hourlyRate || ""}
                onChange={(e) => setHourlyRate(parseFloat(e.target.value) || 0)}
                placeholder="150.00"
                disabled={isRunning}
                className="h-12 text-base pl-10 transition-all hover:border-green-400 disabled:opacity-60"
              />
            </div>
          </div>

          {/* Action Button - Redesenhado */}
          <Button
            onClick={isRunning ? handleStop : handleStart}
            className={cn(
              "w-full h-14 text-lg font-bold transition-all duration-300",
              "shadow-lg hover:shadow-xl active:scale-[0.98]",
              isRunning 
                ? "bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 shadow-red-500/30" 
                : "bg-gradient-to-r from-lumina-500 to-blue-600 hover:from-lumina-600 hover:to-blue-700 shadow-lumina-500/30"
            )}
            size="lg"
          >
            {isRunning ? (
              <>
                <Pause className="h-6 w-6 mr-3" />
                Parar Timer
              </>
            ) : (
              <>
                <Play className="h-6 w-6 mr-3" />
                Iniciar Timer
              </>
            )}
          </Button>

          {/* Info - Redesenhado */}
          {!isRunning && (
            <div className="pt-4 border-t border-lumina-100 dark:border-lumina-900">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="flex items-start gap-2 p-3 bg-gradient-to-br from-lumina-50 to-blue-50 dark:from-lumina-950/50 dark:to-blue-950/50 rounded-lg border border-lumina-200 dark:border-lumina-800">
                  <CheckCircle2 className="h-4 w-4 text-lumina-600 dark:text-lumina-400 mt-0.5 flex-shrink-0" />
                  <span className="text-xs font-medium text-foreground">Rastreamento automático de tempo</span>
                </div>
                <div className="flex items-start gap-2 p-3 bg-gradient-to-br from-blue-50 to-green-50 dark:from-blue-950/50 dark:to-green-950/50 rounded-lg border border-blue-200 dark:border-blue-800">
                  <CheckCircle2 className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                  <span className="text-xs font-medium text-foreground">Adicione descrição e taxa</span>
                </div>
                <div className="flex items-start gap-2 p-3 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/50 dark:to-emerald-950/50 rounded-lg border border-green-200 dark:border-green-800">
                  <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                  <span className="text-xs font-medium text-foreground">Salvo no projeto selecionado</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}

