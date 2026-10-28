import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Check, 
  Sparkles, 
  Calendar, 
  CreditCard,
  ArrowRight,
  Building2,
  Users,
  FolderKanban,
  DollarSign
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';

interface Organization {
  id: string;
  name: string;
  status: string;
  plan: string;
  trial_ends_at: string;
}

interface ProfileWithOrg {
  organization_id?: string;
}

export function WelcomePage() {
  const navigate = useNavigate();
  const { user, profile } = useAuthStore();
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);
  const [daysRemaining, setDaysRemaining] = useState(0);

  const loadOrganization = async () => {
    if (!user) {
      navigate('/login');
      return;
    }

    // Buscar organization_id do profile
    const profileWithOrg = profile as ProfileWithOrg | null;
    
    if (!profileWithOrg?.organization_id) {
      // Se não tem organization_id, buscar do banco
      try {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('organization_id')
          .eq('id', user.id)
          .single();
        
        if (!profileData?.organization_id) {
          navigate('/login');
          return;
        }
        
        profileWithOrg!.organization_id = profileData.organization_id;
      } catch (error) {
        console.error('Erro ao buscar profile:', error);
        navigate('/login');
        return;
      }
    }

    try {
      const { data, error } = await supabase
        .from('organizations')
        .select('*')
        .eq('id', profileWithOrg.organization_id)
        .single();

      if (error) throw error;

      if (data) {
        setOrganization(data);
        
        // Calcular dias restantes do trial
        if (data.trial_ends_at) {
          const trialEnd = new Date(data.trial_ends_at);
          const today = new Date();
          const diffTime = trialEnd.getTime() - today.getTime();
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          setDaysRemaining(Math.max(0, diffDays));
        }
      }
    } catch (error) {
      console.error('Erro ao carregar organização:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrganization();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const handleStartTrial = () => {
    navigate('/');
  };

  const handleUpgrade = () => {
    navigate('/upgrade');
  };

  const features = [
    {
      icon: Users,
      title: 'Até 5 Usuários',
      description: 'Colabore com sua equipe'
    },
    {
      icon: FolderKanban,
      title: '50 Projetos',
      description: 'Gerenciamento ilimitado'
    },
    {
      icon: Building2,
      title: '10GB Armazenamento',
      description: 'Para seus arquivos'
    },
    {
      icon: DollarSign,
      title: 'Controle Financeiro',
      description: 'Despesas e receitas'
    }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-lumina-50 via-white to-lumina-100 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-lumina-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-lumina-50 via-white to-lumina-100 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 p-4 flex items-center justify-center">
      <div className="max-w-4xl w-full space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="h-16 w-16 rounded-2xl bg-lumina-500 flex items-center justify-center shadow-lg">
              <Building2 className="h-10 w-10 text-white" />
            </div>
          </div>
          
          <div className="space-y-2">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
              Bem-vindo ao Lumina AI ERP! 🎉
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-400">
              Sua conta foi criada com sucesso
            </p>
          </div>

          {/* Trial Badge */}
          {organization?.status === 'trial' && (
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-lumina-500 to-purple-600 text-white shadow-lg">
              <Sparkles className="h-5 w-5" />
              <span className="font-semibold">
                {daysRemaining} dias de teste grátis
              </span>
              <Calendar className="h-4 w-4" />
            </div>
          )}
        </div>

        {/* Main Content */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Trial Card */}
          <Card className="border-2 border-lumina-200 dark:border-lumina-800 shadow-xl">
            <CardHeader className="text-center pb-4">
              <div className="flex justify-center mb-4">
                <div className="h-12 w-12 rounded-full bg-lumina-100 dark:bg-lumina-900 flex items-center justify-center">
                  <Sparkles className="h-6 w-6 text-lumina-600 dark:text-lumina-400" />
                </div>
              </div>
              <CardTitle className="text-2xl">Comece Agora</CardTitle>
              <CardDescription className="text-base">
                Explore todos os recursos por {daysRemaining} dias
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Features List */}
              <div className="space-y-3">
                {features.map((feature, index) => {
                  const Icon = feature.icon;
                  return (
                    <div key={index} className="flex items-start gap-3">
                      <div className="flex-shrink-0 h-8 w-8 rounded-lg bg-lumina-100 dark:bg-lumina-900 flex items-center justify-center">
                        <Icon className="h-4 w-4 text-lumina-600 dark:text-lumina-400" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {feature.title}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {feature.description}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="pt-4">
                <Button 
                  onClick={handleStartTrial}
                  className="w-full bg-lumina-600 hover:bg-lumina-700 text-white"
                  size="lg"
                >
                  Começar Teste Grátis
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
                <p className="text-xs text-center text-gray-500 dark:text-gray-400 mt-3">
                  Sem cartão de crédito necessário
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Upgrade Card */}
          <Card className="border-2 border-purple-200 dark:border-purple-800 shadow-xl bg-gradient-to-br from-white to-purple-50 dark:from-gray-900 dark:to-purple-950">
            <CardHeader className="text-center pb-4">
              <Badge className="mx-auto mb-4 bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100">
                Mais Popular
              </Badge>
              <div className="flex justify-center mb-4">
                <div className="h-12 w-12 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center">
                  <CreditCard className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                </div>
              </div>
              <CardTitle className="text-2xl">Plano Starter</CardTitle>
              <div className="flex items-baseline justify-center gap-1 mt-2">
                <span className="text-4xl font-bold text-gray-900 dark:text-white">
                  R$ 64,99
                </span>
                <span className="text-gray-600 dark:text-gray-400">/mês</span>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Benefits */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Check className="h-5 w-5 text-purple-600 dark:text-purple-400 flex-shrink-0" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    Todos os recursos do trial
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-5 w-5 text-purple-600 dark:text-purple-400 flex-shrink-0" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    Suporte prioritário
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-5 w-5 text-purple-600 dark:text-purple-400 flex-shrink-0" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    Atualizações automáticas
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-5 w-5 text-purple-600 dark:text-purple-400 flex-shrink-0" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    Backup diário dos dados
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-5 w-5 text-purple-600 dark:text-purple-400 flex-shrink-0" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    Sem compromisso - cancele quando quiser
                  </span>
                </div>
              </div>

              {/* Highlight */}
              <div className="bg-purple-100 dark:bg-purple-900/30 rounded-lg p-4 border border-purple-200 dark:border-purple-800">
                <p className="text-sm font-medium text-purple-900 dark:text-purple-100 text-center">
                  💎 Desbloqueie todo o potencial agora
                </p>
              </div>

              <div className="space-y-3">
                <Button 
                  onClick={handleUpgrade}
                  className="w-full bg-gradient-to-r from-purple-600 to-lumina-600 hover:from-purple-700 hover:to-lumina-700 text-white"
                  size="lg"
                >
                  Fazer Upgrade Agora
                  <CreditCard className="ml-2 h-5 w-5" />
                </Button>
                <Button 
                  onClick={handleStartTrial}
                  variant="outline"
                  className="w-full"
                  size="lg"
                >
                  Continuar com Trial
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Footer Info */}
        <div className="text-center text-sm text-gray-600 dark:text-gray-400 space-y-2">
          <p>
            Seu trial termina em{' '}
            <span className="font-semibold text-lumina-600 dark:text-lumina-400">
              {new Date(organization?.trial_ends_at || '').toLocaleDateString('pt-BR')}
            </span>
          </p>
          <p className="text-xs">
            Após o período de teste, você pode escolher entre continuar com o plano pago ou cancelar sem custos
          </p>
        </div>
      </div>
    </div>
  );
}
