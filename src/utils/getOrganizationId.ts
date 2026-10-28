/**
 * Função auxiliar para obter organization_id do usuário atual
 */

import { supabase } from "@/lib/supabase";

export async function getOrganizationId(): Promise<string> {
  console.log("=== getOrganizationId: Iniciando ===");
  
  const { data: { user } } = await supabase.auth.getUser();
  console.log("Usuário obtido:", user?.id);
  
  if (!user) {
    console.error("Usuário não autenticado");
    throw new Error("Usuário não autenticado");
  }

  // Buscar organization_id do usuário
  console.log("Buscando organization_id para user_id:", user.id);
  const { data: memberData, error: memberError } = await supabase
    .from("organization_members")
    .select("organization_id")
    .eq("user_id", user.id)
    .eq("status", "active")
    .single();

  console.log("Resultado da busca - memberData:", memberData);
  console.log("Resultado da busca - memberError:", memberError);

  if (memberError || !memberData) {
    console.error("Erro ao buscar organização do usuário:", memberError);
    throw new Error("Usuário não pertence a nenhuma organização. Configure sua empresa primeiro em /company/setup");
  }

  console.log("organization_id encontrado:", memberData.organization_id);
  console.log("=== getOrganizationId: Concluído ===");
  return memberData.organization_id;
}
