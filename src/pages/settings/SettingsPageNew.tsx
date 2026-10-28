import { useState, useRef } from "react";
import { useAuthStore } from "@/store/authStore";
import { useUserPreferences } from "@/hooks/useUserPreferences";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/Switch";
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
  Video,
  DollarSign,
  FolderKanban,
  Brain,
  Clock,
  Monitor,
  RotateCcw,
} from "lucide-react";
import { toast } from "react-hot-toast";
import { supabase } from "@/lib/supabase";

export function SettingsPage() {
  const { user, profile, updateProfile, signOut } = useAuthStore();
  const { preferences, loading: prefsLoading, setPreference, resetPreferences } = useUserPreferences();
  const [activeTab, setActiveTab] = useState<"profile" | "account" | "preferences" | "advanced">("profile");
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

    if (!file.type.startsWith("image/")) {
      toast.error("Por favor, selecione uma imagem válida");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error("A imagem deve ter no máximo 2MB");
      return;
    }

    try {
      setIsLoading(true);

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

      const { data: urlData } = supabase.storage
        .from("avatars")
        .getPublicUrl(filePath);

      const avatarUrl = urlData.publicUrl;

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

  const handleResetPreferences = async () => {
    if (confirm("Tem certeza que deseja restaurar todas as preferências para os valores padrão?")) {
      try {
        await resetPreferences();
        toast.success("Preferências restauradas com sucesso!");
      } catch (error) {
        console.error("Erro ao restaurar preferências:", error);
        toast.error("Erro ao restaurar preferências");
      }
    }
  };

  const tabs = [
    { id: "profile", label: "Perfil", icon: User },
    { id: "account", label: "Conta", icon: Shield },
    { id: "preferences", label: "Preferências", icon: Palette },
    { id: "advanced", label: "Avançado", icon: Monitor },
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-[var(--text)]">Configurações</h1>
        <p className="text-[var(--text-secondary)] mt-1 text-sm sm:text-base">
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
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-3 border-b-2 transition-colors whitespace-nowrap text-sm sm:text-base ${
                activeTab === tab.id
                  ? "border-[var(--primary)] text-[var(--primary)]"
                  : "border-transparent text-[var(--text-secondary)] hover:text-[var(--text)]"
              }`}
            >
              <Icon className="h-4 w-4" />
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
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="relative group">
                <Avatar className="h-24 w-24 sm:h-32 sm:w-32 border-4 border-[var(--background)] shadow-lg">
                  <AvatarImage src={formData.avatar_url || undefined} alt={formData.nome} />
                  <AvatarFallback className="bg-gradient-to-br from-[var(--primary)] to-[var(--primary-dark)] text-white text-2xl sm:text-3xl font-semibold">
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
                />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-semibold text-[var(--text)]">{formData.nome}</h3>
                <p className="text-xs sm:text-sm text-[var(--text-secondary)]">{formData.email}</p>
              </div>
              <Badge
                variant={profile?.role === "admin" ? "default" : "secondary"}
                className="mt-2"
              >
                {profile?.role === "admin" ? "Administrador" : "Usuário"}
              </Badge>
              <Button
                variant="outline"
                size="sm"
                onClick={handleAvatarClick}
                className="w-full mt-4"
              >
                <Upload className="h-4 w-4 mr-2" />
                Alterar Foto
              </Button>
            </div>
          </Card>

          {/* Form Section */}
          <Card className="p-4 sm:p-6 md:col-span-2">
            <h3 className="text-base sm:text-lg font-semibold mb-4 text-[var(--text)]">Informações Pessoais</h3>
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="nome" className="text-[var(--text)]">
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
                  <Label htmlFor="email" className="text-[var(--text)]">
                    <Mail className="h-4 w-4 inline mr-2" />
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    disabled
                    className="bg-[var(--muted)]"
                  />
                  <p className="text-xs text-[var(--text-secondary)]">
                    O email não pode ser alterado
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="empresa" className="text-[var(--text)]">
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
                  <Label htmlFor="telefone" className="text-[var(--text)]">
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

              <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4">
                <Button
                  variant="outline"
                  className="w-full sm:w-auto"
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
                <Button onClick={handleSaveProfile} disabled={isLoading} className="w-full sm:w-auto">
                  <Save className="h-4 w-4 mr-2" />
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
            <h3 className="text-base sm:text-lg font-semibold mb-4 flex items-center gap-2 text-[var(--text)]">
              <Lock className="h-5 w-5" />
              Segurança
            </h3>
            <div className="space-y-4">
              <div>
                <Label className="text-[var(--text)]">Alterar Senha</Label>
                <p className="text-sm text-[var(--text-secondary)] mb-3">
                  Atualize sua senha periodicamente para manter sua conta segura
                </p>
                <Button variant="outline">
                  <Lock className="h-4 w-4 mr-2" />
                  Alterar Senha
                </Button>
              </div>
            </div>
          </Card>

          <Card className="p-4 sm:p-6">
            <h3 className="text-base sm:text-lg font-semibold mb-4 flex items-center gap-2 text-[var(--text)]">
              <Bell className="h-5 w-5" />
              Notificações
            </h3>
            <div className="space-y-4">
              <Switch
                checked={preferences.notifications.email}
                onCheckedChange={(checked) => setPreference("notifications", "email", checked)}
                label="Notificações por Email"
                description="Receba atualizações importantes por email"
              />
              <Switch
                checked={preferences.notifications.push}
                onCheckedChange={(checked) => setPreference("notifications", "push", checked)}
                label="Notificações Push"
                description="Receba notificações no navegador"
              />
              <Switch
                checked={preferences.notifications.meetingReminders}
                onCheckedChange={(checked) => setPreference("notifications", "meetingReminders", checked)}
                label="Lembretes de Reuniões"
                description="Receba lembretes antes das reuniões agendadas"
              />
              <Switch
                checked={preferences.notifications.taskDeadlines}
                onCheckedChange={(checked) => setPreference("notifications", "taskDeadlines", checked)}
                label="Prazos de Tarefas"
                description="Seja notificado sobre tarefas próximas do prazo"
              />
              <Switch
                checked={preferences.notifications.financialAlerts}
                onCheckedChange={(checked) => setPreference("notifications", "financialAlerts", checked)}
                label="Alertas Financeiros"
                description="Receba avisos sobre transações e metas financeiras"
              />
            </div>
          </Card>

          <Card className="p-4 sm:p-6 border-[var(--destructive)]">
            <h3 className="text-base sm:text-lg font-semibold mb-4 flex items-center gap-2 text-[var(--destructive)]">
              <LogOut className="h-5 w-5" />
              Zona de Perigo
            </h3>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-[var(--text-secondary)] mb-3">
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
      {activeTab === "preferences" && !prefsLoading && (
        <div className="grid gap-4 sm:gap-6 max-w-3xl">
          {/* UI Preferences */}
          <Card className="p-4 sm:p-6">
            <h3 className="text-base sm:text-lg font-semibold mb-4 flex items-center gap-2 text-[var(--text)]">
              <Palette className="h-5 w-5" />
              Interface e Aparência
            </h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-[var(--text)]">Visualização Padrão - Clientes</Label>
                <select
                  value={preferences.ui.defaultClientsView}
                  onChange={(e) => setPreference("ui", "defaultClientsView", e.target.value as "grid" | "list")}
                  className="w-full px-3 py-2 rounded-md border border-[var(--border)] bg-[var(--background)] text-[var(--text)]"
                >
                  <option value="grid">Grade</option>
                  <option value="list">Lista</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label className="text-[var(--text)]">Visualização Padrão - Projetos</Label>
                <select
                  value={preferences.ui.defaultProjectsView}
                  onChange={(e) => setPreference("ui", "defaultProjectsView", e.target.value as "grid" | "list")}
                  className="w-full px-3 py-2 rounded-md border border-[var(--border)] bg-[var(--background)] text-[var(--text)]"
                >
                  <option value="grid">Grade</option>
                  <option value="list">Lista</option>
                </select>
              </div>

              <Switch
                checked={preferences.ui.compactMode}
                onCheckedChange={(checked) => setPreference("ui", "compactMode", checked)}
                label="Modo Compacto"
                description="Reduza o espaçamento entre elementos para exibir mais informações"
              />

              <Switch
                checked={preferences.ui.showAvatars}
                onCheckedChange={(checked) => setPreference("ui", "showAvatars", checked)}
                label="Mostrar Avatares"
                description="Exiba fotos de perfil nas listas e cards"
              />
            </div>
          </Card>

          {/* Meetings & AI */}
          <Card className="p-4 sm:p-6">
            <h3 className="text-base sm:text-lg font-semibold mb-4 flex items-center gap-2 text-[var(--text)]">
              <Brain className="h-5 w-5" />
              Reuniões & IA
            </h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-[var(--text)]">Status Padrão</Label>
                <select
                  value={preferences.meetings.defaultStatus}
                  onChange={(e) => setPreference("meetings", "defaultStatus", e.target.value as any)}
                  className="w-full px-3 py-2 rounded-md border border-[var(--border)] bg-[var(--background)] text-[var(--text)]"
                >
                  <option value="all">Todas</option>
                  <option value="scheduled">Agendadas</option>
                  <option value="in_progress">Em Andamento</option>
                  <option value="completed">Concluídas</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label className="text-[var(--text)]">Modelo de Ata Padrão</Label>
                <select
                  value={preferences.meetings.defaultTemplate}
                  onChange={(e) => setPreference("meetings", "defaultTemplate", e.target.value as any)}
                  className="w-full px-3 py-2 rounded-md border border-[var(--border)] bg-[var(--background)] text-[var(--text)]"
                >
                  <option value="standard">Padrão</option>
                  <option value="formal">Formal</option>
                  <option value="informal">Informal</option>
                  <option value="technical">Técnica</option>
                  <option value="board">Conselho/Diretoria</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label className="text-[var(--text)]">Provedor de IA</Label>
                <select
                  value={preferences.meetings.aiProvider}
                  onChange={(e) => setPreference("meetings", "aiProvider", e.target.value as any)}
                  className="w-full px-3 py-2 rounded-md border border-[var(--border)] bg-[var(--background)] text-[var(--text)]"
                >
                  <option value="openai">OpenAI</option>
                  <option value="anthropic">Anthropic (Claude)</option>
                  <option value="mock">Mock (Teste)</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label className="text-[var(--text)]">Modelo de IA</Label>
                <Input
                  value={preferences.meetings.aiModel}
                  onChange={(e) => setPreference("meetings", "aiModel", e.target.value)}
                  placeholder="gpt-4o-mini"
                />
              </div>

              <Switch
                checked={preferences.meetings.autoGenerateSummary}
                onCheckedChange={(checked) => setPreference("meetings", "autoGenerateSummary", checked)}
                label="Gerar Resumo Automaticamente"
                description="Crie resumos de IA automaticamente após transcrições"
              />
            </div>
          </Card>

          {/* Calendar & Time */}
          <Card className="p-4 sm:p-6">
            <h3 className="text-base sm:text-lg font-semibold mb-4 flex items-center gap-2 text-[var(--text)]">
              <Clock className="h-5 w-5" />
              Calendário & Tempo
            </h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-[var(--text)]">Aba Padrão</Label>
                <select
                  value={preferences.calendar.defaultView}
                  onChange={(e) => setPreference("calendar", "defaultView", e.target.value as any)}
                  className="w-full px-3 py-2 rounded-md border border-[var(--border)] bg-[var(--background)] text-[var(--text)]"
                >
                  <option value="timer">Timer</option>
                  <option value="calendar">Calendário</option>
                  <option value="tasks">Tarefas</option>
                  <option value="team">Equipe</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[var(--text)]">Horário de Início</Label>
                  <Input
                    type="time"
                    value={preferences.calendar.workingHoursStart}
                    onChange={(e) => setPreference("calendar", "workingHoursStart", e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-[var(--text)]">Horário de Término</Label>
                  <Input
                    type="time"
                    value={preferences.calendar.workingHoursEnd}
                    onChange={(e) => setPreference("calendar", "workingHoursEnd", e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-[var(--text)]">Valor Hora Padrão (R$)</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={preferences.calendar.defaultHourlyRate}
                  onChange={(e) => setPreference("calendar", "defaultHourlyRate", parseFloat(e.target.value))}
                />
              </div>

              <Switch
                checked={preferences.calendar.autoStartTimer}
                onCheckedChange={(checked) => setPreference("calendar", "autoStartTimer", checked)}
                label="Iniciar Timer Automaticamente"
                description="Inicie o timer automaticamente ao selecionar um projeto"
              />
            </div>
          </Card>

          {/* Finance */}
          <Card className="p-4 sm:p-6">
            <h3 className="text-base sm:text-lg font-semibold mb-4 flex items-center gap-2 text-[var(--text)]">
              <DollarSign className="h-5 w-5" />
              Finanças
            </h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-[var(--text)]">Moeda</Label>
                <Input
                  value={preferences.finance.currency}
                  onChange={(e) => setPreference("finance", "currency", e.target.value)}
                  placeholder="BRL"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-[var(--text)]">Margem de Lucro Padrão (%)</Label>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  value={preferences.finance.defaultProfitMargin}
                  onChange={(e) => setPreference("finance", "defaultProfitMargin", parseFloat(e.target.value))}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-[var(--text)]">Método de Pagamento Padrão</Label>
                <select
                  value={preferences.finance.defaultPaymentMethod}
                  onChange={(e) => setPreference("finance", "defaultPaymentMethod", e.target.value as any)}
                  className="w-full px-3 py-2 rounded-md border border-[var(--border)] bg-[var(--background)] text-[var(--text)]"
                >
                  <option value="pix">PIX</option>
                  <option value="boleto">Boleto</option>
                  <option value="card">Cartão</option>
                  <option value="transfer">Transferência</option>
                  <option value="cash">Dinheiro</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[var(--text)] text-xs sm:text-sm">Meta Receita Mensal (R$)</Label>
                  <Input
                    type="number"
                    min="0"
                    value={preferences.finance.monthlyRevenueGoal}
                    onChange={(e) => setPreference("finance", "monthlyRevenueGoal", parseFloat(e.target.value))}
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-[var(--text)] text-xs sm:text-sm">Meta Lucro Mensal (R$)</Label>
                  <Input
                    type="number"
                    min="0"
                    value={preferences.finance.monthlyProfitGoal}
                    onChange={(e) => setPreference("finance", "monthlyProfitGoal", parseFloat(e.target.value))}
                  />
                </div>
              </div>
            </div>
          </Card>

          {/* Projects */}
          <Card className="p-4 sm:p-6">
            <h3 className="text-base sm:text-lg font-semibold mb-4 flex items-center gap-2 text-[var(--text)]">
              <FolderKanban className="h-5 w-5" />
              Projetos
            </h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-[var(--text)]">Prioridade Padrão</Label>
                <select
                  value={preferences.projects.defaultPriority}
                  onChange={(e) => setPreference("projects", "defaultPriority", e.target.value as any)}
                  className="w-full px-3 py-2 rounded-md border border-[var(--border)] bg-[var(--background)] text-[var(--text)]"
                >
                  <option value="low">Baixa</option>
                  <option value="medium">Média</option>
                  <option value="high">Alta</option>
                  <option value="urgent">Urgente</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label className="text-[var(--text)]">Status Padrão</Label>
                <select
                  value={preferences.projects.defaultStatus}
                  onChange={(e) => setPreference("projects", "defaultStatus", e.target.value as any)}
                  className="w-full px-3 py-2 rounded-md border border-[var(--border)] bg-[var(--background)] text-[var(--text)]"
                >
                  <option value="planning">Planejamento</option>
                  <option value="in_progress">Em Andamento</option>
                  <option value="completed">Concluído</option>
                  <option value="paused">Pausado</option>
                  <option value="cancelled">Cancelado</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[var(--text)]">Ordenar Por</Label>
                  <select
                    value={preferences.projects.sortBy}
                    onChange={(e) => setPreference("projects", "sortBy", e.target.value as any)}
                    className="w-full px-3 py-2 rounded-md border border-[var(--border)] bg-[var(--background)] text-[var(--text)]"
                  >
                    <option value="date">Data</option>
                    <option value="status">Status</option>
                    <option value="client">Cliente</option>
                    <option value="priority">Prioridade</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label className="text-[var(--text)]">Ordem</Label>
                  <select
                    value={preferences.projects.sortOrder}
                    onChange={(e) => setPreference("projects", "sortOrder", e.target.value as any)}
                    className="w-full px-3 py-2 rounded-md border border-[var(--border)] bg-[var(--background)] text-[var(--text)]"
                  >
                    <option value="asc">Crescente</option>
                    <option value="desc">Decrescente</option>
                  </select>
                </div>
              </div>
            </div>
          </Card>

          {/* Media */}
          <Card className="p-4 sm:p-6">
            <h3 className="text-base sm:text-lg font-semibold mb-4 flex items-center gap-2 text-[var(--text)]">
              <Video className="h-5 w-5" />
              Mídia e Gravações
            </h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-[var(--text)]">Qualidade Padrão</Label>
                <select
                  value={preferences.media.defaultQuality}
                  onChange={(e) => setPreference("media", "defaultQuality", e.target.value as any)}
                  className="w-full px-3 py-2 rounded-md border border-[var(--border)] bg-[var(--background)] text-[var(--text)]"
                >
                  <option value="low">Baixa (360p)</option>
                  <option value="medium">Média (720p)</option>
                  <option value="high">Alta (1080p)</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label className="text-[var(--text)]">Tamanho Máximo de Arquivo (MB)</Label>
                <Input
                  type="number"
                  min="1"
                  max="100"
                  value={preferences.media.maxFileSize / 1048576}
                  onChange={(e) => setPreference("media", "maxFileSize", parseFloat(e.target.value) * 1048576)}
                />
              </div>

              <Switch
                checked={preferences.media.autoGenerateThumbnails}
                onCheckedChange={(checked) => setPreference("media", "autoGenerateThumbnails", checked)}
                label="Gerar Miniaturas Automaticamente"
                description="Crie miniaturas para vídeos e imagens ao fazer upload"
              />
            </div>
          </Card>
        </div>
      )}

      {/* Advanced Tab */}
      {activeTab === "advanced" && (
        <div className="grid gap-4 sm:gap-6 max-w-2xl">
          <Card className="p-4 sm:p-6">
            <h3 className="text-base sm:text-lg font-semibold mb-4 flex items-center gap-2 text-[var(--text)]">
              <Globe className="h-5 w-5" />
              Idioma e Região
            </h3>
            <div className="space-y-3">
              <div>
                <Label className="text-[var(--text)]">Idioma</Label>
                <Input value="Português (Brasil)" disabled className="bg-[var(--muted)] mt-2" />
              </div>
              <div>
                <Label className="text-[var(--text)]">Fuso Horário</Label>
                <Input value="América/São Paulo (GMT-3)" disabled className="bg-[var(--muted)] mt-2" />
              </div>
            </div>
          </Card>

          <Card className="p-4 sm:p-6">
            <h3 className="text-base sm:text-lg font-semibold mb-4 flex items-center gap-2 text-[var(--text)]">
              <RotateCcw className="h-5 w-5" />
              Restaurar Padrões
            </h3>
            <div className="space-y-3">
              <p className="text-sm text-[var(--text-secondary)]">
                Restaure todas as preferências para os valores padrão do sistema.
                Esta ação não afetará seus dados pessoais ou projetos.
              </p>
              <Button variant="outline" onClick={handleResetPreferences}>
                <RotateCcw className="h-4 w-4 mr-2" />
                Restaurar Preferências
              </Button>
            </div>
          </Card>

          <Card className="p-4 sm:p-6">
            <h3 className="text-base sm:text-lg font-semibold mb-4 flex items-center gap-2 text-[var(--text)]">
              <HelpCircle className="h-5 w-5" />
              Ajuda
            </h3>
            <div className="space-y-3">
              <Button variant="outline" className="w-full justify-start">
                <HelpCircle className="h-4 w-4 mr-2" />
                Central de Ajuda
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Mail className="h-4 w-4 mr-2" />
                Entrar em Contato
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
