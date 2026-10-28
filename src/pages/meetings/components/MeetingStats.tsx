import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Video, Users } from "lucide-react";
import type { MeetingStats as MeetingStatsType } from "@/services/meetingService";

interface MeetingStatsProps {
  stats: MeetingStatsType;
}

export function MeetingStats({ stats }: MeetingStatsProps) {
  return (
    <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-4 lg:p-6">
          <CardTitle className="text-xs sm:text-sm font-medium truncate">
            Próximas Reuniões
          </CardTitle>
          <Calendar className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
        </CardHeader>
        <CardContent className="p-3 sm:p-4 lg:p-6 pt-0">
          <div className="flex items-baseline gap-1.5 sm:gap-2">
            <p className="text-xl sm:text-2xl font-bold">{stats.scheduled}</p>
            <p className="text-[10px] sm:text-xs text-muted-foreground truncate">
              agendadas
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-4 lg:p-6">
          <CardTitle className="text-xs sm:text-sm font-medium truncate">
            Reuniões Concluídas
          </CardTitle>
          <Video className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
        </CardHeader>
        <CardContent className="p-3 sm:p-4 lg:p-6 pt-0">
          <div className="flex items-baseline gap-1.5 sm:gap-2">
            <p className="text-xl sm:text-2xl font-bold">{stats.completed}</p>
            <p className="text-[10px] sm:text-xs text-muted-foreground truncate">
              finalizadas
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-4 lg:p-6">
          <CardTitle className="text-xs sm:text-sm font-medium truncate">
            Total de Participantes
          </CardTitle>
          <Users className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
        </CardHeader>
        <CardContent className="p-3 sm:p-4 lg:p-6 pt-0">
          <div className="flex items-baseline gap-1.5 sm:gap-2">
            <p className="text-xl sm:text-2xl font-bold">{stats.totalParticipants}</p>
            <p className="text-[10px] sm:text-xs text-muted-foreground truncate">
              únicos
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
