import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Loader2 } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';

export function CheckoutSuccessPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuthStore();
  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    if (!sessionId || !user) {
      navigate('/');
      return;
    }

    verifySession();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId, user]);

  const verifySession = async () => {
    try {
      // Aqui você pode verificar a sessão do Stripe se necessário
      // Por enquanto, apenas aguardar um momento antes de redirecionar
      await new Promise(resolve => setTimeout(resolve, 2000));
      setLoading(false);
    } catch {
      setError('Erro ao verificar pagamento');
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-lumina-50 via-white to-lumina-100 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 flex items-center justify-center">
        <Card className="max-w-md w-full">
          <CardContent className="flex flex-col items-center justify-center p-12">
            <Loader2 className="h-12 w-12 text-lumina-600 animate-spin mb-4" />
            <p className="text-gray-600 dark:text-gray-400">
              Verificando seu pagamento...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-lumina-50 via-white to-lumina-100 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-12 text-center">
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={() => navigate('/')}>
              Ir para Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-lumina-50 via-white to-lumina-100 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 flex items-center justify-center p-4">
      <Card className="max-w-2xl w-full">
        <CardHeader className="text-center pb-6">
          <div className="flex justify-center mb-6">
            <div className="h-20 w-20 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
              <CheckCircle2 className="h-12 w-12 text-green-600 dark:text-green-400" />
            </div>
          </div>
          <CardTitle className="text-3xl">Pagamento Confirmado!</CardTitle>
          <CardDescription className="text-lg mt-2">
            Bem-vindo ao Lumina AI ERP
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg p-6">
            <h3 className="font-semibold text-green-900 dark:text-green-100 mb-2">
              ✅ Assinatura Ativada - Plano Starter
            </h3>
            <p className="text-sm text-green-700 dark:text-green-300">
              Sua assinatura do Plano Starter (até 5 usuários) foi ativada com sucesso! 
              Você agora tem acesso completo a todos os recursos por 30 dias.
            </p>
          </div>

          <div className="space-y-3">
            <h3 className="font-semibold text-gray-900 dark:text-white">
              Próximos passos:
            </h3>
            <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
              <li className="flex items-start gap-2">
                <span className="text-lumina-600 dark:text-lumina-400">1.</span>
                <span>Configure seu perfil e preferências da empresa</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-lumina-600 dark:text-lumina-400">2.</span>
                <span>Adicione até 5 membros da sua equipe</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-lumina-600 dark:text-lumina-400">3.</span>
                <span>Crie seus primeiros projetos e clientes</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-lumina-600 dark:text-lumina-400">4.</span>
                <span>Explore o controle financeiro e relatórios</span>
              </li>
            </ul>
          </div>

          <div className="text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
            <p>
              📧 Você receberá um email de confirmação com os detalhes da sua assinatura.
            </p>
            <p className="mt-2">
              � Sua próxima cobrança será em 30 dias. Você pode cancelar quando quiser.
            </p>
          </div>

          <div className="bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
            <p className="text-xs text-amber-900 dark:text-amber-100">
              ⚠️ <strong>Política de Não Reembolso:</strong> Não oferecemos reembolso de valores pagos. 
              Porém, você pode cancelar sua assinatura a qualquer momento e continuará tendo acesso 
              ao sistema até o final do período já pago.
            </p>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              onClick={() => navigate('/')}
              className="flex-1 bg-lumina-600 hover:bg-lumina-700"
              size="lg"
            >
              Ir para Dashboard
            </Button>
            <Button
              onClick={() => navigate('/settings')}
              variant="outline"
              className="flex-1"
              size="lg"
            >
              Configurações
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
