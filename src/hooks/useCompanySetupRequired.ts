import { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '@/store/authStore';
import { companyService } from '@/services/companyService';

interface CompanySetupStatus {
  isLoading: boolean;
  isSetupRequired: boolean;
  missingFields: string[];
  hasCompany: boolean;
}

/**
 * Hook que verifica se a empresa precisa completar o setup inicial
 * Verifica campos essenciais: company_name, email, phone (CNPJ é opcional)
 */
export function useCompanySetupRequired(): CompanySetupStatus {
  const { profile, user } = useAuthStore();
  const [status, setStatus] = useState<CompanySetupStatus>({
    isLoading: true,
    isSetupRequired: false,
    missingFields: [],
    hasCompany: false,
  });

  const checkSetupStatus = useCallback(async () => {
    if (!user || !profile) {
      setStatus({
        isLoading: false,
        isSetupRequired: false,
        missingFields: [],
        hasCompany: false,
      });
      return;
    }

    try {
      // Verificar se existe empresa cadastrada
      const company = await companyService.getMyCompany();

      if (!company) {
        // Não tem empresa = precisa fazer setup
        setStatus({
          isLoading: false,
          isSetupRequired: true,
          missingFields: ['company_name', 'email', 'phone'],
          hasCompany: false,
        });
        return;
      }

      // Verificar apenas campos essenciais obrigatórios (CNPJ removido)
      const missingFields: string[] = [];
      const requiredFields = {
        company_name: 'Razão Social',
        email: 'E-mail',
        phone: 'Telefone',
      };

      Object.entries(requiredFields).forEach(([field, label]) => {
        const value = company[field as keyof typeof company];
        if (!value || (typeof value === 'string' && value.trim() === '')) {
          missingFields.push(label);
        }
      });

      setStatus({
        isLoading: false,
        isSetupRequired: missingFields.length > 0,
        missingFields,
        hasCompany: true,
      });

    } catch (error) {
      console.error('Erro ao verificar status do setup:', error);
      // Em caso de erro, assumir que precisa fazer setup
      setStatus({
        isLoading: false,
        isSetupRequired: true,
        missingFields: ['Erro ao verificar'],
        hasCompany: false,
      });
    }
  }, [user, profile]);

  useEffect(() => {
    checkSetupStatus();
  }, [checkSetupStatus]);

  return status;
}
