import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  X,
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  Users,
  FileText,
  Plus,
  CheckSquare,
} from "lucide-react";
import { calendarService, type EventType } from "@/services/calendarService";
import { taskService, type TaskPriority } from "@/services/taskService";
import { projectService } from "@/services/projectService";
import { toast } from "react-hot-toast";

type ItemType = "event" | "task";

interface CreateItemDialogProps {
  type: ItemType;
  date: Date;
  onClose: () => void;
  onSuccess: () => void;
}

export function CreateItemDialog({
  type,
  date,
  onClose,
  onSuccess,
}: CreateItemDialogProps) {
  const [projects, setProjects] = useState<Array<{ id: string; name: string }>>(
    []
  );

  // Estados para Evento
  const [eventTitle, setEventTitle] = useState("");
  const [eventDescription, setEventDescription] = useState("");
  const [eventType, setEventType] = useState<EventType>("meeting");
  const [eventLocation, setEventLocation] = useState("");
  const [eventStartTime, setEventStartTime] = useState(
    date.toISOString().slice(0, 16)
  );
  const [eventEndTime, setEventEndTime] = useState("");
  const [eventAllDay, setEventAllDay] = useState(false);
  const [eventProjectId, setEventProjectId] = useState("");
  const [eventMeetingUrl, setEventMeetingUrl] = useState("");

  // Estados para Tarefa
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDescription, setTaskDescription] = useState("");
  const [taskPriority, setTaskPriority] = useState<TaskPriority>("medium");
  const [taskDueDate, setTaskDueDate] = useState(
    date.toISOString().slice(0, 10)
  );
  const [taskStartDate, setTaskStartDate] = useState(
    date.toISOString().slice(0, 10)
  );
  const [taskProjectId, setTaskProjectId] = useState("");
  const [taskTags, setTaskTags] = useState("");
  const [taskEstimatedHours, setTaskEstimatedHours] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      const data = await projectService.getAllProjects();
      setProjects(data);
    } catch (error) {
      console.error("Erro ao carregar projetos:", error);
    }
  };

  const handleSubmit = async () => {
    if (type === "event") {
      if (!eventTitle.trim()) {
        toast.error("Preencha o título do evento");
        return;
      }

      try {
        setIsSubmitting(true);
        await calendarService.createEvent({
          title: eventTitle,
          description: eventDescription || undefined,
          event_type: eventType,
          location: eventLocation || undefined,
          start_time: new Date(eventStartTime).toISOString(),
          end_time: eventEndTime
            ? new Date(eventEndTime).toISOString()
            : undefined,
          all_day: eventAllDay,
          project_id: eventProjectId || undefined,
          meeting_url: eventMeetingUrl || undefined,
          status: "scheduled",
          color: getEventColor(eventType),
        });

        toast.success("Evento criado com sucesso!");
        onSuccess();
        onClose();
      } catch (error) {
        console.error("Erro ao criar evento:", error);
        toast.error("Erro ao criar evento");
      } finally {
        setIsSubmitting(false);
      }
    } else {
      if (!taskTitle.trim()) {
        toast.error("Preencha o título da tarefa");
        return;
      }

      try {
        setIsSubmitting(true);
        await taskService.createTask({
          title: taskTitle,
          description: taskDescription || undefined,
          priority: taskPriority,
          status: "pending",
          due_date: taskDueDate || undefined,
          start_date: taskStartDate || undefined,
          project_id: taskProjectId || undefined,
          tags: taskTags
            ? taskTags.split(",").map((t) => t.trim())
            : undefined,
          estimated_hours: taskEstimatedHours
            ? parseFloat(taskEstimatedHours)
            : undefined,
          progress: 0,
        });

        toast.success("Tarefa criada com sucesso!");
        onSuccess();
        onClose();
      } catch (error) {
        console.error("Erro ao criar tarefa:", error);
        toast.error("Erro ao criar tarefa");
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const getEventColor = (eventType: EventType): string => {
    const colors: Record<EventType, string> = {
      meeting: "#3b82f6",
      delivery: "#8b5cf6",
      milestone: "#f59e0b",
      deadline: "#ef4444",
      reminder: "#10b981",
      other: "#6b7280",
    };
    return colors[eventType] || "#3b82f6";
  };

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-3xl max-h-[90vh] flex flex-col">
        <CardHeader className="border-b flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {type === "event" ? (
                <CalendarIcon className="h-5 w-5 text-lumina-500" />
              ) : (
                <CheckSquare className="h-5 w-5 text-lumina-500" />
              )}
              <CardTitle>
                Criar {type === "event" ? "Evento" : "Tarefa"}
              </CardTitle>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-6 overflow-y-auto flex-1">
          {type === "event" ? (
            <div className="space-y-4">
              {/* Título */}
              <div className="space-y-2">
                <Label htmlFor="eventTitle">
                  Título do Evento <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="eventTitle"
                  value={eventTitle}
                  onChange={(e) => setEventTitle(e.target.value)}
                  placeholder="Ex: Reunião com cliente..."
                  required
                />
              </div>

              {/* Tipo e Projeto */}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="eventType">Tipo de Evento</Label>
                  <select
                    id="eventType"
                    value={eventType}
                    onChange={(e) => setEventType(e.target.value as EventType)}
                    className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm"
                  >
                    <option value="meeting">Reunião</option>
                    <option value="delivery">Entrega</option>
                    <option value="milestone">Marco</option>
                    <option value="deadline">Prazo</option>
                    <option value="reminder">Lembrete</option>
                    <option value="other">Outro</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="eventProject">Projeto (opcional)</Label>
                  <select
                    id="eventProject"
                    value={eventProjectId}
                    onChange={(e) => setEventProjectId(e.target.value)}
                    className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm"
                  >
                    <option value="">Selecione um projeto</option>
                    {projects.map((project) => (
                      <option key={project.id} value={project.id}>
                        {project.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Descrição */}
              <div className="space-y-2">
                <Label htmlFor="eventDescription">Descrição</Label>
                <textarea
                  id="eventDescription"
                  value={eventDescription}
                  onChange={(e) => setEventDescription(e.target.value)}
                  className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm min-h-[80px]"
                  placeholder="Descreva o evento..."
                />
              </div>

              {/* Localização */}
              <div className="space-y-2">
                <Label htmlFor="eventLocation">Localização</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="eventLocation"
                    value={eventLocation}
                    onChange={(e) => setEventLocation(e.target.value)}
                    placeholder="Endereço ou local do evento"
                    className="pl-9"
                  />
                </div>
              </div>

              {/* Data e Hora */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="eventAllDay"
                    checked={eventAllDay}
                    onChange={(e) => setEventAllDay(e.target.checked)}
                    className="h-4 w-4"
                  />
                  <Label htmlFor="eventAllDay" className="cursor-pointer">
                    Evento de dia inteiro
                  </Label>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="eventStartTime">
                      <Clock className="h-4 w-4 inline mr-2" />
                      {eventAllDay ? "Data de Início" : "Data e Hora de Início"}
                      <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="eventStartTime"
                      type={eventAllDay ? "date" : "datetime-local"}
                      value={eventStartTime}
                      onChange={(e) => setEventStartTime(e.target.value)}
                      required
                    />
                  </div>

                  {!eventAllDay && (
                    <div className="space-y-2">
                      <Label htmlFor="eventEndTime">Data e Hora de Término</Label>
                      <Input
                        id="eventEndTime"
                        type="datetime-local"
                        value={eventEndTime}
                        onChange={(e) => setEventEndTime(e.target.value)}
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Link da Reunião */}
              <div className="space-y-2">
                <Label htmlFor="eventMeetingUrl">Link da Reunião (opcional)</Label>
                <Input
                  id="eventMeetingUrl"
                  value={eventMeetingUrl}
                  onChange={(e) => setEventMeetingUrl(e.target.value)}
                  placeholder="https://meet.google.com/..."
                  type="url"
                />
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Título */}
              <div className="space-y-2">
                <Label htmlFor="taskTitle">
                  Título da Tarefa <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="taskTitle"
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  placeholder="Ex: Revisar plantas..."
                  required
                />
              </div>

              {/* Prioridade e Projeto */}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="taskPriority">Prioridade</Label>
                  <select
                    id="taskPriority"
                    value={taskPriority}
                    onChange={(e) =>
                      setTaskPriority(e.target.value as TaskPriority)
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
                  <Label htmlFor="taskProject">Projeto (opcional)</Label>
                  <select
                    id="taskProject"
                    value={taskProjectId}
                    onChange={(e) => setTaskProjectId(e.target.value)}
                    className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm"
                  >
                    <option value="">Selecione um projeto</option>
                    {projects.map((project) => (
                      <option key={project.id} value={project.id}>
                        {project.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Descrição */}
              <div className="space-y-2">
                <Label htmlFor="taskDescription">Descrição</Label>
                <textarea
                  id="taskDescription"
                  value={taskDescription}
                  onChange={(e) => setTaskDescription(e.target.value)}
                  className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm min-h-[80px]"
                  placeholder="Descreva a tarefa..."
                />
              </div>

              {/* Datas */}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="taskStartDate">Data de Início</Label>
                  <Input
                    id="taskStartDate"
                    type="date"
                    value={taskStartDate}
                    onChange={(e) => setTaskStartDate(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="taskDueDate">
                    Data de Vencimento <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="taskDueDate"
                    type="date"
                    value={taskDueDate}
                    onChange={(e) => setTaskDueDate(e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* Tags e Horas Estimadas */}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="taskTags">Tags (separadas por vírgula)</Label>
                  <Input
                    id="taskTags"
                    value={taskTags}
                    onChange={(e) => setTaskTags(e.target.value)}
                    placeholder="tag1, tag2, tag3"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="taskEstimatedHours">Horas Estimadas</Label>
                  <Input
                    id="taskEstimatedHours"
                    type="number"
                    step="0.5"
                    min="0"
                    value={taskEstimatedHours}
                    onChange={(e) => setTaskEstimatedHours(e.target.value)}
                    placeholder="8.0"
                  />
                </div>
              </div>
            </div>
          )}
        </CardContent>

        <div className="border-t p-6 flex-shrink-0 flex justify-end gap-3">
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? "Salvando..." : "Criar"}
          </Button>
        </div>
      </Card>
    </div>
  );
}

