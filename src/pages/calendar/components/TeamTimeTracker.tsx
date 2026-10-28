import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Clock,
  Search,
  TrendingUp,
  DollarSign,
  Calendar as CalendarIcon,
  ChevronDown,
  ChevronRight,
  FolderOpen,
  Eye,
  Building2,
} from "lucide-react";
import { timeTrackingService } from "@/services/timeTrackingService";
import { Loader2 } from "lucide-react";
import { TimerEntryModal } from "@/components/modals/TimerEntryModal";

interface UserEntry {
  user_id: string;
  user_name: string;
  total_seconds: number;
  total_cost: number;
  entry_count: number;
  entries: {
    id: string;
    start_time: string;
    end_time: string;
    duration_seconds: number;
    description?: string;
    hourly_rate?: number;
    cost: number;
  }[];
}

interface ProjectGroup {
  project_id: string;
  project_name: string;
  total_seconds: number;
  total_cost: number;
  entry_count: number;
  user_count: number;
  users: UserEntry[];
}

export function TeamTimeTracker() {
  const [projectGroups, setProjectGroups] = useState<ProjectGroup[]>([]);
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Estado para o modal
  interface SelectedEntry {
    id: string;
    user_id: string;
    project_id?: string;
    start_time: string;
    end_time: string;
    duration_seconds: number;
    description?: string;
    hourly_rate?: number;
    cost: number;
    project_name?: string;
    user_name?: string;
  }
  const [selectedEntry, setSelectedEntry] = useState<SelectedEntry | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().setDate(1)).toISOString().split("T")[0], // Primeiro dia do mês
    end: new Date().toISOString().split("T")[0], // Hoje
  });

  useEffect(() => {
    loadTeamData(false); // false = mostrar loading na primeira carga e ao mudar datas
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateRange]);

  const [empresaNaoConfigurada, setEmpresaNaoConfigurada] = useState(false);

  const loadTeamData = async (silentRefresh = false) => {
    try {
      // Só mostrar loading se não for refresh silencioso
      if (!silentRefresh) {
        setIsLoading(true);
      }
      
      setEmpresaNaoConfigurada(false); // Reset do estado de erro
      
      console.log("🔍 Buscando timers da equipe...", { dateRange });
      
      // Buscar entradas detalhadas da equipe
      const rawEntries = await timeTrackingService.getTeamTimeEntries(dateRange);
      
      console.log("📥 Entradas recebidas:", rawEntries?.length || 0, rawEntries);
      
      if (!rawEntries || rawEntries.length === 0) {
        console.log("ℹ️ Nenhuma entrada encontrada no período");
        setProjectGroups([]);
        return;
      }
      
      // Agrupar por projeto primeiro
      const projectMap = new Map<string, ProjectGroup>();
      
      interface RawEntry {
        id: string;
        user_id: string;
        project_id?: string;
        duration?: number;
        total_cost?: number;
        description?: string;
        hourly_rate?: number;
        start_time: string;
        end_time: string;
        project?: { id: string; name: string } | { id: string; name: string }[];
        user?: { id: string; nome: string } | { id: string; nome: string }[];
      }
      
      (rawEntries as RawEntry[]).forEach((entry) => {
        // Normalizar project e user (podem vir como array do Supabase)
        const project = Array.isArray(entry.project) ? entry.project[0] : entry.project;
        const user = Array.isArray(entry.user) ? entry.user[0] : entry.user;
        
        if (!project || !user) {
          console.warn("⚠️ Entrada ignorada (sem projeto ou usuário):", entry);
          return;
        }
        
        const projectId = entry.project_id || "unknown";
        const projectName = project.name || "Sem Projeto";
        const userId = entry.user_id;
        const userName = user.nome || "Usuário";
        const durationSeconds = entry.duration || 0;
        const cost = entry.total_cost || 0;
        
        // Buscar ou criar grupo de projeto
        if (!projectMap.has(projectId)) {
          projectMap.set(projectId, {
            project_id: projectId,
            project_name: projectName,
            total_seconds: 0,
            total_cost: 0,
            entry_count: 0,
            user_count: 0,
            users: [],
          });
        }
        
        const projectGroup = projectMap.get(projectId)!;
        projectGroup.total_seconds += durationSeconds;
        projectGroup.total_cost += cost;
        projectGroup.entry_count++;
        
        // Buscar ou criar usuário dentro do projeto
        let userEntry = projectGroup.users.find(u => u.user_id === userId);
        if (!userEntry) {
          userEntry = {
            user_id: userId,
            user_name: userName,
            total_seconds: 0,
            total_cost: 0,
            entry_count: 0,
            entries: [],
          };
          projectGroup.users.push(userEntry);
          projectGroup.user_count++;
        }
        
        userEntry.total_seconds += durationSeconds;
        userEntry.total_cost += cost;
        userEntry.entry_count++;
        userEntry.entries.push({
          id: entry.id,
          start_time: entry.start_time,
          end_time: entry.end_time,
          duration_seconds: durationSeconds,
          description: entry.description,
          hourly_rate: entry.hourly_rate,
          cost: cost,
        });
      });
      
      // Converter map para array e ordenar por tempo total
      const projects = Array.from(projectMap.values())
        .sort((a, b) => b.total_seconds - a.total_seconds);
      
      // Debug: Verificar se os totais estão corretos
      console.log("📊 Processamento completo:", {
        entradasRecebidas: rawEntries?.length || 0,
        projetosAgrupados: projects.length,
        totalSegundos: projects.reduce((sum, p) => sum + p.total_seconds, 0),
        totalCusto: projects.reduce((sum, p) => sum + p.total_cost, 0),
        projects: projects.map(p => ({
          nome: p.project_name,
          usuarios: p.user_count,
          entradas: p.entry_count,
          tempo: p.total_seconds
        }))
      });
      
      setProjectGroups(projects);
    } catch (error) {
      console.error("Erro ao carregar dados da equipe:", error);
      
      // Verificar se é erro de empresa não configurada
      if (error instanceof Error && error.message === "EMPRESA_NAO_CONFIGURADA") {
        setEmpresaNaoConfigurada(true);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const toggleProject = (projectId: string) => {
    setExpandedProjects(prev => {
      const newSet = new Set(prev);
      if (newSet.has(projectId)) {
        newSet.delete(projectId);
      } else {
        newSet.add(projectId);
      }
      return newSet;
    });
  };

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const filteredProjects = projectGroups.filter((project) =>
    project.project_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    project.users.some(user => user.user_name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const totalSeconds = projectGroups.reduce((sum, p) => sum + p.total_seconds, 0);
  const totalCost = projectGroups.reduce((sum, p) => sum + p.total_cost, 0);
  const totalEntries = projectGroups.reduce((sum, p) => sum + p.entry_count, 0);
  const totalProjects = projectGroups.length;

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  // Tela de erro: Empresa não configurada
  if (empresaNaoConfigurada) {
    return (
      <div className="space-y-4">
        <Card className="p-8 sm:p-12 text-center border-orange-200 dark:border-orange-900">
          <div className="mx-auto w-16 h-16 bg-orange-100 dark:bg-orange-950 rounded-full flex items-center justify-center mb-4">
            <FolderOpen className="h-8 w-8 text-orange-600 dark:text-orange-400" />
          </div>
          <h3 className="text-lg sm:text-xl font-bold mb-2 text-orange-900 dark:text-orange-100">
            Empresa não configurada
          </h3>
          <p className="text-sm text-muted-foreground max-w-md mx-auto mb-6">
            Para usar o sistema de timers da equipe, você precisa configurar sua empresa primeiro. 
            Isso garante o isolamento correto dos dados e permite que você colabore com sua equipe.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              onClick={() => window.location.href = '/company'}
              className="gap-2"
            >
              <Building2 className="h-4 w-4" />
              Ir para Minha Empresa
            </Button>
            <Button
              variant="outline"
              onClick={() => loadTeamData(false)}
            >
              Tentar Novamente
            </Button>
          </div>
          <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
            <p className="text-xs text-left text-muted-foreground">
              <strong className="text-blue-700 dark:text-blue-400">💡 Dica:</strong> Configure os dados da sua empresa 
              na página "Minha Empresa". O nome da empresa será usado para agrupar os membros da equipe. 
              Outros usuários devem usar o MESMO nome de empresa para trabalhar juntos.
            </p>
          </div>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-lumina-500" />
        <span className="ml-3 text-muted-foreground">Carregando timers da equipe...</span>
      </div>
    );
  }

  return (
    <div className="space-y-3 sm:space-y-4 lg:space-y-6">
      {/* Título e Descrição */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1.5 flex-1">
          <h2 className="text-lg sm:text-xl lg:text-2xl font-bold">Timers da Equipe</h2>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Visualize o tempo registrado por cada colaborador e projeto. Apenas timers finalizados aparecem aqui.
          </p>
          {projectGroups.length === 0 && !isLoading && (
            <Badge variant="outline" className="text-xs gap-1 mt-2">
              <Clock className="h-3 w-3" />
              Aguardando timers finalizados no período selecionado
            </Badge>
          )}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => loadTeamData(false)}
          className="gap-2 flex-shrink-0"
        >
          <Clock className="h-4 w-4" />
          Atualizar
        </Button>
      </div>

      {/* Header com Resumo */}
      <div className="grid gap-2 sm:gap-3 lg:gap-4 grid-cols-2 lg:grid-cols-4">
        <Card className="p-3 sm:p-4">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="p-1.5 sm:p-2 bg-blue-50 dark:bg-blue-950 rounded-lg">
              <FolderOpen className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-[10px] sm:text-xs lg:text-sm text-muted-foreground truncate">Projetos</p>
              <p className="text-lg sm:text-xl lg:text-2xl font-bold">{totalProjects}</p>
            </div>
          </div>
        </Card>

        <Card className="p-3 sm:p-4">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="p-1.5 sm:p-2 bg-green-50 dark:bg-green-950 rounded-lg">
              <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-[10px] sm:text-xs lg:text-sm text-muted-foreground truncate">Tempo Total</p>
              <p className="text-base sm:text-lg lg:text-xl font-mono font-bold">{formatTime(totalSeconds)}</p>
            </div>
          </div>
        </Card>

        <Card className="p-3 sm:p-4">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="p-1.5 sm:p-2 bg-purple-50 dark:bg-purple-950 rounded-lg">
              <DollarSign className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-[10px] sm:text-xs lg:text-sm text-muted-foreground truncate">Custo Total</p>
              <p className="text-sm sm:text-base lg:text-xl xl:text-2xl font-bold truncate">
                {totalCost > 0 ? `R$ ${totalCost.toFixed(2)}` : "-"}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-3 sm:p-4">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="p-1.5 sm:p-2 bg-orange-50 dark:bg-orange-950 rounded-lg">
              <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <p className="text-[10px] sm:text-xs lg:text-sm text-muted-foreground truncate">Registros</p>
              <p className="text-lg sm:text-xl lg:text-2xl font-bold">{totalEntries}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filtros */}
      <Card className="p-3 sm:p-4">
        <div className="grid gap-2 sm:gap-3 lg:gap-4 md:grid-cols-3">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar projeto ou colaborador..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-7 sm:pl-9 text-xs sm:text-sm h-8 sm:h-10"
            />
          </div>

          {/* Date Range */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            <CalendarIcon className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
            <Input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
              className="text-xs sm:text-sm h-8 sm:h-10"
            />
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2">
            <span className="text-xs sm:text-sm text-muted-foreground flex-shrink-0">até</span>
            <Input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
              className="text-xs sm:text-sm h-8 sm:h-10"
            />
          </div>
        </div>
      </Card>

      {/* Projects List */}
      <div className="space-y-3 sm:space-y-4">
        {filteredProjects.length === 0 ? (
          <Card className="p-8 sm:p-12 text-center">
            <FolderOpen className="h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground mx-auto mb-3 sm:mb-4 opacity-50" />
            <h3 className="text-base sm:text-lg font-semibold mb-1.5 sm:mb-2">
              {searchQuery ? "Nenhum projeto encontrado" : "Nenhum timer finalizado no período"}
            </h3>
            <p className="text-xs sm:text-sm text-muted-foreground max-w-md mx-auto">
              {searchQuery
                ? "Tente ajustar sua busca ou remover os filtros"
                : "Timers ativos aparecem no cabeçalho. Apenas timers finalizados (parados) são exibidos aqui agrupados por projeto."}
            </p>
          </Card>
        ) : (
          filteredProjects.map((project) => {
            const isExpanded = expandedProjects.has(project.project_id);
            
            return (
              <Card key={project.project_id} className="overflow-hidden">
                {/* Project Header - Clickable */}
                <Button
                  variant="ghost"
                  className="w-full p-4 sm:p-5 lg:p-6 h-auto hover:bg-muted/50 transition-colors"
                  onClick={() => toggleProject(project.project_id)}
                >
                  <div className="flex items-center justify-between w-full gap-3">
                    <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1 text-left">
                      <div className="p-2 bg-lumina-50 dark:bg-lumina-950/30 rounded-lg flex-shrink-0">
                        <FolderOpen className="h-5 w-5 text-lumina-600 dark:text-lumina-400" />
                      </div>
                      
                      <div className="min-w-0 flex-1">
                        <h3 className="font-semibold text-base sm:text-lg truncate">
                          {project.project_name}
                        </h3>
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant="secondary" className="text-[10px] sm:text-xs">
                            {project.user_count} colaborador{project.user_count !== 1 ? "es" : ""}
                          </Badge>
                          <Badge variant="outline" className="text-[10px] sm:text-xs">
                            {project.entry_count} registro{project.entry_count !== 1 ? "s" : ""}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 flex-shrink-0">
                      <div className="text-right">
                        <div className="text-lg sm:text-xl font-mono font-bold text-lumina-600 dark:text-lumina-400">
                          {formatTime(project.total_seconds)}
                        </div>
                        {project.total_cost > 0 && (
                          <div className="text-xs sm:text-sm text-green-600 dark:text-green-400 font-medium">
                            R$ {project.total_cost.toFixed(2)}
                          </div>
                        )}
                      </div>
                      
                      {isExpanded ? (
                        <ChevronDown className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                      ) : (
                        <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                      )}
                    </div>
                  </div>
                </Button>

                {/* Expanded Content - Users and Entries */}
                {isExpanded && (
                  <div className="border-t bg-muted/20 p-4 sm:p-5 space-y-4">
                    {project.users.map((user) => (
                      <div key={user.user_id} className="space-y-3">
                        {/* User Header */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 sm:gap-3">
                            <Avatar className="h-8 w-8 sm:h-10 sm:w-10 ring-2 ring-lumina-500/20">
                              <AvatarImage src={undefined} />
                              <AvatarFallback className="bg-gradient-to-br from-lumina-500 to-lumina-600 text-white font-semibold text-xs">
                                {getInitials(user.user_name)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-semibold text-sm sm:text-base">{user.user_name}</p>
                              <p className="text-xs text-muted-foreground">
                                {user.entry_count} entrada{user.entry_count !== 1 ? "s" : ""}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-base sm:text-lg font-mono font-bold">
                              {formatTime(user.total_seconds)}
                            </div>
                            {user.total_cost > 0 && (
                              <div className="text-xs text-green-600 dark:text-green-400">
                                R$ {user.total_cost.toFixed(2)}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* User Entries */}
                        <div className="space-y-2 ml-0 sm:ml-12">
                          {user.entries.map((entry) => (
                            <Card key={entry.id} className="p-3 bg-background/50">
                              <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0 flex-1 space-y-1">
                                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                    <Clock className="h-3 w-3 flex-shrink-0" />
                                    <span>{formatDate(entry.start_time)}</span>
                                  </div>
                                  {entry.description && (
                                    <p className="text-sm">{entry.description}</p>
                                  )}
                                  {entry.hourly_rate && entry.hourly_rate > 0 && (
                                    <p className="text-xs text-muted-foreground">
                                      Taxa: R$ {entry.hourly_rate.toFixed(2)}/h
                                    </p>
                                  )}
                                </div>
                                <div className="flex-shrink-0 flex items-center gap-2">
                                  <div className="text-right">
                                    <div className="text-sm font-mono font-bold">
                                      {formatTime(entry.duration_seconds)}
                                    </div>
                                    {entry.cost > 0 && (
                                      <div className="text-xs text-green-600 dark:text-green-400">
                                        R$ {entry.cost.toFixed(2)}
                                      </div>
                                    )}
                                  </div>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      setSelectedEntry({
                                        ...entry,
                                        user_id: user.user_id,
                                        project_name: project.project_name,
                                        user_name: user.user_name,
                                      });
                                      setIsModalOpen(true);
                                    }}
                                    className="h-7 px-2"
                                  >
                                    <Eye className="h-3 w-3" />
                                  </Button>
                                </div>
                              </div>
                            </Card>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            );
          })
        )}
      </div>

      {/* Modal de detalhes do timer */}
      <TimerEntryModal
        entry={selectedEntry}
        open={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedEntry(null);
        }}
        onUpdate={() => {
          loadTeamData(true); // Recarregar dados após edição/exclusão (silencioso)
        }}
      />
    </div>
  );
}

