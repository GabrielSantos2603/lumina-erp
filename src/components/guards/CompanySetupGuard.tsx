import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useCompanySetupRequired } from '@/hooks/useCompanySetupRequired';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

interface CompanySetupGuardProps {
  children: ReactNode;
}

/**
 * Guard que verifica se a empresa completou o setup inicial
 * Se não completou, redireciona para /company/setup
 * Páginas que não precisam do guard: /company/setup, /settings, /company
 */
export function CompanySetupGuard({ children }: CompanySetupGuardProps) {
  const location = useLocation();
  const { isLoading, isSetupRequired } = useCompanySetupRequired();

  // Páginas que podem ser acessadas sem setup completo
  const allowedPaths = [
    '/company/setup',
    '/settings',
    '/company',
    '/welcome',
    '/upgrade',
    '/checkout',
  ];

  // Verificar se a rota atual é permitida
  const isAllowedPath = allowedPaths.some(path => 
    location.pathname.startsWith(path)
  );

  // Se está carregando, mostrar loading
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="flex flex-col items-center justify-center py-12 space-y-4">
            <Loader2 className="h-12 w-12 text-lumina-600 animate-spin" />
            <p className="text-sm text-muted-foreground">
              Verificando configurações...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Se precisa fazer setup E não está em página permitida, redirecionar
  if (isSetupRequired && !isAllowedPath) {
    return <Navigate to="/company/setup" replace />;
  }

  // Caso contrário, renderizar normalmente
  return <>{children}</>;
}
