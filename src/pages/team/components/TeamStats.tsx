import { Card, CardContent } from "@/components/ui/card";
import { Users, UserCheck, Briefcase, DollarSign, TrendingUp } from "lucide-react";

interface TeamStatsProps {
  stats: {
    total: number;
    active: number;
    vacation: number;
    leave: number;
    inactive: number;
    totalProjects: number;
    avgSalary: number;
    totalPayroll: number;
  };
}

export function TeamStats({ stats }: TeamStatsProps) {
  return (
    <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardContent className="p-3 sm:p-4 lg:pt-6 lg:px-6 lg:pb-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5 sm:space-y-1 min-w-0 flex-1">
              <p className="text-xs sm:text-sm text-muted-foreground truncate">Total de Membros</p>
              <p className="text-xl sm:text-2xl font-bold">{stats.total}</p>
              <p className="text-[10px] sm:text-xs text-muted-foreground truncate">{stats.active} ativos</p>
            </div>
            <div className="p-2 sm:p-3 bg-lumina-100 dark:bg-lumina-900/30 rounded-lg flex-shrink-0">
              <Users className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 text-lumina-600 dark:text-lumina-400" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-3 sm:p-4 lg:pt-6 lg:px-6 lg:pb-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5 sm:space-y-1 min-w-0 flex-1">
              <p className="text-xs sm:text-sm text-muted-foreground truncate">Membros Ativos</p>
              <p className="text-xl sm:text-2xl font-bold text-green-600">{stats.active}</p>
              <p className="text-[10px] sm:text-xs text-green-600 flex items-center gap-1 truncate">
                <UserCheck className="h-3 w-3 flex-shrink-0" />
                <span className="truncate">{stats.total > 0 ? ((stats.active / stats.total) * 100).toFixed(0) : 0}% do time</span>
              </p>
            </div>
            <div className="p-2 sm:p-3 bg-green-100 dark:bg-green-900/30 rounded-lg flex-shrink-0">
              <UserCheck className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-3 sm:p-4 lg:pt-6 lg:px-6 lg:pb-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5 sm:space-y-1 min-w-0 flex-1">
              <p className="text-xs sm:text-sm text-muted-foreground truncate">Projetos Ativos</p>
              <p className="text-xl sm:text-2xl font-bold">{stats.totalProjects}</p>
              <p className="text-[10px] sm:text-xs text-muted-foreground truncate">
                {stats.active > 0 ? (stats.totalProjects / stats.active).toFixed(1) : 0} por pessoa
              </p>
            </div>
            <div className="p-2 sm:p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex-shrink-0">
              <Briefcase className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-3 sm:p-4 lg:pt-6 lg:px-6 lg:pb-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5 sm:space-y-1 min-w-0 flex-1">
              <p className="text-xs sm:text-sm text-muted-foreground truncate">Salário Médio</p>
              <p className="text-xl sm:text-2xl font-bold truncate">
                R$ {(stats.avgSalary / 1000).toFixed(1)}k
              </p>
              <p className="text-[10px] sm:text-xs text-muted-foreground flex items-center gap-1 truncate">
                <TrendingUp className="h-3 w-3 flex-shrink-0" />
                <span className="truncate">Total: R$ {(stats.totalPayroll / 1000).toFixed(0)}k</span>
              </p>
            </div>
            <div className="p-2 sm:p-3 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg flex-shrink-0">
              <DollarSign className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 text-yellow-600 dark:text-yellow-400" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
