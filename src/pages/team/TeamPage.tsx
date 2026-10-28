import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { LayoutGrid, List, Plus } from "lucide-react";
import { 
  TeamStats, 
  TeamMemberCard, 
  TeamMemberListItem, 
  TeamFilters, 
  TeamMemberModal 
} from "./components";
import { teamService, type TeamMember, type CreateTeamMemberData } from "@/services/teamService";
import { DynamicContainer } from "@/components/responsive";
import { useOrganization } from "@/hooks/useOrganization";
import { toast } from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { DeleteConfirmDialog } from "@/components/DeleteConfirmDialog";

export default function TeamPage() {
  const navigate = useNavigate();
  const { organization, usage } = useOrganization();
  
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [filteredMembers, setFilteredMembers] = useState<TeamMember[]>([]);
  const [stats, setStats] = useState<{
    total: number;
    active: number;
    vacation: number;
    leave: number;
    inactive: number;
    totalProjects: number;
    avgSalary: number;
    totalPayroll: number;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [memberToDelete, setMemberToDelete] = useState<{ id: string; name: string } | null>(null);
  
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [roleFilter, setRoleFilter] = useState("all");

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    let filtered = [...members];

    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(
        member =>
          member.name.toLowerCase().includes(searchLower) ||
          member.email.toLowerCase().includes(searchLower) ||
          member.department?.toLowerCase().includes(searchLower)
      );
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter(member => member.status === statusFilter);
    }

    if (roleFilter !== "all") {
      filtered = filtered.filter(member => member.role === roleFilter);
    }

    setFilteredMembers(filtered);
  }, [members, searchTerm, statusFilter, roleFilter]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [membersData, statsData] = await Promise.all([
        teamService.getTeamMembers(),
        teamService.getTeamStats(),
      ]);
      
      setMembers(membersData);
      setStats(statsData);
    } catch (error) {
      console.error("Erro ao carregar dados da equipe:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearFilters = () => {
    setSearchTerm("");
    setStatusFilter("all");
    setRoleFilter("all");
  };

  const handleAddMember = async (data: CreateTeamMemberData) => {
    try {
      // Verificar limite de usuários do plano
      if (organization && usage) {
        const maxUsers = organization.max_users || 5; // Plano Starter tem limite de 5 usuários
        const currentUsers = usage.active_users || members.filter(m => m.status === 'active').length;

        if (currentUsers >= maxUsers) {
          toast.error(
            `Limite de usuários atingido! Seu plano permite até ${maxUsers} usuários. Você já tem ${currentUsers} usuários ativos.`,
            {
              duration: 5000,
            }
          );
          return;
        }
      }

      setIsLoading(true);
      await teamService.createTeamMember(data);
      await loadData();
      setShowAddModal(false);
      
      toast.success("Membro adicionado com sucesso!");
    } catch (error) {
      console.error("Erro ao adicionar membro:", error);
      toast.error("Erro ao adicionar membro. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditMember = async (data: CreateTeamMemberData) => {
    if (!selectedMember) return;
    
    try {
      setIsLoading(true);
      await teamService.updateTeamMember(selectedMember.id, data);
      await loadData();
      setShowEditModal(false);
      setSelectedMember(null);
      toast.success("Membro atualizado com sucesso!");
    } catch (error) {
      console.error("Erro ao atualizar membro:", error);
      toast.error("Erro ao atualizar membro. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteMember = (memberId: string, memberName: string) => {
    setMemberToDelete({ id: memberId, name: memberName });
    setShowDeleteDialog(true);
  };

  const confirmDeleteMember = async () => {
    if (!memberToDelete) return;

    try {
      setIsLoading(true);
      await teamService.deleteTeamMember(memberToDelete.id);
      await loadData();
      setMemberToDelete(null);
      setShowEditModal(false);
      setSelectedMember(null);
      toast.success("Membro excluído com sucesso!");
    } catch (error) {
      console.error("Erro ao excluir membro:", error);
      toast.error("Erro ao excluir membro. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleMemberClick = (member: TeamMember) => {
    setSelectedMember(member);
    setShowEditModal(true);
  };

  if (isLoading && !members.length) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  return (
    <DynamicContainer className="overflow-x-hidden">
      <div className="space-y-3 sm:space-y-4 lg:space-y-6">
        <div className="flex flex-col gap-3 sm:gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0 flex-1">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold truncate">Gestão de Equipe</h1>
            <p className="text-xs sm:text-sm text-muted-foreground truncate">
              Administre sua equipe e colaboradores
            </p>
          </div>
          <Button 
            onClick={() => setShowAddModal(true)} 
            className="gap-1.5 sm:gap-2 h-9 sm:h-10 lg:h-11 w-full sm:w-auto text-sm sm:text-base"
          >
            <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">Adicionar Membro</span>
            <span className="sm:hidden">Adicionar</span>
          </Button>
        </div>

      {stats && <TeamStats stats={stats} />}

      <TeamFilters
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        roleFilter={roleFilter}
        onRoleFilterChange={setRoleFilter}
        onClearFilters={handleClearFilters}
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs sm:text-sm text-muted-foreground">
          {filteredMembers.length} {filteredMembers.length === 1 ? "membro encontrado" : "membros encontrados"}
        </p>
        <div className="flex gap-2">
          <Button
            variant={viewMode === "grid" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("grid")}
            className="h-8 sm:h-9 flex-1 sm:flex-none"
          >
            <LayoutGrid className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            <span className="ml-1.5 sm:hidden">Grade</span>
          </Button>
          <Button
            variant={viewMode === "list" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("list")}
            className="h-8 sm:h-9 flex-1 sm:flex-none"
          >
            <List className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            <span className="ml-1.5 sm:hidden">Lista</span>
          </Button>
        </div>
      </div>

      {filteredMembers.length === 0 ? (
        <div className="text-center py-8 sm:py-12">
          <p className="text-sm sm:text-base text-muted-foreground">Nenhum membro encontrado</p>
        </div>
      ) : viewMode === "grid" ? (
        <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredMembers.map((member) => (
            <TeamMemberCard
              key={member.id}
              member={member}
              onClick={() => handleMemberClick(member)}
            />
          ))}
        </div>
      ) : (
        <div className="space-y-3 sm:space-y-4">
          {filteredMembers.map((member) => (
            <TeamMemberListItem
              key={member.id}
              member={member}
              onClick={() => handleMemberClick(member)}
            />
          ))}
        </div>
      )}

      {showAddModal && (
        <TeamMemberModal
          onClose={() => setShowAddModal(false)}
          onSave={handleAddMember}
          isLoading={isLoading}
        />
      )}

      {showEditModal && selectedMember && (
        <TeamMemberModal
          member={selectedMember}
          onClose={() => {
            setShowEditModal(false);
            setSelectedMember(null);
          }}
          onSave={handleEditMember}
          onDelete={handleDeleteMember}
          isLoading={isLoading}
        />
      )}

      {/* Diálogo de Confirmação de Exclusão */}
      <DeleteConfirmDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        onConfirm={confirmDeleteMember}
        title="Excluir Membro da Equipe"
        description="Tem certeza que deseja excluir este membro? Esta ação não pode ser desfeita e todos os dados relacionados serão perdidos."
        itemName={memberToDelete?.name}
      />
      </div>
    </DynamicContainer>
  );
}
