/**
 * Service para gerenciar organizações (multi-tenant SaaS)
 */

import { supabase } from '@/lib/supabase';
import type { Organization, OrganizationMember, OrganizationUsage, SubscriptionHistory } from '@/types/saas.types';

export class OrganizationService {
  /**
   * Obter organização do usuário atual
   */
  async getCurrentOrganization(): Promise<Organization | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    // Buscar membership do usuário
    const { data: membership } = await supabase
      .from('organization_members')
      .select('organization_id')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single();

    if (!membership) return null;

    // Buscar dados da organização
    const { data, error } = await supabase
      .from('organizations')
      .select('*')
      .eq('id', membership.organization_id)
      .single();

    if (error) {
      console.error('Erro ao buscar organização:', error);
      return null;
    }

    return data as Organization;
  }

  /**
   * Obter membership do usuário atual
   */
  async getCurrentMembership(): Promise<OrganizationMember | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from('organization_members')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single();

    if (error) {
      console.error('Erro ao buscar membership:', error);
      return null;
    }

    return data as OrganizationMember;
  }

  /**
   * Atualizar organização
   */
  async updateOrganization(
    organizationId: string,
    updates: Partial<Organization>
  ): Promise<Organization> {
    const { data, error } = await supabase
      .from('organizations')
      .update(updates)
      .eq('id', organizationId)
      .select()
      .single();

    if (error) throw error;
    return data as Organization;
  }

  /**
   * Obter membros da organização
   */
  async getMembers(organizationId: string): Promise<OrganizationMember[]> {
    const { data, error } = await supabase
      .from('organization_members')
      .select(`
        *,
        profiles:user_id (
          nome,
          email,
          avatar_url
        )
      `)
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data as OrganizationMember[];
  }

  /**
   * Convidar membro para organização
   */
  async inviteMember(
    organizationId: string,
    email: string,
    role: OrganizationMember['role'] = 'member'
  ): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Usuário não autenticado');

    // Verificar se usuário existe
    const { data: existingUser } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', email)
      .single();

    if (!existingUser) {
      // TODO: Enviar convite por email para criar conta
      throw new Error('Usuário não encontrado. Implementar convite por email.');
    }

    // Adicionar como membro
    const { error } = await supabase
      .from('organization_members')
      .insert({
        organization_id: organizationId,
        user_id: existingUser.id,
        role,
        status: 'invited',
        invited_by: user.id,
        invited_at: new Date().toISOString()
      });

    if (error) throw error;
  }

  /**
   * Atualizar role de membro
   */
  async updateMemberRole(
    memberId: string,
    role: OrganizationMember['role']
  ): Promise<void> {
    const { error } = await supabase
      .from('organization_members')
      .update({ role })
      .eq('id', memberId);

    if (error) throw error;
  }

  /**
   * Remover membro da organização
   */
  async removeMember(memberId: string): Promise<void> {
    const { error } = await supabase
      .from('organization_members')
      .delete()
      .eq('id', memberId);

    if (error) throw error;
  }

  /**
   * Obter uso/quotas da organização
   */
  async getUsage(organizationId: string): Promise<OrganizationUsage | null> {
    const { data, error } = await supabase
      .from('organization_usage_stats')
      .select('*')
      .eq('organization_id', organizationId)
      .single();

    if (error) {
      console.error('Erro ao buscar uso da organização:', error);
      return null;
    }

    return data as OrganizationUsage;
  }

  /**
   * Verificar se organização atingiu limite
   */
  async checkLimits(organizationId: string): Promise<{
    users: { current: number; max: number; exceeded: boolean };
    projects: { current: number; max: number; exceeded: boolean };
    storage: { current: number; max: number; exceeded: boolean };
  }> {
    const [org, usage] = await Promise.all([
      this.getCurrentOrganization(),
      this.getUsage(organizationId)
    ]);

    if (!org || !usage) {
      throw new Error('Organização não encontrada');
    }

    return {
      users: {
        current: usage.active_users,
        max: org.max_users,
        exceeded: usage.active_users >= org.max_users
      },
      projects: {
        current: usage.total_projects,
        max: org.max_projects,
        exceeded: usage.total_projects >= org.max_projects
      },
      storage: {
        current: 0, // TODO: Implementar cálculo de storage
        max: org.max_storage_gb,
        exceeded: false
      }
    };
  }

  /**
   * Obter histórico de assinaturas
   */
  async getSubscriptionHistory(organizationId: string): Promise<SubscriptionHistory[]> {
    const { data, error } = await supabase
      .from('subscription_history')
      .select('*')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as SubscriptionHistory[];
  }

  /**
   * Verificar se assinatura está ativa
   */
  async isSubscriptionActive(organizationId?: string): Promise<boolean> {
    const org = organizationId 
      ? await supabase.from('organizations').select('*').eq('id', organizationId).single()
      : await this.getCurrentOrganization();

    if (!org) return false;

    const organization = 'data' in org ? org.data : org;
    if (!organization) return false;

    // Trial ativo
    if (organization.status === 'trial' && organization.trial_ends_at) {
      return new Date(organization.trial_ends_at) > new Date();
    }

    // Assinatura ativa
    return organization.status === 'active' && 
           organization.stripe_subscription_status === 'active';
  }

  /**
   * Obter dias restantes do trial
   */
  async getTrialDaysRemaining(): Promise<number | null> {
    const org = await this.getCurrentOrganization();
    if (!org || org.status !== 'trial' || !org.trial_ends_at) return null;

    const now = new Date();
    const trialEnd = new Date(org.trial_ends_at);
    const diffTime = trialEnd.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return diffDays > 0 ? diffDays : 0;
  }

  /**
   * Cancelar assinatura (no final do período)
   */
  async cancelSubscription(organizationId: string): Promise<void> {
    // Atualizar no banco para marcar cancelamento
    const { error } = await supabase
      .from('organizations')
      .update({
        stripe_cancel_at_period_end: true,
        updated_at: new Date().toISOString()
      })
      .eq('id', organizationId);

    if (error) throw error;

    // TODO: Chamar API Stripe para cancelar subscription
  }

  /**
   * Reativar assinatura cancelada
   */
  async reactivateSubscription(organizationId: string): Promise<void> {
    const { error } = await supabase
      .from('organizations')
      .update({
        stripe_cancel_at_period_end: false,
        updated_at: new Date().toISOString()
      })
      .eq('id', organizationId);

    if (error) throw error;

    // TODO: Chamar API Stripe para reativar subscription
  }
}

export const organizationService = new OrganizationService();
