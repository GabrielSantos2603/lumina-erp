import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  ChevronRight,
  ChevronDown,
  Calendar as CalendarIcon,
  Clock,
  CheckSquare,
  Square,
  Filter,
  Search,
  Folder,
  TrendingUp,
  Users,
  Target,
  Loader2,
  MoreVertical,
  Edit,
  Trash2,
  ArrowUp,
  RefreshCw,
} from "lucide-react";
import { cn } from "@/utils/cn";
import { taskService, type Task, type TaskPriority } from "@/services/taskService";
import { projectService } from "@/services/projectService";
import { teamService, type TeamMember } from "@/services/teamService";
import { toast } from "react-hot-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CreateTaskDialog } from "./CreateTaskDialog";
import { TaskDetailsDialog } from "./TaskDetailsDialog";
import { GanttChartView } from "./GanttChartView";
import { TaskItem, TasksStats, TasksTimeline } from "./tasks";

interface TaskWithHierarchy extends Task {
  parent_id?: string;
  assigned_team_member_id?: string;
  weight?: number;
  level?: number;
  order_index?: number;
  children?: TaskWithHierarchy[];
  subtasks_count?: number;
  completed_subtasks_count?: number;
  calculated_progress?: number;
}

export function TasksView() {
  const [tasks, setTasks] = useState<TaskWithHierarchy[]>([]);
  const [projects, setProjects] = useState<Array<{ id: string; name: string }>>([]);
  const [teamMembers, setTeamMembers] = useState<Map<string, TeamMember>>(new Map());
  const [selectedProject, setSelectedProject] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());
  const [selectedTask, setSelectedTask] = useState<TaskWithHierarchy | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [creatingForTask, setCreatingForTask] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"list" | "timeline" | "gantt">("list");

  useEffect(() => {
    loadData();
    loadTeamMembers();
  }, [selectedProject]);

  const loadTeamMembers = async () => {
    try {
      const members = await teamService.getTeamMembers();
      const membersMap = new Map<string, TeamMember>();
      members.forEach((m) => membersMap.set(m.id, m));
      setTeamMembers(membersMap);
    } catch (error) {
      console.error("Erro ao carregar membros da equipe:", error);
    }
  };

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [tasksData, projectsData] = await Promise.all([
        taskService.getTasks(),
        projectService.getAllProjects(),
      ]);

      setProjects(projectsData);
      
      // Converter para TaskWithHierarchy
      const tasksWithHierarchy = tasksData.map((t) => ({
        ...t,
        parent_id: (t as any).parent_id,
        assigned_team_member_id: (t as any).assigned_team_member_id,
        weight: (t as any).weight ?? 1.0,
        level: (t as any).level ?? 0,
        order_index: (t as any).order_index ?? 0,
        children: [],
        subtasks_count: 0,
        completed_subtasks_count: 0,
      })) as TaskWithHierarchy[];

      // Construir hierarquia
      const tasksMap = new Map<string, TaskWithHierarchy>();
      tasksWithHierarchy.forEach((task) => {
        tasksMap.set(task.id, task);
      });

      const rootTasks: TaskWithHierarchy[] = [];
      tasksWithHierarchy.forEach((task) => {
        if (task.parent_id && tasksMap.has(task.parent_id)) {
          const parent = tasksMap.get(task.parent_id)!;
          if (!parent.children) parent.children = [];
          parent.children.push(task);
          parent.subtasks_count = (parent.subtasks_count || 0) + 1;
          if (task.status === "completed") {
            parent.completed_subtasks_count = (parent.completed_subtasks_count || 0) + 1;
          }
        } else {
          rootTasks.push(task);
        }
      });

      // Ordenar por order_index
      const sortTasks = (tsks: TaskWithHierarchy[]) => {
        tsks.sort((a, b) => (a.order_index || 0) - (b.order_index || 0));
        tsks.forEach((t) => {
          if (t.children) sortTasks(t.children);
        });
      };
      sortTasks(rootTasks);

      setTasks(rootTasks);
    } catch (error) {
      console.error("Erro ao carregar tarefas:", error);
      toast.error("Erro ao carregar tarefas");
    } finally {
      setIsLoading(false);
    }
  };

  const filteredTasks = useMemo(() => {
    let filtered = tasks;

    // Filtrar por projeto
    if (selectedProject !== "all") {
      filtered = filterByProject(filtered, selectedProject);
    }

    // Filtrar por busca
    if (searchQuery.trim()) {
      filtered = filterBySearch(filtered, searchQuery);
    }

    return filtered;
  }, [tasks, selectedProject, searchQuery]);

  const filterByProject = (
    taskList: TaskWithHierarchy[],
    projectId: string
  ): TaskWithHierarchy[] => {
    return taskList
      .map((task) => {
        if (task.project_id === projectId) {
          return {
            ...task,
            children: task.children ? filterByProject(task.children, projectId) : [],
          };
        }
        return null;
      })
      .filter((t): t is TaskWithHierarchy => t !== null);
  };

  const filterBySearch = (
    taskList: TaskWithHierarchy[],
    query: string
  ): TaskWithHierarchy[] => {
    const lowerQuery = query.toLowerCase();
    return taskList
      .map((task) => {
        const matches =
          task.title.toLowerCase().includes(lowerQuery) ||
          task.description?.toLowerCase().includes(lowerQuery);

        const filteredChildren = task.children
          ? filterBySearch(task.children, query)
          : [];

        if (matches || filteredChildren.length > 0) {
          return {
            ...task,
            children: filteredChildren,
          };
        }
        return null;
      })
      .filter((t): t is TaskWithHierarchy => t !== null);
  };

  const toggleExpand = (taskId: string) => {
    const newExpanded = new Set(expandedTasks);
    if (newExpanded.has(taskId)) {
      newExpanded.delete(taskId);
    } else {
      newExpanded.add(taskId);
    }
    setExpandedTasks(newExpanded);
  };

  // Função removida - status agora só pode ser alterado no TaskDetailsDialog

  const handleDelete = async (taskId: string) => {
    if (!confirm("Tem certeza que deseja excluir esta tarefa?")) return;

    try {
      await taskService.deleteTask(taskId);
      toast.success("Tarefa excluída!");
      loadData();
    } catch (error) {
      console.error("Erro ao excluir tarefa:", error);
      toast.error("Erro ao excluir tarefa");
    }
  };

  const handleCompleteSubtask = async (taskId: string) => {
    try {
      await taskService.updateTask(taskId, {
        status: "completed",
        progress: 100,
        completed_at: new Date().toISOString(),
      });
      toast.success("Sub-tarefa concluída!");
      loadData();
    } catch (err) {
      console.error(err);
      toast.error("Erro ao concluir sub-tarefa");
    }
  };

  const getProgressColor = (progress: number) => {
    if (progress === 100) return "bg-green-500";
    if (progress >= 75) return "bg-blue-500";
    if (progress >= 50) return "bg-yellow-500";
    if (progress >= 25) return "bg-orange-500";
    return "bg-red-500";
  };

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      urgent: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
      high: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
      medium: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
      low: "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400",
    };
    return colors[priority] || colors.medium;
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      completed: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
      in_progress: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
      pending: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
      cancelled: "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400",
      on_hold: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
    };
    return colors[status] || colors.pending;
  };

  const renderTask = (task: TaskWithHierarchy, depth: number = 0) => {
    const isExpanded = expandedTasks.has(task.id);
    const hasChildren = task.children && task.children.length > 0;
    const progress = task.calculated_progress ?? task.progress;
    const indent = depth * 24;

    return (
      <div key={task.id} className="space-y-1">
        <div
          className={cn(
            "group flex items-center gap-3 p-3 rounded-lg border transition-all",
            "hover:bg-muted/50 hover:shadow-sm",
            depth > 0 && "ml-4 border-l-2 border-l-lumina-200 dark:border-l-lumina-800"
          )}
          style={{ paddingLeft: `${12 + indent}px` }}
        >
          {/* Ícone de expandir/colapsar */}
          <div className="flex items-center gap-2 min-w-[32px]">
            {hasChildren ? (
              <button
                onClick={() => toggleExpand(task.id)}
                className="p-1 hover:bg-muted rounded transition-colors"
              >
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                )}
              </button>
            ) : (
              <div className="w-6" />
            )}
            {/* Ação rápida para subtarefas: botão concluir no lugar do checkbox */}
            {depth > 0 ? (
              <div className="p-0">
                {task.status !== "completed" ? (
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 px-2 text-xs gap-1"
                    onClick={async (e) => {
                      e.stopPropagation();
                      try {
                        await taskService.updateTask(task.id, {
                          status: "completed",
                          progress: 100,
                          completed_at: new Date().toISOString(),
                        });
                        toast.success("Sub-tarefa concluída!");
                        loadData();
                      } catch (err) {
                        console.error(err);
                        toast.error("Erro ao concluir sub-tarefa");
                      }
                    }}
                  >
                    <CheckSquare className="h-3.5 w-3.5" />
                    Concluir
                  </Button>
                ) : (
                  <Badge variant="outline" className="text-[10px]">100%</Badge>
                )}
              </div>
            ) : (
              // Para tarefas raiz, manter apenas indicador visual (não interativo)
              <div className="p-1">
                {task.status === "completed" ? (
                  <CheckSquare className="h-5 w-5 text-green-600" />
                ) : (
                  <Square className="h-5 w-5 text-muted-foreground opacity-50" />
                )}
              </div>
            )}
          </div>

          {/* Conteúdo da tarefa */}
          <div className="flex-1 min-w-0" onClick={() => {
            setSelectedTask(task);
            setShowDetailsDialog(true);
          }}>
            <div className="flex items-center gap-2 mb-1">
              <h4
                className={cn(
                  "font-semibold text-sm",
                  task.status === "completed" && "line-through text-muted-foreground"
                )}
              >
                {task.title}
              </h4>
              <Badge className={getPriorityColor(task.priority)} variant="secondary">
                {task.priority === "urgent" ? "Urgente" :
                 task.priority === "high" ? "Alta" :
                 task.priority === "medium" ? "Média" : "Baixa"}
              </Badge>
              <Badge className={getStatusColor(task.status)} variant="secondary">
                {task.status === "completed" ? "Concluída" :
                 task.status === "in_progress" ? "Em Progresso" :
                 task.status === "pending" ? "Pendente" :
                 task.status === "cancelled" ? "Cancelada" : "Em Espera"}
              </Badge>
              {task.weight && task.weight > 1 && (
                <Badge variant="outline" className="text-xs">
                  Peso: {task.weight}
                </Badge>
              )}
            </div>

            {/* Progresso */}
            <div className="flex items-center gap-2 mb-1">
              <div className="flex-1 bg-muted rounded-full h-2 overflow-hidden">
                <div
                  className={cn("h-full transition-all", getProgressColor(progress))}
                  style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
                />
              </div>
              <span className="text-xs font-medium text-muted-foreground min-w-[40px] text-right">
                {progress.toFixed(0)}%
              </span>
            </div>

            {/* Informações adicionais */}
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              {task.due_date && (
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {new Date(task.due_date).toLocaleDateString("pt-BR")}
                </div>
              )}
              {hasChildren && (
                <div className="flex items-center gap-1">
                  <Target className="h-3 w-3" />
                  {task.completed_subtasks_count || 0}/{task.subtasks_count || 0} sub-tarefas
                </div>
              )}
              {task.estimated_hours && (
                <div className="flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" />
                  {task.estimated_hours}h
                </div>
              )}
              {task.assigned_team_member_id && teamMembers.has(task.assigned_team_member_id) && (
                <div className="flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  {teamMembers.get(task.assigned_team_member_id)!.name}
                </div>
              )}
            </div>
          </div>

          {/* Menu de ações */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => {
                  setCreatingForTask(task.id);
                  setShowCreateDialog(true);
                }}
              >
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Sub-tarefa
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  setSelectedTask(task);
                  setShowDetailsDialog(true);
                }}
              >
                <Edit className="h-4 w-4 mr-2" />
                Editar
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => handleDelete(task.id)}
                className="text-red-600"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Excluir
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Sub-tarefas */}
        {hasChildren && isExpanded && (
          <div className="ml-4 border-l-2 border-l-muted pl-2">
            {task.children?.map((child) => renderTask(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  const renderTimeline = () => {
    // Agrupar tarefas por data
    const tasksByDate = new Map<string, TaskWithHierarchy[]>();

    const collectTasks = (taskList: TaskWithHierarchy[]) => {
      taskList.forEach((task) => {
        const date = task.due_date || task.start_date || task.created_at;
        if (date) {
          const dateKey = new Date(date).toISOString().split("T")[0];
          if (!tasksByDate.has(dateKey)) {
            tasksByDate.set(dateKey, []);
          }
          tasksByDate.get(dateKey)!.push(task);
        }
        if (task.children) {
          collectTasks(task.children);
        }
      });
    };

    collectTasks(filteredTasks);

    const sortedDates = Array.from(tasksByDate.keys()).sort();

    return (
      <div className="space-y-6">
        {sortedDates.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            Nenhuma tarefa com data definida
          </div>
        ) : (
          sortedDates.map((dateKey) => {
            const date = new Date(dateKey);
            const dayTasks = tasksByDate.get(dateKey)!;
            const isToday =
              date.toDateString() === new Date().toDateString();
            const isPast = date < new Date() && !isToday;

            return (
              <div key={dateKey} className="relative">
                {/* Linha do tempo */}
                <div className="flex gap-4">
                  {/* Data */}
                  <div
                    className={cn(
                      "flex flex-col items-center min-w-[100px] pt-1",
                      isToday && "text-lumina-600 dark:text-lumina-400 font-semibold"
                    )}
                  >
                    <div className="text-xs font-medium uppercase">
                      {date.toLocaleDateString("pt-BR", { weekday: "short" })}
                    </div>
                    <div className="text-xl font-bold">
                      {date.getDate()}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {date.toLocaleDateString("pt-BR", { month: "short" })}
                    </div>
                    <div
                      className={cn(
                        "absolute left-1/2 top-12 bottom-0 w-0.5 -translate-x-1/2",
                        isPast ? "bg-red-200 dark:bg-red-900/30" :
                        isToday ? "bg-lumina-300 dark:bg-lumina-700" :
                        "bg-muted"
                      )}
                    />
                  </div>

                  {/* Tarefas */}
                  <div className="flex-1 space-y-2 pb-6">
                    {dayTasks.map((task) => (
                      <Card
                        key={task.id}
                        className={cn(
                          "p-3 cursor-pointer hover:shadow-md transition-all",
                          isPast && task.status !== "completed" && "border-red-300 dark:border-red-900/50"
                        )}
                        onClick={() => {
                          setSelectedTask(task);
                          setShowDetailsDialog(true);
                        }}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h4
                                className={cn(
                                  "font-semibold text-sm",
                                  task.status === "completed" && "line-through text-muted-foreground"
                                )}
                              >
                                {task.title}
                              </h4>
                              <Badge className={getPriorityColor(task.priority)} variant="secondary" style={{ fontSize: "10px" }}>
                                {task.priority}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-2 mb-2">
                              <div className="flex-1 bg-muted rounded-full h-1.5">
                                <div
                                  className={cn("h-full", getProgressColor(task.progress))}
                                  style={{ width: `${task.progress}%` }}
                                />
                              </div>
                              <span className="text-xs text-muted-foreground">
                                {task.progress}%
                              </span>
                            </div>
                            {task.description && (
                              <p className="text-xs text-muted-foreground line-clamp-2">
                                {task.description}
                              </p>
                            )}
                            {task.assigned_team_member_id && teamMembers.has(task.assigned_team_member_id) && (
                              <div className="flex items-center gap-1 text-xs text-muted-foreground mt-2">
                                <Users className="h-3 w-3" />
                                {teamMembers.get(task.assigned_team_member_id)!.name}
                              </div>
                            )}
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    );
  };

  const stats = useMemo(() => {
    const allTasks = (taskList: TaskWithHierarchy[]): TaskWithHierarchy[] => {
      let result: TaskWithHierarchy[] = [];
      taskList.forEach((task) => {
        result.push(task);
        if (task.children) {
          result = result.concat(allTasks(task.children));
        }
      });
      return result;
    };

    const all = allTasks(filteredTasks);
    return {
      total: all.length,
      completed: all.filter((t) => t.status === "completed").length,
      inProgress: all.filter((t) => t.status === "in_progress").length,
      pending: all.filter((t) => t.status === "pending").length,
      avgProgress: all.length > 0 
        ? all.reduce((sum, t) => sum + (t.calculated_progress ?? t.progress), 0) / all.length 
        : 0,
    };
  }, [filteredTasks]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-lumina-500" />
      </div>
    );
  }

  return (
    <div className="space-y-3 sm:space-y-4 lg:space-y-6">
      {/* Estatísticas */}
      <TasksStats stats={stats} />

      {/* Filtros e Controles */}
      <Card className="p-3 sm:p-4">
        <div className="flex flex-col gap-3 sm:gap-4 md:flex-row md:items-center md:justify-between">
          {/* Busca */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar tarefas..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 sm:pl-9 text-xs sm:text-sm h-8 sm:h-10"
            />
          </div>

          {/* Filtros */}
          <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-1">
            {/* Projeto */}
            <div className="relative min-w-[140px]">
              <Folder className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground pointer-events-none" />
              <select
                value={selectedProject}
                onChange={(e) => setSelectedProject(e.target.value)}
                className="w-full pl-7 sm:pl-9 pr-6 sm:pr-8 py-1.5 sm:py-2 rounded-md border border-input bg-background text-xs sm:text-sm"
              >
                <option value="all">Todos</option>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Modo de visualização */}
            <div className="flex items-center rounded-lg border bg-background">
              <Button
                variant={viewMode === "list" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setViewMode("list")}
                className="rounded-r-none h-7 sm:h-8 px-2 sm:px-3 text-xs"
              >
                Lista
              </Button>
              <Button
                variant={viewMode === "timeline" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setViewMode("timeline")}
                className="rounded-none h-7 sm:h-8 px-2 sm:px-3 text-xs"
              >
                Timeline
              </Button>
              <Button
                variant={viewMode === "gantt" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setViewMode("gantt")}
                className="rounded-l-none h-7 sm:h-8 px-2 sm:px-3 text-xs"
              >
                Gantt
              </Button>
            </div>

            {/* Botão Atualizar */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                loadData();
                toast.success("Tarefas atualizadas!");
              }}
              disabled={isLoading}
              className="gap-1.5 sm:gap-2 h-7 sm:h-9 px-2 sm:px-3 text-xs sm:text-sm"
            >
              <RefreshCw className={cn("h-3 w-3 sm:h-4 sm:w-4", isLoading && "animate-spin")} />
              <span className="hidden sm:inline">Atualizar</span>
            </Button>

            {/* Botão Criar */}
            <Button
              onClick={() => {
                setCreatingForTask(null);
                setShowCreateDialog(true);
              }}
              className="gap-1.5 sm:gap-2 h-7 sm:h-9 px-2 sm:px-4 text-xs sm:text-sm"
            >
              <Plus className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Nova Tarefa</span>
              <span className="sm:hidden">Nova</span>
            </Button>
          </div>
        </div>
      </Card>

      {/* Lista de Tarefas */}
      <Card className="p-3 sm:p-4 lg:p-6">
        {filteredTasks.length === 0 ? (
          <div className="text-center py-12">
            <Target className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-semibold mb-2">
              {searchQuery ? "Nenhuma tarefa encontrada" : "Nenhuma tarefa ainda"}
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              {searchQuery
                ? "Tente ajustar sua busca"
                : "Crie sua primeira tarefa para começar"}
            </p>
            {!searchQuery && (
              <Button
                onClick={() => {
                  setCreatingForTask(null);
                  setShowCreateDialog(true);
                }}
                className="gap-2"
              >
                <Plus className="h-4 w-4" />
                Criar Primeira Tarefa
              </Button>
            )}
          </div>
        ) : viewMode === "list" ? (
          <div className="space-y-2">
            {filteredTasks.map((task) => (
              <TaskItem
                key={task.id}
                task={task}
                isExpanded={expandedTasks.has(task.id)}
                teamMembers={teamMembers}
                onToggleExpand={toggleExpand}
                onCompleteSubtask={handleCompleteSubtask}
                onTaskClick={(t) => {
                  setSelectedTask(t);
                  setShowDetailsDialog(true);
                }}
                onAddSubtask={(taskId) => {
                  setCreatingForTask(taskId);
                  setShowCreateDialog(true);
                }}
                onEdit={(t) => {
                  setSelectedTask(t);
                  setShowDetailsDialog(true);
                }}
                onDelete={handleDelete}
              />
            ))}
          </div>
        ) : viewMode === "timeline" ? (
          <TasksTimeline
            tasks={filteredTasks}
            teamMembers={teamMembers}
            onTaskClick={(task) => {
              setSelectedTask(task);
              setShowDetailsDialog(true);
            }}
          />
        ) : (
          <GanttChartView
            tasks={filteredTasks}
            teamMembers={teamMembers}
            onTaskClick={(task) => {
              setSelectedTask(task);
              setShowDetailsDialog(true);
            }}
          />
        )}
      </Card>

      {/* Dialogs */}
      {showCreateDialog && (
        <CreateTaskDialog
          projectId={selectedProject !== "all" ? selectedProject : undefined}
          parentId={creatingForTask || undefined}
          onClose={() => {
            setShowCreateDialog(false);
            setCreatingForTask(null);
          }}
          onSuccess={loadData}
        />
      )}

      {showDetailsDialog && selectedTask && (
        <TaskDetailsDialog
          task={selectedTask}
          subtasks={selectedTask.children || []}
          onClose={() => {
            setShowDetailsDialog(false);
            setSelectedTask(null);
          }}
          onUpdate={loadData}
          onAddSubtask={(taskId) => {
            setCreatingForTask(taskId);
            setShowCreateDialog(true);
            setShowDetailsDialog(false);
          }}
        />
      )}
    </div>
  );
}

