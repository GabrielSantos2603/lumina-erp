import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Label } from "@/components/ui/label";
import { DynamicContainer, DynamicGrid } from "@/components/responsive";
import { DeleteConfirmDialog } from "@/components/DeleteConfirmDialog";
import { 
  Search, 
  LayoutGrid, 
  List,
  Plus,
  Phone,
  Mail,
  MapPin,
  Building2,
  Calendar,
  Briefcase,
  Users,
  X,
  FileText,
  Smartphone,
  FileSignature,
  User,
  UserCircle,
  Home,
  Loader2,
  Trash2,
} from "lucide-react";
import { clientService, type Client as DBClient } from "@/services/clientService";
import { cn } from "@/utils/cn";
import toast from "react-hot-toast";
import { formatPhone, formatCPF, formatCNPJ, formatCEP, removeMask } from "@/utils/formatters";
import { ClientInfoTab, ClientContactTab, ClientAddressTab, ClientNotesTab, type Client as ClientType } from "./components";

interface Client {
  id: string;
  name: string;
  type: "residential" | "commercial";
  personType: "pf" | "pj";
  cpfCnpj?: string;
  status: "active" | "inactive" | "potential";
  phone: string;
  phoneSecondary?: string;
  email: string;
  emailSecondary?: string;
  website?: string;
  address?: string;
  addressNumber?: string;
  complement?: string;
  neighborhood?: string;
  city: string;
  state?: string;
  zipCode?: string;
  howMetUs?: string;
  referredBy?: string;
  notes?: string;
  activeProjects: number;
  registrationDate: string;
  avatar?: string;
}

const mockClients: Client[] = [
  {
    id: "1",
    name: "Caroline Souza",
    type: "residential",
    personType: "pf",
    status: "active",
    phone: "(54) 99123-4567",
    email: "caroline.souza@email.com",
    city: "Bento Gonçalves",
    state: "RS",
    activeProjects: 2,
    registrationDate: "2023-08-15"
  },
  {
    id: "2",
    name: "Pedro Oliveira",
    type: "residential",
    personType: "pf",
    status: "active",
    phone: "(54) 98765-4321",
    email: "pedro.oliveira@email.com",
    city: "Gramado",
    state: "RS",
    activeProjects: 3,
    registrationDate: "2023-06-20"
  },
  {
    id: "3",
    name: "Paulo Santos",
    type: "residential",
    personType: "pf",
    status: "active",
    phone: "(51) 99876-5432",
    email: "paulo.santos@email.com",
    city: "Porto Alegre",
    state: "RS",
    activeProjects: 1,
    registrationDate: "2023-11-10"
  },
  {
    id: "4",
    name: "Maria Costa",
    type: "residential",
    personType: "pf",
    status: "active",
    phone: "(54) 99234-5678",
    email: "maria.costa@email.com",
    city: "Canela",
    state: "RS",
    activeProjects: 1,
    registrationDate: "2024-01-05"
  },
  {
    id: "5",
    name: "Ana Silva",
    type: "residential",
    personType: "pf",
    status: "potential",
    phone: "(51) 98567-1234",
    email: "ana.silva@email.com",
    city: "Porto Alegre",
    state: "RS",
    activeProjects: 0,
    registrationDate: "2024-05-15"
  },
  {
    id: "6",
    name: "Incorporadora Doma",
    type: "commercial",
    personType: "pj",
    status: "active",
    phone: "(54) 3456-7890",
    email: "contato@doma.com.br",
    city: "Gramado",
    state: "RS",
    activeProjects: 1,
    registrationDate: "2023-10-01"
  },
  {
    id: "7",
    name: "Incorporadora Dumont",
    type: "commercial",
    personType: "pj",
    status: "active",
    phone: "(51) 3234-5678",
    email: "comercial@dumont.com.br",
    city: "Porto Alegre",
    state: "RS",
    activeProjects: 1,
    registrationDate: "2023-12-15"
  },
  {
    id: "8",
    name: "Roberto Almeida",
    type: "residential",
    personType: "pf",
    status: "inactive",
    phone: "(54) 99345-6789",
    email: "roberto.almeida@email.com",
    city: "Caxias do Sul",
    state: "RS",
    activeProjects: 0,
    registrationDate: "2023-03-20"
  },
  {
    id: "9",
    name: "Construtora Silva & Filhos",
    type: "commercial",
    personType: "pj",
    status: "potential",
    phone: "(51) 3567-8901",
    email: "contato@silvafilhos.com.br",
    city: "Porto Alegre",
    state: "RS",
    activeProjects: 0,
    registrationDate: "2024-04-10"
  },
  {
    id: "10",
    name: "Juliana Ferreira",
    type: "residential",
    personType: "pf",
    status: "active",
    phone: "(54) 99456-7890",
    email: "juliana.ferreira@email.com",
    city: "Bento Gonçalves",
    state: "RS",
    activeProjects: 1,
    registrationDate: "2024-02-28"
  }
];

const statusLabels = {
  active: { label: "Ativo", color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" },
  inactive: { label: "Inativo", color: "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400" },
  potential: { label: "Potencial", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" }
};

const typeLabels = {
  residential: { label: "Residencial", icon: Users },
  commercial: { label: "Comercial", icon: Building2 }
};

export function ClientsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [activeTab, setActiveTab] = useState<"info" | "contact" | "address" | "notes">("info");
  const [currentStep, setCurrentStep] = useState(1);
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [clientToDelete, setClientToDelete] = useState<{ id: string; name: string } | null>(null);

  const [editingClient, setEditingClient] = useState({
    id: "",
    personType: "pf" as "pf" | "pj",
    name: "",
    cpfCnpj: "",
    type: "residential" as "residential" | "commercial",
    status: "potential" as "active" | "inactive" | "potential",
    phone: "",
    phoneSecondary: "",
    email: "",
    emailSecondary: "",
    website: "",
    address: "",
    addressNumber: "",
    complement: "",
    neighborhood: "",
    city: "",
    state: "",
    zipCode: "",
    howMetUs: "",
    referredBy: "",
    notes: ""
  });
  const [newClient, setNewClient] = useState({
    personType: "pf" as "pf" | "pj",
    name: "",
    cpfCnpj: "",
    type: "residential" as "residential" | "commercial",
    status: "potential" as "active" | "inactive" | "potential",
    phone: "",
    phoneSecondary: "",
    email: "",
    emailSecondary: "",
    website: "",
    address: "",
    addressNumber: "",
    complement: "",
    neighborhood: "",
    city: "",
    state: "",
    zipCode: "",
    howMetUs: "",
    referredBy: "",
    notes: ""
  });

  // Carregar clientes do Supabase
  useEffect(() => {
    loadClients();
  }, []);

  const loadClients = async () => {
    try {
      setIsLoading(true);
      console.log("🔄 Carregando clientes do Supabase...");
      
      const data = await clientService.getAllClients();
      console.log("📊 Dados recebidos:", data);
      
      // Se não houver dados, usa array vazio (não mock)
      if (!data || data.length === 0) {
        console.log("ℹ️ Nenhum cliente encontrado no banco");
        setClients([]);
        return;
      }
      
      // Converter campos do banco para o formato do componente
      const formattedClients: Client[] = data.map(client => ({
        id: client.id,
        name: client.name,
        type: client.type,
        personType: client.person_type,
        cpfCnpj: client.cpf_cnpj,
        status: client.status,
        phone: client.phone,
        phoneSecondary: client.phone_secondary,
        email: client.email,
        emailSecondary: client.email_secondary,
        website: client.website,
        address: client.address,
        addressNumber: client.address_number,
        complement: client.complement,
        neighborhood: client.neighborhood,
        city: client.city,
        state: client.state,
        zipCode: client.zip_code,
        howMetUs: client.how_met_us,
        referredBy: client.referred_by,
        notes: client.notes,
        activeProjects: client.active_projects,
        registrationDate: client.created_at || new Date().toISOString(),
      }));

      console.log(`✅ ${formattedClients.length} clientes formatados com sucesso`);
      setClients(formattedClients);
    } catch (error) {
      console.error("❌ Erro ao carregar clientes:", error);
      toast.error("Erro ao conectar com o banco de dados");
      // Em caso de erro, mostra array vazio
      setClients([]);
    } finally {
      setIsLoading(false);
      console.log("✅ Loading finalizado");
    }
  };

  const handleSubmitClient = async () => {
    if (!newClient.name || !newClient.email || !newClient.phone || !newClient.city) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    try {
      setIsSaving(true);
      const toastId = toast.loading("Salvando cliente...");

      // Remove máscaras dos campos antes de salvar
      const clientData = {
        name: newClient.name,
        type: newClient.type,
        person_type: newClient.personType,
        cpf_cnpj: newClient.cpfCnpj ? removeMask(newClient.cpfCnpj) : undefined,
        status: newClient.status,
        phone: removeMask(newClient.phone),
        phone_secondary: newClient.phoneSecondary ? removeMask(newClient.phoneSecondary) : undefined,
        email: newClient.email,
        email_secondary: newClient.emailSecondary || undefined,
        website: newClient.website || undefined,
        address: newClient.address || undefined,
        address_number: newClient.addressNumber || undefined,
        complement: newClient.complement || undefined,
        neighborhood: newClient.neighborhood || undefined,
        city: newClient.city,
        state: newClient.state || undefined,
        zip_code: newClient.zipCode ? removeMask(newClient.zipCode) : undefined,
        how_met_us: newClient.howMetUs || undefined,
        referred_by: newClient.referredBy || undefined,
        notes: newClient.notes || undefined,
        active_projects: 0,
      };

      await clientService.createClient(clientData);
      
      toast.dismiss(toastId);
      toast.success("✅ Cliente cadastrado com sucesso!");
      
      // Recarregar lista
      await loadClients();
      
      // Fechar modal e resetar form
      handleCloseForm();
      resetForm();
    } catch (error: any) {
      console.error("Erro ao salvar cliente:", error);
      toast.dismiss();
      
      // Mensagens de erro mais específicas
      if (error.message?.includes("policy")) {
        toast.error("Erro de permissão. Verifique se você está autenticado.");
      } else if (error.message?.includes("duplicate")) {
        toast.error("Este cliente já existe no sistema.");
      } else {
        toast.error(error.message || "Erro ao salvar cliente. Tente novamente.");
      }
    } finally {
      setIsSaving(false);
    }
  };

  const resetForm = () => {
    setNewClient({
      personType: "pf",
      name: "",
      cpfCnpj: "",
      type: "residential",
      status: "potential",
      phone: "",
      phoneSecondary: "",
      email: "",
      emailSecondary: "",
      website: "",
      address: "",
      addressNumber: "",
      complement: "",
      neighborhood: "",
      city: "",
      state: "",
      zipCode: "",
      howMetUs: "",
      referredBy: "",
      notes: ""
    });
  };

  const handleNextStep = () => {
    if (currentStep < 4) setCurrentStep(currentStep + 1);
  };

  const handlePreviousStep = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  const handleCloseForm = () => {
    setShowAddForm(false);
    setCurrentStep(1);
  };

  const handleOpenDetails = (client: Client) => {
    setSelectedClient(client);
    setShowDetailsModal(true);
    setActiveTab("info");
  };

  const handleCloseDetails = () => {
    setShowDetailsModal(false);
    setSelectedClient(null);
  };

  const handleOpenEditForm = (client: Client) => {
    // Aplica formatações nos campos ao carregar
    setEditingClient({
      id: client.id,
      personType: client.personType,
      name: client.name,
      cpfCnpj: client.cpfCnpj 
        ? (client.personType === "pf" ? formatCPF(client.cpfCnpj) : formatCNPJ(client.cpfCnpj))
        : "",
      type: client.type,
      status: client.status,
      phone: formatPhone(client.phone),
      phoneSecondary: client.phoneSecondary ? formatPhone(client.phoneSecondary) : "",
      email: client.email,
      emailSecondary: client.emailSecondary || "",
      website: client.website || "",
      address: client.address || "",
      addressNumber: client.addressNumber || "",
      complement: client.complement || "",
      neighborhood: client.neighborhood || "",
      city: client.city,
      state: client.state || "",
      zipCode: client.zipCode ? formatCEP(client.zipCode) : "",
      howMetUs: client.howMetUs || "",
      referredBy: client.referredBy || "",
      notes: client.notes || ""
    });
    setShowDetailsModal(false);
    setShowEditForm(true);
    setCurrentStep(1);
  };

  const handleCloseEditForm = () => {
    setShowEditForm(false);
    setCurrentStep(1);
    setEditingClient({
      id: "",
      personType: "pf",
      name: "",
      cpfCnpj: "",
      type: "residential",
      status: "potential",
      phone: "",
      phoneSecondary: "",
      email: "",
      emailSecondary: "",
      website: "",
      address: "",
      addressNumber: "",
      complement: "",
      neighborhood: "",
      city: "",
      state: "",
      zipCode: "",
      howMetUs: "",
      referredBy: "",
      notes: ""
    });
  };

  const handleDeleteClient = async (clientId: string, clientName: string) => {
    setClientToDelete({ id: clientId, name: clientName });
    setShowDeleteDialog(true);
  };

  const confirmDeleteClient = async () => {
    if (!clientToDelete) return;

    try {
      setIsSaving(true);
      const toastId = toast.loading("Excluindo cliente...");

      await clientService.deleteClient(clientToDelete.id);
      
      toast.success("✅ Cliente excluído com sucesso!", { id: toastId });
      
      // Recarregar lista
      await loadClients();
      
      // Fechar modais se estiverem abertos
      handleCloseEditForm();
      handleCloseDetails();
      
      // Resetar cliente a deletar
      setClientToDelete(null);
    } catch (error: any) {
      console.error("Erro ao excluir cliente:", error);
      toast.error(error.message || "Erro ao excluir cliente");
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateClient = async () => {
    if (!editingClient.name || !editingClient.email || !editingClient.phone || !editingClient.city) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    try {
      setIsSaving(true);
      const toastId = toast.loading("Atualizando cliente...");

      // Remove máscaras dos campos antes de salvar
      const clientData = {
        name: editingClient.name,
        type: editingClient.type,
        person_type: editingClient.personType,
        cpf_cnpj: editingClient.cpfCnpj ? removeMask(editingClient.cpfCnpj) : undefined,
        status: editingClient.status,
        phone: removeMask(editingClient.phone),
        phone_secondary: editingClient.phoneSecondary ? removeMask(editingClient.phoneSecondary) : undefined,
        email: editingClient.email,
        email_secondary: editingClient.emailSecondary || undefined,
        website: editingClient.website || undefined,
        address: editingClient.address || undefined,
        address_number: editingClient.addressNumber || undefined,
        complement: editingClient.complement || undefined,
        neighborhood: editingClient.neighborhood || undefined,
        city: editingClient.city,
        state: editingClient.state || undefined,
        zip_code: editingClient.zipCode ? removeMask(editingClient.zipCode) : undefined,
        how_met_us: editingClient.howMetUs || undefined,
        referred_by: editingClient.referredBy || undefined,
        notes: editingClient.notes || undefined,
      };

      await clientService.updateClient(editingClient.id, clientData);
      
      toast.dismiss(toastId);
      toast.success("✅ Cliente atualizado com sucesso!");
      
      // Recarregar lista
      await loadClients();
      
      // Fechar modal e resetar form
      handleCloseEditForm();
    } catch (error: any) {
      console.error("Erro ao atualizar cliente:", error);
      toast.dismiss();
      
      // Mensagens de erro mais específicas
      if (error.message?.includes("policy")) {
        toast.error("Erro de permissão. Verifique se você está autenticado.");
      } else if (error.message?.includes("duplicate")) {
        toast.error("Este CPF/CNPJ já existe no sistema.");
      } else {
        toast.error(error.message || "Erro ao atualizar cliente. Tente novamente.");
      }
    } finally {
      setIsSaving(false);
    }
  };

  const filteredClients = clients.filter(client => {
    if (!searchQuery.trim()) return true;
    
    const query = searchQuery.toLowerCase().trim();
    
    // Busca por nome
    if (client.name?.toLowerCase().includes(query)) return true;
    
    // Busca por email (principal e secundário)
    if (client.email?.toLowerCase().includes(query)) return true;
    if (client.emailSecondary?.toLowerCase().includes(query)) return true;
    
    // Busca por telefone (principal e secundário) - apenas se a query tiver dígitos
    const queryDigits = query.replace(/\D/g, '');
    if (queryDigits.length > 0) {
      if (client.phone?.replace(/\D/g, '').includes(queryDigits)) return true;
      if (client.phoneSecondary?.replace(/\D/g, '').includes(queryDigits)) return true;
    }
    
    // Busca por cidade e estado
    if (client.city?.toLowerCase().includes(query)) return true;
    if (client.state?.toLowerCase().includes(query)) return true;
    
    // Busca por CPF/CNPJ - apenas se a query tiver dígitos
    if (queryDigits.length > 0 && client.cpfCnpj?.replace(/\D/g, '').includes(queryDigits)) return true;
    
    // Busca por endereço
    if (client.address?.toLowerCase().includes(query)) return true;
    if (client.neighborhood?.toLowerCase().includes(query)) return true;
    
    // Busca por status
    if (statusLabels[client.status]?.label.toLowerCase().includes(query)) return true;
    
    // Busca por tipo
    if (typeLabels[client.type]?.label.toLowerCase().includes(query)) return true;
    
    // Busca por tipo de pessoa (apenas para termos específicos, evitando falsos positivos)
    const pfKeywords = ['pessoa fisica', 'pessoa física', 'fisica', 'física'];
    const pjKeywords = ['pessoa juridica', 'pessoa jurídica', 'juridica', 'jurídica', 'empresa'];
    
    // Verifica se a query corresponde exatamente a abreviação
    if (client.personType === 'pf' && query === 'pf') return true;
    if (client.personType === 'pj' && query === 'pj') return true;
    
    // Verifica se alguma palavra-chave COMEÇA com a query (mínimo 3 caracteres para evitar falsos positivos)
    if (query.length >= 3) {
      if (client.personType === 'pf' && pfKeywords.some(keyword => keyword.startsWith(query))) return true;
      if (client.personType === 'pj' && pjKeywords.some(keyword => keyword.startsWith(query))) return true;
    }
    
    return false;
  });

  const getInitials = (name: string) => {
    const names = name.split(" ");
    if (names.length >= 2) {
      return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <DynamicContainer className="overflow-x-hidden">
      <div className="space-y-3 sm:space-y-4 lg:space-y-6">
        {/* Título da Página */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground">
              Clientes
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">
              {isLoading ? "Carregando..." : `${filteredClients.length} ${filteredClients.length === 1 ? 'cliente' : 'clientes'}`}
            </p>
          </div>
          <Button className="gap-2 w-full sm:w-auto" size="sm" onClick={() => setShowAddForm(true)}>
            <Plus className="h-4 w-4" />
            <span className="hidden xs:inline">Novo Cliente</span>
            <span className="xs:hidden">Novo</span>
          </Button>
        </div>

        {/* Header com busca e ações */}
        <div className="flex flex-col gap-2 sm:gap-3 lg:gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar clientes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 text-sm"
          />
          {searchQuery && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
              onClick={() => setSearchQuery("")}
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>

        <div className="flex items-center gap-2 sm:ml-auto">
          <div className="flex items-center rounded-lg border bg-background">
            <Button
              variant={viewMode === "grid" ? "secondary" : "ghost"}
              size="icon"
              onClick={() => setViewMode("grid")}
              className="rounded-r-none h-9 w-9"
            >
              <LayoutGrid className="h-4 w-4" />
              <span className="sr-only">Visualização em Grade</span>
            </Button>
            <Button
              variant={viewMode === "list" ? "secondary" : "ghost"}
              size="icon"
              onClick={() => setViewMode("list")}
              className="rounded-l-none h-9 w-9"
            >
              <List className="h-4 w-4" />
              <span className="sr-only">Visualização em Lista</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Indicador de Resultados da Busca */}
      {searchQuery && !isLoading && (
        <div className="flex items-center justify-between px-4 py-3 bg-lumina-50 dark:bg-lumina-900/20 rounded-lg border border-lumina-200 dark:border-lumina-800">
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4 text-lumina-600" />
            <span className="text-sm font-medium text-lumina-700 dark:text-lumina-300">
              {filteredClients.length === 0 
                ? "Nenhum resultado encontrado" 
                : `${filteredClients.length} ${filteredClients.length === 1 ? 'cliente encontrado' : 'clientes encontrados'}`
              }
            </span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSearchQuery("")}
            className="text-xs h-7"
          >
            Limpar busca
          </Button>
        </div>
      )}

      {/* Loading State */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-lumina-500" />
          <span className="ml-3 text-muted-foreground">Carregando clientes...</span>
        </div>
      ) : (
        <>
          {/* Grid de clientes */}
          {viewMode === "grid" ? (
            <DynamicGrid 
              columns={4}
              minCardWidth={240}
            >
              {filteredClients.map((client) => {
            const TypeIcon = typeLabels[client.type].icon;
            return (
              <Card 
                key={client.id} 
                className="group cursor-pointer hover:shadow-lg transition-all duration-200 overflow-hidden"
                onClick={() => handleOpenDetails(client)}
              >
                <CardContent className="p-3 sm:p-4 lg:p-6 space-y-2 sm:space-y-3 lg:space-y-4">
                  {/* Avatar e Status */}
                  <div className="flex items-start justify-between">
                    <Avatar className="h-12 w-12 sm:h-14 sm:w-14 lg:h-16 lg:w-16">
                      <AvatarFallback className="text-sm sm:text-base lg:text-lg font-semibold bg-lumina-100 text-lumina-700 dark:bg-lumina-900/30 dark:text-lumina-400">
                        {getInitials(client.name)}
                      </AvatarFallback>
                    </Avatar>
                    <Badge className={cn("text-[10px] sm:text-xs", statusLabels[client.status].color)}>
                      {statusLabels[client.status].label}
                    </Badge>
                  </div>

                  {/* Nome e Tipo */}
                  <div>
                    <h3 className="font-semibold text-sm sm:text-base line-clamp-2 min-h-[2.5rem] sm:min-h-[3rem]">
                      {client.name}
                    </h3>
                    <div className="flex items-center gap-1 sm:gap-1.5 mt-0.5 sm:mt-1 text-[10px] sm:text-xs text-muted-foreground">
                      <TypeIcon className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                      <span>{typeLabels[client.type].label}</span>
                    </div>
                  </div>

                  {/* Informações de contato */}
                  <div className="space-y-1 sm:space-y-1.5 lg:space-y-2 text-[10px] sm:text-xs text-muted-foreground">
                    <div className="flex items-center gap-1.5 sm:gap-2">
                      <Phone className="h-3 w-3 sm:h-3.5 sm:w-3.5 flex-shrink-0" />
                      <span className="line-clamp-1 truncate">{client.phone}</span>
                    </div>

                    <div className="flex items-center gap-1.5 sm:gap-2">
                      <Mail className="h-3 w-3 sm:h-3.5 sm:w-3.5 flex-shrink-0" />
                      <span className="line-clamp-1 truncate">{client.email}</span>
                    </div>

                    <div className="flex items-center gap-1.5 sm:gap-2">
                      <MapPin className="h-3 w-3 sm:h-3.5 sm:w-3.5 flex-shrink-0" />
                      <span className="line-clamp-1 truncate">
                        {client.city}{client.state ? `, ${client.state}` : ''}
                      </span>
                    </div>
                  </div>

                  {/* Footer com projetos */}
                  <div className="pt-2 sm:pt-3 border-t flex items-center justify-between text-[10px] sm:text-xs">
                    <div className="flex items-center gap-1 sm:gap-1.5 text-muted-foreground">
                      <Briefcase className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                      <span className="truncate">{client.activeProjects} proj.</span>
                    </div>
                    <div className="flex items-center gap-1 sm:gap-1.5 text-muted-foreground">
                      <Calendar className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                      <span className="truncate">
                        {new Date(client.registrationDate).toLocaleDateString("pt-BR", { 
                          month: "short", 
                          year: "numeric" 
                        })}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
              })}
            </DynamicGrid>
          ) : (
            /* Lista de clientes */
            <div className="space-y-2">
              {filteredClients.map((client) => {
                const TypeIcon = typeLabels[client.type].icon;
                return (
                  <Card 
                    key={client.id}
                    className="hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => handleOpenDetails(client)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center gap-4">
                        {/* Avatar */}
                        <Avatar className="h-16 w-16 flex-shrink-0">
                          <AvatarFallback className="text-base font-semibold bg-lumina-100 text-lumina-700 dark:bg-lumina-900/30 dark:text-lumina-400">
                            {getInitials(client.name)}
                          </AvatarFallback>
                        </Avatar>

                        {/* Informações */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-4 mb-2">
                            <div>
                              <h3 className="font-semibold text-base">{client.name}</h3>
                              <div className="flex items-center gap-1.5 mt-0.5 text-xs text-muted-foreground">
                                <TypeIcon className="h-3.5 w-3.5" />
                                <span>{typeLabels[client.type].label}</span>
                              </div>
                            </div>
                            <Badge className={statusLabels[client.status].color}>
                              {statusLabels[client.status].label}
                            </Badge>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2 text-sm text-muted-foreground">
                            <div className="flex items-center gap-2">
                              <Phone className="h-4 w-4" />
                              <span>{client.phone}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Mail className="h-4 w-4" />
                              <span className="truncate">{client.email}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <MapPin className="h-4 w-4" />
                              <span>{client.city}{client.state ? `, ${client.state}` : ''}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Briefcase className="h-4 w-4" />
                              <span>{client.activeProjects} projeto{client.activeProjects !== 1 ? 's' : ''}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          {/* Mensagem quando não há resultados */}
          {filteredClients.length === 0 && !isLoading && (
            <div className="text-center py-12">
              <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-2">
                {searchQuery ? "Nenhum cliente encontrado" : "Nenhum cliente cadastrado"}
              </h3>
              <p className="text-muted-foreground mb-4">
                {searchQuery 
                  ? "Tente ajustar os termos da sua busca ou limpar o filtro"
                  : "Comece adicionando seu primeiro cliente ao sistema"
                }
              </p>
              {searchQuery ? (
                <Button
                  variant="outline"
                  onClick={() => setSearchQuery("")}
                  className="gap-2"
                >
                  <X className="h-4 w-4" />
                  Limpar Busca
                </Button>
              ) : (
                <Button
                  onClick={() => setShowAddForm(true)}
                  className="gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Adicionar Primeiro Cliente
                </Button>
              )}
            </div>
          )}
        </>
      )}

      {/* Modal de Adicionar Cliente */}
      {showAddForm && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-4xl max-h-[90vh] flex flex-col">
            <CardHeader className="border-b flex-shrink-0">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <UserCircle className="h-5 w-5" />
                    Adicionar Novo Cliente
                  </CardTitle>
                  <CardDescription className="mt-1.5">
                    Etapa {currentStep} de 4
                  </CardDescription>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={handleCloseForm}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {/* Indicador de Progresso */}
              <div className="flex items-center gap-2 mt-4">
                {[1, 2, 3, 4].map((step) => (
                  <div key={step} className="flex items-center flex-1">
                    <div className={`h-2 rounded-full flex-1 transition-all ${
                      step <= currentStep 
                        ? "bg-lumina-500" 
                        : "bg-muted"
                    }`} />
                  </div>
                ))}
              </div>

              {/* Tabs de Navegação */}
              <div className="flex gap-2 mt-4 overflow-x-auto pb-2">
                <button
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  className={`flex-1 min-w-[140px] px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    currentStep === 1
                      ? "bg-lumina-100 text-lumina-700 dark:bg-lumina-900/30 dark:text-lumina-400"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  }`}
                >
                  <div className="flex items-center gap-2 justify-center">
                    <User className="h-4 w-4" />
                    <span>Dados Básicos</span>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentStep(2)}
                  className={`flex-1 min-w-[140px] px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    currentStep === 2
                      ? "bg-lumina-100 text-lumina-700 dark:bg-lumina-900/30 dark:text-lumina-400"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  }`}
                >
                  <div className="flex items-center gap-2 justify-center">
                    <Smartphone className="h-4 w-4" />
                    <span>Contato</span>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentStep(3)}
                  className={`flex-1 min-w-[140px] px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    currentStep === 3
                      ? "bg-lumina-100 text-lumina-700 dark:bg-lumina-900/30 dark:text-lumina-400"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  }`}
                >
                  <div className="flex items-center gap-2 justify-center">
                    <Home className="h-4 w-4" />
                    <span>Endereço</span>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentStep(4)}
                  className={`flex-1 min-w-[140px] px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    currentStep === 4
                      ? "bg-lumina-100 text-lumina-700 dark:bg-lumina-900/30 dark:text-lumina-400"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  }`}
                >
                  <div className="flex items-center gap-2 justify-center">
                    <Briefcase className="h-4 w-4" />
                    <span>Comercial</span>
                  </div>
                </button>
              </div>
            </CardHeader>

            <CardContent className="p-6 overflow-y-auto flex-1">
              <form className="space-y-6">
                {/* ETAPA 1: DADOS BÁSICOS */}
                {currentStep === 1 && (
                  <div className="space-y-6">
                    {/* Tipo de Pessoa */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <User className="h-5 w-5 text-lumina-600" />
                        <h3 className="text-lg font-semibold">Tipo de Cliente</h3>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <button
                          type="button"
                          onClick={() => setNewClient({...newClient, personType: "pf"})}
                          className={`p-4 rounded-lg border-2 transition-all text-left ${
                            newClient.personType === "pf"
                              ? "border-lumina-500 bg-lumina-50 dark:bg-lumina-900/20"
                              : "border-border hover:border-lumina-200"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <User className={`h-6 w-6 ${newClient.personType === "pf" ? "text-lumina-600" : "text-muted-foreground"}`} />
                            <div>
                              <p className="font-medium">Pessoa Física</p>
                              <p className="text-xs text-muted-foreground">Cliente individual</p>
                            </div>
                          </div>
                        </button>

                        <button
                          type="button"
                          onClick={() => setNewClient({...newClient, personType: "pj"})}
                          className={`p-4 rounded-lg border-2 transition-all text-left ${
                            newClient.personType === "pj"
                              ? "border-lumina-500 bg-lumina-50 dark:bg-lumina-900/20"
                              : "border-border hover:border-lumina-200"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <Building2 className={`h-6 w-6 ${newClient.personType === "pj" ? "text-lumina-600" : "text-muted-foreground"}`} />
                            <div>
                              <p className="font-medium">Pessoa Jurídica</p>
                              <p className="text-xs text-muted-foreground">Empresa</p>
                            </div>
                          </div>
                        </button>
                      </div>
                    </div>

                    {/* Informações Básicas */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <FileSignature className="h-5 w-5 text-lumina-600" />
                        <h3 className="text-lg font-semibold">Informações Básicas</h3>
                      </div>
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2 md:col-span-2">
                          <Label htmlFor="name">
                            {newClient.personType === "pf" ? "Nome Completo" : "Razão Social"} *
                          </Label>
                          <Input
                            id="name"
                            value={newClient.name}
                            onChange={(e) => setNewClient({...newClient, name: e.target.value})}
                            placeholder={newClient.personType === "pf" ? "João da Silva" : "Empresa LTDA"}
                            required
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="cpfCnpj">
                            {newClient.personType === "pf" ? "CPF" : "CNPJ"}
                          </Label>
                          <Input
                            id="cpfCnpj"
                            value={newClient.cpfCnpj}
                            onChange={(e) => {
                              const formatted = newClient.personType === "pf" 
                                ? formatCPF(e.target.value)
                                : formatCNPJ(e.target.value);
                              setNewClient({...newClient, cpfCnpj: formatted});
                            }}
                            placeholder={newClient.personType === "pf" ? "000.000.000-00" : "00.000.000/0000-00"}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="type">Tipo de Projeto *</Label>
                          <select
                            id="type"
                            value={newClient.type}
                            onChange={(e) => setNewClient({...newClient, type: e.target.value as "residential" | "commercial"})}
                            className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm"
                            required
                          >
                            <option value="residential">🏠 Residencial</option>
                            <option value="commercial">🏢 Comercial</option>
                          </select>
                        </div>

                        <div className="space-y-2 md:col-span-2">
                          <Label htmlFor="status">Status do Cliente *</Label>
                          <select
                            id="status"
                            value={newClient.status}
                            onChange={(e) => setNewClient({...newClient, status: e.target.value as "active" | "inactive" | "potential"})}
                            className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm"
                            required
                          >
                            <option value="potential">🔵 Potencial - Em prospecção</option>
                            <option value="active">🟢 Ativo - Cliente atual</option>
                            <option value="inactive">⚪ Inativo - Sem projetos ativos</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* ETAPA 2: CONTATO */}
                {currentStep === 2 && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <Smartphone className="h-5 w-5 text-lumina-600" />
                      <h3 className="text-lg font-semibold">Informações de Contato</h3>
                    </div>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="phone">Telefone Principal *</Label>
                        <Input
                          id="phone"
                          value={newClient.phone}
                          onChange={(e) => {
                            const formatted = formatPhone(e.target.value);
                            setNewClient({...newClient, phone: formatted});
                          }}
                          placeholder="(51) 99999-9999"
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="phoneSecondary">Telefone Secundário</Label>
                        <Input
                          id="phoneSecondary"
                          value={newClient.phoneSecondary}
                          onChange={(e) => {
                            const formatted = formatPhone(e.target.value);
                            setNewClient({...newClient, phoneSecondary: formatted});
                          }}
                          placeholder="(51) 99999-9999"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="email">Email Principal *</Label>
                        <Input
                          id="email"
                          type="email"
                          value={newClient.email}
                          onChange={(e) => setNewClient({...newClient, email: e.target.value})}
                          placeholder="cliente@email.com"
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="emailSecondary">Email Secundário</Label>
                        <Input
                          id="emailSecondary"
                          type="email"
                          value={newClient.emailSecondary}
                          onChange={(e) => setNewClient({...newClient, emailSecondary: e.target.value})}
                          placeholder="contato@email.com"
                        />
                      </div>

                      {newClient.personType === "pj" && (
                        <div className="space-y-2 md:col-span-2">
                          <Label htmlFor="website">Website</Label>
                          <Input
                            id="website"
                            value={newClient.website}
                            onChange={(e) => setNewClient({...newClient, website: e.target.value})}
                            placeholder="https://www.empresa.com.br"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* ETAPA 3: ENDEREÇO */}
                {currentStep === 3 && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <Home className="h-5 w-5 text-lumina-600" />
                      <h3 className="text-lg font-semibold">Endereço</h3>
                    </div>
                    <div className="grid gap-4 md:grid-cols-6">
                      <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="zipCode">CEP</Label>
                        <Input
                          id="zipCode"
                          value={newClient.zipCode}
                          onChange={(e) => {
                            const formatted = formatCEP(e.target.value);
                            setNewClient({...newClient, zipCode: formatted});
                          }}
                          placeholder="90000-000"
                        />
                      </div>

                      <div className="space-y-2 md:col-span-4">
                        <Label htmlFor="address">Endereço *</Label>
                        <Input
                          id="address"
                          value={newClient.address}
                          onChange={(e) => setNewClient({...newClient, address: e.target.value})}
                          placeholder="Rua Example"
                          required
                        />
                      </div>

                      <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="addressNumber">Número</Label>
                        <Input
                          id="addressNumber"
                          value={newClient.addressNumber}
                          onChange={(e) => setNewClient({...newClient, addressNumber: e.target.value})}
                          placeholder="123"
                        />
                      </div>

                      <div className="space-y-2 md:col-span-4">
                        <Label htmlFor="complement">Complemento</Label>
                        <Input
                          id="complement"
                          value={newClient.complement}
                          onChange={(e) => setNewClient({...newClient, complement: e.target.value})}
                          placeholder="Apto 101, Bloco A"
                        />
                      </div>

                      <div className="space-y-2 md:col-span-3">
                        <Label htmlFor="neighborhood">Bairro</Label>
                        <Input
                          id="neighborhood"
                          value={newClient.neighborhood}
                          onChange={(e) => setNewClient({...newClient, neighborhood: e.target.value})}
                          placeholder="Centro"
                        />
                      </div>

                      <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="city">Cidade *</Label>
                        <Input
                          id="city"
                          value={newClient.city}
                          onChange={(e) => setNewClient({...newClient, city: e.target.value})}
                          placeholder="Porto Alegre"
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="state">Estado *</Label>
                        <Input
                          id="state"
                          value={newClient.state}
                          onChange={(e) => setNewClient({...newClient, state: e.target.value})}
                          placeholder="RS"
                          maxLength={2}
                          required
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* ETAPA 4: INFORMAÇÕES COMERCIAIS */}
                {currentStep === 4 && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <Briefcase className="h-5 w-5 text-lumina-600" />
                      <h3 className="text-lg font-semibold">Informações Comerciais</h3>
                    </div>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="howMetUs">Como Conheceu Nosso Trabalho?</Label>
                        <select
                          id="howMetUs"
                          value={newClient.howMetUs}
                          onChange={(e) => setNewClient({...newClient, howMetUs: e.target.value})}
                          className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm"
                        >
                          <option value="">Selecione uma opção</option>
                          <option value="indication">Indicação</option>
                          <option value="instagram">Instagram</option>
                          <option value="facebook">Facebook</option>
                          <option value="google">Google / Site</option>
                          <option value="event">Evento / Feira</option>
                          <option value="linkedin">LinkedIn</option>
                          <option value="other">Outro</option>
                        </select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="referredBy">Indicado por</Label>
                        <Input
                          id="referredBy"
                          value={newClient.referredBy}
                          onChange={(e) => setNewClient({...newClient, referredBy: e.target.value})}
                          placeholder="Nome de quem indicou"
                        />
                      </div>

                      <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="notes">Observações</Label>
                        <textarea
                          id="notes"
                          value={newClient.notes}
                          onChange={(e) => setNewClient({...newClient, notes: e.target.value})}
                          className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm min-h-[120px]"
                          placeholder="Informações adicionais sobre o cliente, preferências, histórico de contatos, etc."
                        />
                      </div>
                    </div>
                  </div>
                )}
              </form>
            </CardContent>

            {/* Footer com Botões de Navegação */}
            <div className="border-t p-6 flex-shrink-0 bg-muted/30">
              <div className="flex justify-between items-center">
                <div className="text-sm text-muted-foreground">
                  {currentStep === 1 && "Comece informando o tipo e dados básicos do cliente"}
                  {currentStep === 2 && "Forneça os dados de contato do cliente"}
                  {currentStep === 3 && "Informe o endereço do cliente"}
                  {currentStep === 4 && "Finalize com informações comerciais (opcional)"}
                </div>
                <div className="flex gap-3">
                  {currentStep > 1 && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handlePreviousStep}
                    >
                      Anterior
                    </Button>
                  )}
                  {currentStep < 4 ? (
                    <Button
                      type="button"
                      onClick={handleNextStep}
                    >
                      Próximo
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      className="gap-2"
                      onClick={handleSubmitClient}
                      disabled={isSaving}
                    >
                      {isSaving ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Salvando...
                        </>
                      ) : (
                        <>
                          <Plus className="h-4 w-4" />
                          Adicionar Cliente
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Modal de Detalhes do Cliente */}
      {showDetailsModal && selectedClient && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-4xl max-h-[90vh] flex flex-col">
            <CardHeader className="border-b flex-shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Avatar className="h-16 w-16">
                    <AvatarFallback className="text-xl font-bold bg-lumina-100 text-lumina-700 dark:bg-lumina-900/30 dark:text-lumina-400">
                      {getInitials(selectedClient.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle className="text-2xl">{selectedClient.name}</CardTitle>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge className={statusLabels[selectedClient.status].color}>
                        {statusLabels[selectedClient.status].label}
                      </Badge>
                      <Badge variant="outline" className="gap-1">
                        {(() => {
                          const TypeIcon = typeLabels[selectedClient.type].icon;
                          return <TypeIcon className="h-3 w-3" />;
                        })()}
                        {typeLabels[selectedClient.type].label}
                      </Badge>
                      <Badge variant="outline">
                        {selectedClient.personType === "pf" ? "Pessoa Física" : "Pessoa Jurídica"}
                      </Badge>
                    </div>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleCloseDetails}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {/* Tabs de navegação */}
              <div className="flex border-b mt-4 -mb-4">
                <button
                  onClick={() => setActiveTab("info")}
                  className={cn(
                    "px-4 py-2 text-sm font-medium border-b-2 transition-colors",
                    activeTab === "info"
                      ? "border-lumina-500 text-lumina-600 dark:text-lumina-400"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  )}
                >
                  📋 Informações
                </button>
                <button
                  onClick={() => setActiveTab("contact")}
                  className={cn(
                    "px-4 py-2 text-sm font-medium border-b-2 transition-colors",
                    activeTab === "contact"
                      ? "border-lumina-500 text-lumina-600 dark:text-lumina-400"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  )}
                >
                  📞 Contato
                </button>
                <button
                  onClick={() => setActiveTab("address")}
                  className={cn(
                    "px-4 py-2 text-sm font-medium border-b-2 transition-colors",
                    activeTab === "address"
                      ? "border-lumina-500 text-lumina-600 dark:text-lumina-400"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  )}
                >
                  📍 Endereço
                </button>
                <button
                  onClick={() => setActiveTab("notes")}
                  className={cn(
                    "px-4 py-2 text-sm font-medium border-b-2 transition-colors",
                    activeTab === "notes"
                      ? "border-lumina-500 text-lumina-600 dark:text-lumina-400"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  )}
                >
                  📝 Observações
                </button>
              </div>
            </CardHeader>

            <CardContent className="flex-1 overflow-y-auto p-6">
              {activeTab === "info" && <ClientInfoTab client={selectedClient} />}
              {activeTab === "contact" && <ClientContactTab client={selectedClient} />}
              {activeTab === "address" && <ClientAddressTab client={selectedClient} />}
              {activeTab === "notes" && <ClientNotesTab client={selectedClient} />}
            </CardContent>

            {/* Footer com ações */}
            <div className="border-t p-4 flex justify-between items-center flex-shrink-0">
              <div className="text-sm text-muted-foreground">
                ID: {selectedClient.id}
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="destructive" 
                  onClick={() => handleDeleteClient(selectedClient.id, selectedClient.name)}
                  disabled={isSaving}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Excluir
                </Button>
                <Button variant="outline" onClick={handleCloseDetails}>
                  Fechar
                </Button>
                <Button className="gap-2" onClick={() => handleOpenEditForm(selectedClient)}>
                  <FileText className="h-4 w-4" />
                  Editar Cliente
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Modal de Editar Cliente */}
      {showEditForm && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
          <Card className="w-full max-w-4xl h-[95vh] sm:h-auto sm:max-h-[90vh] flex flex-col my-auto">
            <CardHeader className="border-b flex-shrink-0 p-3 sm:p-4 lg:p-6">
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                    <FileText className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
                    <span className="truncate">Editar Cliente</span>
                  </CardTitle>
                  <CardDescription className="mt-1 sm:mt-1.5 text-xs sm:text-sm">
                    Etapa {currentStep} de 4
                  </CardDescription>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={handleCloseEditForm}
                  className="h-8 w-8 sm:h-10 sm:w-10 flex-shrink-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {/* Indicador de Progresso */}
              <div className="flex items-center gap-1.5 sm:gap-2 mt-3 sm:mt-4">
                {[1, 2, 3, 4].map((step) => (
                  <div key={step} className="flex items-center flex-1">
                    <div className={`h-1.5 sm:h-2 rounded-full flex-1 transition-all ${
                      step <= currentStep 
                        ? "bg-lumina-500" 
                        : "bg-muted"
                    }`} />
                  </div>
                ))}
              </div>

              {/* Tabs de Navegação */}
              <div className="flex gap-1 sm:gap-2 mt-3 sm:mt-4 overflow-x-auto pb-2 scrollbar-thin">
                <button
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  className={`flex-1 min-w-[80px] sm:min-w-[140px] px-2 sm:px-4 py-2 sm:py-2.5 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                    currentStep === 1
                      ? "bg-lumina-100 text-lumina-700 dark:bg-lumina-900/30 dark:text-lumina-400"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  }`}
                >
                  <div className="flex items-center gap-1.5 sm:gap-2 justify-center">
                    <User className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
                    <span className="hidden sm:inline">Dados Básicos</span>
                    <span className="sm:hidden">Dados</span>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentStep(2)}
                  className={`flex-1 min-w-[80px] sm:min-w-[140px] px-2 sm:px-4 py-2 sm:py-2.5 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                    currentStep === 2
                      ? "bg-lumina-100 text-lumina-700 dark:bg-lumina-900/30 dark:text-lumina-400"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  }`}
                >
                  <div className="flex items-center gap-1.5 sm:gap-2 justify-center">
                    <Smartphone className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
                    <span>Contato</span>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentStep(3)}
                  className={`flex-1 min-w-[80px] sm:min-w-[140px] px-2 sm:px-4 py-2 sm:py-2.5 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                    currentStep === 3
                      ? "bg-lumina-100 text-lumina-700 dark:bg-lumina-900/30 dark:text-lumina-400"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  }`}
                >
                  <div className="flex items-center gap-1.5 sm:gap-2 justify-center">
                    <Home className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
                    <span>Endereço</span>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentStep(4)}
                  className={`flex-1 min-w-[80px] sm:min-w-[140px] px-2 sm:px-4 py-2 sm:py-2.5 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                    currentStep === 4
                      ? "bg-lumina-100 text-lumina-700 dark:bg-lumina-900/30 dark:text-lumina-400"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  }`}
                >
                  <div className="flex items-center gap-1.5 sm:gap-2 justify-center">
                    <Briefcase className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
                    <span>Comercial</span>
                  </div>
                </button>
              </div>
            </CardHeader>

            <CardContent className="p-3 sm:p-4 lg:p-6 overflow-y-auto flex-1 min-h-0">
              <form className="space-y-4 sm:space-y-6">
                {/* ETAPA 1: DADOS BÁSICOS */}
                {currentStep === 1 && (
                  <div className="space-y-4 sm:space-y-6">
                    {/* Tipo de Pessoa */}
                    <div className="space-y-3 sm:space-y-4">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 sm:h-5 sm:w-5 text-lumina-600 flex-shrink-0" />
                        <h3 className="text-sm sm:text-base lg:text-lg font-semibold">Tipo de Cliente</h3>
                      </div>
                      <div className="grid grid-cols-2 gap-2 sm:gap-4">
                        <button
                          type="button"
                          onClick={() => setEditingClient({...editingClient, personType: "pf"})}
                          className={`p-2.5 sm:p-4 rounded-lg border-2 transition-all text-left ${
                            editingClient.personType === "pf"
                              ? "border-lumina-500 bg-lumina-50 dark:bg-lumina-900/20"
                              : "border-border hover:border-lumina-200"
                          }`}
                        >
                          <div className="flex items-center gap-2 sm:gap-3">
                            <User className={`h-5 w-5 sm:h-6 sm:w-6 flex-shrink-0 ${editingClient.personType === "pf" ? "text-lumina-600" : "text-muted-foreground"}`} />
                            <div className="min-w-0">
                              <p className="font-medium text-xs sm:text-sm truncate">Pessoa Física</p>
                              <p className="text-[10px] sm:text-xs text-muted-foreground truncate">Individual</p>
                            </div>
                          </div>
                        </button>

                        <button
                          type="button"
                          onClick={() => setEditingClient({...editingClient, personType: "pj"})}
                          className={`p-2.5 sm:p-4 rounded-lg border-2 transition-all text-left ${
                            editingClient.personType === "pj"
                              ? "border-lumina-500 bg-lumina-50 dark:bg-lumina-900/20"
                              : "border-border hover:border-lumina-200"
                          }`}
                        >
                          <div className="flex items-center gap-2 sm:gap-3">
                            <Building2 className={`h-5 w-5 sm:h-6 sm:w-6 flex-shrink-0 ${editingClient.personType === "pj" ? "text-lumina-600" : "text-muted-foreground"}`} />
                            <div className="min-w-0">
                              <p className="font-medium text-xs sm:text-sm truncate">Pessoa Jurídica</p>
                              <p className="text-[10px] sm:text-xs text-muted-foreground truncate">Empresa</p>
                            </div>
                          </div>
                        </button>
                      </div>
                    </div>

                    {/* Informações Básicas */}
                    <div className="space-y-3 sm:space-y-4">
                      <div className="flex items-center gap-2">
                        <FileSignature className="h-4 w-4 sm:h-5 sm:w-5 text-lumina-600 flex-shrink-0" />
                        <h3 className="text-sm sm:text-base lg:text-lg font-semibold">Informações Básicas</h3>
                      </div>
                      <div className="grid gap-3 sm:gap-4 md:grid-cols-2">
                        <div className="space-y-2 md:col-span-2">
                          <Label htmlFor="edit-name">
                            {editingClient.personType === "pf" ? "Nome Completo" : "Razão Social"} *
                          </Label>
                          <Input
                            id="edit-name"
                            value={editingClient.name}
                            onChange={(e) => setEditingClient({...editingClient, name: e.target.value})}
                            placeholder={editingClient.personType === "pf" ? "João da Silva" : "Empresa LTDA"}
                            required
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="edit-cpfCnpj">
                            {editingClient.personType === "pf" ? "CPF" : "CNPJ"}
                          </Label>
                          <Input
                            id="edit-cpfCnpj"
                            value={editingClient.cpfCnpj}
                            onChange={(e) => {
                              const formatted = editingClient.personType === "pf" 
                                ? formatCPF(e.target.value)
                                : formatCNPJ(e.target.value);
                              setEditingClient({...editingClient, cpfCnpj: formatted});
                            }}
                            placeholder={editingClient.personType === "pf" ? "000.000.000-00" : "00.000.000/0000-00"}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="edit-type">Tipo de Projeto *</Label>
                          <select
                            id="edit-type"
                            value={editingClient.type}
                            onChange={(e) => setEditingClient({...editingClient, type: e.target.value as "residential" | "commercial"})}
                            className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm"
                            required
                          >
                            <option value="residential">🏠 Residencial</option>
                            <option value="commercial">🏢 Comercial</option>
                          </select>
                        </div>

                        <div className="space-y-2 md:col-span-2">
                          <Label htmlFor="edit-status">Status do Cliente *</Label>
                          <select
                            id="edit-status"
                            value={editingClient.status}
                            onChange={(e) => setEditingClient({...editingClient, status: e.target.value as "active" | "inactive" | "potential"})}
                            className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm"
                            required
                          >
                            <option value="potential">🔵 Potencial - Em prospecção</option>
                            <option value="active">🟢 Ativo - Cliente atual</option>
                            <option value="inactive">⚪ Inativo - Sem projetos ativos</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* ETAPA 2: CONTATO */}
                {currentStep === 2 && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <Smartphone className="h-5 w-5 text-lumina-600" />
                      <h3 className="text-lg font-semibold">Informações de Contato</h3>
                    </div>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="edit-phone">Telefone Principal *</Label>
                        <Input
                          id="edit-phone"
                          value={editingClient.phone}
                          onChange={(e) => {
                            const formatted = formatPhone(e.target.value);
                            setEditingClient({...editingClient, phone: formatted});
                          }}
                          placeholder="(51) 99999-9999"
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="edit-phoneSecondary">Telefone Secundário</Label>
                        <Input
                          id="edit-phoneSecondary"
                          value={editingClient.phoneSecondary}
                          onChange={(e) => {
                            const formatted = formatPhone(e.target.value);
                            setEditingClient({...editingClient, phoneSecondary: formatted});
                          }}
                          placeholder="(51) 99999-9999"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="edit-email">Email Principal *</Label>
                        <Input
                          id="edit-email"
                          type="email"
                          value={editingClient.email}
                          onChange={(e) => setEditingClient({...editingClient, email: e.target.value})}
                          placeholder="cliente@email.com"
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="edit-emailSecondary">Email Secundário</Label>
                        <Input
                          id="edit-emailSecondary"
                          type="email"
                          value={editingClient.emailSecondary}
                          onChange={(e) => setEditingClient({...editingClient, emailSecondary: e.target.value})}
                          placeholder="contato@email.com"
                        />
                      </div>

                      {editingClient.personType === "pj" && (
                        <div className="space-y-2 md:col-span-2">
                          <Label htmlFor="edit-website">Website</Label>
                          <Input
                            id="edit-website"
                            value={editingClient.website}
                            onChange={(e) => setEditingClient({...editingClient, website: e.target.value})}
                            placeholder="https://www.empresa.com.br"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* ETAPA 3: ENDEREÇO */}
                {currentStep === 3 && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <Home className="h-5 w-5 text-lumina-600" />
                      <h3 className="text-lg font-semibold">Endereço</h3>
                    </div>
                    <div className="grid gap-4 md:grid-cols-6">
                      <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="edit-zipCode">CEP</Label>
                        <Input
                          id="edit-zipCode"
                          value={editingClient.zipCode}
                          onChange={(e) => {
                            const formatted = formatCEP(e.target.value);
                            setEditingClient({...editingClient, zipCode: formatted});
                          }}
                          placeholder="90000-000"
                        />
                      </div>

                      <div className="space-y-2 md:col-span-4">
                        <Label htmlFor="edit-address">Endereço *</Label>
                        <Input
                          id="edit-address"
                          value={editingClient.address}
                          onChange={(e) => setEditingClient({...editingClient, address: e.target.value})}
                          placeholder="Rua Example"
                          required
                        />
                      </div>

                      <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="edit-addressNumber">Número</Label>
                        <Input
                          id="edit-addressNumber"
                          value={editingClient.addressNumber}
                          onChange={(e) => setEditingClient({...editingClient, addressNumber: e.target.value})}
                          placeholder="123"
                        />
                      </div>

                      <div className="space-y-2 md:col-span-4">
                        <Label htmlFor="edit-complement">Complemento</Label>
                        <Input
                          id="edit-complement"
                          value={editingClient.complement}
                          onChange={(e) => setEditingClient({...editingClient, complement: e.target.value})}
                          placeholder="Apto 101, Bloco A"
                        />
                      </div>

                      <div className="space-y-2 md:col-span-3">
                        <Label htmlFor="edit-neighborhood">Bairro</Label>
                        <Input
                          id="edit-neighborhood"
                          value={editingClient.neighborhood}
                          onChange={(e) => setEditingClient({...editingClient, neighborhood: e.target.value})}
                          placeholder="Centro"
                        />
                      </div>

                      <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="edit-city">Cidade *</Label>
                        <Input
                          id="edit-city"
                          value={editingClient.city}
                          onChange={(e) => setEditingClient({...editingClient, city: e.target.value})}
                          placeholder="Porto Alegre"
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="edit-state">Estado *</Label>
                        <Input
                          id="edit-state"
                          value={editingClient.state}
                          onChange={(e) => setEditingClient({...editingClient, state: e.target.value})}
                          placeholder="RS"
                          maxLength={2}
                          required
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* ETAPA 4: INFORMAÇÕES COMERCIAIS */}
                {currentStep === 4 && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <Briefcase className="h-5 w-5 text-lumina-600" />
                      <h3 className="text-lg font-semibold">Informações Comerciais</h3>
                    </div>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="edit-howMetUs">Como Conheceu Nosso Trabalho?</Label>
                        <select
                          id="edit-howMetUs"
                          value={editingClient.howMetUs}
                          onChange={(e) => setEditingClient({...editingClient, howMetUs: e.target.value})}
                          className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm"
                        >
                          <option value="">Selecione uma opção</option>
                          <option value="indication">Indicação</option>
                          <option value="instagram">Instagram</option>
                          <option value="facebook">Facebook</option>
                          <option value="google">Google / Site</option>
                          <option value="event">Evento / Feira</option>
                          <option value="linkedin">LinkedIn</option>
                          <option value="other">Outro</option>
                        </select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="edit-referredBy">Indicado por</Label>
                        <Input
                          id="edit-referredBy"
                          value={editingClient.referredBy}
                          onChange={(e) => setEditingClient({...editingClient, referredBy: e.target.value})}
                          placeholder="Nome de quem indicou"
                        />
                      </div>

                      <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="edit-notes">Observações</Label>
                        <textarea
                          id="edit-notes"
                          value={editingClient.notes}
                          onChange={(e) => setEditingClient({...editingClient, notes: e.target.value})}
                          className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm min-h-[120px]"
                          placeholder="Informações adicionais sobre o cliente, preferências, histórico de contatos, etc."
                        />
                      </div>
                    </div>
                  </div>
                )}
              </form>
            </CardContent>

            {/* Footer com Botões de Navegação */}
            <div className="border-t p-3 sm:p-4 lg:p-6 flex-shrink-0 bg-muted/30">
              <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 sm:gap-4">
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={() => handleDeleteClient(editingClient.id, editingClient.name)}
                    disabled={isSaving}
                    className="text-xs sm:text-sm h-9 sm:h-10"
                  >
                    <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5" />
                    Excluir Cliente
                  </Button>
                </div>
                <div className="flex gap-2 sm:gap-3 w-full sm:w-auto">
                  {currentStep > 1 && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handlePreviousStep}
                      className="flex-1 sm:flex-none text-xs sm:text-sm h-9 sm:h-10"
                    >
                      Anterior
                    </Button>
                  )}
                  {currentStep < 4 ? (
                    <Button
                      type="button"
                      onClick={handleNextStep}
                      className="flex-1 sm:flex-none text-xs sm:text-sm h-9 sm:h-10"
                    >
                      Próximo
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      className="gap-1.5 sm:gap-2 flex-1 sm:flex-none text-xs sm:text-sm h-9 sm:h-10"
                      onClick={handleUpdateClient}
                      disabled={isSaving}
                    >
                      {isSaving ? (
                        <>
                          <Loader2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 animate-spin" />
                          Salvando...
                        </>
                      ) : (
                        <>
                          <FileText className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                          Salvar
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Diálogo de Confirmação de Exclusão */}
      <DeleteConfirmDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        onConfirm={confirmDeleteClient}
        title="Excluir Cliente"
        description="Tem certeza que deseja excluir este cliente? Esta ação não pode ser desfeita e todos os dados relacionados serão perdidos."
        itemName={clientToDelete?.name}
      />
      </div>
    </DynamicContainer>
  );
}


