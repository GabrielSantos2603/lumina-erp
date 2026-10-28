import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, X, Zap, CreditCard } from 'lucide-react';
import { useOrganization } from '../hooks/useOrganization';

/**
 * Banner que mostra o status da assinatura/trial no topo da aplicação
 * Exibe informações diferentes baseado no estado:
 * - Trial ativo: Mostra dias restantes
 * - Trial expirando (3 dias ou menos): Alerta laranja
 * - Trial expirado: Alerta vermelho
 * - Assinatura ativa: Não exibe nada
 */
export function SubscriptionBanner() {
  const navigate = useNavigate();
  const { organization, loading } = useOrganization();
  const [isDismissed, setIsDismissed] = useState(false);

  // Reset dismissed state quando mudar de organização
  useEffect(() => {
    setIsDismissed(false);
  }, [organization?.id]);

  if (loading || !organization || isDismissed) {
    return null;
  }

  const status = organization.stripe_subscription_status;
  const trialEndsAt = organization.trial_ends_at;
  
  // Não exibe nada se a assinatura está ativa
  if (status === 'active' && !trialEndsAt) {
    return null;
  }

  const now = new Date();
  const trialEndDate = trialEndsAt ? new Date(trialEndsAt) : null;
  const daysRemaining = trialEndDate 
    ? Math.max(0, Math.ceil((trialEndDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
    : 0;

  const isInTrial = status === 'trialing' && daysRemaining > 0;
  const isTrialExpiring = isInTrial && daysRemaining <= 3;
  const isTrialExpired = daysRemaining === 0 && (status === 'trialing' || status === 'inactive');
  const isPastDue = status === 'past_due';

  // Não exibe nada se não está em trial e não tem problema
  if (!isInTrial && !isTrialExpired && !isPastDue) {
    return null;
  }

  // Define estilo e conteúdo baseado no estado
  let bgColor = 'bg-blue-600';
  let icon = <Clock className="w-5 h-5" />;
  let message = '';
  let ctaText = 'Ver Planos';
  let showCTA = true;

  if (isTrialExpired) {
    bgColor = 'bg-red-600';
    icon = <Zap className="w-5 h-5" />;
    message = '🎉 Seu período de teste expirou! Faça upgrade agora para continuar aproveitando o Lumina ERP.';
    ctaText = 'Fazer Upgrade Agora';
  } else if (isPastDue) {
    bgColor = 'bg-orange-600';
    icon = <CreditCard className="w-5 h-5" />;
    message = '⚠️ Pagamento pendente. Por favor, atualize suas informações de pagamento para evitar interrupção do serviço.';
    ctaText = 'Atualizar Pagamento';
  } else if (isTrialExpiring) {
    bgColor = 'bg-orange-600';
    icon = <Clock className="w-5 h-5 animate-pulse" />;
    message = `⏰ Faltam apenas ${daysRemaining} dia${daysRemaining > 1 ? 's' : ''} para seu trial expirar! Não perca acesso aos seus dados.`;
    ctaText = 'Garantir Acesso';
  } else if (isInTrial) {
    bgColor = 'bg-indigo-600';
    icon = <Clock className="w-5 h-5" />;
    message = `Você está em período de teste. Faltam ${daysRemaining} dia${daysRemaining > 1 ? 's' : ''} para escolher um plano.`;
    ctaText = 'Ver Planos';
    showCTA = daysRemaining <= 7; // Só mostra CTA nos últimos 7 dias
  }

  const handleCTA = () => {
    if (isPastDue) {
      navigate('/settings/billing');
    } else {
      navigate('/upgrade');
    }
  };

  return (
    <div className={`${bgColor} text-white shadow-lg`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between py-3">
          {/* Mensagem */}
          <div className="flex items-center flex-1 min-w-0">
            <div className="flex-shrink-0">
              {icon}
            </div>
            <p className="ml-3 font-medium text-sm truncate">
              {message}
            </p>
          </div>

          {/* CTA + Dismiss */}
          <div className="flex items-center ml-4 flex-shrink-0 space-x-4">
            {showCTA && (
              <button
                onClick={handleCTA}
                className="bg-white text-gray-900 hover:bg-gray-100 px-4 py-2 rounded-lg text-sm font-semibold transition-colors shadow-sm"
              >
                {ctaText}
              </button>
            )}
            
            {/* Botão de fechar (não disponível para trial expirado ou past_due) */}
            {!isTrialExpired && !isPastDue && (
              <button
                onClick={() => setIsDismissed(true)}
                className="text-white hover:text-gray-200 transition-colors"
                aria-label="Dispensar"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Barra de progresso para trial */}
      {isInTrial && (
        <div className="h-1 bg-white bg-opacity-20">
          <div
            className="h-full bg-white transition-all duration-1000"
            style={{
              width: `${Math.max(0, Math.min(100, (daysRemaining / 14) * 100))}%`
            }}
          />
        </div>
      )}
    </div>
  );
}
