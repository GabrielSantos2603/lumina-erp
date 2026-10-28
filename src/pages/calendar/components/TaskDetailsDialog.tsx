import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  X,
  Edit,
  Trash2,
  Plus,
  Clock,
  Target,
  TrendingUp,
  CheckSquare,
  Square,
  Tag,
  Users,
  Folder,
} from "lucide-react";
import { cn } from "@/utils/cn";
import { taskService, type Task, type TaskPriority } from "@/services/taskService";
import { toast } from "react-hot-toast";

interface TaskDetailsDialogProps {
  task: Task;
  subtasks?: Task[]; // Sub-tarefas desta tarefa
  onClose: () => void;
  onUpdate: () => void;
  onAddSubtask: (taskId: string) => void;
}

export function TaskDetailsDialog({
  task,
  subtasks = [],
  onClose,
  onUpdate,
  onAddSubtask,
}: TaskDetailsDialogProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedTask, setEditedTask] = useState({
    title: task.title,
    description: task.description || "",
    priority: task.priority,
    status: task.status,
    due_date: task.due_date || "",
    start_date: task.start_date || "",
    weight: task.weight?.toString() || "1.0",
    estimated_hours: task.estimated_hours?.toString() || "",
    tags: task.tags?.join(", ") || "",
    category: task.category || "",
  });
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    try {
      setIsSaving(true);
      await taskService.updateTask(task.id, {
        title: editedTask.title,
        description: editedTask.description || undefined,
        priority: editedTask.priority as TaskPriority,
        status: editedTask.status as any,
        due_date: editedTask.due_date || undefined,
        start_date: editedTask.start_date || undefined,
        weight: editedTask.weight ? parseFloat(editedTask.weight) : undefined,
        estimated_hours: editedTask.estimated_hours
          ? parseFloat(editedTask.estimated_hours)
          : undefined,
        tags: editedTask.tags
          ? editedTask.tags.split(",").map((t) => t.trim())
          : undefined,
        category: editedTask.category || undefined,
      });

      toast.success("Tarefa atualizada!");
      setIsEditing(false);
      onUpdate();
    } catch (error) {
      console.error("Erro ao atualizar tarefa:", error);
      toast.error("Erro ao atualizar tarefa");
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleStatus = async () => {
    // Não permitir marcar tarefas mães como concluídas manualmente
    if (subtasks.length > 0 && task.status !== "completed") {
      const allSubtasksCompleted = subtasks.every(t => t.status === "completed");
      if (!allSubtasksCompleted) {
        toast.error("Não é possível marcar tarefas mães como concluídas manualmente. Todas as sub-tarefas devem estar concluídas primeiro.");
        return;
      }
    }

    const newStatus =
      task.status === "completed"
        ? "pending"
        : task.status === "pending"
        ? "in_progress"
        : "completed";

    try {
      // Calcular o novo progresso
      let newProgress: number;
      if (newStatus === "completed") {
        newProgress = 100;
      } else {
        // Se tem sub-tarefas, recalcular baseado nelas
        if (subtasks.length > 0) {
          const completedCount = subtasks.filter(st => st.status === "completed").length;
          newProgress = Math.round((completedCount / subtasks.length) * 100);
        } else {
          // Se não tem sub-tarefas, resetar para 0 ou manter o progresso manual
          newProgress = 0;
        }
      }

      await taskService.updateTask(task.id, {
        status: newStatus,
        progress: newProgress,
        completed_at: newStatus === "completed" ? new Date().toISOString() : undefined,
      });
      
      // Se marcou como concluída e é tarefa filha, verificar se deve marcar a mãe automaticamente
      if (newStatus === "completed" && (task as any).parent_id) {
        await checkAndCompleteParent((task as any).parent_id);
      }
      
      // Se desmarcou como concluída e é tarefa filha, recalcular progresso da mãe
      if (newStatus !== "completed" && (task as any).parent_id) {
        await recalculateParentProgress((task as any).parent_id);
      }
      
      toast.success("Status atualizado! Fechando...");
      
      // Atualizar lista em background
      onUpdate();
      
      // Fechar modal após um delay maior para garantir atualização
      setTimeout(() => {
        onClose();
      }, 500);
    } catch (error) {
      console.error("Erro ao atualizar status:", error);
      toast.error("Erro ao atualizar status");
    }
  };

  // Função para verificar e completar automaticamente tarefa mãe quando todas as filhas estão concluídas
  const checkAndCompleteParent = async (parentId: string) => {
    try {
      const parentTask = await taskService.getTaskById(parentId);
      const allSubtasks = await taskService.getTasks({ parent_id: parentId });
      
      // Verifica se todas as sub-tarefas estão concluídas
      const allCompleted = allSubtasks.length > 0 && allSubtasks.every(t => t.status === "completed");
      
      if (allCompleted && parentTask.status !== "completed") {
        await taskService.updateTask(parentId, {
          status: "completed",
          progress: 100,
          completed_at: new Date().toISOString(),
        });
        toast.success(`Tarefa mãe "${parentTask.title}" foi marcada como concluída automaticamente!`);
        
        // Recursivamente verificar se a mãe também tem mãe
        if ((parentTask as any).parent_id) {
          checkAndCompleteParent((parentTask as any).parent_id);
        }
      }
    } catch (error) {
      console.error("Erro ao verificar tarefa mãe:", error);
    }
  };

  // Função para recalcular progresso da tarefa mãe quando uma filha é desmarcada
  const recalculateParentProgress = async (parentId: string) => {
    try {
      const parentTask = await taskService.getTaskById(parentId);
      const allSubtasks = await taskService.getTasks({ parent_id: parentId });
      
      if (allSubtasks.length > 0) {
        // Recalcula progresso baseado nas sub-tarefas
        const completedCount = allSubtasks.filter(t => t.status === "completed").length;
        const newProgress = Math.round((completedCount / allSubtasks.length) * 100);
        
        // Atualiza progresso e status da mãe
        await taskService.updateTask(parentId, {
          progress: newProgress,
          status: newProgress === 100 ? "completed" : newProgress > 0 ? "in_progress" : "pending",
          completed_at: newProgress === 100 ? new Date().toISOString() : undefined,
        });
        
        // Recursivamente recalcular se a mãe também tem mãe
        if ((parentTask as any).parent_id) {
          await recalculateParentProgress((parentTask as any).parent_id);
        }
      }
    } catch (error) {
      console.error("Erro ao recalcular progresso da tarefa mãe:", error);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Tem certeza que deseja excluir esta tarefa? Todas as sub-tarefas também serão excluídas."))
      return;

    try {
      await taskService.deleteTask(task.id);
      toast.success("Tarefa excluída!");
      onClose();
      onUpdate();
    } catch (error) {
      console.error("Erro ao excluir tarefa:", error);
      toast.error("Erro ao excluir tarefa");
    }
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

  const progress = (task as any).calculated_progress ?? task.progress;

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4">
      <Card className="w-full max-w-4xl max-h-[95vh] sm:max-h-[90vh] flex flex-col">
        <CardHeader className="border-b flex-shrink-0 p-3 sm:p-6">
          <div className="flex items-center justify-between gap-2">
            <CardTitle className="flex items-center gap-1.5 sm:gap-2 text-base sm:text-lg">
              <Target className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
              <span className="truncate">{isEditing ? "Editar" : "Detalhes"}</span>
            </CardTitle>
            <div className="flex items-center gap-1 sm:gap-2">
              {!isEditing && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onAddSubtask(task.id)}
                    className="gap-1 sm:gap-2 h-8 px-2 sm:px-3"
                  >
                    <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    <span className="hidden sm:inline">Sub-tarefa</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsEditing(true)}
                    className="gap-1 sm:gap-2 h-8 px-2 sm:px-3"
                  >
                    <Edit className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    <span className="hidden sm:inline">Editar</span>
                  </Button>
                  <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
                    <X className="h-4 w-4" />
                  </Button>
                </>
              )}
              {isEditing && (
                <Button variant="ghost" size="icon" onClick={() => setIsEditing(false)} className="h-8 w-8">
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-3 sm:p-6 overflow-y-auto flex-1">
          {isEditing ? (
            <div className="space-y-3 sm:space-y-4">
              {/* Título */}
              <div className="space-y-2">
                <Label htmlFor="edit-title">Título *</Label>
                <Input
                  id="edit-title"
                  value={editedTask.title}
                  onChange={(e) =>
                    setEditedTask({ ...editedTask, title: e.target.value })
                  }
                  required
                />
              </div>

              {/* Prioridade e Status */}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="edit-priority">Prioridade</Label>
                  <select
                    id="edit-priority"
                    value={editedTask.priority}
                    onChange={(e) =>
                      setEditedTask({
                        ...editedTask,
                        priority: e.target.value as TaskPriority,
                      })
                    }
                    className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm"
                  >
                    <option value="low">Baixa</option>
                    <option value="medium">Média</option>
                    <option value="high">Alta</option>
                    <option value="urgent">Urgente</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-status">Status</Label>
                  <select
                    id="edit-status"
                    value={editedTask.status}
                    onChange={(e) =>
                      setEditedTask({ ...editedTask, status: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm"
                  >
                    <option value="pending">Pendente</option>
                    <option value="in_progress">Em Progresso</option>
                    <option value="completed">Concluída</option>
                    <option value="cancelled">Cancelada</option>
                    <option value="on_hold">Em Espera</option>
                  </select>
                </div>
              </div>

              {/* Descrição */}
              <div className="space-y-2">
                <Label htmlFor="edit-description">Descrição</Label>
                <textarea
                  id="edit-description"
                  value={editedTask.description}
                  onChange={(e) =>
                    setEditedTask({ ...editedTask, description: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm min-h-[100px]"
                />
              </div>

              {/* Datas */}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="edit-start-date">Data de Início</Label>
                  <Input
                    id="edit-start-date"
                    type="date"
                    value={editedTask.start_date}
                    onChange={(e) =>
                      setEditedTask({ ...editedTask, start_date: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-due-date">Data de Vencimento</Label>
                  <Input
                    id="edit-due-date"
                    type="date"
                    value={editedTask.due_date}
                    onChange={(e) =>
                      setEditedTask({ ...editedTask, due_date: e.target.value })
                    }
                  />
                </div>
              </div>

              {/* Peso e Horas */}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="edit-weight">Peso (0-100)</Label>
                  <Input
                    id="edit-weight"
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    value={editedTask.weight}
                    onChange={(e) =>
                      setEditedTask({ ...editedTask, weight: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-hours">Horas Estimadas</Label>
                  <Input
                    id="edit-hours"
                    type="number"
                    step="0.5"
                    min="0"
                    value={editedTask.estimated_hours}
                    onChange={(e) =>
                      setEditedTask({ ...editedTask, estimated_hours: e.target.value })
                    }
                  />
                </div>
              </div>

              {/* Tags e Categoria */}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="edit-tags">Tags</Label>
                  <Input
                    id="edit-tags"
                    value={editedTask.tags}
                    onChange={(e) =>
                      setEditedTask({ ...editedTask, tags: e.target.value })
                    }
                    placeholder="tag1, tag2, tag3"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-category">Categoria</Label>
                  <Input
                    id="edit-category"
                    value={editedTask.category}
                    onChange={(e) =>
                      setEditedTask({ ...editedTask, category: e.target.value })
                    }
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4 sm:space-y-6">
              {/* Header com Status */}
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex-1 min-w-0">
                  <h2 className="text-lg sm:text-2xl font-bold mb-2 break-words">{task.title}</h2>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge className={cn(getPriorityColor(task.priority), "text-[10px] sm:text-xs")} variant="secondary">
                      {task.priority === "urgent"
                        ? "Urgente"
                        : task.priority === "high"
                        ? "Alta"
                        : task.priority === "medium"
                        ? "Média"
                        : "Baixa"}
                    </Badge>
                    <Badge className={cn(getStatusColor(task.status), "text-[10px] sm:text-xs")} variant="secondary">
                      {task.status === "completed"
                        ? "Concluída"
                        : task.status === "in_progress"
                        ? "Em Progresso"
                        : task.status === "pending"
                        ? "Pendente"
                        : task.status === "cancelled"
                        ? "Cancelada"
                        : "Em Espera"}
                    </Badge>
                  </div>

                  {/* Progresso */}
                  <div className="space-y-2 mt-3">
                    <div className="flex items-center justify-between text-xs sm:text-sm">
                      <span className="text-muted-foreground">Progresso</span>
                      <span className="font-semibold">{progress.toFixed(0)}%</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2 sm:h-3">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all",
                          progress === 100
                            ? "bg-green-500"
                            : progress >= 75
                            ? "bg-blue-500"
                            : progress >= 50
                            ? "bg-yellow-500"
                            : progress >= 25
                            ? "bg-orange-500"
                            : "bg-red-500"
                        )}
                        style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-2 sm:flex-shrink-0">
                  {task.status !== "completed" ? (
                    <Button
                      variant="default"
                      onClick={handleToggleStatus}
                      className="gap-1.5 text-xs sm:text-sm h-8 sm:h-9 w-full sm:w-auto"
                      disabled={subtasks.length > 0 && !subtasks.every(t => t.status === "completed")}
                      title={
                        subtasks.length > 0 && !subtasks.every(t => t.status === "completed")
                          ? "Todas as sub-tarefas devem estar concluídas primeiro"
                          : undefined
                      }
                    >
                      {subtasks.length > 0 && !subtasks.every(t => t.status === "completed")
                        ? `Concluir (${subtasks.filter(t => t.status === "completed").length}/${subtasks.length})`
                        : "Marcar como concluída"}
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      onClick={handleToggleStatus}
                      className="gap-1.5 text-xs sm:text-sm h-8 sm:h-9 w-full sm:w-auto"
                    >
                      Desmarcar
                    </Button>
                  )}
                  {subtasks.length > 0 && task.status !== "completed" && (
                    <p className="text-[10px] sm:text-xs text-muted-foreground">
                      {subtasks.length} sub-tarefa{subtasks.length > 1 ? "s" : ""} deve{subtasks.length > 1 ? "m" : ""} estar concluída{subtasks.length > 1 ? "s" : ""}
                    </p>
                  )}
                </div>
            </div>

              {/* Descrição */}
              {task.description && (
                <div>
                  <Label className="text-xs sm:text-sm font-semibold mb-1.5 sm:mb-2 block">Descrição</Label>
                  <p className="text-xs sm:text-sm text-muted-foreground whitespace-pre-wrap break-words">
                    {task.description}
                  </p>
                </div>
              )}

            {/* Sub-tarefas */}
            {subtasks.length > 0 && (
              <div className="space-y-2 sm:space-y-3">
                <Label className="text-xs sm:text-sm font-semibold mb-2 block">Sub-tarefas</Label>
                <div className="space-y-2">
                  {subtasks.map((st) => (
                    <div
                      key={st.id}
                      className={cn(
                        "flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 p-2.5 sm:p-3 rounded-lg border",
                        "hover:bg-muted/50 transition-colors"
                      )}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start sm:items-center gap-2 flex-wrap">
                          <h4 className={cn("font-medium text-xs sm:text-sm break-words flex-1",
                            st.status === "completed" && "line-through text-muted-foreground"
                          )}>
                            {st.title}
                          </h4>
                          <Badge variant="secondary" className={cn(getStatusColor(st.status), "text-[10px] whitespace-nowrap")}>
                            {st.status === "completed" ? "Concluída" : st.status === "in_progress" ? "Progresso" : "Pendente"}
                          </Badge>
                        </div>
                        {st.description && (
                          <p className="text-[10px] sm:text-xs text-muted-foreground line-clamp-2 mt-1">{st.description}</p>
                        )}
                      </div>

                      {st.status !== "completed" ? (
                        <Button
                          size="sm"
                          variant="default"
                          className="gap-1.5 text-[10px] sm:text-xs h-7 sm:h-8 w-full sm:w-auto whitespace-nowrap"
                          onClick={async () => {
                            try {
                              await taskService.updateTask(st.id, {
                                status: "completed",
                                progress: 100,
                                completed_at: new Date().toISOString(),
                              });
                              toast.success("Sub-tarefa concluída!");
                              onUpdate();
                            } catch (error) {
                              console.error("Erro ao concluir sub-tarefa:", error);
                              toast.error("Erro ao concluir sub-tarefa");
                            }
                          }}
                        >
                          Concluir
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-1.5 text-[10px] sm:text-xs h-7 sm:h-8 w-full sm:w-auto whitespace-nowrap"
                          onClick={async () => {
                            try {
                              await taskService.updateTask(st.id, {
                                status: "in_progress",
                                progress: Math.min(99, st.progress || 0),
                                completed_at: undefined,
                              });
                              toast.success("Sub-tarefa desmarcada!");
                              onUpdate();
                            } catch (error) {
                              console.error("Erro ao desmarcar sub-tarefa:", error);
                              toast.error("Erro ao desmarcar sub-tarefa");
                            }
                          }}
                        >
                          Desmarcar
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

              {/* Informações */}
              <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2">
                {task.due_date && (
                  <div>
                    <Label className="text-xs sm:text-sm font-semibold mb-1.5 sm:mb-2 flex items-center gap-1.5 sm:gap-2">
                      <Clock className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      Vencimento
                    </Label>
                    <p className="text-xs sm:text-sm">
                      {new Date(task.due_date).toLocaleDateString("pt-BR", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                )}

                {task.estimated_hours && (
                  <div>
                    <Label className="text-xs sm:text-sm font-semibold mb-1.5 sm:mb-2 flex items-center gap-1.5 sm:gap-2">
                      <TrendingUp className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      Horas Estimadas
                    </Label>
                    <p className="text-xs sm:text-sm">{task.estimated_hours}h</p>
                  </div>
                )}

                {task.weight && (
                  <div>
                    <Label className="text-xs sm:text-sm font-semibold mb-1.5 sm:mb-2 flex items-center gap-1.5 sm:gap-2">
                      <Target className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      Peso
                    </Label>
                    <p className="text-xs sm:text-sm">{task.weight}</p>
                  </div>
                )}

                {task.level !== undefined && (
                  <div>
                    <Label className="text-xs sm:text-sm font-semibold mb-1.5 sm:mb-2">Nível</Label>
                    <p className="text-xs sm:text-sm">Nível {task.level + 1}</p>
                  </div>
                )}
              </div>

              {/* Tags */}
              {task.tags && task.tags.length > 0 && (
                <div>
                  <Label className="text-xs sm:text-sm font-semibold mb-1.5 sm:mb-2 flex items-center gap-1.5 sm:gap-2">
                    <Tag className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    Tags
                  </Label>
                  <div className="flex flex-wrap gap-1.5 sm:gap-2">
                    {task.tags.map((tag, idx) => (
                      <Badge key={idx} variant="outline" className="text-[10px] sm:text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Categoria */}
              {task.category && (
                <div>
                  <Label className="text-xs sm:text-sm font-semibold mb-1.5 sm:mb-2">Categoria</Label>
                  <Badge variant="outline" className="text-[10px] sm:text-xs">{task.category}</Badge>
                </div>
              )}
            </div>
          )}
        </CardContent>

        <div className="border-t p-3 sm:p-6 flex-shrink-0 flex flex-col sm:flex-row justify-between gap-2 sm:gap-0">
          {isEditing ? (
            <>
              <Button variant="outline" onClick={() => setIsEditing(false)} className="w-full sm:w-auto order-2 sm:order-1">
                Cancelar
              </Button>
              <div className="flex gap-2 order-1 sm:order-2">
                <Button variant="destructive" onClick={handleDelete} className="flex-1 sm:flex-initial text-xs sm:text-sm h-9">
                  <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                  Excluir
                </Button>
                <Button onClick={handleSave} disabled={isSaving} className="flex-1 sm:flex-initial text-xs sm:text-sm h-9">
                  {isSaving ? "Salvando..." : "Salvar"}
                </Button>
              </div>
            </>
          ) : (
            <Button onClick={onClose} className="w-full sm:w-auto">Fechar</Button>
          )}
        </div>
      </Card>
    </div>
  );
}

