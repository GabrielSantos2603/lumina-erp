import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  X,
  Clock,
  MapPin,
  Users,
  Calendar as CalendarIcon,
  CheckSquare,
  Tag,
  FileText,
  Link as LinkIcon,
  AlertCircle,
  CheckCircle2,
  Plus,
} from "lucide-react";
import { cn } from "@/utils/cn";
import type { CalendarEvent } from "@/services/calendarService";
import type { Task } from "@/services/taskService";
import { CreateItemDialog } from "./CreateItemDialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface CalendarItem {
  id: string;
  type: "event" | "task";
  title: string;
  color: string;
  start: Date;
  end?: Date;
  allDay?: boolean;
  data: CalendarEvent | Task;
}

interface DayDetailsDialogProps {
  date: Date;
  items: CalendarItem[];
  selectedItem: CalendarItem | null;
  onClose: () => void;
  onItemSelect: (item: CalendarItem) => void;
  onRefresh?: () => void;
}

export function DayDetailsDialog({
  date,
  items,
  selectedItem,
  onClose,
  onItemSelect,
  onRefresh,
}: DayDetailsDialogProps) {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [createType, setCreateType] = useState<"event" | "task">("event");

  const handleCreateSuccess = () => {
    if (onRefresh) {
      onRefresh();
    }
    setShowCreateDialog(false);
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("pt-BR", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getEventTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      meeting: "Reunião",
      delivery: "Entrega",
      milestone: "Marco",
      deadline: "Prazo",
      reminder: "Lembrete",
      other: "Outro",
    };
    return labels[type] || type;
  };

  const getTaskStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      pending: "Pendente",
      in_progress: "Em Progresso",
      completed: "Concluída",
      cancelled: "Cancelada",
      on_hold: "Em Espera",
    };
    return labels[status] || status;
  };

  const getPriorityLabel = (priority: string) => {
    const labels: Record<string, string> = {
      low: "Baixa",
      medium: "Média",
      high: "Alta",
      urgent: "Urgente",
    };
    return labels[priority] || priority;
  };

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] flex flex-col">
        <CardHeader className="border-b flex-shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <CalendarIcon className="h-5 w-5" />
                {formatDate(date)}
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {items.length} {items.length === 1 ? "item" : "itens"} agendados
              </p>
            </div>
            <div className="flex items-center gap-2">
              {/* Botão de Adicionar */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button className="gap-2" variant="default">
                    <Plus className="h-4 w-4" />
                    Adicionar
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={() => {
                      setCreateType("event");
                      setShowCreateDialog(true);
                    }}
                  >
                    <CalendarIcon className="h-4 w-4 mr-2" />
                    Novo Evento
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => {
                      setCreateType("task");
                      setShowCreateDialog(true);
                    }}
                  >
                    <CheckSquare className="h-4 w-4 mr-2" />
                    Nova Tarefa
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-6 overflow-y-auto flex-1">
          {items.length === 0 ? (
            <div className="text-center py-12">
              <CalendarIcon className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-semibold mb-2">Nenhum item agendado</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Não há eventos ou tarefas para este dia.
              </p>
              <Button
                onClick={() => {
                  setCreateType("event");
                  setShowCreateDialog(true);
                }}
                className="gap-2"
              >
                <Plus className="h-4 w-4" />
                Criar Primeiro Evento
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Lista de items */}
              <div className="grid gap-3">
                {items.map((item) => {
                  const isSelected = selectedItem?.id === item.id;
                  const isEvent = item.type === "event";
                  const event = isEvent ? (item.data as CalendarEvent) : null;
                  const task = !isEvent ? (item.data as Task) : null;

                  return (
                    <div
                      key={item.id}
                      onClick={() => onItemSelect(item)}
                      className={cn(
                        "p-4 rounded-lg border cursor-pointer transition-all",
                        isSelected
                          ? "border-lumina-500 bg-lumina-50 dark:bg-lumina-900/30 ring-2 ring-lumina-500"
                          : "hover:border-lumina-300 hover:bg-muted/50"
                      )}
                      style={
                        isSelected
                          ? undefined
                          : { borderLeftWidth: "4px", borderLeftColor: item.color }
                      }
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            {isEvent ? (
                              <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                            ) : (
                              <CheckSquare className="h-4 w-4 text-muted-foreground" />
                            )}
                            <h4 className="font-semibold">{item.title}</h4>
                            <Badge
                              variant="secondary"
                              className="text-xs"
                              style={{ backgroundColor: item.color, color: "white" }}
                            >
                              {isEvent
                                ? getEventTypeLabel(event!.event_type)
                                : getTaskStatusLabel(task!.status)}
                            </Badge>
                          </div>

                          {/* Informações de tempo */}
                          <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {item.allDay ? (
                                <span>Dia inteiro</span>
                              ) : (
                                <span>
                                  {formatTime(item.start)}
                                  {item.end && ` - ${formatTime(item.end)}`}
                                </span>
                              )}
                            </div>
                            {task && task.priority && (
                              <div className="flex items-center gap-1">
                                <AlertCircle className="h-3 w-3" />
                                <span>
                                  Prioridade: {getPriorityLabel(task.priority)}
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Descrição */}
                          {(event?.description || task?.description) && (
                            <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                              {event?.description || task?.description}
                            </p>
                          )}

                          {/* Detalhes adicionais */}
                          <div className="flex flex-wrap gap-2 mt-2">
                            {event?.location && (
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <MapPin className="h-3 w-3" />
                                {event.location}
                              </div>
                            )}
                            {event?.meeting_url && (
                              <a
                                href={event.meeting_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1 text-xs text-lumina-600 hover:text-lumina-700"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <LinkIcon className="h-3 w-3" />
                                Link da reunião
                              </a>
                            )}
                            {task?.project_id && (
                              <Badge variant="outline" className="text-xs">
                                Projeto: {task.project_id.slice(0, 8)}
                              </Badge>
                            )}
                            {task?.progress !== undefined && (
                              <Badge variant="outline" className="text-xs">
                                {task.progress}% concluído
                              </Badge>
                            )}
                          </div>

                          {/* Tags */}
                          {task?.tags && task.tags.length > 0 && (
                            <div className="flex items-center gap-1 mt-2 flex-wrap">
                              <Tag className="h-3 w-3 text-muted-foreground" />
                              {task.tags.map((tag, idx) => (
                                <Badge
                                  key={idx}
                                  variant="outline"
                                  className="text-xs"
                                >
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Indicador de seleção */}
                        {isSelected && (
                          <CheckCircle2 className="h-5 w-5 text-lumina-600 flex-shrink-0" />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Detalhes expandidos do item selecionado */}
              {selectedItem && (
                <Card className="mt-4 border-lumina-500">
                  <CardHeader>
                    <CardTitle className="text-lg">
                      Detalhes do {selectedItem.type === "event" ? "Evento" : "Tarefa"}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {selectedItem.type === "event" ? (
                      <EventDetails event={selectedItem.data as CalendarEvent} />
                    ) : (
                      <TaskDetails task={selectedItem.data as Task} />
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </CardContent>

        <div className="border-t p-4 flex-shrink-0 flex justify-end">
          <Button onClick={onClose}>Fechar</Button>
        </div>
      </Card>

      {/* Dialog de Criação */}
      {showCreateDialog && (
        <CreateItemDialog
          type={createType}
          date={date}
          onClose={() => setShowCreateDialog(false)}
          onSuccess={handleCreateSuccess}
        />
      )}
    </div>
  );
}

function EventDetails({ event }: { event: CalendarEvent }) {
  return (
    <div className="space-y-4">
      <div>
        <h4 className="font-semibold mb-1">Título</h4>
        <p>{event.title}</p>
      </div>

      {event.description && (
        <div>
          <h4 className="font-semibold mb-1 flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Descrição
          </h4>
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">
            {event.description}
          </p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        {event.location && (
          <div>
            <h4 className="font-semibold mb-1 flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Localização
            </h4>
            <p className="text-sm text-muted-foreground">{event.location}</p>
          </div>
        )}

        {event.meeting_url && (
          <div>
            <h4 className="font-semibold mb-1 flex items-center gap-2">
              <LinkIcon className="h-4 w-4" />
              Link da Reunião
            </h4>
            <a
              href={event.meeting_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-lumina-600 hover:text-lumina-700 underline"
            >
              {event.meeting_url}
            </a>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <h4 className="font-semibold mb-1">Status</h4>
          <Badge
            variant={
              event.status === "completed"
                ? "default"
                : event.status === "cancelled"
                ? "secondary"
                : "outline"
            }
          >
            {event.status === "scheduled"
              ? "Agendado"
              : event.status === "completed"
              ? "Concluído"
              : event.status === "cancelled"
              ? "Cancelado"
              : "Reagendado"}
          </Badge>
        </div>

        <div>
          <h4 className="font-semibold mb-1">Tipo</h4>
          <Badge variant="outline">{event.event_type}</Badge>
        </div>
      </div>

      {event.participants && event.participants.length > 0 && (
        <div>
          <h4 className="font-semibold mb-1 flex items-center gap-2">
            <Users className="h-4 w-4" />
            Participantes
          </h4>
          <div className="flex flex-wrap gap-2">
            {event.participants.map((participant, idx) => (
              <Badge key={idx} variant="secondary">
                {participant}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function TaskDetails({ task }: { task: Task }) {
  return (
    <div className="space-y-4">
      <div>
        <h4 className="font-semibold mb-1">Título</h4>
        <p>{task.title}</p>
      </div>

      {task.description && (
        <div>
          <h4 className="font-semibold mb-1 flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Descrição
          </h4>
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">
            {task.description}
          </p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <h4 className="font-semibold mb-1">Status</h4>
          <Badge
            variant={
              task.status === "completed"
                ? "default"
                : task.status === "cancelled"
                ? "secondary"
                : "outline"
            }
          >
            {task.status === "pending"
              ? "Pendente"
              : task.status === "in_progress"
              ? "Em Progresso"
              : task.status === "completed"
              ? "Concluída"
              : task.status === "cancelled"
              ? "Cancelada"
              : "Em Espera"}
          </Badge>
        </div>

        <div>
          <h4 className="font-semibold mb-1">Prioridade</h4>
          <Badge
            variant="outline"
            className={
              task.priority === "urgent"
                ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                : task.priority === "high"
                ? "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400"
                : task.priority === "medium"
                ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                : "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400"
            }
          >
            {task.priority === "low"
              ? "Baixa"
              : task.priority === "medium"
              ? "Média"
              : task.priority === "high"
              ? "Alta"
              : "Urgente"}
          </Badge>
        </div>
      </div>

      {task.progress !== undefined && (
        <div>
          <div className="flex items-center justify-between mb-1">
            <h4 className="font-semibold">Progresso</h4>
            <span className="text-sm text-muted-foreground">{task.progress}%</span>
          </div>
          <div className="w-full bg-muted rounded-full h-2">
            <div
              className="bg-lumina-600 h-2 rounded-full transition-all"
              style={{ width: `${task.progress}%` }}
            />
          </div>
        </div>
      )}

      {(task.estimated_hours || task.actual_hours) && (
        <div>
          <h4 className="font-semibold mb-1">Horas</h4>
          <div className="text-sm text-muted-foreground">
            {task.estimated_hours && (
              <div>Estimada: {task.estimated_hours}h</div>
            )}
            {task.actual_hours && (
              <div>Real: {task.actual_hours}h</div>
            )}
          </div>
        </div>
      )}

      {task.due_date && (
        <div>
          <h4 className="font-semibold mb-1 flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Data de Vencimento
          </h4>
          <p className="text-sm text-muted-foreground">
            {new Date(task.due_date).toLocaleDateString("pt-BR", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </p>
        </div>
      )}

      {task.tags && task.tags.length > 0 && (
        <div>
          <h4 className="font-semibold mb-1 flex items-center gap-2">
            <Tag className="h-4 w-4" />
            Tags
          </h4>
          <div className="flex flex-wrap gap-2">
            {task.tags.map((tag, idx) => (
              <Badge key={idx} variant="outline">
                {tag}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {task.category && (
        <div>
          <h4 className="font-semibold mb-1">Categoria</h4>
          <Badge variant="outline">{task.category}</Badge>
        </div>
      )}
    </div>
  );
}

