import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users } from "lucide-react";
import { cn } from "@/utils/cn";
import type { TeamMember } from "@/services/teamService";

interface TaskWithHierarchy {
  id: string;
  title: string;
  description?: string;
  status: string;
  priority: string;
  progress: number;
  due_date?: string;
  start_date?: string;
  created_at: string;
  assigned_team_member_id?: string;
  children?: TaskWithHierarchy[];
}

interface TasksTimelineProps {
  tasks: TaskWithHierarchy[];
  teamMembers: Map<string, TeamMember>;
  onTaskClick: (task: TaskWithHierarchy) => void;
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

const getProgressColor = (progress: number) => {
  if (progress === 100) return "bg-green-500";
  if (progress >= 75) return "bg-blue-500";
  if (progress >= 50) return "bg-yellow-500";
  if (progress >= 25) return "bg-orange-500";
  return "bg-red-500";
};

export function TasksTimeline({ tasks, teamMembers, onTaskClick }: TasksTimelineProps) {
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

  collectTasks(tasks);

  const sortedDates = Array.from(tasksByDate.keys()).sort();

  if (sortedDates.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        Nenhuma tarefa com data definida
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {sortedDates.map((dateKey) => {
        const date = new Date(dateKey);
        const dayTasks = tasksByDate.get(dateKey)!;
        const isToday = date.toDateString() === new Date().toDateString();
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
                <div className="text-xl font-bold">{date.getDate()}</div>
                <div className="text-xs text-muted-foreground">
                  {date.toLocaleDateString("pt-BR", { month: "short" })}
                </div>
                <div
                  className={cn(
                    "absolute left-1/2 top-12 bottom-0 w-0.5 -translate-x-1/2",
                    isPast
                      ? "bg-red-200 dark:bg-red-900/30"
                      : isToday
                      ? "bg-lumina-300 dark:bg-lumina-700"
                      : "bg-muted"
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
                      isPast &&
                        task.status !== "completed" &&
                        "border-red-300 dark:border-red-900/50"
                    )}
                    onClick={() => onTaskClick(task)}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4
                            className={cn(
                              "font-semibold text-sm",
                              task.status === "completed" &&
                                "line-through text-muted-foreground"
                            )}
                          >
                            {task.title}
                          </h4>
                          <Badge
                            className={getPriorityColor(task.priority)}
                            variant="secondary"
                            style={{ fontSize: "10px" }}
                          >
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
                        {task.assigned_team_member_id &&
                          teamMembers.has(task.assigned_team_member_id) && (
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
      })}
    </div>
  );
}
