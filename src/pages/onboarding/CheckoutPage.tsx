import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft,
  Check,
  CreditCard,
  Shield,
  Lock,
  AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';

interface PlanDetails {
  id: string;
  name: string;
  price: number;
  description: string;
  features: string[];
}

const PLANS: Record<string, PlanDetails> = {
  starter: {
    id: 'starter',
    name: 'Starter',
    price: 64.99,
    description: 'Para pequenas equipes começando',
    features: [
      'Até 5 usuários simultâneos',
      '50 projetos ativos',
      '10GB de armazenamento',
      'Controle financeiro completo',
      'Suporte por email (48h)',
      'Backup semanal',
      'Relatórios básicos',
      'App mobile incluído'
    ]
  },
  professional: {
    id: 'professional',
    name: 'Professional',
    price: 129.99,
    description: 'Para equipes em crescimento',
    features: [
      'Até 15 usuários simultâneos',
      'Projetos ilimitados',
      '50GB de armazenamento',
      'Controle financeiro avançado',
      'Suporte prioritário (24h)',
      'Backup diário',
      'Relatórios avançados + BI',
      'App mobile incluído',
      'Integrações API',
      'Personalização de marca',
      'Múltiplas empresas'
    ]
  },
  enterprise: {
    id: 'enterprise',
    name: 'Enterprise',
    price: 299.99,
    description: 'Para grandes organizações',
    features: [
      'Usuários ilimitados',
      'Projetos ilimitados',
      '200GB de armazenamento',
      'Controle financeiro completo',
      'Suporte 24/7 + telefone',
      'Backup em tempo real',
      'Relatórios customizados + BI',
      'App mobile white-label',
      'API completa',
      'Customização total',
      'Múltiplas empresas',
      'SLA garantido 99.9%',
      'Treinamento dedicado',
      'Gerente de conta'
    ]
  }
};

export function CheckoutPage() {
  const navigate = useNavigate();
  const { planId } = useParams<{ planId: string }>();
  const { user, profile } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState<PlanDetails | null>(null);

  useEffect(() => {
    if (!planId || !PLANS[planId]) {
      toast.error('Plano inválido');
      navigate('/upgrade');
      return;
    }
    setPlan(PLANS[planId]);
  }, [planId, navigate]);

  const handleCheckout = async () => {
    if (!user || !profile || !plan) {
      toast.error('Você precisa estar logado');
      navigate('/login');
      return;
    }

    setLoading(true);

    try {
      toast.loading('Criando sessão de pagamento...', { id: 'checkout' });

      // Chamar Supabase Edge Function para criar Checkout Session
      const { data, error } = await supabase.functions.invoke('create-checkout-session', {
        body: {
          planId: plan.id,
          userId: user.id,
          email: user.email,
        }
      });

      if (error) throw error;

      if (data?.url) {
        // Redirecionar para Stripe Checkout
        window.location.href = data.url;
      } else {
        throw new Error('URL de checkout não recebida');
      }

    } catch (error: unknown) {
      console.error('Erro no checkout:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro ao processar pagamento';
      toast.error(errorMessage, { id: 'checkout' });
      setLoading(false);
    }
  };

  if (!plan) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-lumina-50 via-white to-lumina-100 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-lumina-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-lumina-50 via-white to-lumina-100 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 p-4">
      <div className="max-w-4xl mx-auto py-12">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate('/upgrade')}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar para planos
          </Button>

          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Finalizar Compra
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Você está a um passo de desbloquear todo o potencial do Lumina AI ERP
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Resumo do Plano - 2/3 */}
          <div className="md:col-span-2 space-y-6">
            {/* Plan Summary */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-2xl">{plan.name}</CardTitle>
                    <CardDescription>{plan.description}</CardDescription>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold text-gray-900 dark:text-white">
                      R$ {plan.price.toFixed(2)}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      por mês
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
                    O que está incluído:
                  </h3>
                  <div className="grid grid-cols-1 gap-2">
                    {plan.features.map((feature, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-lumina-600 dark:text-lumina-400 flex-shrink-0" />
                        <span className="text-sm text-gray-700 dark:text-gray-300">
                          {feature}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Payment Info */}
            <Card className="border-lumina-200 dark:border-lumina-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Pagamento Seguro
                </CardTitle>
                <CardDescription>
                  Processado pelo Stripe - a plataforma de pagamento mais confiável do mundo
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                        🎉 14 Dias Grátis + Plano Starter
                      </p>
                      <p className="text-xs text-blue-700 dark:text-blue-300">
                        Teste por 14 dias sem pagar nada! Após o período de teste, cobrança de R$ 64,99/mês.
                        Cancele quando quiser durante o trial, sem cobranças.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <Shield className="h-4 w-4" />
                    <span>Seus dados estão protegidos com criptografia SSL</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <Lock className="h-4 w-4" />
                    <span>Processamento PCI DSS Level 1 compliant</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <AlertCircle className="h-4 w-4" />
                    <span>14 dias grátis - Cancele antes e não pague nada</span>
                  </div>
                </div>

                <Button
                  onClick={handleCheckout}
                  disabled={loading}
                  className="w-full bg-lumina-600 hover:bg-lumina-700 text-white"
                  size="lg"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                      Processando...
                    </>
                  ) : (
                    <>
                      Continuar para Pagamento
                      <ArrowLeft className="ml-2 h-4 w-4 rotate-180" />
                    </>
                  )}
                </Button>

                <p className="text-xs text-center text-gray-500 dark:text-gray-400">
                  Ao continuar, você concorda com nossos{' '}
                  <a href="/terms" className="text-lumina-600 hover:underline">
                    Termos de Serviço
                  </a>
                  {' '}e{' '}
                  <a href="/privacy" className="text-lumina-600 hover:underline">
                    Política de Privacidade
                  </a>
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar - 1/3 */}
          <div className="space-y-6">
            {/* Price Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Resumo</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">
                      Plano Starter (5 usuários)
                    </span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      R$ {plan.price.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">
                      Cobrança
                    </span>
                    <Badge variant="secondary" className="text-xs">
                      Mensal
                    </Badge>
                  </div>
                </div>

                <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                  <div className="flex justify-between mb-2">
                    <span className="font-semibold text-gray-900 dark:text-white">
                      Total Hoje
                    </span>
                    <span className="text-2xl font-bold text-green-600 dark:text-green-400">
                      R$ 0,00
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                    🎉 Teste grátis por 14 dias
                  </p>
                </div>

                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 space-y-1">
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    Após 14 dias, cobrança de R$ {plan.price.toFixed(2)}/mês
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    💳 Próxima cobrança em 14 dias
                  </p>
                </div>

                <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-3 mt-4">
                  <p className="text-xs text-blue-900 dark:text-blue-100">
                    ✨ <strong>Trial Grátis:</strong> Teste todas as funcionalidades por 14 dias sem compromisso. Cancele antes do término e não pague nada!
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Benefits */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Por que escolher?</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-lumina-600 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    Cancele quando quiser
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-lumina-600 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    Suporte técnico incluído
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-lumina-600 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    Atualizações automáticas
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-lumina-600 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    99.9% de uptime
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
