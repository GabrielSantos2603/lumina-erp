/**
 * Serviço para gerenciar clientes no Supabase
 */

import { supabase } from "@/lib/supabase";
import { getOrganizationId } from "@/utils/getOrganizationId";

export interface Client {
  id: string;
  user_id?: string;
  name: string;
  type: "residential" | "commercial";
  person_type: "pf" | "pj";
  cpf_cnpj?: string;
  status: "active" | "inactive" | "potential";
  phone: string;
  phone_secondary?: string;
  email: string;
  email_secondary?: string;
  website?: string;
  address?: string;
  address_number?: string;
  complement?: string;
  neighborhood?: string;
  city: string;
  state?: string;
  zip_code?: string;
  how_met_us?: string;
  referred_by?: string;
  notes?: string;
  active_projects: number;
  created_at?: string;
  updated_at?: string;
}

export type ClientInsert = Omit<Client, "id" | "created_at" | "updated_at" | "user_id">;
export type ClientUpdate = Partial<ClientInsert>;

export interface ClientStats {
  total_clients: number;
  active_clients: number;
  potential_clients: number;
  residential_clients: number;
  commercial_clients: number;
  total_active_projects: number;
}

class ClientService {
  /**
   * Busca todos os clientes da organização do usuário autenticado
   */
  async getAllClients(): Promise<Client[]> {
    // Verifica autenticação
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      console.warn("Usuário não autenticado ao buscar clientes");
      return []; // Retorna array vazio se não estiver autenticado
    }

    // RLS policies filtram automaticamente pela organização
    const { data, error } = await supabase
      .from("clients")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Erro ao buscar clientes:", error);
      
      // Erro específico se não pertencer a organização
      if (error.message?.includes("row-level security") || error.code === "42501") {
        throw new Error("Você não tem permissão para acessar clientes. Configure sua empresa primeiro.");
      }
      
      throw error;
    }

    console.log(`✅ ${data?.length || 0} clientes carregados do Supabase`);
    return data || [];
  }

  /**
   * Busca clientes com filtros
   */
  async searchClients(
    searchTerm?: string,
    status?: string,
    type?: string,
    limit = 50,
    offset = 0
  ): Promise<Client[]> {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error("Usuário não autenticado");
    }

    const { data, error } = await supabase.rpc("search_clients", {
      p_user_id: user.id,
      p_search_term: searchTerm || null,
      p_status: status || null,
      p_type: type || null,
      p_limit: limit,
      p_offset: offset,
    });

    if (error) {
      console.error("Erro ao buscar clientes:", error);
      throw error;
    }

    return data || [];
  }

  /**
   * Busca um cliente por ID
   */
  async getClientById(id: string): Promise<Client | null> {
    const { data, error } = await supabase
      .from("clients")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      console.error("Erro ao buscar cliente:", error);
      return null;
    }

    return data;
  }

  /**
   * Cria um novo cliente
   */
  async createClient(client: ClientInsert): Promise<Client> {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error("Usuário não autenticado");
    }

    // Buscar organization_id do usuário
    const organizationId = await getOrganizationId();

    const { data, error } = await supabase
      .from("clients")
      .insert({
        ...client,
        user_id: user.id,
        organization_id: organizationId,
      })
      .select()
      .single();

    if (error) {
      console.error("Erro ao criar cliente:", error);
      throw error;
    }

    return data;
  }

  /**
   * Atualiza um cliente
   */
  async updateClient(id: string, updates: ClientUpdate): Promise<Client> {
    const { data, error } = await supabase
      .from("clients")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Erro ao atualizar cliente:", error);
      throw error;
    }

    return data;
  }

  /**
   * Deleta um cliente
   */
  async deleteClient(id: string): Promise<void> {
    const { error } = await supabase
      .from("clients")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Erro ao deletar cliente:", error);
      throw error;
    }
  }

  /**
   * Obtém estatísticas de clientes
   */
  async getClientStats(): Promise<ClientStats> {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error("Usuário não autenticado");
    }

    const { data, error } = await supabase
      .from("client_stats")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (error) {
      console.error("Erro ao buscar estatísticas:", error);
      // Retorna valores padrão se não houver dados
      return {
        total_clients: 0,
        active_clients: 0,
        potential_clients: 0,
        residential_clients: 0,
        commercial_clients: 0,
        total_active_projects: 0,
      };
    }

    return data;
  }

  /**
   * Incrementa contador de projetos ativos
   */
  async incrementActiveProjects(clientId: string): Promise<void> {
    const { error } = await supabase.rpc("increment", {
      table_name: "clients",
      row_id: clientId,
      column_name: "active_projects",
    });

    if (error) {
      console.error("Erro ao incrementar projetos:", error);
    }
  }

  /**
   * Decrementa contador de projetos ativos
   */
  async decrementActiveProjects(clientId: string): Promise<void> {
    const { error } = await supabase.rpc("decrement", {
      table_name: "clients",
      row_id: clientId,
      column_name: "active_projects",
    });

    if (error) {
      console.error("Erro ao decrementar projetos:", error);
    }
  }
}

export const clientService = new ClientService();

