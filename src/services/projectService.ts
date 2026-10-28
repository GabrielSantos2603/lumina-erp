/**
 * Serviço para gerenciar projetos no Supabase
 */

import { supabase } from "@/lib/supabase";
import { getOrganizationId } from "@/utils/getOrganizationId";
import { withAuthRetry } from "@/lib/supabaseWithRetry";

export interface Project {
  id: string;
  user_id?: string;
  name: string;
  client_id?: string;
  client_name?: string;
  category: "architecture" | "interior_design" | "landscape" | "renovation" | "other";
  type: "residential" | "commercial";
  status: "planning" | "in_progress" | "completed" | "paused" | "cancelled";
  priority?: "low" | "medium" | "high" | "urgent";
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  start_date?: string;
  end_date?: string;
  estimated_completion?: string;
  budget?: number;
  actual_cost?: number;
  area_sqm?: number;
  floors?: number;
  bedrooms?: number;
  bathrooms?: number;
  description?: string;
  notes?: string;
  image_url?: string;
  created_at?: string;
  updated_at?: string;
}

export type ProjectInsert = Omit<Project, "id" | "created_at" | "updated_at" | "user_id">;
export type ProjectUpdate = Partial<ProjectInsert>;

export interface ProjectStats {
  total_projects: number;
  planning_projects: number;
  in_progress_projects: number;
  completed_projects: number;
  total_budget: number;
  total_actual_cost: number;
}

class ProjectService {
  /**
   * Busca todos os projetos do usuário autenticado
   * Usa withAuthRetry para renovar sessão automaticamente se necessário
   */
  async getAllProjects(): Promise<Project[]> {
    // Verifica autenticação
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      console.warn("Usuário não autenticado ao buscar projetos");
      return [];
    }

    // Usar withAuthRetry para renovar automaticamente se sessão expirou
    const { data, error } = await withAuthRetry(() =>
      supabase
        .from("projects")
        .select("*")
        .order("created_at", { ascending: false })
    );

    if (error) {
      console.error("Erro ao buscar projetos:", error);
      throw error;
    }

    console.log(`✅ ${data?.length || 0} projetos carregados do Supabase`);
    return data || [];
  }

  /**
   * Busca um projeto por ID
   */
  async getProjectById(id: string): Promise<Project | null> {
    const { data, error } = await supabase
      .from("projects")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      console.error("Erro ao buscar projeto:", error);
      return null;
    }

    return data;
  }

  /**
   * Busca projetos de um cliente específico
   */
  async getProjectsByClient(clientId: string): Promise<Project[]> {
    const { data, error } = await supabase
      .from("projects")
      .select("*")
      .eq("client_id", clientId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Erro ao buscar projetos do cliente:", error);
      throw error;
    }

    return data || [];
  }

  /**
   * Cria um novo projeto
   */
  async createProject(project: ProjectInsert): Promise<Project> {
    console.log("=== projectService.createProject: Iniciando ===");
    console.log("Dados do projeto recebidos:", project);
    
    const { data: { user } } = await supabase.auth.getUser();
    console.log("Usuário autenticado:", user?.id);
    
    if (!user) {
      console.error("Usuário não autenticado");
      throw new Error("Usuário não autenticado");
    }

    // Buscar organization_id do usuário
    console.log("Buscando organization_id...");
    const organizationId = await getOrganizationId();
    console.log("organization_id obtido:", organizationId);

    const insertData = {
      ...project,
      user_id: user.id,
      organization_id: organizationId,
    };
    console.log("Dados completos para inserção:", insertData);

    console.log("Executando insert no Supabase...");
    const { data, error } = await supabase
      .from("projects")
      .insert(insertData)
      .select()
      .single();

    console.log("Resultado do insert - data:", data);
    console.log("Resultado do insert - error:", error);

    if (error) {
      console.error("=== ERRO ao criar projeto no Supabase ===");
      console.error("Código do erro:", error.code);
      console.error("Mensagem do erro:", error.message);
      console.error("Detalhes do erro:", error.details);
      console.error("Hint do erro:", error.hint);
      throw error;
    }

    console.log("=== projectService.createProject: Concluído com sucesso ===");
    return data;
  }

  /**
   * Atualiza um projeto
   */
  async updateProject(id: string, updates: ProjectUpdate): Promise<Project> {
    const { data, error } = await supabase
      .from("projects")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Erro ao atualizar projeto:", error);
      throw error;
    }

    return data;
  }

  /**
   * Deleta um projeto
   */
  async deleteProject(id: string): Promise<void> {
    const { error } = await supabase
      .from("projects")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Erro ao deletar projeto:", error);
      throw error;
    }
  }

  /**
   * Obtém estatísticas de projetos
   */
  async getProjectStats(): Promise<ProjectStats> {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error("Usuário não autenticado");
    }

    const { data, error } = await supabase
      .from("project_stats")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (error) {
      console.error("Erro ao buscar estatísticas:", error);
      // Retorna valores padrão se não houver dados
      return {
        total_projects: 0,
        planning_projects: 0,
        in_progress_projects: 0,
        completed_projects: 0,
        total_budget: 0,
        total_actual_cost: 0,
      };
    }

    return data;
  }

  /**
   * Busca projetos com filtros
   */
  async searchProjects(
    searchTerm?: string,
    status?: string,
    category?: string,
    limit = 50,
    offset = 0
  ): Promise<Project[]> {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error("Usuário não autenticado");
    }

    const { data, error } = await supabase.rpc("search_projects", {
      p_user_id: user.id,
      p_search_term: searchTerm || null,
      p_status: status || null,
      p_category: category || null,
      p_limit: limit,
      p_offset: offset,
    });

    if (error) {
      console.error("Erro ao buscar projetos:", error);
      throw error;
    }

    return data || [];
  }
}

export const projectService = new ProjectService();

