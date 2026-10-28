import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/store/authStore";
import { useOrganization } from "@/hooks/useOrganization";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  User,
  Mail,
  Building2,
  Phone,
  Camera,
  Save,
  Shield,
  Bell,
  Lock,
  Palette,
  Globe,
  HelpCircle,
  LogOut,
  Upload,
  CreditCard,
  Calendar,
  Crown,
} from "lucide-react";
import { toast } from "react-hot-toast";
import { supabase } from "@/lib/supabase";
import { ThemeCustomization } from "@/components/settings/ThemeCustomization";
import { DynamicContainer } from "@/components/responsive";

export function SettingsPage() {
  const navigate = useNavigate();
  const { user, profile, updateProfile, signOut } = useAuthStore();
  const { organization, member } = useOrganization();
  const [activeTab, setActiveTab] = useState<"profile" | "account" | "preferences">("profile");
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Estados do formulário
  const [formData, setFormData] = useState({
    nome: profile?.nome || "",
    email: user?.email || "",
    empresa: profile?.empresa || "",
    telefone: profile?.telefone || "",
    avatar_url: profile?.avatar_url || "",
  });

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tipo de arquivo
    if (!file.type.startsWith("image/")) {
      toast.error("Por favor, selecione uma imagem válida");
      return;
    }

    // Validar tamanho (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error("A imagem deve ter no máximo 2MB");
      return;
    }

    try {
      setIsLoading(true);

      // Upload para Supabase Storage
      const fileExt = file.name.split(".").pop();
      const fileName = `${user?.id}-${Date.now()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: true,
        });

      if (uploadError) throw uploadError;

      // Obter URL pública
      const { data: urlData } = supabase.storage
        .from("avatars")
        .getPublicUrl(filePath);

      const avatarUrl = urlData.publicUrl;

      // Atualizar profile
      await updateProfile({ avatar_url: avatarUrl });

      setFormData((prev) => ({ ...prev, avatar_url: avatarUrl }));
      toast.success("Foto de perfil atualizada!");
    } catch (error) {
      console.error("Erro ao fazer upload do avatar:", error);
      toast.error("Erro ao atualizar foto de perfil");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    try {
      setIsLoading(true);

      await updateProfile({
        nome: formData.nome,
        empresa: formData.empresa || null,
        telefone: formData.telefone || null,
      });

      toast.success("Perfil atualizado com sucesso!");
    } catch (error) {
      console.error("Erro ao atualizar perfil:", error);
      toast.error("Erro ao atualizar perfil");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut();
      toast.success("Logout realizado com sucesso!");
    } catch (error) {
      console.error("Erro ao fazer logout:", error);
      toast.error("Erro ao fazer logout");
    }
  };

  const tabs = [
    { id: "profile", label: "Perfil", icon: User },
    { id: "account", label: "Conta", icon: Shield },
    { id: "preferences", label: "Preferências", icon: Palette },
  ];

  return (
    <DynamicContainer className="overflow-x-hidden">
      <div className="space-y-3 sm:space-y-4 lg:space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground truncate">Configurações</h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1 line-clamp-2">
            Gerencie suas informações pessoais e preferências do sistema
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 sm:gap-2 border-b overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-3 border-b-2 transition-colors whitespace-nowrap text-sm sm:text-base ${
                  activeTab === tab.id
                    ? "border-lumina-500 text-lumina-600 dark:text-lumina-400"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Profile Tab */}
        {activeTab === "profile" && (
          <div className="grid gap-4 sm:gap-6 md:grid-cols-3">
            {/* Avatar Section */}
            <Card className="p-4 sm:p-6 md:col-span-1">
              <div className="flex flex-col items-center text-center space-y-3 sm:space-y-4">
                <div className="relative group">
                  <Avatar className="h-24 w-24 sm:h-28 sm:w-28 lg:h-32 lg:w-32 border-2 sm:border-4 border-background shadow-lg">
                    <AvatarImage src={formData.avatar_url || undefined} alt={formData.nome} />
                    <AvatarFallback className="bg-gradient-to-br from-lumina-500 to-lumina-600 text-white text-2xl sm:text-3xl font-semibold">
                      {getInitials(formData.nome || "U")}
                    </AvatarFallback>
                  </Avatar>
                  <button
                    onClick={handleAvatarClick}
                    className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    aria-label="Alterar avatar"
                  >
                    <Camera className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarUpload}
                    className="hidden"
                    aria-label="Upload de avatar"
                  />
                </div>
                <div className="min-w-0 w-full">
                  <h3 className="text-base sm:text-lg font-semibold truncate">{formData.nome}</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground truncate">{formData.email}</p>
                </div>
                <Badge
                  variant={profile?.role === "admin" ? "default" : "secondary"}
                  className="mt-2 text-xs sm:text-sm"
                >
                  {profile?.role === "admin" ? "Administrador" : "Usuário"}
                </Badge>

                {/* Subscription Info */}
                {organization && (
                  <div className="w-full mt-4 pt-4 border-t space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">Plano Atual:</span>
                      <Badge variant="default" className="gap-1">
                        <Crown className="h-3 w-3" />
                        {organization.plan === 'starter' ? 'Starter' : 
                         organization.plan === 'professional' ? 'Professional' : 
                         organization.plan === 'enterprise' ? 'Enterprise' : 'Trial'}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">Status:</span>
                      <Badge 
                        variant={
                          organization.status === 'active' ? 'default' :
                          organization.status === 'trial' ? 'secondary' :
                          'destructive'
                        }
                      >
                        {organization.status === 'active' ? '✓ Ativo' :
                         organization.status === 'trial' ? '🎉 Trial' :
                         organization.status === 'cancelled' ? '⚠️ Cancelado' :
                         organization.status === 'suspended' ? '⏸️ Suspenso' :
                         'Inativo'}
                      </Badge>
                    </div>
                    {organization.trial_ends_at && organization.status === 'trial' && (
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">Trial termina em:</span>
                        <span className="text-xs font-medium">
                          {Math.max(0, Math.ceil((new Date(organization.trial_ends_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))} dias
                        </span>
                      </div>
                    )}
                    {organization.stripe_current_period_end && organization.status === 'active' && (
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">Próximo pagamento:</span>
                        <span className="text-xs font-medium">
                          {Math.max(0, Math.ceil((new Date(organization.stripe_current_period_end).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))} dias
                        </span>
                      </div>
                    )}
                    {organization.status === 'active' && organization.subscription_price > 0 && (
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">Valor mensal:</span>
                        <span className="text-xs font-semibold">
                          R$ {organization.subscription_price.toFixed(2)}
                        </span>
                      </div>
                    )}
                  </div>
                )}

                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleAvatarClick}
                  className="w-full mt-2 sm:mt-4 h-8 sm:h-9"
                >
                  <Upload className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                  Alterar Foto
                </Button>
              </div>
            </Card>

            {/* Form Section */}
            <Card className="p-4 sm:p-6 md:col-span-2">
              <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">Informações Pessoais</h3>
              <div className="space-y-3 sm:space-y-4">
                <div className="grid gap-3 sm:gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="nome">
                    <User className="h-4 w-4 inline mr-2" />
                    Nome Completo
                  </Label>
                  <Input
                    id="nome"
                    value={formData.nome}
                    onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                    placeholder="Seu nome completo"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">
                    <Mail className="h-4 w-4 inline mr-2" />
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    disabled
                    className="bg-muted"
                  />
                  <p className="text-xs text-muted-foreground">
                    O email não pode ser alterado
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="empresa">
                    <Building2 className="h-4 w-4 inline mr-2" />
                    Empresa
                  </Label>
                  <Input
                    id="empresa"
                    value={formData.empresa}
                    onChange={(e) => setFormData({ ...formData, empresa: e.target.value })}
                    placeholder="Nome da empresa"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="telefone">
                    <Phone className="h-4 w-4 inline mr-2" />
                    Telefone
                  </Label>
                  <Input
                    id="telefone"
                    value={formData.telefone}
                    onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                    placeholder="(00) 00000-0000"
                  />
                </div>
              </div>

                <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3 pt-3 sm:pt-4">
                  <Button
                    variant="outline"
                    className="w-full sm:w-auto h-9 sm:h-10"
                    onClick={() => {
                      setFormData({
                        nome: profile?.nome || "",
                        email: user?.email || "",
                        empresa: profile?.empresa || "",
                        telefone: profile?.telefone || "",
                        avatar_url: profile?.avatar_url || "",
                      });
                      toast.success("Alterações descartadas");
                    }}
                  >
                    Cancelar
                  </Button>
                  <Button onClick={handleSaveProfile} disabled={isLoading} className="w-full sm:w-auto h-9 sm:h-10">
                    <Save className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                    {isLoading ? "Salvando..." : "Salvar Alterações"}
                  </Button>
                </div>
            </div>
          </Card>
        </div>
      )}

        {/* Account Tab */}
        {activeTab === "account" && (
          <div className="grid gap-4 sm:gap-6 max-w-2xl">
            <Card className="p-4 sm:p-6">
              <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 flex items-center gap-2">
                <Lock className="h-4 w-4 sm:h-5 sm:w-5" />
                Segurança
              </h3>
            <div className="space-y-4">
              <div>
                <Label>Alterar Senha</Label>
                <p className="text-sm text-muted-foreground mb-3">
                  Atualize sua senha periodicamente para manter sua conta segura
                </p>
                <Button variant="outline">
                  <Lock className="h-4 w-4 mr-2" />
                  Alterar Senha
                </Button>
              </div>
            </div>
            </Card>

            {/* Card de Assinatura */}
            <Card className="p-4 sm:p-6">
              <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 flex items-center gap-2">
                <CreditCard className="h-4 w-4 sm:h-5 sm:w-5" />
                Assinatura e Pagamento
              </h3>
              <div className="space-y-4">
                <div>
                  <Label>Gerenciar Assinatura</Label>
                  <p className="text-sm text-muted-foreground mb-3">
                    Visualize informações detalhadas da sua assinatura, altere método de pagamento ou cancele quando quiser
                  </p>
                  <Button 
                    variant="outline"
                    onClick={() => navigate('/settings/subscription')}
                  >
                    <CreditCard className="h-4 w-4 mr-2" />
                    Ver Assinatura
                  </Button>
                </div>
              </div>
            </Card>

            <Card className="p-4 sm:p-6">
              <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 flex items-center gap-2">
                <Bell className="h-4 w-4 sm:h-5 sm:w-5" />
                Notificações
              </h3>
              <div className="space-y-3 sm:space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm sm:text-base truncate">Notificações por Email</p>
                    <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2">
                      Receba atualizações importantes por email
                    </p>
                  </div>
                  <input type="checkbox" className="h-4 w-4 flex-shrink-0" defaultChecked aria-label="Ativar notificações por email" />
                </div>
                <div className="flex items-center justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm sm:text-base truncate">Notificações Push</p>
                    <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2">
                      Receba notificações no navegador
                    </p>
                  </div>
                  <input type="checkbox" className="h-4 w-4 flex-shrink-0" aria-label="Ativar notificações push" />
                </div>
              </div>
            </Card>

            <Card className="p-4 sm:p-6 border-destructive">
              <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 flex items-center gap-2 text-destructive">
                <LogOut className="h-4 w-4 sm:h-5 sm:w-5" />
                Zona de Perigo
              </h3>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground mb-3">
                  Sair da sua conta em todos os dispositivos
                </p>
                <Button variant="destructive" onClick={handleLogout}>
                  <LogOut className="h-4 w-4 mr-2" />
                  Sair da Conta
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

        {/* Preferences Tab */}
        {activeTab === "preferences" && (
          <div className="grid gap-4 sm:gap-6">
            {/* Personalização de Cores */}
            <ThemeCustomization />

            <Card className="p-4 sm:p-6">
              <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 flex items-center gap-2">
                <Globe className="h-4 w-4 sm:h-5 sm:w-5" />
                Idioma e Região
              </h3>
            <div className="space-y-3">
              <div>
                <Label>Idioma</Label>
                <Input value="Português (Brasil)" disabled className="bg-muted mt-2" />
              </div>
              <div>
                <Label>Fuso Horário</Label>
                <Input value="América/São Paulo (GMT-3)" disabled className="bg-muted mt-2" />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 flex items-center gap-2">
              <HelpCircle className="h-4 w-4 sm:h-5 sm:w-5" />
              Ajuda
            </h3>
            <div className="space-y-2 sm:space-y-3">
              <Button variant="outline" className="w-full justify-start h-9 sm:h-10 text-sm sm:text-base">
                <HelpCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                Central de Ajuda
              </Button>
              <Button variant="outline" className="w-full justify-start h-9 sm:h-10 text-sm sm:text-base">
                <Mail className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                Entrar em Contato
              </Button>
            </div>
          </Card>
        </div>
        )}
      </div>
    </DynamicContainer>
  );
}
