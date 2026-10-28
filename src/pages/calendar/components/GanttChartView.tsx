import { useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Calendar as CalendarIcon,
  Clock,
  Users,
  TrendingUp,
  CheckSquare,
  Square,
} from "lucide-react";
import { cn } from "@/utils/cn";
import type { Task } from "@/services/taskService";
import type { TeamMember } from "@/services/teamService";

interface TaskWithHierarchy extends Task {
  parent_id?: string;
  assigned_team_member_id?: string;
  children?: TaskWithHierarchy[];
  level?: number;
}

interface GanttChartViewProps {
  tasks: TaskWithHierarchy[];
  teamMembers: Map<string, TeamMember>;
  onTaskClick: (task: TaskWithHierarchy) => void;
}

const DAY_WIDTH = 40; // Largura de cada dia em pixels
const TASK_HEIGHT = 50; // Altura de cada tarefa em pixels

export function GanttChartView({
  tasks,
  teamMembers,
  onTaskClick,
}: GanttChartViewProps) {
  // Calcular o range de datas
  const dateRange = useMemo(() => {
    const allDates: Date[] = [];
    
    const collectDates = (taskList: TaskWithHierarchy[]) => {
      taskList.forEach((task) => {
        if (task.start_date) allDates.push(new Date(task.start_date));
        if (task.due_date) allDates.push(new Date(task.due_date));
        if (task.children) collectDates(task.children);
      });
    };
    
    collectDates(tasks);
    
    if (allDates.length === 0) {
      // Se não há datas, usar o mês atual
      const today = new Date();
      const start = new Date(today.getFullYear(), today.getMonth(), 1);
      const end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      return { start, end };
    }
    
    const minDate = new Date(Math.min(...allDates.map(d => d.getTime())));
    const maxDate = new Date(Math.max(...allDates.map(d => d.getTime())));
    
    // Adicionar margem de 7 dias antes e depois
    minDate.setDate(minDate.getDate() - 7);
    maxDate.setDate(maxDate.getDate() + 7);
    
    return { start: minDate, end: maxDate };
  }, [tasks]);

  // Gerar array de datas
  const dates = useMemo(() => {
    const days: Date[] = [];
    const current = new Date(dateRange.start);
    
    while (current <= dateRange.end) {
      days.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
    
    return days;
  }, [dateRange]);

  // Aplanar tarefas com hierarquia para renderização
  const flatTasks = useMemo(() => {
    const result: Array<{ task: TaskWithHierarchy; level: number }> = [];
    
    const flatten = (taskList: TaskWithHierarchy[], level = 0) => {
      taskList.forEach((task) => {
        result.push({ task, level });
        if (task.children && task.children.length > 0) {
          flatten(task.children, level + 1);
        }
      });
    };
    
    flatten(tasks);
    return result;
  }, [tasks]);

  const getTaskLeft = (task: TaskWithHierarchy): number => {
    const startDate = task.start_date ? new Date(task.start_date) : dateRange.start;
    const daysDiff = Math.floor((startDate.getTime() - dateRange.start.getTime()) / (1000 * 60 * 60 * 24));
    return Math.max(0, daysDiff * DAY_WIDTH);
  };

  const getTaskWidth = (task: TaskWithHierarchy): number => {
    const startDate = task.start_date ? new Date(task.start_date) : dateRange.start;
    const endDate = task.due_date ? new Date(task.due_date) : (task.start_date ? new Date(task.start_date) : dateRange.end);
    const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    return Math.max(DAY_WIDTH, daysDiff * DAY_WIDTH);
  };

  const getProgressColor = (progress: number) => {
    if (progress === 100) return "bg-green-500";
    if (progress >= 75) return "bg-blue-500";
    if (progress >= 50) return "bg-yellow-500";
    if (progress >= 25) return "bg-orange-500";
    return "bg-red-500";
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      completed: "bg-green-100 border-green-500 dark:bg-green-900/30 dark:border-green-700",
      in_progress: "bg-blue-100 border-blue-500 dark:bg-blue-900/30 dark:border-blue-700",
      pending: "bg-yellow-100 border-yellow-500 dark:bg-yellow-900/30 dark:border-yellow-700",
      cancelled: "bg-gray-100 border-gray-500 dark:bg-gray-900/30 dark:border-gray-700",
      on_hold: "bg-purple-100 border-purple-500 dark:bg-purple-900/30 dark:border-purple-700",
    };
    return colors[status] || colors.pending;
  };

  const today = new Date();
  const todayIndex = dates.findIndex(d => 
    d.getDate() === today.getDate() && 
    d.getMonth() === today.getMonth() && 
    d.getFullYear() === today.getFullYear()
  );

  return (
    <div className="space-y-4">
      {/* Header com datas */}
      <div className="overflow-x-auto">
        <div className="flex" style={{ minWidth: `${dates.length * DAY_WIDTH + 250}px` }}>
          {/* Coluna de tarefas */}
          <div className="sticky left-0 z-20 bg-background border-r min-w-[250px] flex items-center px-4 py-2 font-semibold">
            Tarefa
          </div>
          
          {/* Datas */}
          <div className="flex">
            {dates.map((date, index) => {
              const isToday = 
                date.getDate() === today.getDate() && 
                date.getMonth() === today.getMonth() && 
                date.getFullYear() === today.getFullYear();
              const isWeekend = date.getDay() === 0 || date.getDay() === 6;
              
              return (
                <div
                  key={date.toISOString()}
                  className={cn(
                    "border-r border-b text-center py-2",
                    isToday && "bg-lumina-100 dark:bg-lumina-900/30 border-lumina-500",
                    isWeekend && !isToday && "bg-muted/50"
                  )}
                  style={{ width: `${DAY_WIDTH}px`, minWidth: `${DAY_WIDTH}px` }}
                >
                  <div className="text-xs font-medium">
                    {date.getDate()}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {date.toLocaleDateString("pt-BR", { weekday: "short" })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Tarefas */}
      <div className="overflow-x-auto border rounded-lg">
        <div className="relative" style={{ minWidth: `${dates.length * DAY_WIDTH + 250}px` }}>
          {/* Linha de hoje */}
          {todayIndex >= 0 && (
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-lumina-500 z-10 pointer-events-none"
              style={{
                left: `${250 + todayIndex * DAY_WIDTH + DAY_WIDTH / 2}px`,
              }}
            />
          )}

          {flatTasks.map(({ task, level }) => {
            const left = getTaskLeft(task);
            const width = getTaskWidth(task);
            const progress = (task as any).calculated_progress ?? task.progress;
            const indent = level * 24;

            return (
              <div
                key={task.id}
                className={cn(
                  "flex items-center border-b hover:bg-muted/50 transition-colors cursor-pointer relative",
                  getStatusColor(task.status)
                )}
                style={{ height: `${TASK_HEIGHT}px` }}
                onClick={() => onTaskClick(task)}
              >
                {/* Coluna de tarefas */}
                <div
                  className="sticky left-0 z-10 bg-background border-r px-4 py-2 flex items-center gap-3 h-full"
                  style={{ minWidth: "250px", paddingLeft: `${16 + indent}px` }}
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    {task.status === "completed" ? (
                      <CheckSquare className="h-4 w-4 text-green-600 flex-shrink-0" />
                    ) : (
                      <Square className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    )}
                    <span className={cn(
                      "font-medium text-sm truncate",
                      task.status === "completed" && "line-through text-muted-foreground"
                    )}>
                      {task.title}
                    </span>
                  </div>
                  {task.assigned_team_member_id && teamMembers.has(task.assigned_team_member_id) && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground flex-shrink-0">
                      <Users className="h-3 w-3" />
                      <span className="truncate max-w-[60px]">
                        {teamMembers.get(task.assigned_team_member_id)!.name}
                      </span>
                    </div>
                  )}
                </div>

                {/* Barra do Gantt */}
                <div
                  className="relative flex-1 h-full"
                  style={{ minWidth: `${dates.length * DAY_WIDTH}px` }}
                >
                  {/* Barra de progresso */}
                  <div
                    className={cn(
                      "absolute h-6 rounded top-1/2 -translate-y-1/2 border-2 shadow-sm",
                      getStatusColor(task.status)
                    )}
                    style={{
                      left: `${left}px`,
                      width: `${width}px`,
                    }}
                  >
                    {/* Progresso interno */}
                    <div
                      className={cn(
                        "h-full rounded-l transition-all",
                        getProgressColor(progress)
                      )}
                      style={{ width: `${progress}%` }}
                    />
                    
                    {/* Texto da tarefa na barra */}
                    <div className="absolute inset-0 flex items-center justify-center text-xs font-medium text-foreground px-2 truncate">
                      {width > 100 ? task.title : ""}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {flatTasks.length === 0 && (
            <div className="flex items-center justify-center py-12 text-muted-foreground">
              Nenhuma tarefa com datas definidas para exibir no Gantt Chart
            </div>
          )}
        </div>
      </div>

      {/* Legenda */}
      <Card className="p-4">
        <div className="flex items-center gap-6 text-sm">
          <div className="font-semibold">Legenda:</div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-green-500 border-2 border-green-600" />
            <span>Concluída</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-blue-500 border-2 border-blue-600" />
            <span>Em Progresso</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-yellow-500 border-2 border-yellow-600" />
            <span>Pendente</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-0.5 bg-lumina-500" />
            <span>Hoje</span>
          </div>
        </div>
      </Card>
    </div>
  );
}




