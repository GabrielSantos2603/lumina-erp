import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Building2,
  Mail,
  Phone,
  CheckCircle2,
  Sparkles,
  AlertCircle
} from "lucide-react";
import { companyService } from "@/services/companyService";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/store/authStore";
import toast from "react-hot-toast";

export function CompanySetupPage() {
  const navigate = useNavigate();
  const { profile } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    company_name: "",
    email: "",
    phone: "",
  });

  const [errors, setErrors] = useState({
    company_name: "",
    email: "",
    phone: "",
  });

  useEffect(() => {
    const loadData = async () => {
      // Pre-preencher email com email do perfil
      if (profile?.email) {
        setFormData(prev => ({ ...prev, email: profile.email }));
      }
      
      // Carregar dados existentes se houver
      try {
        const company = await companyService.getMyCompany();
        if (company) {
          setFormData({
            company_name: company.company_name || "",
            email: company.email || profile?.email || "",
            phone: company.phone || "",
          });
        }
      } catch (error) {
        console.error("Erro ao carregar empresa:", error);
      }
    };
    
    loadData();
  }, [profile]);

  // Validação Email
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Validação Telefone (mínimo 10 dígitos)
  const validatePhone = (phone: string): boolean => {
    const cleanPhone = phone.replace(/\D/g, '');
    return cleanPhone.length >= 10;
  };

  const validateForm = (): boolean => {
    const newErrors = { ...errors };
    let isValid = true;

    // Validar Razão Social
    if (!formData.company_name.trim()) {
      newErrors.company_name = "Razão Social é obrigatória";
      isValid = false;
    } else if (formData.company_name.length < 3) {
      newErrors.company_name = "Razão Social deve ter no mínimo 3 caracteres";
      isValid = false;
    } else {
      newErrors.company_name = "";
    }

    // Validar Email
    if (!formData.email.trim()) {
      newErrors.email = "E-mail é obrigatório";
      isValid = false;
    } else if (!validateEmail(formData.email)) {
      newErrors.email = "E-mail inválido";
      isValid = false;
    } else {
      newErrors.email = "";
    }

    // Validar Telefone
    if (!formData.phone.trim()) {
      newErrors.phone = "Telefone é obrigatório";
      isValid = false;
    } else if (!validatePhone(formData.phone)) {
      newErrors.phone = "Telefone deve ter no mínimo 10 dígitos";
      isValid = false;
    } else {
      newErrors.phone = "";
    }

    setErrors(newErrors);
    return isValid;
  };

  const formatPhone = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length <= 10) {
      const match = cleaned.match(/^(\d{2})(\d{4})(\d{4})$/);
      if (match) {
        return `(${match[1]}) ${match[2]}-${match[3]}`;
      }
    } else {
      const match = cleaned.match(/^(\d{2})(\d{5})(\d{4})$/);
      if (match) {
        return `(${match[1]}) ${match[2]}-${match[3]}`;
      }
    }
    return cleaned;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhone(e.target.value);
    setFormData({ ...formData, phone: formatted });
    if (errors.phone) {
      setErrors({ ...errors, phone: "" });
    }
  };

  const handleFinish = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    const toastId = toast.loading("Salvando informações...");

    try {
      // Verificar se já existe empresa
      const existingCompany = await companyService.getMyCompany();

      if (existingCompany) {
        // Atualizar empresa existente
        await companyService.updateCompany(existingCompany.id, {
          company_name: formData.company_name,
          email: formData.email,
          phone: formData.phone,
        });
      } else {
        // Criar nova empresa
        await companyService.createCompany({
          company_name: formData.company_name,
          email: formData.email,
          phone: formData.phone,
        });
      }

      // Atualizar organization (para manter sincronizado)
      if (profile) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('organization_id')
          .eq('id', profile.id)
          .single();

        if (profileData?.organization_id) {
          await supabase
            .from('organizations')
            .update({ 
              company_name: formData.company_name,
            })
            .eq('id', profileData.organization_id);
        }
      }

      toast.success("Empresa configurada com sucesso! 🎉", { id: toastId });
      
      // Redirecionar para o dashboard
      setTimeout(() => {
        navigate("/");
      }, 500);

    } catch (error) {
      console.error("Erro ao salvar empresa:", error);
      toast.error("Erro ao salvar informações. Tente novamente.", { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-lumina-600 via-purple-600 to-indigo-700 flex items-center justify-center p-4">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl" />
      </div>

      <Card className="w-full max-w-2xl shadow-2xl backdrop-blur-sm bg-white/95 dark:bg-gray-900/95 relative z-10">
        <CardHeader className="text-center space-y-2 pb-4">
          <div className="flex justify-center mb-2">
            <div className="relative">
              <Building2 className="h-16 w-16 text-lumina-600" />
              <Sparkles className="h-6 w-6 text-yellow-500 absolute -top-1 -right-1 animate-pulse" />
            </div>
          </div>
          <CardTitle className="text-3xl font-bold bg-gradient-to-r from-lumina-600 to-purple-600 bg-clip-text text-transparent">
            Configure sua Empresa
          </CardTitle>
          <CardDescription className="text-base">
            Preencha as informações essenciais para começar
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Formulário único */}
          <div className="space-y-4 animate-in fade-in-50 duration-300">
            <div className="bg-blue-50 dark:bg-blue-950/30 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="flex gap-3">
                <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                    Informações Essenciais
                  </p>
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    Esses dados são necessários para identificação da sua empresa no sistema.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="company_name" className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-lumina-600" />
                Razão Social *
              </Label>
              <Input
                id="company_name"
                value={formData.company_name}
                onChange={(e) => {
                  setFormData({ ...formData, company_name: e.target.value });
                  if (errors.company_name) {
                    setErrors({ ...errors, company_name: "" });
                  }
                }}
                placeholder="Ex: Lumina AI Labs LTDA"
                className={errors.company_name ? "border-red-500" : ""}
                disabled={loading}
              />
              {errors.company_name && (
                <p className="text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.company_name}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-lumina-600" />
                E-mail Corporativo *
              </Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => {
                  setFormData({ ...formData, email: e.target.value });
                  if (errors.email) {
                    setErrors({ ...errors, email: "" });
                  }
                }}
                placeholder="contato@empresa.com.br"
                className={errors.email ? "border-red-500" : ""}
                disabled={loading}
              />
              {errors.email && (
                <p className="text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.email}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone" className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-lumina-600" />
                Telefone/Celular *
              </Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={handlePhoneChange}
                placeholder="(00) 00000-0000"
                maxLength={15}
                className={errors.phone ? "border-red-500" : ""}
                disabled={loading}
              />
              {errors.phone && (
                <p className="text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.phone}
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                Digite apenas os números, a formatação será automática
              </p>
            </div>

            <div className="flex justify-end pt-4">
              <Button 
                onClick={handleFinish}
                className="gap-2 bg-gradient-to-r from-lumina-600 to-purple-600 hover:from-lumina-700 hover:to-purple-700"
                disabled={loading}
              >
                {loading ? "Salvando..." : "Salvar e Continuar"}
                <CheckCircle2 className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Footer info */}
          <div className="pt-4 border-t">
            <div className="flex items-start gap-2 text-sm text-muted-foreground">
              <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
              <p>
                Você poderá adicionar mais informações depois em{" "}
                <span className="font-medium text-lumina-600">Minha Empresa</span>, como CNPJ, endereço completo, dados bancários e configurações visuais.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
