import { useAuthStore } from "@/store/authStore";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  User,
  Settings,
  HelpCircle,
  LogOut,
  Building2,
  Mail,
  Shield,
  ChevronDown,
  Briefcase,
  CheckCircle2,
  Clock,
  DollarSign,
  Bell,
  Sun,
  Moon,
  Laptop,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "@/hooks/useTheme";

interface UserMenuProps {
  isMobileOnly?: boolean;
  metrics?: {
    projects: number;
    tasks: number;
    hours: number;
    revenue: number;
  };
}

export function UserMenu({ isMobileOnly = false, metrics }: UserMenuProps) {
  const { user, profile, signOut } = useAuthStore();
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate("/login");
    } catch (error) {
      console.error("Erro ao fazer logout:", error);
    }
  };

  // Pegar nome do profile ou email
  const displayName = profile?.nome || user?.email || "Usuário";
  const displayEmail = user?.email || profile?.email || "";
  const companyName = profile?.empresa || "";

  // Gerar iniciais para o avatar
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  // Ícone do tema
  const getThemeIcon = () => {
    if (theme === "light") return <Sun className="h-4 w-4" />;
    if (theme === "dark") return <Moon className="h-4 w-4" />;
    return <Laptop className="h-4 w-4" />;
  };

  const getThemeLabel = () => {
    if (theme === "light") return "Modo Claro";
    if (theme === "dark") return "Modo Escuro";
    return "Seguir Sistema";
  };

  const cycleTheme = () => {
    const themes: Array<"light" | "dark" | "system"> = ["light", "dark", "system"];
    const currentIndex = themes.indexOf(theme as "light" | "dark" | "system");
    const nextIndex = (currentIndex + 1) % themes.length;
    setTheme(themes[nextIndex]);
  };

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="flex items-center gap-2 sm:gap-3 h-auto px-2 sm:px-3 py-2 hover:bg-muted/50"
        >
          <Avatar className="h-9 w-9">
            <AvatarImage src={profile?.avatar_url || undefined} alt={displayName} />
            <AvatarFallback className="bg-lumina-500 text-white font-semibold">
              {getInitials(displayName)}
            </AvatarFallback>
          </Avatar>
          <div className="hidden sm:flex flex-col items-start text-sm">
            <span className="font-medium leading-none">{displayName.split(" ")[0]}</span>
            <span className="text-xs text-muted-foreground leading-none mt-1">
              {profile?.role === "admin" ? "Administrador" : "Usuário"}
            </span>
          </div>
          <ChevronDown className="hidden sm:block h-4 w-4 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent 
        align="end" 
        className="w-72 sm:w-80 max-h-[85vh] overflow-y-auto"
        sideOffset={8}
        collisionPadding={16}
      >
        {/* User Info */}
        <DropdownMenuLabel className="pb-3">
          <div className="flex items-center gap-3">
            <Avatar className="h-12 w-12">
              <AvatarImage src={profile?.avatar_url || undefined} alt={displayName} />
              <AvatarFallback className="bg-lumina-500 text-white text-base font-semibold">
                {getInitials(displayName)}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <span className="font-semibold text-base leading-tight">{displayName}</span>
              <span className="text-xs text-muted-foreground leading-tight mt-1">
                {displayEmail}
              </span>
              {companyName && (
                <span className="text-xs text-muted-foreground leading-tight mt-0.5 flex items-center gap-1">
                  <Building2 className="h-3 w-3" />
                  {companyName}
                </span>
              )}
            </div>
          </div>
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        {/* Metrics (mobile only) */}
        {isMobileOnly && metrics && (
          <>
            <div className="px-3 py-2 sm:hidden">
              <p className="text-xs font-medium text-muted-foreground mb-2">Visão Geral</p>
              <div className="grid grid-cols-2 gap-2">
                <div className="flex items-center gap-2 p-2 bg-blue-100 dark:bg-blue-900/50 rounded-lg">
                  <div className="p-1.5 bg-blue-200 dark:bg-blue-800/50 rounded">
                    <Briefcase className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] text-muted-foreground">Projetos</span>
                    <span className="text-sm font-bold text-blue-600 dark:text-blue-400">
                      {metrics.projects}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 p-2 bg-green-100 dark:bg-green-900/50 rounded-lg">
                  <div className="p-1.5 bg-green-200 dark:bg-green-800/50 rounded">
                    <CheckCircle2 className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] text-muted-foreground">Tarefas</span>
                    <span className="text-sm font-bold text-green-600 dark:text-green-400">
                      {metrics.tasks}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 p-2 bg-purple-100 dark:bg-purple-900/50 rounded-lg">
                  <div className="p-1.5 bg-purple-200 dark:bg-purple-800/50 rounded">
                    <Clock className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] text-muted-foreground">Horas</span>
                    <span className="text-sm font-bold text-purple-600 dark:text-purple-400">
                      {metrics.hours}h
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 p-2 bg-orange-100 dark:bg-orange-900/50 rounded-lg">
                  <div className="p-1.5 bg-orange-200 dark:bg-orange-800/50 rounded">
                    <DollarSign className="h-3.5 w-3.5 text-orange-600 dark:text-orange-400" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] text-muted-foreground">Receita</span>
                    <span className="text-sm font-bold text-orange-600 dark:text-orange-400">
                      ${(metrics.revenue / 1000).toFixed(1)}k
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <DropdownMenuSeparator className="sm:hidden" />
          </>
        )}

        {/* Theme Toggle (mobile only) */}
        {isMobileOnly && (
          <>
            <DropdownMenuItem
              onClick={cycleTheme}
              className="cursor-pointer py-2.5 sm:hidden"
            >
              {getThemeIcon()}
              <div className="flex flex-col ml-3">
                <span className="text-sm font-medium">Tema</span>
                <span className="text-xs text-muted-foreground">
                  {getThemeLabel()}
                </span>
              </div>
            </DropdownMenuItem>

            <DropdownMenuItem
              className="cursor-pointer py-2.5 sm:hidden"
            >
              <Bell className="h-4 w-4" />
              <div className="flex flex-col ml-3">
                <span className="text-sm font-medium">Notificações</span>
                <span className="text-xs text-muted-foreground">
                  Ver avisos e atualizações
                </span>
              </div>
            </DropdownMenuItem>
            <DropdownMenuSeparator className="sm:hidden" />
          </>
        )}

        {/* Menu Items */}
        <DropdownMenuGroup>
          <DropdownMenuItem
            onClick={() => navigate("/settings")}
            className="cursor-pointer py-2.5"
          >
            <User className="mr-3 h-4 w-4" />
            <div className="flex flex-col">
              <span className="text-sm font-medium">Meu Perfil</span>
              <span className="text-xs text-muted-foreground">
                Editar informações pessoais
              </span>
            </div>
          </DropdownMenuItem>

          <DropdownMenuItem
            onClick={() => navigate("/settings")}
            className="cursor-pointer py-2.5"
          >
            <Settings className="mr-3 h-4 w-4" />
            <div className="flex flex-col">
              <span className="text-sm font-medium">Configurações</span>
              <span className="text-xs text-muted-foreground">
                Preferências do sistema
              </span>
            </div>
          </DropdownMenuItem>

          {profile?.role === "admin" && (
            <DropdownMenuItem
              onClick={() => navigate("/settings")}
              className="cursor-pointer py-2.5"
            >
              <Shield className="mr-3 h-4 w-4" />
              <div className="flex flex-col">
                <span className="text-sm font-medium">Administração</span>
                <span className="text-xs text-muted-foreground">
                  Gerenciar usuários e permissões
                </span>
              </div>
            </DropdownMenuItem>
          )}
        </DropdownMenuGroup>

        <DropdownMenuSeparator />

        <DropdownMenuGroup>
          <DropdownMenuItem className="cursor-pointer py-2.5">
            <HelpCircle className="mr-3 h-4 w-4" />
            <div className="flex flex-col">
              <span className="text-sm font-medium">Ajuda & Suporte</span>
              <span className="text-xs text-muted-foreground">
                Documentação e tutoriais
              </span>
            </div>
          </DropdownMenuItem>

          <DropdownMenuItem className="cursor-pointer py-2.5">
            <Mail className="mr-3 h-4 w-4" />
            <div className="flex flex-col">
              <span className="text-sm font-medium">Enviar Feedback</span>
              <span className="text-xs text-muted-foreground">
                Ajude-nos a melhorar
              </span>
            </div>
          </DropdownMenuItem>
        </DropdownMenuGroup>

        <DropdownMenuSeparator />

        {/* Logout */}
        <DropdownMenuItem
          onClick={handleSignOut}
          className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-950/20 py-2.5"
        >
          <LogOut className="mr-3 h-4 w-4" />
          <span className="text-sm font-medium">Sair da conta</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

