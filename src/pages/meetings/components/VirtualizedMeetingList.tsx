import { MeetingCard } from "./MeetingCard";
import type { Meeting } from "@/services/meetingService";

interface VirtualizedMeetingListProps {
  meetings: Meeting[];
  onCardClick: (meeting: Meeting) => void;
}

export function VirtualizedMeetingList({
  meetings,
  onCardClick,
}: VirtualizedMeetingListProps) {
  // Por enquanto, usar grid normal para todos os casos
  // A virtualização será implementada depois que react-window for configurado corretamente
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {meetings.map((meeting) => (
        <MeetingCard
          key={meeting.id}
          meeting={meeting}
          onClick={() => onCardClick(meeting)}
        />
      ))}
    </div>
  );
}
