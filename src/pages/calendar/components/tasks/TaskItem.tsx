import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ChevronRight,
  ChevronDown,
  CheckSquare,
  Square,
  Clock,
  Target,
  TrendingUp,
  Users,
  MoreVertical,
  Plus,
  Edit,
  Trash2,
} from "lucide-react";
import { cn } from "@/utils/cn";
import type { TeamMember } from "@/services/teamService";

interface TaskWithHierarchy {
  id: string;
  title: string;
  status: string;
  priority: string;
  progress: number;
  calculated_progress?: number;
  due_date?: string;
  estimated_hours?: number;
  assigned_team_member_id?: string;
  weight?: number;
  subtasks_count?: number;
  completed_subtasks_count?: number;
  children?: TaskWithHierarchy[];
}

interface TaskItemProps {
  task: TaskWithHierarchy;
  depth?: number;
  isExpanded: boolean;
  teamMembers: Map<string, TeamMember>;
  onToggleExpand: (taskId: string) => void;
  onCompleteSubtask: (taskId: string) => Promise<void>;
  onTaskClick: (task: TaskWithHierarchy) => void;
  onAddSubtask: (taskId: string) => void;
  onEdit: (task: TaskWithHierarchy) => void;
  onDelete: (taskId: string) => void;
}

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case "urgent":
      return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
    case "high":
      return "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400";
    case "medium":
      return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400";
    default:
      return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400";
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case "completed":
      return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";
    case "in_progress":
      return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400";
    case "cancelled":
      return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
    case "on_hold":
      return "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400";
    default:
      return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400";
  }
};

const getProgressColor = (progress: number) => {
  if (progress === 100) return "bg-green-500";
  if (progress >= 75) return "bg-blue-500";
  if (progress >= 50) return "bg-yellow-500";
  if (progress >= 25) return "bg-orange-500";
  return "bg-red-500";
};

export function TaskItem({
  task,
  depth = 0,
  isExpanded,
  teamMembers,
  onToggleExpand,
  onCompleteSubtask,
  onTaskClick,
  onAddSubtask,
  onEdit,
  onDelete,
}: TaskItemProps) {
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
              onClick={() => onToggleExpand(task.id)}
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
                  onClick={(e) => {
                    e.stopPropagation();
                    onCompleteSubtask(task.id);
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
        <div className="flex-1 min-w-0 cursor-pointer" onClick={() => onTaskClick(task)}>
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
            <DropdownMenuItem onClick={() => onAddSubtask(task.id)}>
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Sub-tarefa
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onEdit(task)}>
              <Edit className="h-4 w-4 mr-2" />
              Editar
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onDelete(task.id)} className="text-red-600">
              <Trash2 className="h-4 w-4 mr-2" />
              Excluir
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Sub-tarefas */}
      {hasChildren && isExpanded && (
        <div className="ml-4 border-l-2 border-l-muted pl-2">
          {task.children?.map((child) => (
            <TaskItem
              key={child.id}
              task={child}
              depth={depth + 1}
              isExpanded={isExpanded}
              teamMembers={teamMembers}
              onToggleExpand={onToggleExpand}
              onCompleteSubtask={onCompleteSubtask}
              onTaskClick={onTaskClick}
              onAddSubtask={onAddSubtask}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}
