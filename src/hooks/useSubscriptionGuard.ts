import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOrganization } from './useOrganization';
import { toast } from 'react-hot-toast';

interface UseSubscriptionGuardOptions {
  /**
   * Se true, redireciona automaticamente para /upgrade quando trial expirar
   * @default true
   */
  redirect?: boolean;
  /**
   * Se true, mostra toast de aviso quando trial expirar
   * @default true
   */
  showToast?: boolean;
  /**
   * Intervalo em ms para verificar status da assinatura
   * @default 60000 (1 minuto)
   */
  checkInterval?: number;
  /**
   * Rotas que não devem redirecionar (ex: /upgrade, /settings/billing)
   */
  excludedRoutes?: string[];
}

/**
 * Hook para proteger rotas e funcionalidades baseado no status da assinatura
 * 
 * @example
 * // Uso básico - redireciona automaticamente se trial expirado
 * function ProtectedPage() {
 *   const { isActive, isTrialExpired, daysRemaining } = useSubscriptionGuard();
 *   
 *   if (!isActive) return <UpgradeRequired />;
 *   return <div>Conteúdo protegido</div>;
 * }
 * 
 * @example
 * // Uso avançado - apenas verifica sem redirecionar
 * function FeatureButton() {
 *   const { isActive, blockAction } = useSubscriptionGuard({ redirect: false });
 *   
 *   const handleClick = () => {
 *     if (blockAction()) return;
 *     // Executar ação
 *   };
 * }
 */
export function useSubscriptionGuard(options: UseSubscriptionGuardOptions = {}) {
  const {
    redirect = true,
    showToast = true,
    checkInterval = 60000, // 1 minuto
    excludedRoutes = ['/upgrade', '/settings/billing', '/auth/login']
  } = options;

  const navigate = useNavigate();
  const { organization, loading } = useOrganization();

  // Verifica se a assinatura está ativa
  const isActive = !loading && organization && (
    organization.stripe_subscription_status === 'active' ||
    organization.stripe_subscription_status === 'trialing' ||
    (organization.trial_ends_at && new Date(organization.trial_ends_at) > new Date())
  );

  // Verifica se o trial expirou
  const isTrialExpired = !loading && organization && 
    organization.stripe_subscription_status === 'trialing' &&
    organization.trial_ends_at && 
    new Date(organization.trial_ends_at) <= new Date();

  // Calcula dias restantes do trial
  const daysRemaining = organization?.trial_ends_at
    ? Math.max(0, Math.ceil((new Date(organization.trial_ends_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : 0;

  // Status da assinatura
  const subscriptionStatus = organization?.stripe_subscription_status || 'inactive';

  // Verifica se está em trial
  const isInTrial = subscriptionStatus === 'trialing' && daysRemaining > 0;

  // Função para bloquear ação se assinatura inativa
  const blockAction = (customMessage?: string): boolean => {
    if (isActive) return false;

    const message = customMessage || 
      (isTrialExpired 
        ? 'Seu período de teste expirou. Faça upgrade para continuar usando o Lumina ERP.'
        : 'Assinatura inativa. Por favor, atualize sua assinatura.');

    if (showToast) {
      toast.error(message, {
        duration: 5000
      });
    }

    return true;
  };

  // Efeito para verificar status periodicamente
  useEffect(() => {
    if (loading || !organization) return;

    // Verifica se deve redirecionar
    const shouldRedirect = redirect && 
      !isActive && 
      !excludedRoutes.some(route => window.location.pathname.startsWith(route));

    if (shouldRedirect) {
      if (showToast) {
        toast.error(
          isTrialExpired 
            ? 'Seu período de teste de 14 dias expirou! 🎉\n\nFaça upgrade agora para continuar aproveitando o Lumina ERP.'
            : 'Sua assinatura está inativa. Por favor, atualize seu plano.',
          {
            duration: 7000,
            icon: '⚠️'
          }
        );
      }
      navigate('/upgrade', { replace: true });
      return;
    }

    // Configura verificação periódica
    const interval = setInterval(() => {
      // Recarrega a página se a assinatura expirou durante o uso
      if (!isActive && !excludedRoutes.some(route => window.location.pathname.startsWith(route))) {
        window.location.reload();
      }
    }, checkInterval);

    return () => clearInterval(interval);
  }, [loading, organization, isActive, isTrialExpired, redirect, showToast, checkInterval, navigate, excludedRoutes]);

  // Aviso quando faltam 3 dias ou menos
  useEffect(() => {
    if (isInTrial && daysRemaining <= 3 && daysRemaining > 0 && showToast) {
      toast(
        `⏰ Faltam apenas ${daysRemaining} dia${daysRemaining > 1 ? 's' : ''} para seu trial expirar!\n\nFaça upgrade agora e garanta acesso ilimitado.`,
        {
          duration: 6000,
          icon: '🎯'
        }
      );
    }
  }, [isInTrial, daysRemaining, showToast]);

  return {
    /** Se a assinatura está ativa (trial válido ou assinatura paga) */
    isActive,
    /** Se o trial expirou */
    isTrialExpired,
    /** Se está em período de trial válido */
    isInTrial,
    /** Dias restantes do trial */
    daysRemaining,
    /** Status da assinatura Stripe */
    subscriptionStatus,
    /** Status legível em português */
    statusLabel: getStatusLabel(subscriptionStatus),
    /** Bloqueia uma ação se assinatura inativa - retorna true se bloqueou */
    blockAction,
    /** Se ainda está carregando */
    loading,
    /** Organização atual */
    organization
  };
}

function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    active: 'Ativo',
    trialing: 'Em Trial',
    past_due: 'Pagamento Pendente',
    canceled: 'Cancelado',
    unpaid: 'Não Pago',
    incomplete: 'Incompleto',
    incomplete_expired: 'Expirado',
    inactive: 'Inativo'
  };
  return labels[status] || 'Desconhecido';
}
