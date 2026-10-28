/**
 * Hook para acessar organização do contexto
 */

import { useContext } from 'react';
import { OrganizationContextInstance } from '@/contexts/OrganizationContext';

export function useOrganization() {
  const context = useContext(OrganizationContextInstance);
  if (!context) {
    throw new Error('useOrganization must be used within OrganizationProvider');
  }
  return context;
}
