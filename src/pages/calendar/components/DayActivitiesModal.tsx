import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Users,
  Briefcase,
  Clock,
  CheckSquare,
  DollarSign,
  UserPlus,
  Calendar,
  ChevronDown,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  Plus,
  Edit,
  Check,
  X,
  RefreshCw,
} from "lucide-react";
import { cn } from "@/utils/cn";
import {
  dayActivitiesService,
  type DayActivity,
  type DayActivitiesSummary,
} from "@/services/dayActivitiesService";

interface DayActivitiesModalProps {
  date: Date;
  open: boolean;
  onClose: () => void;
}

interface Section {
  id: string;
  type: DayActivity['type'];
  title: string;
  icon: typeof Users;
  color: string;
  bgColor: string;
}

const sections: Section[] = [
  {
    id: "clients",
    type: "client",
    title: "Clientes",
    icon: Users,
    color: "text-blue-600",
    bgColor: "bg-blue-50 dark:bg-blue-950/30",
  },
  {
    id: "projects",
    type: "project",
    title: "Projetos",
    icon: Briefcase,
    color: "text-purple-600",
    bgColor: "bg-purple-50 dark:bg-purple-950/30",
  },
  {
    id: "timers",
    type: "timer",
    title: "Timers",
    icon: Clock,
    color: "text-lumina-600",
    bgColor: "bg-lumina-50 dark:bg-lumina-950/30",
  },
  {
    id: "tasks",
    type: "task",
    title: "Tarefas",
    icon: CheckSquare,
    color: "text-green-600",
    bgColor: "bg-green-50 dark:bg-green-950/30",
  },
  {
    id: "transactions",
    type: "transaction",
    title: "Financeiro",
    icon: DollarSign,
    color: "text-yellow-600",
    bgColor: "bg-yellow-50 dark:bg-yellow-950/30",
  },
  {
    id: "team",
    type: "team",
    title: "Equipe",
    icon: UserPlus,
    color: "text-indigo-600",
    bgColor: "bg-indigo-50 dark:bg-indigo-950/30",
  },
  {
    id: "meetings",
    type: "meeting",
    title: "Reuniões",
    icon: Calendar,
    color: "text-rose-600",
    bgColor: "bg-rose-50 dark:bg-rose-950/30",
  },
];

const getActionIcon = (action: DayActivity['action']) => {
  switch (action) {
    case "created":
      return Plus;
    case "updated":
      return Edit;
    case "completed":
      return Check;
    case "status_changed":
      return RefreshCw;
    case "deleted":
      return X;
    default:
      return Plus;
  }
};

const getActionLabel = (action: DayActivity['action']) => {
  switch (action) {
    case "created":
      return "Criado";
    case "updated":
      return "Atualizado";
    case "completed":
      return "Concluído";
    case "status_changed":
      return "Status Alterado";
    case "deleted":
      return "Excluído";
    default:
      return action;
  }
};

const getActionColor = (action: DayActivity['action']) => {
  switch (action) {
    case "created":
      return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400";
    case "updated":
      return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400";
    case "completed":
      return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";
    case "status_changed":
      return "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400";
    case "deleted":
      return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
    default:
      return "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400";
  }
};

export function DayActivitiesModal({
  date,
  open,
  onClose,
}: DayActivitiesModalProps) {
  const [activities, setActivities] = useState<DayActivity[]>([]);
  const [summary, setSummary] = useState<DayActivitiesSummary | null>(null);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(sections.map(s => s.id)));
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (open) {
      loadActivities();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, date]);

  const loadActivities = async () => {
    try {
      setIsLoading(true);
      const [activitiesData, summaryData] = await Promise.all([
        dayActivitiesService.getDayActivities(date),
        dayActivitiesService.getDaySummary(date),
      ]);
      setActivities(activitiesData);
      setSummary(summaryData);
    } catch (error) {
      console.error("Erro ao carregar atividades:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleSection = (sectionId: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId);
    } else {
      newExpanded.add(sectionId);
    }
    setExpandedSections(newExpanded);
  };

  const getActivitiesByType = (type: DayActivity['type']) => {
    return activities.filter((activity) => activity.type === type);
  };

  const getSectionCount = (sectionId: string) => {
    switch (sectionId) {
      case "clients":
        return summary ? summary.clients.created + summary.clients.updated : 0;
      case "projects":
        return summary
          ? summary.projects.created +
            summary.projects.updated +
            summary.projects.completed +
            summary.projects.status_changed
          : 0;
      case "timers":
        return summary?.timers.count || 0;
      case "tasks":
        return summary
          ? summary.tasks.created +
            summary.tasks.completed +
            summary.tasks.updated
          : 0;
      case "transactions":
        return summary
          ? summary.transactions.income.count +
            summary.transactions.expense.count
          : 0;
      case "team":
        return summary?.team.added || 0;
      case "meetings":
        return summary
          ? summary.meetings.scheduled + summary.meetings.completed
          : 0;
      default:
        return 0;
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("pt-BR", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const formatTime = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleTimeString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-xl sm:text-2xl">
            Atividades do Dia
          </DialogTitle>
          <p className="text-sm text-muted-foreground capitalize">
            {formatDate(date)}
          </p>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : activities.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium">Nenhuma atividade neste dia</p>
            <p className="text-sm text-muted-foreground">
              Não há registros de clientes, projetos, tarefas ou outras
              atividades nesta data.
            </p>
          </div>
        ) : (
          <ScrollArea className="flex-1 -mx-6 px-6 h-[calc(90vh-12rem)] overflow-y-auto">
            <div className="space-y-3 pb-4">
              {/* Resumo Rápido */}
              <Card className="p-4 bg-gradient-to-br from-lumina-50 to-lumina-100 dark:from-lumina-950/30 dark:to-lumina-900/20 border-lumina-200 dark:border-lumina-800">
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Resumo do Dia
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-lumina-700 dark:text-lumina-400">
                      {activities.length}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Atividades
                    </div>
                  </div>
                  {summary?.timers.count ? (
                    <div className="text-center">
                      <div className="text-2xl font-bold text-lumina-700 dark:text-lumina-400">
                        {summary.timers.total_hours.toFixed(1)}h
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Trabalhadas
                      </div>
                    </div>
                  ) : null}
                  {summary && (summary.transactions.income.count > 0 || summary.transactions.expense.count > 0) ? (
                    <>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600 dark:text-green-400 flex items-center justify-center gap-1">
                          <TrendingUp className="h-4 w-4" />
                          {summary.transactions.income.count}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          R$ {summary.transactions.income.total.toFixed(2)}
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-red-600 dark:text-red-400 flex items-center justify-center gap-1">
                          <TrendingDown className="h-4 w-4" />
                          {summary.transactions.expense.count}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          R$ {summary.transactions.expense.total.toFixed(2)}
                        </div>
                      </div>
                    </>
                  ) : null}
                </div>
              </Card>

              {/* Seções de Atividades */}
              {sections.map((section) => {
                const sectionActivities = getActivitiesByType(section.type);
                const count = getSectionCount(section.id);
                if (count === 0) return null;

                const isExpanded = expandedSections.has(section.id);
                const Icon = section.icon;

                return (
                  <Card key={section.id} className="overflow-hidden">
                    <button
                      onClick={() => toggleSection(section.id)}
                      className={cn(
                        "w-full p-4 flex items-center justify-between hover:bg-muted/50 transition-colors",
                        section.bgColor
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={cn(
                            "p-2 rounded-lg bg-white dark:bg-gray-900/50 shadow-sm",
                            section.color
                          )}
                        >
                          <Icon className="h-5 w-5" />
                        </div>
                        <div className="text-left">
                          <h3 className="font-semibold text-sm">
                            {section.title}
                          </h3>
                          <p className="text-xs text-muted-foreground">
                            {count} {count === 1 ? "item" : "itens"}
                          </p>
                        </div>
                      </div>
                      {isExpanded ? (
                        <ChevronDown className="h-5 w-5 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="h-5 w-5 text-muted-foreground" />
                      )}
                    </button>

                    {isExpanded && (
                      <div className="p-4 space-y-2 border-t">
                        {sectionActivities.map((activity) => {
                          const ActionIcon = getActionIcon(activity.action);
                          return (
                            <div
                              key={activity.id}
                              className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                            >
                              <div
                                className={cn(
                                  "p-1.5 rounded-md flex-shrink-0",
                                  getActionColor(activity.action)
                                )}
                              >
                                <ActionIcon className="h-3.5 w-3.5" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-2">
                                  <h4 className="font-medium text-sm truncate">
                                    {activity.title}
                                  </h4>
                                  <Badge
                                    variant="secondary"
                                    className="text-xs shrink-0"
                                  >
                                    {getActionLabel(activity.action)}
                                  </Badge>
                                </div>
                                {activity.description && (
                                  <p className="text-xs text-muted-foreground mt-1">
                                    {activity.description}
                                  </p>
                                )}
                                <p className="text-xs text-muted-foreground mt-1">
                                  {formatTime(activity.created_at)}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </Card>
                );
              })}
            </div>
          </ScrollArea>
        )}

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
