import { supabase } from "@/lib/supabase";

export interface Company {
  id: string;
  user_id: string;
  
  // Informações Básicas
  company_name: string;
  trading_name?: string;
  legal_nature?: string;
  
  // Documentos
  cnpj?: string;
  state_registration?: string;
  municipal_registration?: string;
  
  // Contato
  email?: string;
  phone?: string;
  mobile?: string;
  website?: string;
  
  // Endereço
  zip_code?: string;
  street?: string;
  number?: string;
  complement?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  country?: string;
  
  // Dados Bancários
  bank_name?: string;
  bank_code?: string;
  agency?: string;
  account_number?: string;
  account_type?: string;
  pix_key?: string;
  pix_type?: string;
  
  // Informações Fiscais
  tax_regime?: string;
  cnae?: string;
  cnae_description?: string;
  
  // Configurações
  logo_url?: string;
  primary_color?: string;
  secondary_color?: string;
  
  // Informações Adicionais
  founded_date?: string;
  employee_count?: number;
  annual_revenue?: number;
  
  // Redes Sociais
  instagram?: string;
  facebook?: string;
  linkedin?: string;
  behance?: string;
  
  // Timestamps
  created_at?: string;
  updated_at?: string;
}

export const companyService = {
  // Buscar empresa do usuário logado
  async getMyCompany(): Promise<Company | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Usuário não autenticado");

    const { data, error } = await supabase
      .from("companies")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        // Nenhuma empresa encontrada
        return null;
      }
      throw error;
    }

    return data;
  },

  // Criar empresa
  async createCompany(company: Omit<Company, "id" | "user_id" | "created_at" | "updated_at">): Promise<Company> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Usuário não autenticado");

    // Limpar dados vazios antes de enviar
    const cleanData = this._cleanCompanyData(company);

    const { data, error } = await supabase
      .from("companies")
      .insert([{ ...cleanData, user_id: user.id }])
      .select()
      .single();

    if (error) throw error;
    
    // Atualizar o campo empresa no perfil do usuário
    if (data.company_name) {
      await supabase
        .from("profiles")
        .update({ empresa: data.company_name })
        .eq("id", user.id);
    }
    
    return data;
  },

  // Atualizar empresa
  async updateCompany(id: string, updates: Partial<Company>): Promise<Company> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Usuário não autenticado");
    
    // Limpar dados vazios antes de enviar
    const cleanData = this._cleanCompanyData(updates);

    const { data, error } = await supabase
      .from("companies")
      .update(cleanData)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    
    // Se atualizou o nome da empresa, sincronizar com o perfil
    if (data.company_name) {
      await supabase
        .from("profiles")
        .update({ empresa: data.company_name })
        .eq("id", user.id);
    }
    
    return data;
  },

  // Helper para limpar dados vazios (converte "" para null)
  _cleanCompanyData(data: Partial<Company>): Record<string, unknown> {
    const cleaned: Record<string, unknown> = {};
    
    for (const [key, value] of Object.entries(data)) {
      // Se for string vazia, converte para null
      if (value === "") {
        cleaned[key] = null;
      }
      // Se for número 0, mantém (pode ser válido)
      else if (value === 0) {
        cleaned[key] = value;
      }
      // Se for undefined, não inclui no objeto
      else if (value !== undefined) {
        cleaned[key] = value;
      }
    }
    
    return cleaned;
  },

  // Deletar empresa
  async deleteCompany(id: string): Promise<void> {
    const { error } = await supabase
      .from("companies")
      .delete()
      .eq("id", id);

    if (error) throw error;
  },

  // Upload de logo
  async uploadLogo(file: File, companyId: string): Promise<string> {
    const fileExt = file.name.split(".").pop();
    const fileName = `${companyId}-${Date.now()}.${fileExt}`;
    const filePath = `company-logos/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from("avatars") // Usar o bucket existente ou criar um novo
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    const { data } = supabase.storage
      .from("avatars")
      .getPublicUrl(filePath);

    return data.publicUrl;
  },

  // Buscar CEP (via API externa)
  async searchZipCode(zipCode: string): Promise<{
    street: string;
    neighborhood: string;
    city: string;
    state: string;
  } | null> {
    try {
      const cleanZipCode = zipCode.replace(/\D/g, "");
      const response = await fetch(`https://viacep.com.br/ws/${cleanZipCode}/json/`);
      const data = await response.json();

      if (data.erro) return null;

      return {
        street: data.logradouro,
        neighborhood: data.bairro,
        city: data.localidade,
        state: data.uf,
      };
    } catch (error) {
      console.error("Erro ao buscar CEP:", error);
      return null;
    }
  },

  // Buscar CNPJ (via API externa - ReceitaWS)
  async searchCNPJ(cnpj: string): Promise<{
    company_name: string;
    trading_name: string;
    email?: string;
    phone?: string;
    zip_code?: string;
    street?: string;
    number?: string;
    neighborhood?: string;
    city?: string;
    state?: string;
    cnae?: string;
    legal_nature?: string;
    founded_date?: string;
  } | null> {
    try {
      const cleanCNPJ = cnpj.replace(/\D/g, "");
      const response = await fetch(`https://receitaws.com.br/v1/cnpj/${cleanCNPJ}`);
      const data = await response.json();

      if (data.status === "ERROR") return null;

      return {
        company_name: data.nome,
        trading_name: data.fantasia,
        email: data.email,
        phone: data.telefone,
        zip_code: data.cep?.replace(/\D/g, ""),
        street: data.logradouro,
        number: data.numero,
        neighborhood: data.bairro,
        city: data.municipio,
        state: data.uf,
        cnae: data.atividade_principal?.[0]?.code,
        legal_nature: data.natureza_juridica,
        founded_date: data.abertura,
      };
    } catch (error) {
      console.error("Erro ao buscar CNPJ:", error);
      return null;
    }
  },
};
