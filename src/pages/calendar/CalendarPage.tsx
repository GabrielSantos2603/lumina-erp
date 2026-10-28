import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Clock,
  Calendar as CalendarIcon,
  CheckSquare,
  Users as UsersIcon,
} from "lucide-react";
import { Timer } from "@/components/Timer";
import { TeamTimeTracker } from "./components/TeamTimeTracker";
import { CalendarView } from "./components/CalendarView";
import { TasksView } from "./components/TasksView";
import { DynamicContainer } from "@/components/responsive";
import { cn } from "@/utils/cn";

type TabType = "timer" | "calendar" | "tasks" | "team";

export function CalendarPage() {
  const [activeTab, setActiveTab] = useState<TabType>("timer");

  const tabs = [
    {
      id: "timer" as const,
      label: "Timer",
      icon: Clock,
      description: "Rastreamento de tempo em projetos",
    },
    {
      id: "calendar" as const,
      label: "Calendário",
      icon: CalendarIcon,
      description: "Eventos, reuniões e marcos importantes",
    },
    {
      id: "tasks" as const,
      label: "Tarefas",
      icon: CheckSquare,
      description: "Gerenciamento de tarefas e atividades",
    },
    {
      id: "team" as const,
      label: "Times da Equipe",
      icon: UsersIcon,
      description: "Visualize o tempo de todos os membros",
    },
  ];

  const currentTab = tabs.find((t) => t.id === activeTab);

  return (
    <DynamicContainer className="overflow-x-hidden">
      <div className="space-y-2 sm:space-y-3">
        {/* Compact Header com Tabs Integrados */}
        <Card className="p-2 sm:p-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-3">
            {/* Header Info - Mais compacto */}
            <div className="min-w-0 flex-shrink">
              <h2 className="text-base sm:text-lg lg:text-xl font-bold truncate">{currentTab?.label}</h2>
              <p className="text-[10px] sm:text-xs text-muted-foreground truncate hidden sm:block">{currentTab?.description}</p>
            </div>

            {/* Tabs Navigation - Mais compactos e inline no desktop */}
            <div className="flex gap-1 sm:gap-1.5 overflow-x-auto scrollbar-thin pb-1 sm:pb-0">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                
                return (
                  <Button
                    key={tab.id}
                    variant={isActive ? "default" : "ghost"}
                    size="sm"
                    className={cn(
                      "flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 sm:py-2 h-auto whitespace-nowrap",
                      isActive && "bg-lumina-600 hover:bg-lumina-700"
                    )}
                    onClick={() => setActiveTab(tab.id)}
                  >
                    <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
                    <span className="text-[11px] sm:text-xs font-medium">{tab.label}</span>
                  </Button>
                );
              })}
            </div>
          </div>
        </Card>

        {/* Tab Content - Mais espaço disponível */}
        <div className="min-h-[400px] sm:min-h-[500px]">
          {activeTab === "timer" && (
            <div className="max-w-2xl mx-auto">
              <Timer />
            </div>
          )}

          {activeTab === "calendar" && <CalendarView />}

          {activeTab === "tasks" && <TasksView />}

          {activeTab === "team" && <TeamTimeTracker />}
        </div>
      </div>
    </DynamicContainer>
  );
}
