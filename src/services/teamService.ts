import { supabase } from "@/lib/supabase";
import { getOrganizationId } from "@/utils/getOrganizationId";

export interface TeamMember {
  id: string;
  user_id: string;
  name: string;
  email: string;
  phone?: string;
  role: "architect" | "designer" | "engineer" | "manager" | "assistant" | "intern" | "other";
  department?: string;
  specialty?: string;
  status: "active" | "vacation" | "leave" | "inactive";
  salary?: number;
  weekly_hours?: number;
  hire_date?: string;
  termination_date?: string;
  active_projects?: number;
  avatar_url?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateTeamMemberData {
  name: string;
  email: string;
  phone?: string;
  role: "architect" | "designer" | "engineer" | "manager" | "assistant" | "intern" | "other";
  department?: string;
  specialty?: string;
  status?: "active" | "vacation" | "leave" | "inactive";
  salary?: number;
  weekly_hours?: number;
  hire_date?: string;
  notes?: string;
}

export interface UpdateTeamMemberData extends Partial<CreateTeamMemberData> {
  termination_date?: string;
  active_projects?: number;
}

class TeamService {
  /**
   * Obter todos os membros da equipe (ativos por padrão)
   */
  async getTeamMembers(includeInactive = false) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Usuário não autenticado");

    let query = supabase
      .from("team")
      .select("*")
      .eq("user_id", user.id);

    if (!includeInactive) {
      query = query.neq("status", "inactive");
    }

    const { data, error } = await query.order("name", { ascending: true });

    if (error) throw error;
    return data as TeamMember[];
  }

  /**
   * Obter membro por ID
   */
  async getTeamMemberById(id: string) {
    const { data, error } = await supabase
      .from("team")
      .select("*")
      .eq("id", id)
      .single();

    if (error) throw error;
    return data as TeamMember;
  }

  /**
   * Criar novo membro da equipe
   */
  async createTeamMember(memberData: CreateTeamMemberData) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Usuário não autenticado");

    // Buscar organization_id do usuário
    const organizationId = await getOrganizationId();

    const { data, error } = await supabase
      .from("team")
      .insert({
        ...memberData,
        user_id: user.id,
        organization_id: organizationId,
        status: memberData.status || "active",
        weekly_hours: memberData.weekly_hours || 40,
        active_projects: 0,
      })
      .select()
      .single();

    if (error) throw error;
    return data as TeamMember;
  }

  /**
   * Atualizar membro da equipe
   */
  async updateTeamMember(id: string, memberData: UpdateTeamMemberData) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Usuário não autenticado");

    const { data, error } = await supabase
      .from("team")
      .update({
        ...memberData,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("user_id", user.id)
      .select()
      .single();

    if (error) throw error;
    return data as TeamMember;
  }

  /**
   * Deletar membro da equipe (soft delete - marca como inativo)
   */
  async deleteTeamMember(id: string, hardDelete = false) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Usuário não autenticado");

    if (hardDelete) {
      const { error } = await supabase
        .from("team")
        .delete()
        .eq("id", id)
        .eq("user_id", user.id);

      if (error) throw error;
      return true;
    } else {
      // Soft delete - marca como inativo
      await this.updateTeamMember(id, {
        status: "inactive",
        termination_date: new Date().toISOString().split("T")[0],
      });
      return true;
    }
  }

  /**
   * Buscar membros por termo
   */
  async searchTeamMembers(searchTerm: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Usuário não autenticado");

    const { data, error } = await supabase
      .from("team")
      .select("*")
      .eq("user_id", user.id)
      .or(`name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%,department.ilike.%${searchTerm}%`)
      .order("name", { ascending: true });

    if (error) throw error;
    return data as TeamMember[];
  }

  /**
   * Obter membros por status
   */
  async getTeamMembersByStatus(status: "active" | "vacation" | "leave" | "inactive") {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Usuário não autenticado");

    const { data, error } = await supabase
      .from("team")
      .select("*")
      .eq("user_id", user.id)
      .eq("status", status)
      .order("name", { ascending: true });

    if (error) throw error;
    return data as TeamMember[];
  }

  /**
   * Obter membros por cargo/role
   */
  async getTeamMembersByRole(role: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Usuário não autenticado");

    const { data, error } = await supabase
      .from("team")
      .select("*")
      .eq("user_id", user.id)
      .eq("role", role)
      .order("name", { ascending: true });

    if (error) throw error;
    return data as TeamMember[];
  }

  /**
   * Atualizar contador de projetos ativos
   */
  async updateActiveProjectsCount(memberId: string, count: number) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Usuário não autenticado");

    const { error } = await supabase
      .from("team")
      .update({ active_projects: count })
      .eq("id", memberId)
      .eq("user_id", user.id);

    if (error) throw error;
    return true;
  }

  /**
   * Obter estatísticas da equipe
   */
  async getTeamStats() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Usuário não autenticado");

    const { data, error } = await supabase
      .from("team")
      .select("status, role, salary, active_projects, weekly_hours")
      .eq("user_id", user.id);

    if (error) throw error;

    const members = data as TeamMember[];
    const activeMembers = members.filter(m => m.status === "active");

    return {
      total: members.length,
      active: activeMembers.length,
      vacation: members.filter(m => m.status === "vacation").length,
      leave: members.filter(m => m.status === "leave").length,
      inactive: members.filter(m => m.status === "inactive").length,
      totalProjects: members.reduce((sum, m) => sum + (m.active_projects || 0), 0),
      avgSalary: activeMembers.length > 0
        ? activeMembers.reduce((sum, m) => sum + (m.salary || 0), 0) / activeMembers.length
        : 0,
      totalPayroll: activeMembers.reduce((sum, m) => sum + (m.salary || 0), 0),
      byRole: {
        architect: members.filter(m => m.role === "architect").length,
        designer: members.filter(m => m.role === "designer").length,
        engineer: members.filter(m => m.role === "engineer").length,
        manager: members.filter(m => m.role === "manager").length,
        assistant: members.filter(m => m.role === "assistant").length,
        intern: members.filter(m => m.role === "intern").length,
        other: members.filter(m => m.role === "other").length,
      },
    };
  }
}

export const teamService = new TeamService();




