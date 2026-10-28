import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "react-hot-toast";
import { Toaster as SonnerToaster } from "sonner";
import { useGlobalTimerSync } from "@/hooks/useGlobalTimerSync";
import { useSessionManager } from "@/hooks/useSessionManager";

import { ProtectedRoute } from "@/components/ProtectedRoute";
import { CompanySetupGuard } from "@/components/guards/CompanySetupGuard";
import { LoginPage } from "@/pages/auth/LoginPage";
import ConfirmEmailPage from "@/pages/ConfirmEmailPage";
import { DashboardPage } from "@/pages/dashboard/DashboardPage";
import { ClientsPage } from "@/pages/clients/ClientsPage";
import { ProjectsPage } from "@/pages/projects/ProjectsPage";
import { CalendarPage } from "@/pages/calendar/CalendarPage";
import { FinancePage } from "@/pages/finance/FinancePage";
import TeamPage from "@/pages/team/TeamPage";
import { MeetingsPage } from "@/pages/meetings/MeetingsPageUpdated";
import { SettingsPage } from "@/pages/settings/SettingsPage";
import { SubscriptionPage } from "@/pages/settings/SubscriptionPage";
import { CompanyPage } from "@/pages/company/CompanyPage";
import { CompanySetupPage } from "@/pages/company/CompanySetupPage";
import { UpgradePage } from "@/pages/onboarding/UpgradePage";
import { WelcomePage } from "@/pages/onboarding/WelcomePage";
import { CheckoutPage } from "@/pages/onboarding/CheckoutPage";
import { CheckoutSuccessPage } from "@/pages/onboarding/CheckoutSuccessPage";
import { OrganizationProvider } from "@/contexts/OrganizationContext";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutos
      retry: 1,
    },
  },
});

const router = createBrowserRouter([
  {
    path: "/login",
    element: <LoginPage />,
  },
  {
    path: "/confirm-email",
    element: <ConfirmEmailPage />,
  },
  {
    path: "/welcome",
    element: <WelcomePage />,
  },
  {
    path: "/upgrade",
    element: <UpgradePage />,
  },
  {
    path: "/checkout/:planId",
    element: <CheckoutPage />,
  },
  {
    path: "/checkout/success",
    element: <CheckoutSuccessPage />,
  },
  {
    path: "/",
    element: <ProtectedRoute />,
    children: [
      {
        index: true,
        element: <CompanySetupGuard><DashboardPage /></CompanySetupGuard>,
      },
      {
        path: "clients",
        element: <CompanySetupGuard><ClientsPage /></CompanySetupGuard>,
      },
      {
        path: "projects",
        element: <CompanySetupGuard><ProjectsPage /></CompanySetupGuard>,
      },
      {
        path: "calendar",
        element: <CompanySetupGuard><CalendarPage /></CompanySetupGuard>,
      },
      {
        path: "finance",
        element: <CompanySetupGuard><FinancePage /></CompanySetupGuard>,
      },
      {
        path: "team",
        element: <CompanySetupGuard><TeamPage /></CompanySetupGuard>,
      },
      {
        path: "meetings",
        element: <CompanySetupGuard><MeetingsPage /></CompanySetupGuard>,
      },
      {
        path: "settings",
        element: <SettingsPage />,
      },
      {
        path: "settings/subscription",
        element: <SubscriptionPage />,
      },
      {
        path: "company",
        element: <CompanyPage />,
      },
      {
        path: "company/setup",
        element: <CompanySetupPage />,
      },
    ],
  },
]);

function App() {
  // Hook global para manter timer sincronizado mesmo quando Timer.tsx não está montado
  useGlobalTimerSync();
  
  // Hook para gerenciar sessão e prevenir travamentos por sessão expirada
  useSessionManager();

  return (
    <QueryClientProvider client={queryClient}>
      <OrganizationProvider>
        <RouterProvider router={router} />
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3000,
            style: {
              background: "hsl(var(--color-card))",
              color: "hsl(var(--color-card-foreground))",
              border: "1px solid hsl(var(--color-border))",
            },
          }}
        />
        <SonnerToaster 
          position="top-right"
          richColors
          closeButton
          duration={4000}
        />
      </OrganizationProvider>
    </QueryClientProvider>
  );
}

export default App;
