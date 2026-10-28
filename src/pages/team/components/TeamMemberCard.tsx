import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Mail, Phone, Briefcase, Clock } from "lucide-react";
import { cn } from "@/utils/cn";
import type { TeamMember } from "@/services/teamService";

interface TeamMemberCardProps {
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

export function TeamMemberCard({ member, onClick }: TeamMemberCardProps) {
  return (
    <Card 
      className="group cursor-pointer hover:shadow-lg transition-all duration-200"
      onClick={onClick}
    >
      <CardContent className="p-3 sm:p-4 lg:p-6 space-y-2 sm:space-y-3 lg:space-y-4">
        {/* Avatar e Status */}
        <div className="flex items-start justify-between">
          <Avatar className="h-12 w-12 sm:h-14 sm:w-14 lg:h-16 lg:w-16">
            {member.avatar_url && <AvatarImage src={member.avatar_url} alt={member.name} />}
            <AvatarFallback className="text-sm sm:text-base lg:text-lg font-semibold bg-lumina-100 text-lumina-700 dark:bg-lumina-900/30 dark:text-lumina-400">
              {getInitials(member.name)}
            </AvatarFallback>
          </Avatar>
          <Badge className={`text-[10px] sm:text-xs ${statusLabels[member.status].color}`}>
            {statusLabels[member.status].label}
          </Badge>
        </div>

        {/* Nome e Cargo */}
        <div className="min-w-0">
          <h3 className="font-semibold text-sm sm:text-base line-clamp-1">{member.name}</h3>
          <div className="flex items-center gap-1.5 mt-1">
            <Badge variant="outline" className={cn("text-[10px] sm:text-xs", roleLabels[member.role].color)}>
              <span className="mr-1">{roleLabels[member.role].icon}</span>
              <span className="hidden sm:inline">{roleLabels[member.role].label}</span>
            </Badge>
          </div>
        </div>

        {/* Informações */}
        <div className="space-y-1.5 sm:space-y-2 text-[10px] sm:text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <Mail className="h-3 w-3 sm:h-3.5 sm:w-3.5 flex-shrink-0" />
            <span className="line-clamp-1 min-w-0">{member.email}</span>
          </div>

          {member.phone && (
            <div className="flex items-center gap-1.5 sm:gap-2">
              <Phone className="h-3 w-3 sm:h-3.5 sm:w-3.5 flex-shrink-0" />
              <span className="truncate">{member.phone}</span>
            </div>
          )}

          {member.department && (
            <div className="flex items-center gap-1.5 sm:gap-2">
              <Briefcase className="h-3 w-3 sm:h-3.5 sm:w-3.5 flex-shrink-0" />
              <span className="line-clamp-1 min-w-0">{member.department}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-2 sm:pt-3 border-t flex items-center justify-between text-[10px] sm:text-xs">
          <div className="flex items-center gap-1 sm:gap-1.5 text-muted-foreground">
            <Clock className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
            <span className="truncate">{member.weekly_hours || 0}h/sem</span>
          </div>
          <div className="flex items-center gap-1 sm:gap-1.5 text-muted-foreground">
            <Briefcase className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
            <span className="truncate">{member.active_projects || 0} proj.</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
