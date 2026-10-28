import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Check, 
  CreditCard,
  ArrowLeft,
  Building2,
  Users,
  FolderKanban,
  Zap,
  Shield,
  HeadphonesIcon,
  CloudUpload,
  TrendingUp,
  Star
} from 'lucide-react';
import { toast } from 'sonner';

interface Plan {
  id: string;
  name: string;
  price: number;
  description: string;
  popular?: boolean;
  features: string[];
  limits: {
    users: number;
    projects: number;
    storage: string;
  };
}

export function UpgradePage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  // Apenas o plano Starter disponível
  const plan: Plan = {
    id: 'starter',
    name: 'Starter',
    price: 64.99,
    description: 'Ideal para pequenas equipes de até 5 pessoas',
    popular: true,
    features: [
      'Até 5 usuários simultâneos',
      '50 projetos ativos',
      '10GB de armazenamento',
      'Controle financeiro completo',
      'Gestão de clientes e projetos',
      'Calendário e reuniões',
      'Suporte por email (48h)',
      'Backup semanal automático',
      'Relatórios básicos',
      'App mobile incluído'
    ],
    limits: {
      users: 5,
      projects: 50,
      storage: '10GB'
    }
  };

  const handleSelectPlan = async (planId: string) => {
    setLoading(true);

    try {
      // TODO: Integração com gateway de pagamento
      // Por enquanto, apenas simula a seleção
      toast.success('Plano selecionado! Redirecionando para pagamento...');
      
      // Simular delay de processamento
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Navegar para página de checkout (a ser criada)
      navigate(`/checkout/${planId}`);
    } catch (error) {
      console.error('Erro ao selecionar plano:', error);
      toast.error('Erro ao processar. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-lumina-50 via-white to-purple-50 dark:from-gray-950 dark:via-gray-900 dark:to-purple-950 p-4">
      <div className="max-w-7xl mx-auto py-12">
        {/* Header */}
        <div className="text-center mb-12 space-y-4">
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Button>

          <div className="flex justify-center">
            <div className="h-16 w-16 rounded-2xl bg-lumina-500 flex items-center justify-center shadow-lg">
              <Building2 className="h-10 w-10 text-white" />
            </div>
          </div>

          <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
            Plano Starter - Lumina AI ERP
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Teste grátis por 14 dias! Depois apenas R$ 64,99/mês. Cancele quando quiser.
          </p>
          
          <div className="bg-blue-100 dark:bg-blue-900 border border-blue-300 dark:border-blue-700 rounded-lg p-3 max-w-2xl mx-auto mt-4">
            <p className="text-sm text-blue-900 dark:text-blue-100">
              🎉 <strong>14 Dias Grátis:</strong> Experimente todas as funcionalidades sem compromisso. Cancele antes e não pague nada!
            </p>
          </div>
        </div>

        {/* Plan Card - Centralizado */}
        <div className="max-w-xl mx-auto mb-12">
          <Card className="relative border-2 border-lumina-500 shadow-2xl">
            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
              <Badge className="bg-gradient-to-r from-lumina-500 to-purple-600 text-white px-6 py-1.5 text-sm">
                <Star className="h-4 w-4 mr-1" />
                Único Plano Disponível
              </Badge>
            </div>

            <CardHeader className="text-center pb-6 pt-8">
              <CardTitle className="text-3xl mb-2">{plan.name}</CardTitle>
              <CardDescription className="text-base mb-4">{plan.description}</CardDescription>
              
              <div className="flex items-baseline justify-center gap-1 mb-6">
                <span className="text-5xl font-bold text-gray-900 dark:text-white">
                  R$ {plan.price.toFixed(2)}
                </span>
                <span className="text-lg text-gray-600 dark:text-gray-400">/mês</span>
              </div>

              <div className="p-4 bg-lumina-50 dark:bg-lumina-900/30 rounded-xl">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <Users className="h-6 w-6 mx-auto mb-2 text-lumina-600 dark:text-lumina-400" />
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {plan.limits.users}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">usuários</p>
                  </div>
                  <div>
                    <FolderKanban className="h-6 w-6 mx-auto mb-2 text-lumina-600 dark:text-lumina-400" />
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {plan.limits.projects}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">projetos</p>
                  </div>
                  <div>
                    <CloudUpload className="h-6 w-6 mx-auto mb-2 text-lumina-600 dark:text-lumina-400" />
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {plan.limits.storage}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">storage</p>
                  </div>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-6">
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-4 text-center">
                  Tudo que você precisa para gerenciar sua empresa:
                </h3>
                <div className="grid md:grid-cols-2 gap-3">
                  {plan.features.map((feature, index) => (
                    <div key={index} className="flex items-start gap-2">
                      <Check className="h-5 w-5 text-lumina-600 dark:text-lumina-400 flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        {feature}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <Button
                onClick={() => handleSelectPlan(plan.id)}
                disabled={loading}
                className="w-full bg-gradient-to-r from-lumina-600 to-purple-600 hover:from-lumina-700 hover:to-purple-700 text-white"
                size="lg"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2" />
                    Processando...
                  </>
                ) : (
                  <>
                    Começar 14 Dias Grátis
                    <CreditCard className="ml-2 h-5 w-5" />
                  </>
                )}
              </Button>
              
              <p className="text-xs text-center text-gray-500 dark:text-gray-400">
                Sem cobrança hoje • Cancele quando quiser • R$ {plan.price.toFixed(2)}/mês após trial
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Benefits Section */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 mb-8 max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-center text-gray-900 dark:text-white mb-8">
            Benefícios inclusos no plano
          </h2>
          
          <div className="grid md:grid-cols-4 gap-6">
            <div className="text-center space-y-2">
              <div className="flex justify-center">
                <div className="h-12 w-12 rounded-full bg-lumina-100 dark:bg-lumina-900 flex items-center justify-center">
                  <Zap className="h-6 w-6 text-lumina-600 dark:text-lumina-400" />
                </div>
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white">
                Performance
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Sistema rápido e otimizado
              </p>
            </div>

            <div className="text-center space-y-2">
              <div className="flex justify-center">
                <div className="h-12 w-12 rounded-full bg-lumina-100 dark:bg-lumina-900 flex items-center justify-center">
                  <Shield className="h-6 w-6 text-lumina-600 dark:text-lumina-400" />
                </div>
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white">
                Segurança
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Dados criptografados SSL
              </p>
            </div>

            <div className="text-center space-y-2">
              <div className="flex justify-center">
                <div className="h-12 w-12 rounded-full bg-lumina-100 dark:bg-lumina-900 flex items-center justify-center">
                  <HeadphonesIcon className="h-6 w-6 text-lumina-600 dark:text-lumina-400" />
                </div>
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white">
                Suporte
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Resposta em 48h
              </p>
            </div>

            <div className="text-center space-y-2">
              <div className="flex justify-center">
                <div className="h-12 w-12 rounded-full bg-lumina-100 dark:bg-lumina-900 flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-lumina-600 dark:text-lumina-400" />
                </div>
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white">
                Atualizações
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Novos recursos mensais
              </p>
            </div>
          </div>
        </div>

        {/* FAQ/Info */}
        <div className="mt-12 text-center space-y-3 max-w-2xl mx-auto">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-md">
            <div className="grid md:grid-cols-3 gap-4 text-sm">
              <div className="flex flex-col items-center gap-2">
                <CreditCard className="h-5 w-5 text-lumina-600 dark:text-lumina-400" />
                <p className="text-gray-700 dark:text-gray-300">Pagamento seguro via Stripe</p>
              </div>
              <div className="flex flex-col items-center gap-2">
                <Shield className="h-5 w-5 text-lumina-600 dark:text-lumina-400" />
                <p className="text-gray-700 dark:text-gray-300">14 dias grátis sem compromisso</p>
              </div>
              <div className="flex flex-col items-center gap-2">
                <Check className="h-5 w-5 text-lumina-600 dark:text-lumina-400" />
                <p className="text-gray-700 dark:text-gray-300">Acesso completo durante o trial</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
