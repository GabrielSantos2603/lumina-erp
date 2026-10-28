export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          nome: string;
          empresa: string | null;
          telefone: string | null;
          role: "admin" | "manager" | "user";
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          nome: string;
          empresa?: string | null;
          telefone?: string | null;
          role?: "admin" | "manager" | "user";
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          nome?: string;
          empresa?: string | null;
          telefone?: string | null;
          role?: "admin" | "manager" | "user";
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      clients: {
        Row: {
          id: string;
          tenant_id: string;
          nome: string;
          empresa: string | null;
          telefone: string | null;
          email: string;
          endereco: string | null;
          cpf_cnpj: string | null;
          avatar_url: string | null;
          status: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          nome: string;
          empresa?: string | null;
          telefone?: string | null;
          email: string;
          endereco?: string | null;
          cpf_cnpj?: string | null;
          avatar_url?: string | null;
          status?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          tenant_id?: string;
          nome?: string;
          empresa?: string | null;
          telefone?: string | null;
          email?: string;
          endereco?: string | null;
          cpf_cnpj?: string | null;
          avatar_url?: string | null;
          status?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      projects: {
        Row: {
          id: string;
          tenant_id: string;
          client_id: string | null;
          titulo: string;
          descricao: string | null;
          status: "planning" | "in_progress" | "completed" | "cancelled";
          data_inicio: string | null;
          data_fim: string | null;
          orcamento: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          client_id?: string | null;
          titulo: string;
          descricao?: string | null;
          status?: "planning" | "in_progress" | "completed" | "cancelled";
          data_inicio?: string | null;
          data_fim?: string | null;
          orcamento?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          tenant_id?: string;
          client_id?: string | null;
          titulo?: string;
          descricao?: string | null;
          status?: "planning" | "in_progress" | "completed" | "cancelled";
          data_inicio?: string | null;
          data_fim?: string | null;
          orcamento?: number | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      events: {
        Row: {
          id: string;
          tenant_id: string;
          client_id: string | null;
          project_id: string | null;
          titulo: string;
          descricao: string | null;
          data_inicio: string;
          data_fim: string;
          tipo: "meeting" | "deadline" | "appointment" | "reminder";
          all_day: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          client_id?: string | null;
          project_id?: string | null;
          titulo: string;
          descricao?: string | null;
          data_inicio: string;
          data_fim: string;
          tipo?: "meeting" | "deadline" | "appointment" | "reminder";
          all_day?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          tenant_id?: string;
          client_id?: string | null;
          project_id?: string | null;
          titulo?: string;
          descricao?: string | null;
          data_inicio?: string;
          data_fim?: string;
          tipo?: "meeting" | "deadline" | "appointment" | "reminder";
          all_day?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      transactions: {
        Row: {
          id: string;
          tenant_id: string;
          client_id: string | null;
          project_id: string | null;
          company_id: string | null;
          tipo: string;
          categoria: string;
          descricao: string;
          valor: number;
          data_transacao: string;
          status: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          client_id?: string | null;
          project_id?: string | null;
          company_id?: string | null;
          tipo: string;
          categoria: string;
          descricao: string;
          valor: number;
          data_transacao: string;
          status?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          tenant_id?: string;
          client_id?: string | null;
          project_id?: string | null;
          company_id?: string | null;
          tipo?: string;
          categoria?: string;
          descricao?: string;
          valor?: number;
          data_transacao?: string;
          status?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
    Views: {};
    Functions: {};
    Enums: {
      user_role: "admin" | "manager" | "user";
      project_status: "planning" | "in_progress" | "completed" | "cancelled";
      event_type: "meeting" | "deadline" | "appointment" | "reminder";
    };
  };
};


