import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, Users } from "lucide-react";
import type { Meeting } from "@/services/meetingService";

interface MeetingCardProps {
  meeting: Meeting;
  onClick?: () => void;
}

const statusLabels = {
  scheduled: { label: "Agendada", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
  in_progress: { label: "Em Andamento", color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" },
  completed: { label: "Concluída", color: "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400" },
  cancelled: { label: "Cancelada", color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" },
};

export function MeetingCard({ meeting, onClick }: MeetingCardProps) {
  return (
    <Card
      className="cursor-pointer hover:shadow-lg transition-shadow"
      onClick={onClick}
    >
      <CardContent className="p-3 sm:p-4 lg:p-6">
        <div className="space-y-2 sm:space-y-3 lg:space-y-4">
          <div className="min-w-0">
            <div className="flex items-start justify-between gap-2 mb-1.5 sm:mb-2">
              <h3 className="font-semibold text-sm sm:text-base lg:text-lg line-clamp-1 flex-1 min-w-0">{meeting.title}</h3>
              <Badge className={`text-[10px] sm:text-xs flex-shrink-0 ${statusLabels[meeting.status].color}`}>
                {statusLabels[meeting.status].label}
              </Badge>
            </div>
            {meeting.description && (
              <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2">
                {meeting.description}
              </p>
            )}
          </div>

          <div className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm">
            <div className="flex items-center gap-1.5 sm:gap-2 text-muted-foreground">
              <Calendar className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
              <span className="truncate">{new Date(meeting.meeting_date).toLocaleDateString("pt-BR")}</span>
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2 text-muted-foreground">
              <Clock className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
              <span className="truncate">{meeting.start_time}{meeting.end_time && ` - ${meeting.end_time}`}</span>
            </div>
          </div>

          {(meeting.project_name || meeting.client_name) && (
            <div className="flex flex-wrap gap-1.5 sm:gap-2">
              {meeting.project_name && (
                <Badge variant="outline" className="text-[10px] sm:text-xs truncate max-w-[150px]">
                  {meeting.project_name}
                </Badge>
              )}
              {meeting.client_name && (
                <Badge variant="outline" className="text-[10px] sm:text-xs bg-blue-50 dark:bg-blue-900/20 truncate max-w-[150px]">
                  {meeting.client_name}
                </Badge>
              )}
            </div>
          )}

          {meeting.participants && meeting.participants.length > 0 && (
            <div className="flex items-center gap-1.5 sm:gap-2">
              <Users className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
              <div className="flex -space-x-1.5 sm:-space-x-2">
                {meeting.participants.slice(0, 3).map((participant, idx) => (
                  <div
                    key={idx}
                    className="h-5 w-5 sm:h-6 sm:w-6 rounded-full bg-lumina-100 dark:bg-lumina-900 border-2 border-background flex items-center justify-center text-[10px] sm:text-xs font-medium"
                    title={participant}
                  >
                    {participant.charAt(0).toUpperCase()}
                  </div>
                ))}
                {meeting.participants.length > 3 && (
                  <div className="h-5 w-5 sm:h-6 sm:w-6 rounded-full bg-muted border-2 border-background flex items-center justify-center text-[10px] sm:text-xs">
                    +{meeting.participants.length - 3}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
