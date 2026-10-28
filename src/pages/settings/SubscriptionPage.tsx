import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useOrganization } from "@/hooks/useOrganization";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { DynamicContainer } from "@/components/responsive";
import {
  ArrowLeft,
  CreditCard,
  Calendar,
  Crown,
  AlertCircle,
  ExternalLink,
  CheckCircle,
  XCircle,
  Clock,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";

export function SubscriptionPage() {
  const navigate = useNavigate();
  const { organization, loading } = useOrganization();
  const [loadingPortal, setLoadingPortal] = useState(false);

  // Calcular dias restantes
  const getDaysRemaining = (dateString: string | null) => {
    if (!dateString) return 0;
    return Math.max(0, Math.ceil((new Date(dateString).getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
  };

  const trialDays = organization?.trial_ends_at ? getDaysRemaining(organization.trial_ends_at) : 0;
  const daysUntilNextBilling = organization?.stripe_current_period_end 
    ? getDaysRemaining(organization.stripe_current_period_end) 
    : 0;

  const isTrialing = organization?.status === 'trial';
  const isActive = organization?.status === 'active';
  const isCancelled = organization?.stripe_cancel_at_period_end;

  // Abrir Stripe Customer Portal
  const handleManageSubscription = async () => {
    if (!organization?.stripe_customer_id) {
      toast.error('Você não possui uma assinatura ativa');
      return;
    }

    setLoadingPortal(true);

    try {
      const { data, error } = await supabase.functions.invoke('create-customer-portal', {
        body: {
          customerId: organization.stripe_customer_id,
          returnUrl: window.location.href,
        },
      });

      if (error) throw error;

      if (data?.url) {
        // Redirecionar para o Stripe Customer Portal
        window.location.href = data.url;
      } else {
        throw new Error('URL do portal não retornada');
      }
    } catch (error) {
      console.error('Erro ao abrir portal:', error);
      toast.error('Erro ao abrir portal de gerenciamento. Tente novamente.');
      setLoadingPortal(false);
    }
  };

  if (loading) {
    return (
      <DynamicContainer className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-lumina-600"></div>
      </DynamicContainer>
    );
  }

  return (
    <DynamicContainer>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/settings')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
        </div>

        <div>
          <h1 className="text-3xl font-bold text-foreground">Assinatura</h1>
          <p className="text-muted-foreground mt-1">
            Gerencie sua assinatura e métodos de pagamento
          </p>
        </div>

        {/* Alert de Trial */}
        {isTrialing && trialDays > 0 && (
          <Alert className="border-blue-200 bg-blue-50 dark:bg-blue-950 dark:border-blue-800">
            <Sparkles className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            <AlertDescription className="text-blue-900 dark:text-blue-100">
              <strong>🎉 Você está em período de teste grátis!</strong>
              <br />
              Faltam <strong>{trialDays} dias</strong> para o fim do trial. Após isso, você será cobrado automaticamente.
              Cancele antes se não quiser continuar.
            </AlertDescription>
          </Alert>
        )}

        {/* Alert de Cancelamento Pendente */}
        {isCancelled && (
          <Alert className="border-amber-200 bg-amber-50 dark:bg-amber-950 dark:border-amber-800">
            <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            <AlertDescription className="text-amber-900 dark:text-amber-100">
              <strong>⚠️ Assinatura Cancelada</strong>
              <br />
              Seu acesso continuará até <strong>{organization?.stripe_current_period_end ? new Date(organization.stripe_current_period_end).toLocaleDateString('pt-BR') : 'N/A'}</strong>.
              Após essa data, você perderá acesso ao sistema.
            </AlertDescription>
          </Alert>
        )}

        <div className="grid gap-6 md:grid-cols-2">
          {/* Card de Plano Atual */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Crown className="h-5 w-5 text-lumina-600 dark:text-lumina-400" />
                Plano Atual
              </CardTitle>
              <CardDescription>Informações do seu plano de assinatura</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Plano:</span>
                <Badge variant="default" className="gap-1">
                  <Crown className="h-3 w-3" />
                  {organization?.plan === 'starter' ? 'Starter' :
                   organization?.plan === 'professional' ? 'Professional' :
                   organization?.plan === 'enterprise' ? 'Enterprise' : 'Trial'}
                </Badge>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Status:</span>
                <Badge
                  variant={
                    isActive && !isCancelled ? 'default' :
                    isTrialing ? 'secondary' :
                    'destructive'
                  }
                >
                  {isActive && !isCancelled ? (
                    <><CheckCircle className="h-3 w-3 mr-1" /> Ativo</>
                  ) : isTrialing ? (
                    <><Sparkles className="h-3 w-3 mr-1" /> Trial</>
                  ) : isCancelled ? (
                    <><XCircle className="h-3 w-3 mr-1" /> Cancelado</>
                  ) : (
                    <><XCircle className="h-3 w-3 mr-1" /> Inativo</>
                  )}
                </Badge>
              </div>

              {organization?.subscription_price && organization.subscription_price > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Valor:</span>
                  <span className="text-lg font-semibold text-lumina-600 dark:text-lumina-400">
                    R$ {organization.subscription_price.toFixed(2)}/mês
                  </span>
                </div>
              )}

              <div className="pt-4 border-t">
                <div className="space-y-2 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>{organization?.max_users || 5} usuários</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>{organization?.max_projects || 50} projetos</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>{organization?.max_storage_gb || 10}GB de armazenamento</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Card de Cobrança */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-lumina-600 dark:text-lumina-400" />
                Próxima Cobrança
              </CardTitle>
              <CardDescription>Informações sobre pagamentos</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {isTrialing ? (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Trial termina em:</span>
                    <Badge variant="secondary" className="gap-1">
                      <Clock className="h-3 w-3" />
                      {trialDays} dias
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Primeira cobrança:</span>
                    <span className="font-medium">
                      {organization?.trial_ends_at 
                        ? new Date(organization.trial_ends_at).toLocaleDateString('pt-BR')
                        : 'N/A'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Valor:</span>
                    <span className="text-lg font-semibold text-lumina-600 dark:text-lumina-400">
                      R$ {organization?.subscription_price?.toFixed(2) || '64,99'}
                    </span>
                  </div>
                </>
              ) : isActive ? (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      {isCancelled ? 'Acesso até:' : 'Próxima cobrança em:'}
                    </span>
                    <Badge variant={isCancelled ? 'destructive' : 'default'} className="gap-1">
                      <Clock className="h-3 w-3" />
                      {daysUntilNextBilling} dias
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Data:</span>
                    <span className="font-medium">
                      {organization?.stripe_current_period_end 
                        ? new Date(organization.stripe_current_period_end).toLocaleDateString('pt-BR')
                        : 'N/A'}
                    </span>
                  </div>
                  {!isCancelled && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Valor:</span>
                      <span className="text-lg font-semibold text-lumina-600 dark:text-lumina-400">
                        R$ {organization?.subscription_price?.toFixed(2) || '64,99'}
                      </span>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <XCircle className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Nenhuma assinatura ativa</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Card de Gerenciamento */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-lumina-600 dark:text-lumina-400" />
              Gerenciar Assinatura
            </CardTitle>
            <CardDescription>
              Atualize método de pagamento, cancele ou reative sua assinatura
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 space-y-3">
              <p className="text-sm text-muted-foreground">
                No portal de gerenciamento você pode:
              </p>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Cancelar sua assinatura (acesso continua até fim do período)</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Reativar assinatura cancelada (sem nova cobrança)</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Atualizar método de pagamento (cartão de crédito)</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Visualizar e baixar faturas anteriores</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Atualizar informações de cobrança</span>
                </li>
              </ul>
            </div>

            <Button
              onClick={handleManageSubscription}
              disabled={loadingPortal || !organization?.stripe_customer_id}
              className="w-full bg-lumina-600 hover:bg-lumina-700 text-white"
              size="lg"
            >
              {loadingPortal ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Abrindo portal...
                </>
              ) : (
                <>
                  Gerenciar Assinatura
                  <ExternalLink className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>

            <p className="text-xs text-center text-muted-foreground">
              Você será redirecionado para o portal seguro do Stripe
            </p>
          </CardContent>
        </Card>

        {/* Avisos Importantes */}
        <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950 dark:border-blue-800">
          <CardHeader>
            <CardTitle className="text-blue-900 dark:text-blue-100 flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Informações Importantes
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-blue-900 dark:text-blue-100">
            <p>
              <strong>💡 Cancelamento durante o trial:</strong> Se você cancelar durante os 14 dias de teste,
              não será cobrado. Seu acesso continua até o fim do período de trial.
            </p>
            <p>
              <strong>💡 Cancelamento após o trial:</strong> Se você cancelar após ser cobrado, não haverá
              reembolso, mas você poderá usar o sistema até o fim do período pago (30 dias).
            </p>
            <p>
              <strong>💡 Reativação:</strong> Você pode reativar uma assinatura cancelada antes do fim do
              período sem nova cobrança imediata.
            </p>
          </CardContent>
        </Card>
      </div>
    </DynamicContainer>
  );
}
