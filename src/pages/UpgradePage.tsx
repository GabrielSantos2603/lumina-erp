import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOrganization } from '../hooks/useOrganization';
import { 
  CreditCard, 
  Check, 
  ArrowLeft, 
  Zap, 
  Users, 
  HardDrive, 
  Shield,
  Star,
  TrendingUp,
  Clock
} from 'lucide-react';
import { toast } from 'react-hot-toast';

interface PricingPlan {
  id: string;
  name: string;
  price: number;
  billingPeriod: 'monthly' | 'yearly';
  description: string;
  features: string[];
  limits: {
    users: number;
    projects: number;
    storage: string;
  };
  recommended?: boolean;
  stripePriceId?: string;
}

const plans: PricingPlan[] = [
  {
    id: 'starter',
    name: 'Starter',
    price: 64.99,
    billingPeriod: 'monthly',
    description: 'Perfeito para pequenas empresas começando a crescer',
    stripePriceId: 'price_1SQgYtB4f55N6t2F7R48KbRS', // Substituir pelo ID real do Stripe
    features: [
      'Até 5 usuários',
      'Projetos ilimitados',
      '10GB de armazenamento',
      'Suporte por email',
      'Relatórios básicos',
      'Integração com calendário',
      'App mobile',
      'Backup automático'
    ],
    limits: {
      users: 5,
      projects: -1,
      storage: '10GB'
    },
    recommended: true
  }
];

export function UpgradePage() {
  const navigate = useNavigate();
  const { organization, loading } = useOrganization();
  const [loadingCheckout, setLoadingCheckout] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);

  // Verifica se está em trial
  const isInTrial = organization?.stripe_subscription_status === 'trialing';
  const trialEndsAt = organization?.trial_ends_at;
  const daysRemaining = trialEndsAt 
    ? Math.max(0, Math.ceil((new Date(trialEndsAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : 0;

  const handleSubscribe = async (plan: PricingPlan) => {
    if (!organization) {
      toast.error('Organização não encontrada');
      return;
    }

    setSelectedPlan(plan.id);
    setLoadingCheckout(true);

    try {
      // Chama a Edge Function para criar sessão de checkout
      const response = await fetch('/api/stripe/create-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          organizationId: organization.id,
          priceId: plan.stripePriceId,
          successUrl: `${window.location.origin}/settings/billing?success=true`,
          cancelUrl: `${window.location.origin}/upgrade?canceled=true`
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erro ao criar checkout');
      }

      const { checkoutUrl } = await response.json();
      
      // Redireciona para o Stripe Checkout
      window.location.href = checkoutUrl;
    } catch (error) {
      console.error('Erro ao criar checkout:', error);
      toast.error(
        error instanceof Error 
          ? error.message 
          : 'Erro ao processar pagamento. Tente novamente.'
      );
      setLoadingCheckout(false);
      setSelectedPlan(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <button
            onClick={() => navigate('/')}
            className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Voltar para Dashboard
          </button>
        </div>
      </div>

      {/* Trial Alert */}
      {isInTrial && daysRemaining > 0 && (
        <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-center">
              <Clock className="w-5 h-5 mr-3" />
              <p className="font-medium">
                {daysRemaining === 1 
                  ? '⚠️ Último dia do seu período de teste!'
                  : `Faltam ${daysRemaining} dias para seu trial expirar`}
              </p>
            </div>
          </div>
        </div>
      )}

      {isInTrial && daysRemaining === 0 && (
        <div className="bg-red-600 text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-center">
              <Shield className="w-5 h-5 mr-3" />
              <p className="font-medium">
                🎉 Seu período de teste de 14 dias acabou! Escolha um plano para continuar.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <div className="inline-flex items-center bg-indigo-100 text-indigo-700 px-4 py-2 rounded-full text-sm font-medium mb-6">
          <Star className="w-4 h-4 mr-2" />
          Planos e Preços
        </div>
        
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
          Comece agora com o Lumina ERP
        </h1>
        
        <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
          Plano completo por apenas R$ 64,99/mês. Teste grátis por 14 dias, cancele quando quiser.
        </p>

        {/* Benefits */}
        <div className="flex flex-wrap justify-center gap-6 mb-12">
          <div className="flex items-center text-gray-700">
            <Zap className="w-5 h-5 text-indigo-600 mr-2" />
            <span>Configuração instantânea</span>
          </div>
          <div className="flex items-center text-gray-700">
            <Shield className="w-5 h-5 text-indigo-600 mr-2" />
            <span>Pagamento seguro</span>
          </div>
          <div className="flex items-center text-gray-700">
            <TrendingUp className="w-5 h-5 text-indigo-600 mr-2" />
            <span>Sem contrato de longo prazo</span>
          </div>
        </div>
      </div>

      {/* Pricing Card */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
        <div className="max-w-md mx-auto">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className="relative bg-white rounded-2xl shadow-xl overflow-hidden border-2 border-indigo-600"
            >

              <div className="p-8">
                {/* Plan Header */}
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  {plan.name}
                </h3>
                <p className="text-gray-600 mb-6 min-h-[48px]">
                  {plan.description}
                </p>

                {/* Price */}
                <div className="mb-6">
                  <div className="flex items-baseline">
                    <span className="text-5xl font-bold text-gray-900">
                      R$ {plan.price.toFixed(2).replace('.', ',')}
                    </span>
                    <span className="ml-2 text-gray-600">/mês</span>
                  </div>
                </div>

                {/* CTA Button */}
                <button
                  onClick={() => handleSubscribe(plan)}
                  disabled={loadingCheckout}
                  className={`w-full py-3 px-6 rounded-lg font-semibold transition-all ${
                    plan.recommended
                      ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-700 hover:to-purple-700'
                      : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                  } ${
                    loadingCheckout && selectedPlan === plan.id
                      ? 'opacity-50 cursor-not-allowed'
                      : ''
                  }`}
                >
                  {loadingCheckout && selectedPlan === plan.id ? (
                    <span className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Processando...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center">
                      <CreditCard className="w-5 h-5 mr-2" />
                      Começar Agora - 14 Dias Grátis
                    </span>
                  )}
                </button>

                {/* Limits */}
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <div className="space-y-3 mb-6">
                    <div className="flex items-center text-sm text-gray-700">
                      <Users className="w-4 h-4 mr-2 text-indigo-600" />
                      <span>
                        {plan.limits.users === -1 ? 'Usuários ilimitados' : `Até ${plan.limits.users} usuários`}
                      </span>
                    </div>
                    <div className="flex items-center text-sm text-gray-700">
                      <TrendingUp className="w-4 h-4 mr-2 text-indigo-600" />
                      <span>Projetos ilimitados</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-700">
                      <HardDrive className="w-4 h-4 mr-2 text-indigo-600" />
                      <span>{plan.limits.storage} de armazenamento</span>
                    </div>
                  </div>

                  {/* Features */}
                  <ul className="space-y-3">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-start">
                        <Check className="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                        <span className="text-sm text-gray-700">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* FAQ / Additional Info */}
        <div className="mt-16 text-center">
          <div className="bg-indigo-50 rounded-xl p-8 mb-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              💡 Por que escolher o Lumina ERP?
            </h3>
            <div className="grid md:grid-cols-3 gap-6 mt-6">
              <div>
                <div className="text-3xl mb-2">🚀</div>
                <h4 className="font-semibold text-gray-900 mb-1">Comece em minutos</h4>
                <p className="text-sm text-gray-600">Setup instantâneo, sem complicação</p>
              </div>
              <div>
                <div className="text-3xl mb-2">🔒</div>
                <h4 className="font-semibold text-gray-900 mb-1">100% Seguro</h4>
                <p className="text-sm text-gray-600">Seus dados protegidos e criptografados</p>
              </div>
              <div>
                <div className="text-3xl mb-2">💰</div>
                <h4 className="font-semibold text-gray-900 mb-1">Melhor custo-benefício</h4>
                <p className="text-sm text-gray-600">Todos os recursos por R$ 64,99/mês</p>
              </div>
            </div>
          </div>
          
          <p className="text-gray-600 mb-4">
            Precisa de um plano personalizado para sua empresa?
          </p>
          <div className="flex justify-center gap-6">
            <a
              href="mailto:contato@luminaerp.com"
              className="text-indigo-600 hover:text-indigo-700 font-medium"
            >
              Falar com Vendas
            </a>
            <a
              href="/faq"
              className="text-gray-600 hover:text-gray-900 font-medium"
            >
              Perguntas Frequentes
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
