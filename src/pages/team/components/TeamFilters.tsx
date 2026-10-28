import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, X } from "lucide-react";

interface TeamFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  statusFilter: string;
  onStatusFilterChange: (value: string) => void;
  roleFilter: string;
  onRoleFilterChange: (value: string) => void;
  onClearFilters: () => void;
}

const statusOptions = [
  { value: "all", label: "Todos", color: "bg-gray-100 text-gray-700 hover:bg-gray-200" },
  { value: "active", label: "Ativos", color: "bg-green-100 text-green-700 hover:bg-green-200" },
  { value: "vacation", label: "Férias", color: "bg-blue-100 text-blue-700 hover:bg-blue-200" },
  { value: "leave", label: "Afastados", color: "bg-yellow-100 text-yellow-700 hover:bg-yellow-200" },
  { value: "inactive", label: "Inativos", color: "bg-red-100 text-red-700 hover:bg-red-200" },
];

const roleOptions = [
  { value: "all", label: "Todos", emoji: "👥" },
  { value: "architect", label: "Arquitetos", emoji: "🏛️" },
  { value: "designer", label: "Designers", emoji: "🎨" },
  { value: "engineer", label: "Engenheiros", emoji: "⚙️" },
  { value: "manager", label: "Gerentes", emoji: "📊" },
  { value: "assistant", label: "Assistentes", emoji: "📋" },
  { value: "intern", label: "Estagiários", emoji: "🎓" },
  { value: "other", label: "Outros", emoji: "👤" },
];

export function TeamFilters({
  searchTerm,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  roleFilter,
  onRoleFilterChange,
  onClearFilters,
}: TeamFiltersProps) {
  const hasActiveFilters = searchTerm || statusFilter !== "all" || roleFilter !== "all";

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* Busca */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por nome, email ou departamento..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-8 sm:pl-9 h-9 sm:h-10 text-sm sm:text-base"
        />
      </div>

      {/* Filtros por Status */}
      <div className="space-y-1.5 sm:space-y-2">
        <label className="text-xs sm:text-sm font-medium">Filtrar por Status:</label>
        <div className="flex flex-wrap gap-1.5 sm:gap-2">
          {statusOptions.map((status) => (
            <Button
              key={status.value}
              variant={statusFilter === status.value ? "default" : "outline"}
              size="sm"
              onClick={() => onStatusFilterChange(status.value)}
              className={`h-7 sm:h-8 text-xs sm:text-sm ${statusFilter === status.value ? "" : status.color}`}
            >
              {status.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Filtros por Cargo */}
      <div className="space-y-1.5 sm:space-y-2">
        <label className="text-xs sm:text-sm font-medium">Filtrar por Cargo:</label>
        <div className="flex flex-wrap gap-1.5 sm:gap-2">
          {roleOptions.map((role) => (
            <Button
              key={role.value}
              variant={roleFilter === role.value ? "default" : "outline"}
              size="sm"
              onClick={() => onRoleFilterChange(role.value)}
              className="h-7 sm:h-8 text-xs sm:text-sm"
            >
              <span className="mr-1">{role.emoji}</span>
              <span className="hidden sm:inline">{role.label}</span>
            </Button>
          ))}
        </div>
      </div>

      {/* Limpar Filtros */}
      {hasActiveFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onClearFilters}
          className="w-full text-muted-foreground h-8 sm:h-9 text-xs sm:text-sm"
        >
          <X className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
          Limpar Filtros
        </Button>
      )}
    </div>
  );
}
