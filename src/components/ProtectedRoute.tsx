import { useEffect } from "react";
import { Navigate } from "react-router-dom";
import { useAuthStore } from "@/store/authStore";
import { AppLayout } from "./layout/AppLayout";
import { Loader2 } from "lucide-react";
import { useSubscriptionGuard } from "@/hooks/useSubscriptionGuard";

export function ProtectedRoute() {
  const { user, loading, initialize } = useAuthStore();
  
  // Verificação de assinatura (não bloqueia rotas de configuração)
  useSubscriptionGuard({ 
    redirect: true, 
    excludedRoutes: ['/upgrade', '/settings/billing', '/settings', '/auth/login'] 
  });

  useEffect(() => {
    initialize();
  }, [initialize]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-lumina-500 mx-auto" />
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <AppLayout />;
}






