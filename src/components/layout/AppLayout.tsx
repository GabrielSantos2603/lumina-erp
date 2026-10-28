import { useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";

import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { FloatingTimer } from "./FloatingTimer";
import { SubscriptionBanner } from "../SubscriptionBanner";
import { cn } from "@/utils/cn";

export function AppLayout() {
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true); // Padrão retraído
  const location = useLocation();

  useEffect(() => {
    // Close the mobile navigation whenever the route changes
    setIsMobileNavOpen(false);
    // Restore page scroll position for new views
    window.scrollTo({ top: 0, behavior: "auto" });
  }, [location.pathname]);

  useEffect(() => {
    document.body.style.overflow = isMobileNavOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMobileNavOpen]);

  const sidebarWidth = isSidebarCollapsed ? "w-16" : "w-64";
  const sidebarPadding = isSidebarCollapsed ? "lg:pl-16" : "lg:pl-64";

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      {/* Mobile navigation drawer */}
      {isMobileNavOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-foreground/20 backdrop-blur-sm"
            aria-label="Fechar menu de navegação"
            onClick={() => setIsMobileNavOpen(false)}
          />
          <div className="relative h-full w-72 max-w-[80%] shadow-xl">
            <Sidebar
              variant="mobile"
              onNavigate={() => setIsMobileNavOpen(false)}
              className="h-full"
            />
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <div className="hidden lg:flex">
        <div className={cn("fixed inset-y-0 left-0 z-40 transition-all duration-300", sidebarWidth)}>
          <Sidebar 
            className="h-full" 
            isCollapsed={isSidebarCollapsed}
            onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          />
        </div>
      </div>

      <Header 
        onToggleSidebar={() => setIsMobileNavOpen(true)} 
        isSidebarCollapsed={isSidebarCollapsed}
      />

      {/* Banner de assinatura/trial */}
      <SubscriptionBanner />

      <div className={cn("transition-all duration-300 overflow-x-hidden", sidebarPadding)}>
        <main className="min-h-[calc(100vh-5rem)] pb-8 sm:pb-12 pt-16 sm:pt-20 overflow-y-auto overflow-x-hidden">
          <Outlet />
        </main>
      </div>

      <FloatingTimer />
    </div>
  );
}


