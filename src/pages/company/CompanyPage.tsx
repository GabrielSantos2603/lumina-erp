import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Building2,
  MapPin,
  Phone,
  Mail,
  Globe,
  CreditCard,
  FileText,
  Palette,
  Users,
  Calendar,
  DollarSign,
  Instagram,
  Facebook,
  Linkedin,
  Image as ImageIcon,
  Save,
  Search,
  AlertCircle,
  CheckCircle2,
  Upload
} from "lucide-react";
import { DynamicContainer } from "@/components/responsive";
import { companyService, type Company } from "@/services/companyService";
import toast from "react-hot-toast";

export function CompanyPage() {
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [company, setCompany] = useState<Company | null>(null);
  const [activeTab, setActiveTab] = useState<"basic" | "address" | "banking" | "fiscal" | "design" | "social">("basic");
  const [searchingCNPJ, setSearchingCNPJ] = useState(false);
  const [searchingZipCode, setSearchingZipCode] = useState(false);

  const [formData, setFormData] = useState({
    // Informações Básicas
    company_name: "",
    trading_name: "",
    legal_nature: "",
    cnpj: "",
    state_registration: "",
    municipal_registration: "",
    email: "",
    phone: "",
    mobile: "",
    website: "",
    
    // Endereço
    zip_code: "",
    street: "",
    number: "",
    complement: "",
    neighborhood: "",
    city: "",
    state: "",
    country: "Brasil",
    
    // Dados Bancários
    bank_name: "",
    bank_code: "",
    agency: "",
    account_number: "",
    account_type: "",
    pix_key: "",
    pix_type: "",
    
    // Informações Fiscais
    tax_regime: "",
    cnae: "",
    cnae_description: "",
    
    // Configurações
    logo_url: "",
    primary_color: "#7C3AED",
    secondary_color: "#A78BFA",
    
    // Informações Adicionais
    founded_date: "",
    employee_count: 0,
    annual_revenue: 0,
    
    // Redes Sociais
    instagram: "",
    facebook: "",
    linkedin: "",
    behance: "",
  });

  useEffect(() => {
    loadCompany();
  }, []);

  async function loadCompany() {
    try {
      setInitialLoading(true);
      const data = await companyService.getMyCompany();
      if (data) {
        setCompany(data);
        setFormData({
          company_name: data.company_name || "",
          trading_name: data.trading_name || "",
          legal_nature: data.legal_nature || "",
          cnpj: data.cnpj || "",
          state_registration: data.state_registration || "",
          municipal_registration: data.municipal_registration || "",
          email: data.email || "",
          phone: data.phone || "",
          mobile: data.mobile || "",
          website: data.website || "",
          zip_code: data.zip_code || "",
          street: data.street || "",
          number: data.number || "",
          complement: data.complement || "",
          neighborhood: data.neighborhood || "",
          city: data.city || "",
          state: data.state || "",
          country: data.country || "Brasil",
          bank_name: data.bank_name || "",
          bank_code: data.bank_code || "",
          agency: data.agency || "",
          account_number: data.account_number || "",
          account_type: data.account_type || "",
          pix_key: data.pix_key || "",
          pix_type: data.pix_type || "",
          tax_regime: data.tax_regime || "",
          cnae: data.cnae || "",
          cnae_description: data.cnae_description || "",
          logo_url: data.logo_url || "",
          primary_color: data.primary_color || "#7C3AED",
          secondary_color: data.secondary_color || "#A78BFA",
          founded_date: data.founded_date || "",
          employee_count: data.employee_count || 0,
          annual_revenue: data.annual_revenue || 0,
          instagram: data.instagram || "",
          facebook: data.facebook || "",
          linkedin: data.linkedin || "",
          behance: data.behance || "",
        });
      }
    } catch (error) {
      console.error("Erro ao carregar empresa:", error);
      toast.error("Erro ao carregar dados da empresa");
    } finally {
      setInitialLoading(false);
    }
  }

  async function handleSave() {
    console.log("🔍 handleSave chamado", { company_name: formData.company_name, hasCompany: !!company });
    
    if (!formData.company_name) {
      toast.error("Nome da empresa é obrigatório");
      return;
    }

    try {
      setLoading(true);
      console.log("💾 Salvando empresa...", company ? "UPDATE" : "CREATE");
      
      if (company) {
        const result = await companyService.updateCompany(company.id, formData);
        console.log("✅ Empresa atualizada:", result);
        toast.success("Empresa atualizada com sucesso!");
      } else {
        const result = await companyService.createCompany(formData);
        console.log("✅ Empresa criada:", result);
        toast.success("Empresa cadastrada com sucesso!");
      }
      
      await loadCompany();
    } catch (error: any) {
      console.error("❌ Erro ao salvar empresa:", error);
      
      // Mensagens de erro mais específicas
      if (error.message?.includes("relation") || error.message?.includes("does not exist")) {
        toast.error("Erro: Tabela 'companies' não existe no banco. Execute o SQL primeiro!");
      } else if (error.message?.includes("authentication")) {
        toast.error("Erro: Você precisa estar autenticado");
      } else if (error.code === "23505") {
        toast.error("Erro: CNPJ já cadastrado");
      } else if (error.code === "22007" || error.message?.includes("invalid input syntax for type date")) {
        toast.error("Erro: Data de fundação inválida. Deixe em branco ou use formato válido.");
      } else if (error.message) {
        toast.error(`Erro: ${error.message}`);
      } else {
        toast.error("Erro desconhecido ao salvar empresa");
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleSearchCNPJ() {
    if (!formData.cnpj) {
      toast.error("Digite um CNPJ");
      return;
    }

    try {
      setSearchingCNPJ(true);
      const data = await companyService.searchCNPJ(formData.cnpj);
      if (data) {
        setFormData(prev => ({
          ...prev,
          company_name: data.company_name || prev.company_name,
          trading_name: data.trading_name || prev.trading_name,
          email: data.email || prev.email,
          phone: data.phone || prev.phone,
          zip_code: data.zip_code || prev.zip_code,
          street: data.street || prev.street,
          number: data.number || prev.number,
          neighborhood: data.neighborhood || prev.neighborhood,
          city: data.city || prev.city,
          state: data.state || prev.state,
          cnae: data.cnae || prev.cnae,
          legal_nature: data.legal_nature || prev.legal_nature,
          founded_date: data.founded_date || prev.founded_date,
        }));
        toast.success("Dados do CNPJ carregados!");
      } else {
        toast.error("CNPJ não encontrado");
      }
    } catch (error) {
      console.error("Erro ao buscar CNPJ:", error);
      toast.error("Erro ao buscar CNPJ");
    } finally {
      setSearchingCNPJ(false);
    }
  }

  async function handleSearchZipCode() {
    if (!formData.zip_code) {
      toast.error("Digite um CEP");
      return;
    }

    try {
      setSearchingZipCode(true);
      const data = await companyService.searchZipCode(formData.zip_code);
      if (data) {
        setFormData(prev => ({
          ...prev,
          street: data.street,
          neighborhood: data.neighborhood,
          city: data.city,
          state: data.state,
        }));
        toast.success("Endereço carregado!");
      } else {
        toast.error("CEP não encontrado");
      }
    } catch (error) {
      console.error("Erro ao buscar CEP:", error);
      toast.error("Erro ao buscar CEP");
    } finally {
      setSearchingZipCode(false);
    }
  }

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!company) {
      toast.error("Salve a empresa primeiro antes de fazer upload do logo");
      return;
    }

    try {
      setLoading(true);
      const logoUrl = await companyService.uploadLogo(file, company.id);
      setFormData(prev => ({ ...prev, logo_url: logoUrl }));
      await companyService.updateCompany(company.id, { logo_url: logoUrl });
      toast.success("Logo atualizado com sucesso!");
    } catch (error) {
      console.error("Erro ao fazer upload do logo:", error);
      toast.error("Erro ao fazer upload do logo");
    } finally {
      setLoading(false);
    }
  }

  const tabs = [
    { id: "basic", label: "Informações Básicas", icon: Building2 },
    { id: "address", label: "Endereço", icon: MapPin },
    { id: "banking", label: "Dados Bancários", icon: CreditCard },
    { id: "fiscal", label: "Informações Fiscais", icon: FileText },
    { id: "design", label: "Identidade Visual", icon: Palette },
    { id: "social", label: "Redes Sociais", icon: Globe },
  ];

  // Mostrar loading inicial
  if (initialLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-600 mx-auto"></div>
          <p className="text-muted-foreground">Carregando dados da empresa...</p>
        </div>
      </div>
    );
  }

  return (
    <DynamicContainer className="overflow-x-hidden">
      <div className="space-y-3 sm:space-y-4 lg:space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-3 sm:gap-4 md:flex-row md:items-center md:justify-between">
          <div className="min-w-0 flex-1">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold truncate">Minha Empresa</h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1 truncate">
              Configure todas as informações da sua empresa
            </p>
          </div>
          <Button 
            onClick={handleSave} 
            disabled={loading} 
            size="lg" 
            className="gap-1.5 sm:gap-2 h-9 sm:h-10 lg:h-11 px-3 sm:px-4 lg:px-6 text-xs sm:text-sm lg:text-base bg-violet-600 hover:bg-violet-700 text-white shadow-lg disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto"
          >
            <Save className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">{loading ? "Salvando..." : "Salvar Alterações"}</span>
            <span className="sm:hidden">{loading ? "Salvando..." : "Salvar"}</span>
          </Button>
        </div>

        {/* Status Card */}
        {company && (
          <Card className="border-2 border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20">
            <CardContent className="p-4 sm:p-5 lg:p-6">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="p-2 sm:p-2.5 lg:p-3 bg-green-100 dark:bg-green-900/30 rounded-full flex-shrink-0">
                  <CheckCircle2 className="h-5 w-5 sm:h-5 sm:w-5 lg:h-6 lg:w-6 text-green-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-sm sm:text-base truncate">Empresa Cadastrada</p>
                  <p className="text-xs sm:text-sm text-muted-foreground truncate">
                    Última atualização: {company.updated_at && new Date(company.updated_at).toLocaleString("pt-BR")}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tabs */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-1.5 sm:gap-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <Button
                key={tab.id}
                variant={activeTab === tab.id ? "default" : "outline"}
                onClick={() => setActiveTab(tab.id as any)}
                className="h-auto flex-col gap-1.5 sm:gap-2 py-3 sm:py-4 text-xs sm:text-sm"
              >
                <Icon className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
                <span className="truncate w-full text-center">{tab.label}</span>
              </Button>
            );
          })}
        </div>

      {/* Informações Básicas */}
      {activeTab === "basic" && (
        <Card>
          <CardHeader className="p-3 sm:p-4 lg:p-6">
            <CardTitle className="flex items-center gap-1.5 sm:gap-2 text-sm sm:text-base lg:text-lg">
              <Building2 className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
              <span className="truncate">Informações Básicas da Empresa</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 sm:space-y-4 p-3 sm:p-4 lg:p-6 pt-0">
            {/* CNPJ com busca */}
            <div className="space-y-1.5 sm:space-y-2">
              <Label htmlFor="cnpj" className="text-xs sm:text-sm">CNPJ</Label>
              <div className="flex gap-1.5 sm:gap-2">
                <Input
                  id="cnpj"
                  value={formData.cnpj}
                  onChange={(e) => setFormData({ ...formData, cnpj: e.target.value })}
                  placeholder="00.000.000/0000-00"
                  maxLength={18}
                  className="text-xs sm:text-sm h-8 sm:h-10"
                />
                <Button
                  variant="outline"
                  onClick={handleSearchCNPJ}
                  disabled={searchingCNPJ || !formData.cnpj}
                  className="gap-1.5 sm:gap-2 h-8 sm:h-10 px-2 sm:px-3 lg:px-4 text-xs sm:text-sm flex-shrink-0"
                >
                  <Search className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="hidden sm:inline">{searchingCNPJ ? "Buscando..." : "Buscar"}</span>
                  <span className="sm:hidden">🔍</span>
                </Button>
              </div>
              <p className="text-[10px] sm:text-xs text-muted-foreground">
                Digite o CNPJ e clique em "Buscar" para preencher automaticamente
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
              <div className="space-y-2">
                <Label htmlFor="company_name">Razão Social *</Label>
                <Input
                  id="company_name"
                  value={formData.company_name}
                  onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                  placeholder="Ex: João Silva Arquitetura LTDA"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="trading_name">Nome Fantasia</Label>
                <Input
                  id="trading_name"
                  value={formData.trading_name}
                  onChange={(e) => setFormData({ ...formData, trading_name: e.target.value })}
                  placeholder="Ex: Silva Arquitetura"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="legal_nature">Natureza Jurídica</Label>
                <select
                  id="legal_nature"
                  value={formData.legal_nature}
                  onChange={(e) => setFormData({ ...formData, legal_nature: e.target.value })}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="">Selecione...</option>
                  <option value="MEI">MEI - Microempreendedor Individual</option>
                  <option value="EI">EI - Empresário Individual</option>
                  <option value="LTDA">LTDA - Sociedade Limitada</option>
                  <option value="SA">SA - Sociedade Anônima</option>
                  <option value="EIRELI">EIRELI - Empresa Individual de Resp. Limitada</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="founded_date">Data de Fundação</Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="founded_date"
                    type="date"
                    value={formData.founded_date}
                    onChange={(e) => setFormData({ ...formData, founded_date: e.target.value })}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="state_registration">Inscrição Estadual</Label>
                <Input
                  id="state_registration"
                  value={formData.state_registration}
                  onChange={(e) => setFormData({ ...formData, state_registration: e.target.value })}
                  placeholder="000.000.000.000"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="municipal_registration">Inscrição Municipal</Label>
                <Input
                  id="municipal_registration"
                  value={formData.municipal_registration}
                  onChange={(e) => setFormData({ ...formData, municipal_registration: e.target.value })}
                  placeholder="000.000-0"
                />
              </div>
            </div>

            <div className="border-t pt-4 mt-4">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Phone className="h-4 w-4" />
                Contato
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">E-mail</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="contato@empresa.com"
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Telefone Fixo</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="(11) 3000-0000"
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="mobile">Celular / WhatsApp</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="mobile"
                      value={formData.mobile}
                      onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                      placeholder="(11) 99000-0000"
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="website">Website</Label>
                  <div className="relative">
                    <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="website"
                      value={formData.website}
                      onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                      placeholder="www.empresa.com.br"
                      className="pl-10"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t pt-4 mt-4">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Users className="h-4 w-4" />
                Informações Adicionais
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="employee_count">Número de Colaboradores</Label>
                  <Input
                    id="employee_count"
                    type="number"
                    value={formData.employee_count}
                    onChange={(e) => setFormData({ ...formData, employee_count: parseInt(e.target.value) || 0 })}
                    placeholder="0"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="annual_revenue">Faturamento Anual (R$)</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="annual_revenue"
                      type="number"
                      step="0.01"
                      value={formData.annual_revenue}
                      onChange={(e) => setFormData({ ...formData, annual_revenue: parseFloat(e.target.value) || 0 })}
                      placeholder="0.00"
                      className="pl-10"
                    />
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Endereço */}
      {activeTab === "address" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Endereço da Empresa
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* CEP com busca */}
            <div className="space-y-2">
              <Label htmlFor="zip_code">CEP</Label>
              <div className="flex gap-2">
                <Input
                  id="zip_code"
                  value={formData.zip_code}
                  onChange={(e) => setFormData({ ...formData, zip_code: e.target.value })}
                  placeholder="00000-000"
                  maxLength={9}
                />
                <Button
                  variant="outline"
                  onClick={handleSearchZipCode}
                  disabled={searchingZipCode || !formData.zip_code}
                  className="gap-2"
                >
                  <Search className="h-4 w-4" />
                  {searchingZipCode ? "Buscando..." : "Buscar"}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Digite o CEP e clique em "Buscar" para preencher automaticamente
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2 space-y-2">
                <Label htmlFor="street">Logradouro</Label>
                <Input
                  id="street"
                  value={formData.street}
                  onChange={(e) => setFormData({ ...formData, street: e.target.value })}
                  placeholder="Rua, Avenida, etc"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="number">Número</Label>
                <Input
                  id="number"
                  value={formData.number}
                  onChange={(e) => setFormData({ ...formData, number: e.target.value })}
                  placeholder="123"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="complement">Complemento</Label>
                <Input
                  id="complement"
                  value={formData.complement}
                  onChange={(e) => setFormData({ ...formData, complement: e.target.value })}
                  placeholder="Sala, Andar, etc"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="neighborhood">Bairro</Label>
                <Input
                  id="neighborhood"
                  value={formData.neighborhood}
                  onChange={(e) => setFormData({ ...formData, neighborhood: e.target.value })}
                  placeholder="Centro"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="city">Cidade</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  placeholder="São Paulo"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="state">Estado</Label>
                <select
                  id="state"
                  value={formData.state}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="">Selecione...</option>
                  <option value="AC">Acre</option>
                  <option value="AL">Alagoas</option>
                  <option value="AP">Amapá</option>
                  <option value="AM">Amazonas</option>
                  <option value="BA">Bahia</option>
                  <option value="CE">Ceará</option>
                  <option value="DF">Distrito Federal</option>
                  <option value="ES">Espírito Santo</option>
                  <option value="GO">Goiás</option>
                  <option value="MA">Maranhão</option>
                  <option value="MT">Mato Grosso</option>
                  <option value="MS">Mato Grosso do Sul</option>
                  <option value="MG">Minas Gerais</option>
                  <option value="PA">Pará</option>
                  <option value="PB">Paraíba</option>
                  <option value="PR">Paraná</option>
                  <option value="PE">Pernambuco</option>
                  <option value="PI">Piauí</option>
                  <option value="RJ">Rio de Janeiro</option>
                  <option value="RN">Rio Grande do Norte</option>
                  <option value="RS">Rio Grande do Sul</option>
                  <option value="RO">Rondônia</option>
                  <option value="RR">Roraima</option>
                  <option value="SC">Santa Catarina</option>
                  <option value="SP">São Paulo</option>
                  <option value="SE">Sergipe</option>
                  <option value="TO">Tocantins</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="country">País</Label>
                <Input
                  id="country"
                  value={formData.country}
                  onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                  placeholder="Brasil"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Dados Bancários */}
      {activeTab === "banking" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Dados Bancários
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="bank_name">Banco</Label>
                <Input
                  id="bank_name"
                  value={formData.bank_name}
                  onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })}
                  placeholder="Ex: Banco do Brasil"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bank_code">Código do Banco</Label>
                <Input
                  id="bank_code"
                  value={formData.bank_code}
                  onChange={(e) => setFormData({ ...formData, bank_code: e.target.value })}
                  placeholder="Ex: 001"
                  maxLength={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="agency">Agência</Label>
                <Input
                  id="agency"
                  value={formData.agency}
                  onChange={(e) => setFormData({ ...formData, agency: e.target.value })}
                  placeholder="0000"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="account_number">Número da Conta</Label>
                <Input
                  id="account_number"
                  value={formData.account_number}
                  onChange={(e) => setFormData({ ...formData, account_number: e.target.value })}
                  placeholder="00000-0"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="account_type">Tipo de Conta</Label>
                <select
                  id="account_type"
                  value={formData.account_type}
                  onChange={(e) => setFormData({ ...formData, account_type: e.target.value })}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="">Selecione...</option>
                  <option value="Corrente">Conta Corrente</option>
                  <option value="Poupança">Conta Poupança</option>
                  <option value="Pagamento">Conta Pagamento</option>
                </select>
              </div>
            </div>

            <div className="border-t pt-4 mt-4">
              <h3 className="font-semibold mb-4">Chave PIX</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="pix_type">Tipo de Chave PIX</Label>
                  <select
                    id="pix_type"
                    value={formData.pix_type}
                    onChange={(e) => setFormData({ ...formData, pix_type: e.target.value })}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="">Selecione...</option>
                    <option value="CPF">CPF</option>
                    <option value="CNPJ">CNPJ</option>
                    <option value="Email">E-mail</option>
                    <option value="Telefone">Telefone</option>
                    <option value="Aleatória">Chave Aleatória</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="pix_key">Chave PIX</Label>
                  <Input
                    id="pix_key"
                    value={formData.pix_key}
                    onChange={(e) => setFormData({ ...formData, pix_key: e.target.value })}
                    placeholder="Digite a chave PIX"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Informações Fiscais */}
      {activeTab === "fiscal" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Informações Fiscais e Tributárias
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="tax_regime">Regime Tributário</Label>
                <select
                  id="tax_regime"
                  value={formData.tax_regime}
                  onChange={(e) => setFormData({ ...formData, tax_regime: e.target.value })}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="">Selecione...</option>
                  <option value="Simples Nacional">Simples Nacional</option>
                  <option value="Lucro Presumido">Lucro Presumido</option>
                  <option value="Lucro Real">Lucro Real</option>
                  <option value="MEI">MEI - Microempreendedor Individual</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="cnae">Código CNAE</Label>
                <Input
                  id="cnae"
                  value={formData.cnae}
                  onChange={(e) => setFormData({ ...formData, cnae: e.target.value })}
                  placeholder="0000-0/00"
                />
              </div>

              <div className="md:col-span-2 space-y-2">
                <Label htmlFor="cnae_description">Descrição da Atividade (CNAE)</Label>
                <Input
                  id="cnae_description"
                  value={formData.cnae_description}
                  onChange={(e) => setFormData({ ...formData, cnae_description: e.target.value })}
                  placeholder="Ex: Atividades de arquitetura"
                />
              </div>
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
              <h4 className="font-semibold text-sm mb-2 text-blue-900 dark:text-blue-100">
                ℹ️ Informação Importante
              </h4>
              <p className="text-sm text-blue-800 dark:text-blue-200">
                O regime tributário e CNAE corretos são essenciais para o correto recolhimento de impostos.
                Consulte seu contador para garantir que as informações estão atualizadas.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Identidade Visual */}
      {activeTab === "design" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5" />
              Identidade Visual
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Logo */}
            <div className="space-y-4">
              <div>
                <Label>Logo da Empresa</Label>
                <p className="text-sm text-muted-foreground mb-3">
                  Faça upload do logo da sua empresa (PNG, JPG ou SVG)
                </p>
              </div>

              <div className="flex items-center gap-4">
                {formData.logo_url ? (
                  <div className="relative">
                    <img
                      src={formData.logo_url}
                      alt="Logo da empresa"
                      className="h-32 w-32 object-contain rounded-lg border-2 border-dashed border-muted-foreground/25 p-2"
                    />
                  </div>
                ) : (
                  <div className="h-32 w-32 rounded-lg border-2 border-dashed border-muted-foreground/25 flex items-center justify-center bg-muted/10">
                    <ImageIcon className="h-12 w-12 text-muted-foreground/50" />
                  </div>
                )}

                <div className="flex-1 space-y-2">
                  <input
                    type="file"
                    id="logo-upload"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="hidden"
                  />
                  <Button
                    variant="outline"
                    onClick={() => document.getElementById("logo-upload")?.click()}
                    className="gap-2"
                    disabled={!company}
                  >
                    <Upload className="h-4 w-4" />
                    {formData.logo_url ? "Alterar Logo" : "Fazer Upload"}
                  </Button>
                  {!company && (
                    <p className="text-xs text-muted-foreground">
                      Salve a empresa primeiro antes de fazer upload do logo
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Cores */}
            <div className="border-t pt-6">
              <h3 className="font-semibold mb-4">Cores da Marca</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <Label htmlFor="primary_color">Cor Primária</Label>
                  <div className="flex gap-3 items-center">
                    <input
                      type="color"
                      id="primary_color"
                      value={formData.primary_color}
                      onChange={(e) => setFormData({ ...formData, primary_color: e.target.value })}
                      className="h-12 w-20 rounded cursor-pointer border-2 border-input"
                    />
                    <Input
                      value={formData.primary_color}
                      onChange={(e) => setFormData({ ...formData, primary_color: e.target.value })}
                      placeholder="#7C3AED"
                      className="flex-1"
                    />
                  </div>
                  <div 
                    className="h-20 rounded-lg"
                    style={{ backgroundColor: formData.primary_color }}
                  />
                </div>

                <div className="space-y-3">
                  <Label htmlFor="secondary_color">Cor Secundária</Label>
                  <div className="flex gap-3 items-center">
                    <input
                      type="color"
                      id="secondary_color"
                      value={formData.secondary_color}
                      onChange={(e) => setFormData({ ...formData, secondary_color: e.target.value })}
                      className="h-12 w-20 rounded cursor-pointer border-2 border-input"
                    />
                    <Input
                      value={formData.secondary_color}
                      onChange={(e) => setFormData({ ...formData, secondary_color: e.target.value })}
                      placeholder="#A78BFA"
                      className="flex-1"
                    />
                  </div>
                  <div 
                    className="h-20 rounded-lg"
                    style={{ backgroundColor: formData.secondary_color }}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Redes Sociais */}
      {activeTab === "social" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Redes Sociais e Portfólio
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="instagram">Instagram</Label>
                <div className="relative">
                  <Instagram className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="instagram"
                    value={formData.instagram}
                    onChange={(e) => setFormData({ ...formData, instagram: e.target.value })}
                    placeholder="@seuusuario"
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="facebook">Facebook</Label>
                <div className="relative">
                  <Facebook className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="facebook"
                    value={formData.facebook}
                    onChange={(e) => setFormData({ ...formData, facebook: e.target.value })}
                    placeholder="facebook.com/suapagina"
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="linkedin">LinkedIn</Label>
                <div className="relative">
                  <Linkedin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="linkedin"
                    value={formData.linkedin}
                    onChange={(e) => setFormData({ ...formData, linkedin: e.target.value })}
                    placeholder="linkedin.com/company/suaempresa"
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="behance">Behance</Label>
                <div className="relative">
                  <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="behance"
                    value={formData.behance}
                    onChange={(e) => setFormData({ ...formData, behance: e.target.value })}
                    placeholder="behance.net/seuportfolio"
                    className="pl-10"
                  />
                </div>
              </div>
            </div>

            <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg border border-purple-200 dark:border-purple-800 mt-6">
              <h4 className="font-semibold text-sm mb-2 text-purple-900 dark:text-purple-100">
                💡 Dica
              </h4>
              <p className="text-sm text-purple-800 dark:text-purple-200">
                Mantenha suas redes sociais atualizadas para fortalecer sua presença online e
                facilitar o contato com clientes e parceiros.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
      </div>
    </DynamicContainer>
  );
}
