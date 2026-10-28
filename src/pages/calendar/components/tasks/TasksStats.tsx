import { Card } from "@/components/ui/card";

interface TasksStatsProps {
  stats: {
    total: number;
    completed: number;
    inProgress: number;
    pending: number;
    avgProgress: number;
  };
}

export function TasksStats({ stats }: TasksStatsProps) {
  return (
    <div className="grid gap-2 grid-cols-3 sm:gap-3 md:gap-4 md:grid-cols-5">
      <Card className="p-2 sm:p-3 md:p-4">
        <div className="text-[10px] sm:text-xs md:text-sm text-muted-foreground">Total</div>
        <div className="text-lg sm:text-xl md:text-2xl font-bold">{stats.total}</div>
      </Card>
      <Card className="p-2 sm:p-3 md:p-4">
        <div className="text-[10px] sm:text-xs md:text-sm text-muted-foreground">Concluídas</div>
        <div className="text-lg sm:text-xl md:text-2xl font-bold text-green-600">{stats.completed}</div>
      </Card>
      <Card className="p-2 sm:p-3 md:p-4">
        <div className="text-[10px] sm:text-xs md:text-sm text-muted-foreground">Progresso</div>
        <div className="text-lg sm:text-xl md:text-2xl font-bold">{stats.avgProgress.toFixed(0)}%</div>
      </Card>
      <Card className="p-2 sm:p-3 md:p-4 hidden md:block">
        <div className="text-[10px] sm:text-xs md:text-sm text-muted-foreground">Em Progresso</div>
        <div className="text-lg sm:text-xl md:text-2xl font-bold text-blue-600">{stats.inProgress}</div>
      </Card>
      <Card className="p-2 sm:p-3 md:p-4 hidden md:block">
        <div className="text-[10px] sm:text-xs md:text-sm text-muted-foreground">Pendentes</div>
        <div className="text-lg sm:text-xl md:text-2xl font-bold text-yellow-600">{stats.pending}</div>
      </Card>
    </div>
  );
}
