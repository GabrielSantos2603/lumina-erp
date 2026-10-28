import { useState, useEffect, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Grid3x3,
  LayoutGrid,
  List,
  Filter,
  Users,
  User,
} from "lucide-react";
import { cn } from "@/utils/cn";
import { calendarService, type CalendarEvent } from "@/services/calendarService";
import { taskService, type Task } from "@/services/taskService";
import { DayDetailsDialog } from "./DayDetailsDialog";
import { DayActivitiesModal } from "./DayActivitiesModal";
import { dayActivitiesService } from "@/services/dayActivitiesService";

type ViewMode = "month" | "week" | "day";
type FilterMode = "user" | "team";

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

// Função helper para obter cor da tarefa baseada em status e prioridade
const getTaskColor = (task: Task): string => {
  if (task.status === "completed") return "#10b981";
  if (task.status === "cancelled") return "#6b7280";
  if (task.priority === "urgent") return "#ef4444";
  if (task.priority === "high") return "#f59e0b";
  if (task.priority === "medium") return "#3b82f6";
  return "#9ca3af";
};

export function CalendarView() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>("month");
  const [filterMode, setFilterMode] = useState<FilterMode>("user");
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedItem, setSelectedItem] = useState<CalendarItem | null>(null);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activitiesModalOpen, setActivitiesModalOpen] = useState(false);
  const [activitiesModalDate, setActivitiesModalDate] = useState<Date | null>(null);
  const [monthActivitiesCategorized, setMonthActivitiesCategorized] = useState<Map<string, {
    total: number;
    tasks: number;
    meetings: number;
    transactions: number;
    clients: number;
    projects: number;
  }>>(new Map());
  

  // Calcular range de datas baseado na view
  const dateRange = useMemo(() => {
    const start = new Date(currentDate);
    const end = new Date(currentDate);

    if (viewMode === "month") {
      start.setDate(1);
      start.setHours(0, 0, 0, 0);
      const lastDay = new Date(start.getFullYear(), start.getMonth() + 1, 0);
      end.setDate(lastDay.getDate());
      end.setHours(23, 59, 59, 999);
    } else if (viewMode === "week") {
      const day = start.getDay();
      start.setDate(start.getDate() - day);
      start.setHours(0, 0, 0, 0);
      end.setDate(start.getDate() + 6);
      end.setHours(23, 59, 59, 999);
    } else {
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
    }

    return { start, end };
  }, [currentDate, viewMode]);

  // Carregar eventos e tarefas
  useEffect(() => {
    loadCalendarData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateRange, filterMode]);

  // Carregar contador de atividades do mês
  useEffect(() => {
    if (viewMode === "month") {
      loadMonthActivities();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentDate, viewMode]);

  const loadCalendarData = async () => {
    try {
      setIsLoading(true);
      const [eventsData, tasksData] = await Promise.all([
        calendarService.getEvents({
          start_date: dateRange.start.toISOString(),
          end_date: dateRange.end.toISOString(),
        }),
        taskService.getTasks(),
      ]);

      setEvents(eventsData);
      
      // Filtrar tarefas por data
      const filteredTasks = tasksData.filter((task) => {
        if (task.due_date || task.start_date) {
          const taskDate = new Date(task.due_date || task.start_date || "");
          return taskDate >= dateRange.start && taskDate <= dateRange.end;
        }
        return false;
      });
      setTasks(filteredTasks);
    } catch (error) {
      console.error("Erro ao carregar dados do calendário:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadMonthActivities = async () => {
    try {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth() + 1; // getMonthActivitiesCategorized espera 1-12
      const categorized = await dayActivitiesService.getMonthActivitiesCategorized(year, month);
      setMonthActivitiesCategorized(categorized);
    } catch (error) {
      console.error("Erro ao carregar atividades do mês:", error);
    }
  };

  // Combinar eventos e tarefas em items
  const calendarItems = useMemo(() => {
    const items: CalendarItem[] = [];

    // Adicionar eventos
    events.forEach((event) => {
      items.push({
        id: event.id,
        type: "event",
        title: event.title,
        color: event.color || "#3b82f6",
        start: new Date(event.start_time),
        end: event.end_time ? new Date(event.end_time) : undefined,
        allDay: event.all_day,
        data: event,
      });
    });

    // Adicionar tarefas
    tasks.forEach((task) => {
      const date = task.due_date || task.start_date;
      if (date) {
        items.push({
          id: task.id,
          type: "task",
          title: task.title,
          color: getTaskColor(task),
          start: new Date(date),
          end: task.due_date ? new Date(task.due_date) : undefined,
          allDay: true,
          data: task,
        });
      }
    });

    return items.sort((a, b) => a.start.getTime() - b.start.getTime());
  }, [events, tasks]);

  const getItemsForDate = (date: Date): CalendarItem[] => {
    return calendarItems.filter((item) => {
      const itemDate = new Date(item.start);
      return (
        itemDate.getDate() === date.getDate() &&
        itemDate.getMonth() === date.getMonth() &&
        itemDate.getFullYear() === date.getFullYear()
      );
    });
  };

  const handleDateClick = (date: Date) => {
    setActivitiesModalDate(date);
    setActivitiesModalOpen(true);
  };

  const handleItemClick = (item: CalendarItem) => {
    setSelectedItem(item);
  };

  const goToPrevious = () => {
    const newDate = new Date(currentDate);
    if (viewMode === "month") {
      newDate.setMonth(newDate.getMonth() - 1);
    } else if (viewMode === "week") {
      newDate.setDate(newDate.getDate() - 7);
    } else {
      newDate.setDate(newDate.getDate() - 1);
    }
    setCurrentDate(newDate);
  };

  const goToNext = () => {
    const newDate = new Date(currentDate);
    if (viewMode === "month") {
      newDate.setMonth(newDate.getMonth() + 1);
    } else if (viewMode === "week") {
      newDate.setDate(newDate.getDate() + 7);
    } else {
      newDate.setDate(newDate.getDate() + 1);
    }
    setCurrentDate(newDate);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const formatMonthYear = (date: Date) => {
    return date.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
  };

  const formatWeekRange = (date: Date) => {
    const day = date.getDay();
    const start = new Date(date);
    start.setDate(start.getDate() - day);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    return `${start.toLocaleDateString("pt-BR", { day: "numeric", month: "short" })} - ${end.toLocaleDateString("pt-BR", { day: "numeric", month: "short", year: "numeric" })}`;
  };

  const formatDay = (date: Date) => {
    return date.toLocaleDateString("pt-BR", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  // Renderizar vista mensal
  const renderMonthView = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days: (Date | null)[] = [];
    
    // Dias vazios antes do início do mês
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Dias do mês
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }

    return (
      <div className="grid grid-cols-7 gap-0.5 sm:gap-1">
        {/* Cabeçalho dos dias da semana */}
        {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map((day) => (
          <div
            key={day}
            className="text-center text-[10px] sm:text-xs lg:text-sm font-medium text-muted-foreground py-1 sm:py-2"
          >
            {day}
          </div>
        ))}

        {/* Dias do mês */}
        {days.map((date, index) => {
          if (!date) {
            return <div key={`empty-${index}`} className="aspect-square" />;
          }

          const isToday =
            date.getDate() === new Date().getDate() &&
            date.getMonth() === new Date().getMonth() &&
            date.getFullYear() === new Date().getFullYear();

          const dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
          const dayActivities = monthActivitiesCategorized.get(dateKey);
          const hasActivities = dayActivities && dayActivities.total > 0;

          return (
            <button
              key={date.toISOString()}
              onClick={() => handleDateClick(date)}
              className={cn(
                "aspect-square p-1 sm:p-1.5 lg:p-2 rounded-md sm:rounded-lg text-xs sm:text-sm transition-all relative border group",
                "hover:bg-muted focus:outline-none focus:ring-2 focus:ring-lumina-500 cursor-pointer",
                isToday
                  ? "bg-lumina-50 dark:bg-lumina-900/20 border-lumina-300 dark:border-lumina-700 font-semibold shadow-sm"
                  : "border-border hover:border-lumina-200 dark:hover:border-lumina-800 hover:shadow-md",
                hasActivities && "hover:scale-[1.02]"
              )}
            >
              <div className="flex flex-col h-full justify-between">
                {/* Número do dia */}
                <span
                  className={cn(
                    "text-xs sm:text-sm lg:text-base font-bold transition-all",
                    isToday
                      ? "text-lumina-700 dark:text-lumina-400"
                      : "text-foreground"
                  )}
                >
                  {date.getDate()}
                </span>
                
                {/* Indicadores categorizados */}
                {hasActivities && dayActivities && (
                  <div className="flex flex-col gap-0.5 mt-auto">
                    {/* Linha 1: Tarefas e Reuniões */}
                    <div className="flex gap-0.5 justify-center">
                      {dayActivities.tasks > 0 && (
                        <div 
                          className="flex items-center gap-0.5 px-1 py-0.5 rounded text-[8px] sm:text-[10px] font-semibold bg-blue-500 text-white"
                          title={`${dayActivities.tasks} tarefa${dayActivities.tasks > 1 ? 's' : ''}`}
                        >
                          <span>📋</span>
                          <span>{dayActivities.tasks}</span>
                        </div>
                      )}
                      {dayActivities.meetings > 0 && (
                        <div 
                          className="flex items-center gap-0.5 px-1 py-0.5 rounded text-[8px] sm:text-[10px] font-semibold bg-purple-500 text-white"
                          title={`${dayActivities.meetings} reuniã${dayActivities.meetings > 1 ? 'ões' : 'o'}`}
                        >
                          <span>📅</span>
                          <span>{dayActivities.meetings}</span>
                        </div>
                      )}
                    </div>
                    
                    {/* Linha 2: Transações e Outros */}
                    <div className="flex gap-0.5 justify-center">
                      {dayActivities.transactions > 0 && (
                        <div 
                          className="flex items-center gap-0.5 px-1 py-0.5 rounded text-[8px] sm:text-[10px] font-semibold bg-green-500 text-white"
                          title={`${dayActivities.transactions} transaçã${dayActivities.transactions > 1 ? 'ões' : 'o'}`}
                        >
                          <span>💰</span>
                          <span>{dayActivities.transactions}</span>
                        </div>
                      )}
                      {(dayActivities.clients > 0 || dayActivities.projects > 0) && (
                        <div 
                          className="flex items-center gap-0.5 px-1 py-0.5 rounded text-[8px] sm:text-[10px] font-semibold bg-orange-500 text-white"
                          title={`${dayActivities.clients + dayActivities.projects} cliente${(dayActivities.clients + dayActivities.projects) > 1 ? 's/projetos' : '/projeto'}`}
                        >
                          <span>🏢</span>
                          <span>{dayActivities.clients + dayActivities.projects}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>
    );
  };

  // Renderizar vista semanal
  const renderWeekView = () => {
    const day = currentDate.getDay();
    const weekStart = new Date(currentDate);
    weekStart.setDate(currentDate.getDate() - day);
    weekStart.setHours(0, 0, 0, 0);

    const weekDays: Date[] = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(weekStart);
      date.setDate(weekStart.getDate() + i);
      weekDays.push(date);
    }

    return (
      <div className="space-y-2">
        {/* Cabeçalho dos dias */}
        <div className="grid grid-cols-7 gap-2">
          {weekDays.map((date) => {
            const isToday =
              date.getDate() === new Date().getDate() &&
              date.getMonth() === new Date().getMonth() &&
              date.getFullYear() === new Date().getFullYear();

            return (
              <div
                key={date.toISOString()}
                className={cn(
                  "text-center p-2 rounded-lg",
                  isToday && "bg-lumina-100 dark:bg-lumina-900/30"
                )}
              >
                <div className="text-xs text-muted-foreground">
                  {date.toLocaleDateString("pt-BR", { weekday: "short" })}
                </div>
                <div
                  className={cn(
                    "text-xl font-bold",
                    isToday && "text-lumina-700 dark:text-lumina-400"
                  )}
                >
                  {date.getDate()}
                </div>
              </div>
            );
          })}
        </div>

        {/* Conteúdo dos dias */}
        <div className="grid grid-cols-7 gap-2">
          {weekDays.map((date) => {
            const dayItems = getItemsForDate(date);
            const isToday =
              date.getDate() === new Date().getDate() &&
              date.getMonth() === new Date().getMonth() &&
              date.getFullYear() === new Date().getFullYear();

            return (
              <div
                key={date.toISOString()}
                className={cn(
                  "min-h-[200px] p-2 rounded-lg border",
                  isToday && "border-lumina-300 dark:border-lumina-700 bg-lumina-50/50 dark:bg-lumina-900/10"
                )}
              >
                <button
                  onClick={() => handleDateClick(date)}
                  className="w-full text-left mb-2 text-xs font-medium text-muted-foreground hover:text-foreground"
                >
                  {date.toLocaleDateString("pt-BR", { month: "short" })}
                </button>
                <div className="space-y-1">
                  {dayItems.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => handleItemClick(item)}
                      className={cn(
                        "text-xs p-1.5 rounded cursor-pointer hover:opacity-80 transition-opacity truncate",
                        item.allDay && "font-medium"
                      )}
                      style={{ backgroundColor: item.color, color: "white" }}
                    >
                      {!item.allDay && item.start && (
                        <span className="text-[10px] opacity-90">
                          {item.start.toLocaleTimeString("pt-BR", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}{" "}
                        </span>
                      )}
                      {item.title}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // Renderizar vista diária
  const renderDayView = () => {
    const dayItems = getItemsForDate(currentDate);
    const hours = Array.from({ length: 24 }, (_, i) => i);

    return (
      <div className="space-y-1">
        {hours.map((hour) => {
          const hourItems = dayItems.filter((item) => {
            if (item.allDay) return false;
            const itemHour = item.start.getHours();
            return itemHour === hour;
          });

          return (
            <div key={hour} className="flex gap-2 border-b py-2">
              <div className="w-16 text-xs text-muted-foreground text-right pt-1">
                {String(hour).padStart(2, "0")}:00
              </div>
              <div className="flex-1 space-y-1">
                {hourItems.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => handleItemClick(item)}
                    className={cn(
                      "text-xs p-2 rounded cursor-pointer hover:opacity-80 transition-opacity",
                      item.allDay && "font-medium"
                    )}
                    style={{ backgroundColor: item.color, color: "white" }}
                  >
                    <div className="font-medium">{item.title}</div>
                    {item.start && (
                      <div className="text-[10px] opacity-90 mt-0.5">
                        {item.start.toLocaleTimeString("pt-BR", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                        {item.end &&
                          ` - ${item.end.toLocaleTimeString("pt-BR", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}`}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}

        {/* Items do dia inteiro */}
        <div className="mt-4 pt-4 border-t">
          <div className="text-sm font-medium text-muted-foreground mb-2">
            Dia Inteiro
          </div>
          <div className="space-y-1">
            {dayItems
              .filter((item) => item.allDay)
              .map((item) => (
                <div
                  key={item.id}
                  onClick={() => handleItemClick(item)}
                  className={cn(
                    "text-sm p-2 rounded cursor-pointer hover:opacity-80 transition-opacity",
                    "font-medium"
                  )}
                  style={{ backgroundColor: item.color, color: "white" }}
                >
                  {item.title}
                </div>
              ))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* Controles */}
      <Card className="p-3 sm:p-4">
        <div className="flex flex-col gap-3 sm:gap-4 md:flex-row md:items-center md:justify-between">
          {/* Navegação de data */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            <Button variant="outline" size="icon" onClick={goToPrevious} className="h-8 w-8 sm:h-9 sm:w-9">
              <ChevronLeft className="h-3 w-3 sm:h-4 sm:w-4" />
            </Button>
            <Button variant="outline" onClick={goToToday} className="h-8 sm:h-9 text-xs sm:text-sm px-2 sm:px-4">
              Hoje
            </Button>
            <Button variant="outline" size="icon" onClick={goToNext} className="h-8 w-8 sm:h-9 sm:w-9">
              <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4" />
            </Button>
            <div className="ml-2 sm:ml-4 text-sm sm:text-base lg:text-lg font-semibold truncate">
              {viewMode === "month" && formatMonthYear(currentDate)}
              {viewMode === "week" && formatWeekRange(currentDate)}
              {viewMode === "day" && formatDay(currentDate)}
            </div>
          </div>

          {/* Filtros e views */}
          <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-1">
            {/* Filtro Usuário/Equipe */}
            <div className="flex items-center rounded-lg border bg-background">
              <Button
                variant={filterMode === "user" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setFilterMode("user")}
                className="rounded-r-none h-7 sm:h-8 px-2 sm:px-3 text-xs sm:text-sm"
              >
                <User className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2" />
                <span className="hidden sm:inline">Meu</span>
              </Button>
              <Button
                variant={filterMode === "team" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setFilterMode("team")}
                className="rounded-l-none h-7 sm:h-8 px-2 sm:px-3 text-xs sm:text-sm"
              >
                <Users className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2" />
                <span className="hidden sm:inline">Equipe</span>
              </Button>
            </div>

            {/* Modos de visualização */}
            <div className="flex items-center rounded-lg border bg-background">
              <Button
                variant={viewMode === "month" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setViewMode("month")}
                className="rounded-r-none h-7 sm:h-8 px-2 sm:px-3 text-xs sm:text-sm"
              >
                <Grid3x3 className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2" />
                <span className="hidden sm:inline">Mês</span>
              </Button>
              <Button
                variant={viewMode === "week" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setViewMode("week")}
                className="rounded-none h-7 sm:h-8 px-2 sm:px-3 text-xs sm:text-sm"
              >
                <LayoutGrid className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2" />
                <span className="hidden sm:inline">Semana</span>
              </Button>
              <Button
                variant={viewMode === "day" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setViewMode("day")}
                className="rounded-l-none h-7 sm:h-8 px-2 sm:px-3 text-xs sm:text-sm"
              >
                <List className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2" />
                <span className="hidden sm:inline">Dia</span>
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Calendário */}
      <Card className="p-3 sm:p-4 lg:p-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-sm sm:text-base text-muted-foreground">Carregando...</div>
          </div>
        ) : (
          <>
            {viewMode === "month" && renderMonthView()}
            {viewMode === "week" && renderWeekView()}
            {viewMode === "day" && renderDayView()}
          </>
        )}
      </Card>

      {/* Dialog de detalhes do dia */}
      {selectedDate && (
        <DayDetailsDialog
          date={selectedDate}
          items={getItemsForDate(selectedDate)}
          selectedItem={selectedItem}
          onClose={() => {
            setSelectedDate(null);
            setSelectedItem(null);
          }}
          onItemSelect={setSelectedItem}
          onRefresh={loadCalendarData}
        />
      )}

      {/* Modal de atividades do dia */}
      {activitiesModalDate && (
        <DayActivitiesModal
          date={activitiesModalDate}
          open={activitiesModalOpen}
          onClose={() => {
            setActivitiesModalOpen(false);
            setActivitiesModalDate(null);
          }}
        />
      )}
    </div>
  );
}

