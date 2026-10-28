import { NavLink } from "react-router-dom";
import { cn } from "@/utils/cn";
import {
  LayoutDashboard,
  Users,
  FolderKanban,
  Calendar,
  DollarSign,
  UsersRound,
  Video,
  Settings,
  Building2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const navigation = [
  {
    name: "Dashboard",
    href: "/",
    icon: LayoutDashboard,
  },
  {
    name: "Clientes",
    href: "/clients",
    icon: Users,
  },
  {
    name: "Projetos",
    href: "/projects",
    icon: FolderKanban,
  },
  {
    name: "Calendário",
    href: "/calendar",
    icon: Calendar,
  },
  {
    name: "Financeiro",
    href: "/finance",
    icon: DollarSign,
  },
  {
    name: "Minha Empresa",
    href: "/company",
    icon: Building2,
  },
  {
    name: "Equipe",
    href: "/team",
    icon: UsersRound,
  },
  {
    name: "Reuniões",
    href: "/meetings",
    icon: Video,
  },
  {
    name: "Configurações",
    href: "/settings",
    icon: Settings,
  },
];

interface SidebarProps {
  variant?: "desktop" | "mobile";
  onNavigate?: () => void;
  className?: string;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export function Sidebar({
  variant = "desktop",
  onNavigate,
  className,
  isCollapsed = false,
  onToggleCollapse,
}: SidebarProps) {
  const isMobile = variant === "mobile";
  const collapsed = !isMobile && isCollapsed;

  return (
    <aside
      className={cn(
        "flex h-full flex-col border-r bg-card transition-all duration-300 ease-in-out",
        collapsed ? "w-16" : "w-64",
        isMobile && "w-full max-w-sm shadow-2xl",
        className
      )}
    >
      {/* Logo */}
      <div
        className={cn(
          "flex h-16 items-center border-b transition-all duration-300",
          collapsed ? "justify-center px-2" : "gap-3 px-6",
          isMobile && "h-14"
        )}
      >
        <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-lumina-500 to-lumina-600 flex items-center justify-center shadow-lg flex-shrink-0">
          <Building2 className="h-6 w-6 text-white" />
        </div>
        {!collapsed && (
          <div className="overflow-hidden">
            <h1 className="text-lg font-bold text-foreground whitespace-nowrap">
              Lumina ERP
            </h1>
            <p className="text-xs text-muted-foreground whitespace-nowrap">
              Gestão Inteligente
            </p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <TooltipProvider delayDuration={0}>
        <nav className={cn("flex-1 p-3", collapsed ? "space-y-2 flex flex-col items-center" : "space-y-1")}>
          {navigation.map((item) => {
            const NavItem = (
              <NavLink
                key={item.name}
                to={item.href}
                end={item.href === "/"}
                className={({ isActive }) =>
                  cn(
                    "flex items-center rounded-lg text-sm font-medium transition-all",
                    collapsed 
                      ? "h-11 w-11 flex items-center justify-center" 
                      : "gap-3 px-3 py-2.5 w-full",
                    isActive
                      ? "bg-lumina-50 text-lumina-700 dark:bg-lumina-950 dark:text-lumina-300"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  )
                }
                onClick={onNavigate}
              >
                {({ isActive }) => (
                  <>
                    <item.icon
                      className={cn(
                        "h-5 w-5",
                        collapsed ? "flex-shrink-0" : "flex-shrink-0",
                        isActive ? "text-lumina-600 dark:text-lumina-400" : "text-muted-foreground"
                      )}
                    />
                    {!collapsed && (
                      <span className="overflow-hidden text-ellipsis whitespace-nowrap">
                        {item.name}
                      </span>
                    )}
                  </>
                )}
              </NavLink>
            );

            if (collapsed) {
              return (
                <Tooltip key={item.name}>
                  <TooltipTrigger asChild>{NavItem}</TooltipTrigger>
                  <TooltipContent side="right" className="font-medium">
                    {item.name}
                  </TooltipContent>
                </Tooltip>
              );
            }

            return NavItem;
          })}
        </nav>
      </TooltipProvider>

      {/* Toggle Button - Desktop Only */}
      {!isMobile && onToggleCollapse && (
        <div className={cn("border-t p-3", collapsed && "flex justify-center")}>
          <Button
            variant="ghost"
            size={collapsed ? "icon" : "sm"}
            onClick={onToggleCollapse}
            className={cn(
              "transition-all hover:bg-lumina-100 dark:hover:bg-lumina-900/30",
              collapsed ? "w-11 h-11" : "w-full justify-start gap-2"
            )}
            title={collapsed ? "Expandir menu" : "Retrair menu"}
          >
            {collapsed ? (
              <ChevronRight className="h-5 w-5" />
            ) : (
              <>
                <ChevronLeft className="h-5 w-5" />
                <span className="text-sm">Retrair menu</span>
              </>
            )}
          </Button>
        </div>
      )}

      {/* Footer */}
      {!collapsed && (
        <div className="border-t p-4">
          <div className="text-xs text-muted-foreground text-center">
            <p>© 2025 Lumina AI ERP</p>
            <p className="mt-1">Versão 1.0.0</p>
          </div>
        </div>
      )}
    </aside>
  );
}


