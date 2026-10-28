import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Mail, Phone, Clock, Briefcase } from "lucide-react";
import { cn } from "@/utils/cn";
import type { TeamMember } from "@/services/teamService";

interface TeamMemberListItemProps {
  member: TeamMember;
  onClick?: () => void;
}

const roleLabels = {
  architect: { label: "Arquiteto(a)", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400", icon: "🏛️" },
  designer: { label: "Designer", color: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400", icon: "🎨" },
  engineer: { label: "Engenheiro(a)", color: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400", icon: "⚙️" },
  manager: { label: "Gerente", color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400", icon: "📊" },
  assistant: { label: "Assistente", color: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400", icon: "📋" },
  intern: { label: "Estagiário(a)", color: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400", icon: "🎓" },
  other: { label: "Outro", color: "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400", icon: "👤" }
};

const statusLabels = {
  active: { label: "Ativo", color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" },
  vacation: { label: "Férias", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
  leave: { label: "Afastado", color: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400" },
  inactive: { label: "Inativo", color: "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400" }
};

const getInitials = (name: string) => {
  const names = name.split(" ");
  if (names.length >= 2) {
    return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
};

export function TeamMemberListItem({ member, onClick }: TeamMemberListItemProps) {
  return (
    <Card 
      className="hover:shadow-md transition-shadow cursor-pointer"
      onClick={onClick}
    >
      <CardContent className="p-3 sm:p-4">
        <div className="flex items-center gap-2 sm:gap-3 lg:gap-4">
          {/* Avatar */}
          <Avatar className="h-12 w-12 sm:h-14 sm:w-14 lg:h-16 lg:w-16 flex-shrink-0">
            {member.avatar_url && <AvatarImage src={member.avatar_url} alt={member.name} />}
            <AvatarFallback className="text-sm sm:text-base font-semibold bg-lumina-100 text-lumina-700 dark:bg-lumina-900/30 dark:text-lumina-400">
              {getInitials(member.name)}
            </AvatarFallback>
          </Avatar>

          {/* Informações */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 sm:gap-4 mb-1.5 sm:mb-2">
              <div className="min-w-0 flex-1">
                <h3 className="font-semibold text-sm sm:text-base truncate">{member.name}</h3>
                <div className="flex items-center gap-1.5 sm:gap-2 mt-0.5 sm:mt-1 flex-wrap">
                  <Badge variant="outline" className={cn("text-[10px] sm:text-xs", roleLabels[member.role].color)}>
                    <span className="mr-1">{roleLabels[member.role].icon}</span>
                    <span className="hidden sm:inline">{roleLabels[member.role].label}</span>
                  </Badge>
                  {member.department && (
                    <span className="text-[10px] sm:text-xs text-muted-foreground truncate">• {member.department}</span>
                  )}
                </div>
              </div>
              <Badge className={`text-[10px] sm:text-xs flex-shrink-0 ${statusLabels[member.status].color}`}>
                {statusLabels[member.status].label}
              </Badge>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-1.5 sm:gap-2 text-xs sm:text-sm text-muted-foreground">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <Mail className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                <span className="truncate">{member.email}</span>
              </div>
              {member.phone && (
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <Phone className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                  <span className="truncate">{member.phone}</span>
                </div>
              )}
              <div className="flex items-center gap-1.5 sm:gap-2">
                <Clock className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                <span className="truncate">{member.weekly_hours || 0}h/semana</span>
              </div>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <Briefcase className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                <span className="truncate">{member.active_projects || 0} proj. ativos</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
