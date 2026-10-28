/**
 * Context e Hook para gerenciar organização do usuário
 * Fornece acesso global aos dados da organização e permissões
 */

import React, { createContext, useEffect, useState, useCallback } from 'react';
import { organizationService } from '@/services/organizationService';
import type { 
  Organization, 
  OrganizationMember, 
  OrganizationContext, 
  OrganizationUsage,
  Permission 
} from '@/types/saas.types';
import { hasPermission as checkPermission } from '@/types/saas.types';

export const OrganizationContextInstance = createContext<OrganizationContext | null>(null);

export function OrganizationProvider({ children }: { children: React.ReactNode }) {
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [member, setMember] = useState<OrganizationMember | null>(null);
  const [usage, setUsage] = useState<OrganizationUsage | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshOrganization = useCallback(async () => {
    try {
      setLoading(true);
      const [org, mem] = await Promise.all([
        organizationService.getCurrentOrganization(),
        organizationService.getCurrentMembership()
      ]);

      setOrganization(org);
      setMember(mem);

      if (org) {
        const usageData = await organizationService.getUsage(org.id);
        setUsage(usageData);
      }
    } catch (error) {
      console.error('Erro ao carregar organização:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const updateOrganization = useCallback(async (updates: Partial<Organization>) => {
    if (!organization) return;

    try {
      const updated = await organizationService.updateOrganization(organization.id, updates);
      setOrganization(updated);
    } catch (error) {
      console.error('Erro ao atualizar organização:', error);
      throw error;
    }
  }, [organization]);

  const hasPermission = useCallback((permission: Permission): boolean => {
    if (!member) return false;
    return checkPermission(member.role, permission);
  }, [member]);

  const isOwner = member?.role === 'owner';
  const isAdmin = member?.role === 'owner' || member?.role === 'admin';
  const canManageBilling = isOwner || isAdmin;

  useEffect(() => {
    refreshOrganization();
  }, [refreshOrganization]);

  const value: OrganizationContext = {
    organization,
    member,
    loading,
    hasPermission,
    isOwner,
    isAdmin,
    canManageBilling,
    usage,
    refreshOrganization,
    updateOrganization
  };

  return (
    <OrganizationContextInstance.Provider value={value}>
      {children}
    </OrganizationContextInstance.Provider>
  );
}
