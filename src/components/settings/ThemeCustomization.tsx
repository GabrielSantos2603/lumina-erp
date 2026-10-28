import { useState, useEffect } from "react";
import { useThemePreferences } from "@/hooks/useThemePreferences";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Palette,
  RotateCcw,
  Save,
  Sun,
  Moon,
  Sparkles,
  Type,
  Boxes,
} from "lucide-react";

export function ThemeCustomization() {
  const {
    preferences,
    loading,
    isDark,
    currentColors,
    updateColors,
    resetColors,
  } = useThemePreferences();

  // Estados locais para edição
  const [lightPrimary, setLightPrimary] = useState(currentColors.primaryColor);
  const [lightSecondary, setLightSecondary] = useState(currentColors.secondaryColor);
  const [lightAccent, setLightAccent] = useState(currentColors.accentColor);
  const [lightText, setLightText] = useState(currentColors.textColor);
  const [lightIcon, setLightIcon] = useState(currentColors.iconColor);

  const [darkPrimary, setDarkPrimary] = useState(preferences?.darkTheme.primaryColor || "#818cf8");
  const [darkSecondary, setDarkSecondary] = useState(preferences?.darkTheme.secondaryColor || "#a78bfa");
  const [darkAccent, setDarkAccent] = useState(preferences?.darkTheme.accentColor || "#22d3ee");
  const [darkText, setDarkText] = useState(preferences?.darkTheme.textColor || "#f1f5f9");
  const [darkIcon, setDarkIcon] = useState(preferences?.darkTheme.iconColor || "#94a3b8");

  const [saving, setSaving] = useState(false);

  // Atualizar estados quando preferências carregarem
  useEffect(() => {
    if (preferences) {
      setLightPrimary(preferences.lightTheme.primaryColor);
      setLightSecondary(preferences.lightTheme.secondaryColor);
      setLightAccent(preferences.lightTheme.accentColor);
      setLightText(preferences.lightTheme.textColor);
      setLightIcon(preferences.lightTheme.iconColor);

      setDarkPrimary(preferences.darkTheme.primaryColor);
      setDarkSecondary(preferences.darkTheme.secondaryColor);
      setDarkAccent(preferences.darkTheme.accentColor);
      setDarkText(preferences.darkTheme.textColor);
      setDarkIcon(preferences.darkTheme.iconColor);
    }
  }, [preferences]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const success = await updateColors(
        {
          primaryColor: lightPrimary,
          secondaryColor: lightSecondary,
          accentColor: lightAccent,
          textColor: lightText,
          iconColor: lightIcon,
        },
        {
          primaryColor: darkPrimary,
          secondaryColor: darkSecondary,
          accentColor: darkAccent,
          textColor: darkText,
          iconColor: darkIcon,
        }
      );

      if (success) {
        alert("Cores personalizadas salvas com sucesso!");
      } else {
        alert("Erro ao salvar cores");
      }
    } catch (error) {
      console.error(error);
      alert("Erro ao salvar cores");
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    const confirmed = window.confirm(
      "Tem certeza que deseja restaurar as cores padrão?"
    );
    if (!confirmed) return;

    setSaving(true);
    try {
      const success = await resetColors();
      if (success) {
        alert("Cores restauradas para o padrão!");
      } else {
        alert("Erro ao restaurar cores");
      }
    } catch (error) {
      console.error(error);
      alert("Erro ao restaurar cores");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-lumina-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-lumina-500 to-purple-600 flex items-center justify-center">
          <Palette className="h-6 w-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Personalização de Cores</h1>
          <p className="text-sm text-muted-foreground">
            Customize as cores do aplicativo para temas claro e escuro
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Tema Claro */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-6">
            <Sun className="h-5 w-5 text-amber-500" />
            <h2 className="text-lg font-semibold">Tema Claro</h2>
          </div>

          <div className="space-y-4">
            {/* Cor Principal */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                Cor Principal
              </Label>
              <div className="flex gap-2">
                <Input
                  type="color"
                  value={lightPrimary}
                  onChange={(e) => setLightPrimary(e.target.value)}
                  className="w-20 h-10 cursor-pointer"
                />
                <Input
                  type="text"
                  value={lightPrimary}
                  onChange={(e) => setLightPrimary(e.target.value)}
                  placeholder="#6366f1"
                  className="flex-1"
                />
              </div>
            </div>

            {/* Cor Secundária */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                Cor Secundária
              </Label>
              <div className="flex gap-2">
                <Input
                  type="color"
                  value={lightSecondary}
                  onChange={(e) => setLightSecondary(e.target.value)}
                  className="w-20 h-10 cursor-pointer"
                />
                <Input
                  type="text"
                  value={lightSecondary}
                  onChange={(e) => setLightSecondary(e.target.value)}
                  placeholder="#8b5cf6"
                  className="flex-1"
                />
              </div>
            </div>

            {/* Cor de Destaque */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                Cor de Destaque
              </Label>
              <div className="flex gap-2">
                <Input
                  type="color"
                  value={lightAccent}
                  onChange={(e) => setLightAccent(e.target.value)}
                  className="w-20 h-10 cursor-pointer"
                />
                <Input
                  type="text"
                  value={lightAccent}
                  onChange={(e) => setLightAccent(e.target.value)}
                  placeholder="#06b6d4"
                  className="flex-1"
                />
              </div>
            </div>

            {/* Cor do Texto */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Type className="h-4 w-4" />
                Cor do Texto
              </Label>
              <div className="flex gap-2">
                <Input
                  type="color"
                  value={lightText}
                  onChange={(e) => setLightText(e.target.value)}
                  className="w-20 h-10 cursor-pointer"
                />
                <Input
                  type="text"
                  value={lightText}
                  onChange={(e) => setLightText(e.target.value)}
                  placeholder="#0f172a"
                  className="flex-1"
                />
              </div>
            </div>

            {/* Cor dos Ícones */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Boxes className="h-4 w-4" />
                Cor dos Ícones
              </Label>
              <div className="flex gap-2">
                <Input
                  type="color"
                  value={lightIcon}
                  onChange={(e) => setLightIcon(e.target.value)}
                  className="w-20 h-10 cursor-pointer"
                />
                <Input
                  type="text"
                  value={lightIcon}
                  onChange={(e) => setLightIcon(e.target.value)}
                  placeholder="#64748b"
                  className="flex-1"
                />
              </div>
            </div>
          </div>
        </Card>

        {/* Tema Escuro */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-6">
            <Moon className="h-5 w-5 text-blue-500" />
            <h2 className="text-lg font-semibold">Tema Escuro</h2>
          </div>

          <div className="space-y-4">
            {/* Cor Principal */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                Cor Principal
              </Label>
              <div className="flex gap-2">
                <Input
                  type="color"
                  value={darkPrimary}
                  onChange={(e) => setDarkPrimary(e.target.value)}
                  className="w-20 h-10 cursor-pointer"
                />
                <Input
                  type="text"
                  value={darkPrimary}
                  onChange={(e) => setDarkPrimary(e.target.value)}
                  placeholder="#818cf8"
                  className="flex-1"
                />
              </div>
            </div>

            {/* Cor Secundária */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                Cor Secundária
              </Label>
              <div className="flex gap-2">
                <Input
                  type="color"
                  value={darkSecondary}
                  onChange={(e) => setDarkSecondary(e.target.value)}
                  className="w-20 h-10 cursor-pointer"
                />
                <Input
                  type="text"
                  value={darkSecondary}
                  onChange={(e) => setDarkSecondary(e.target.value)}
                  placeholder="#a78bfa"
                  className="flex-1"
                />
              </div>
            </div>

            {/* Cor de Destaque */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                Cor de Destaque
              </Label>
              <div className="flex gap-2">
                <Input
                  type="color"
                  value={darkAccent}
                  onChange={(e) => setDarkAccent(e.target.value)}
                  className="w-20 h-10 cursor-pointer"
                />
                <Input
                  type="text"
                  value={darkAccent}
                  onChange={(e) => setDarkAccent(e.target.value)}
                  placeholder="#22d3ee"
                  className="flex-1"
                />
              </div>
            </div>

            {/* Cor do Texto */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Type className="h-4 w-4" />
                Cor do Texto
              </Label>
              <div className="flex gap-2">
                <Input
                  type="color"
                  value={darkText}
                  onChange={(e) => setDarkText(e.target.value)}
                  className="w-20 h-10 cursor-pointer"
                />
                <Input
                  type="text"
                  value={darkText}
                  onChange={(e) => setDarkText(e.target.value)}
                  placeholder="#f1f5f9"
                  className="flex-1"
                />
              </div>
            </div>

            {/* Cor dos Ícones */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Boxes className="h-4 w-4" />
                Cor dos Ícones
              </Label>
              <div className="flex gap-2">
                <Input
                  type="color"
                  value={darkIcon}
                  onChange={(e) => setDarkIcon(e.target.value)}
                  className="w-20 h-10 cursor-pointer"
                />
                <Input
                  type="text"
                  value={darkIcon}
                  onChange={(e) => setDarkIcon(e.target.value)}
                  placeholder="#94a3b8"
                  className="flex-1"
                />
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Preview Section */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Preview - Tema {isDark ? "Escuro" : "Claro"}</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">Cor Principal</p>
            <div className="h-16 rounded-lg border-2" style={{ backgroundColor: isDark ? darkPrimary : lightPrimary }} />
          </div>
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">Cor Secundária</p>
            <div className="h-16 rounded-lg border-2" style={{ backgroundColor: isDark ? darkSecondary : lightSecondary }} />
          </div>
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">Cor de Destaque</p>
            <div className="h-16 rounded-lg border-2" style={{ backgroundColor: isDark ? darkAccent : lightAccent }} />
          </div>
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">Cores de Texto/Ícone</p>
            <div className="h-16 rounded-lg border-2 flex items-center justify-center gap-2" style={{ borderColor: isDark ? darkIcon : lightIcon }}>
              <Type className="h-6 w-6" style={{ color: isDark ? darkText : lightText }} />
              <Boxes className="h-6 w-6" style={{ color: isDark ? darkIcon : lightIcon }} />
            </div>
          </div>
        </div>
      </Card>

      {/* Actions */}
      <div className="flex gap-3">
        <Button
          onClick={handleSave}
          disabled={saving}
          className="flex-1"
          size="lg"
        >
          <Save className="h-4 w-4 mr-2" />
          {saving ? "Salvando..." : "Salvar Configurações"}
        </Button>
        <Button
          onClick={handleReset}
          disabled={saving}
          variant="outline"
          size="lg"
        >
          <RotateCcw className="h-4 w-4 mr-2" />
          Restaurar Padrão
        </Button>
      </div>
    </div>
  );
}
