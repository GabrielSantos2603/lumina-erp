import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { DynamicContainer, DynamicGrid } from "@/components/responsive";
import { cn } from "@/utils/cn";
import { DeleteConfirmDialog } from "@/components/DeleteConfirmDialog";
import { 
  Search, 
  LayoutGrid, 
  List,
  Plus,
  MapPin,
  User,
  Calendar,
  Building2,
  X,
  FileText,
  Users,
  DollarSign,
  Upload,
  Image as ImageIcon,
  File,
  Link as LinkIcon,
  Briefcase,
  Ruler,
  Home,
  Palette,
  Target,
  CheckCircle2,
  Loader2,
  Trash2
} from "lucide-react";
import { projectService, type Project as ProjectType } from "@/services/projectService";
import { clientService } from "@/services/clientService";
import { ProjectMediaManager } from "@/components/ProjectMediaManager";
import { supabase } from "@/lib/supabase";
import { ProjectInfoTab, ProjectTechnicalTab, ProjectTeamTab, ProjectMediaTab } from "./components";
import toast from "react-hot-toast";

interface Project {
  id: string;
  name: string;
  clientName: string;
  clientId?: string;
  address?: string;
  city?: string;
  state?: string;
  status: "planning" | "in_progress" | "completed" | "paused" | "cancelled";
  category: "architecture" | "interior_design" | "landscape" | "renovation" | "other";
  type: "residential" | "commercial";
  priority?: "low" | "medium" | "high" | "urgent";
  imageUrl?: string;
  startDate?: string;
  endDate?: string;
  budget?: number;
  actualCost?: number;
  areaSqm?: number;
  description?: string;
}

const statusLabels = {
  planning: { label: "Planejamento", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
  in_progress: { label: "Em Andamento", color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" },
  completed: { label: "Concluído", color: "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400" },
  paused: { label: "Pausado", color: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400" },
  cancelled: { label: "Cancelado", color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" }
};

const categoryLabels = {
  architecture: { label: "Arquitetura", icon: Building2 },
  interior_design: { label: "Design de Interiores", icon: Palette },
  landscape: { label: "Paisagismo", icon: Home },
  renovation: { label: "Reforma", icon: Ruler },
  other: { label: "Outro", icon: Briefcase }
};

const priorityLabels = {
  low: { label: "Baixa", color: "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400" },
  medium: { label: "Média", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
  high: { label: "Alta", color: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400" },
  urgent: { label: "Urgente", color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" }
};

export function ProjectsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showMediaManager, setShowMediaManager] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [activeTab, setActiveTab] = useState<"info" | "technical" | "team" | "files">("info");
  const [currentStep, setCurrentStep] = useState(1);
  const [currentEditStep, setCurrentEditStep] = useState(1);
  const [uploadedImages, setUploadedImages] = useState<File[]>([]);
  const [uploadedDocuments, setUploadedDocuments] = useState<File[]>([]);
  const [coverImagePreview, setCoverImagePreview] = useState<string>("");
  const [projects, setProjects] = useState<Project[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<{ id: string; name: string } | null>(null);
  
  const [newProject, setNewProject] = useState({
    // Etapa 1: Informações Básicas
    name: "",
    client: "",
    category: "architecture" as "architecture" | "interior_design" | "landscape" | "renovation" | "other",
    type: "residential" as "residential" | "commercial",
    status: "planning" as "planning" | "in_progress" | "completed" | "paused" | "cancelled",
    priority: "medium" as "low" | "medium" | "high" | "urgent",
    startDate: "",
    endDate: "",
    value: "",
    
    // Etapa 2: Detalhes Técnicos
    area: "",
    address: "",
    city: "",
    state: "",
    zipCode: "",
    description: "",
    objectives: "",
    style: "contemporary" as "contemporary" | "modern" | "classic" | "industrial" | "minimalist" | "rustic" | "other",
    rooms: "",
    floors: "",
    
    // Etapa 3: Equipe e Orçamento
    architect: "",
    team: [] as string[],
    budget: "",
    estimatedHours: "",
    consultants: "",
    
    // Etapa 4: Arquivos e Links
    externalLinks: "",
    notes: "",
    imageUrl: ""
  });

  const [editingProject, setEditingProject] = useState({
    id: "",
    name: "",
    client: "",
    category: "architecture" as "architecture" | "interior_design" | "landscape" | "renovation" | "other",
    type: "residential" as "residential" | "commercial",
    status: "planning" as "planning" | "in_progress" | "completed" | "paused" | "cancelled",
    priority: "medium" as "low" | "medium" | "high" | "urgent",
    startDate: "",
    endDate: "",
    budget: "",
    area: "",
    address: "",
    city: "",
    state: "",
    zipCode: "",
    description: "",
    notes: "",
    imageUrl: "",
    floors: "",
    rooms: ""
  });

  const handleNextStep = () => {
    if (currentStep < 4) setCurrentStep(currentStep + 1);
  };

  const handlePreviousStep = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  const handleCloseForm = () => {
    console.log("Fechando formulário e resetando estado");
    setShowAddForm(false);
    setCurrentStep(1);
    setUploadedImages([]);
    setUploadedDocuments([]);
    setCoverImagePreview("");
    setIsSaving(false); // Garantir que o estado de salvamento seja resetado
    setNewProject({
      name: "",
      client: "",
      category: "architecture",
      type: "residential",
      status: "planning",
      priority: "medium",
      startDate: "",
      endDate: "",
      value: "",
      area: "",
      address: "",
      city: "",
      state: "",
      zipCode: "",
      description: "",
      objectives: "",
      style: "contemporary",
      rooms: "",
      floors: "",
      architect: "",
      team: [],
      budget: "",
      estimatedHours: "",
      consultants: "",
      externalLinks: "",
      notes: "",
      imageUrl: ""
    });
  };

  const handleOpenDetails = (project: Project) => {
    setSelectedProject(project);
    setShowDetailsModal(true);
    setActiveTab("info");
  };

  const handleCloseDetails = () => {
    setShowDetailsModal(false);
    setSelectedProject(null);
  };

  const handleOpenEditForm = (project: Project) => {
    setEditingProject({
      id: project.id,
      name: project.name,
      client: project.clientId || "",
      category: project.category,
      type: project.type,
      status: project.status,
      priority: project.priority || "medium",
      startDate: project.startDate || "",
      endDate: project.endDate || "",
      budget: project.budget?.toString() || "",
      area: project.areaSqm?.toString() || "",
      address: project.address || "",
      city: project.city || "",
      state: project.state || "",
      zipCode: "",
      description: project.description || "",
      notes: "",
      imageUrl: project.imageUrl || "",
      floors: "",
      rooms: ""
    });
    setCoverImagePreview(project.imageUrl || "");
    setShowDetailsModal(false);
    setShowEditForm(true);
    setCurrentEditStep(1);
  };

  const handleCloseEditForm = () => {
    setShowEditForm(false);
    setCurrentEditStep(1);
    setCoverImagePreview("");
  };

  const handleCoverImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, isEdit = false) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      // Validar tamanho (máximo 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Imagem muito grande! Máximo 5MB");
        return;
      }
      
      try {
        toast.loading("Fazendo upload da imagem...");
        
        // Upload para o Supabase Storage
        const fileExt = file.name.split('.').pop();
        const fileName = `project-cover-${Date.now()}.${fileExt}`;
        const filePath = `projects/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('project-media')
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false
          });

        if (uploadError) {
          console.error("Erro no upload:", uploadError);
          toast.dismiss();
          toast.error("Erro ao fazer upload da imagem");
          return;
        }

        // Obter URL pública/assinada
        const { data: urlData } = await supabase.storage
          .from('project-media')
          .createSignedUrl(filePath, 31536000); // 1 ano

        if (urlData?.signedUrl) {
          const imageUrl = urlData.signedUrl;
          setCoverImagePreview(imageUrl);
          
          if (isEdit) {
            setEditingProject({...editingProject, imageUrl});
          } else {
            setNewProject({...newProject, imageUrl});
          }
          
          toast.dismiss();
          toast.success("✅ Imagem carregada!");
        }
      } catch (error) {
        console.error("Erro ao fazer upload:", error);
        toast.dismiss();
        toast.error("Erro ao fazer upload da imagem");
      }
    }
  };

  const removeCoverImage = (isEdit = false) => {
    setCoverImagePreview("");
    if (isEdit) {
      setEditingProject({...editingProject, imageUrl: ""});
    } else {
      setNewProject({...newProject, imageUrl: ""});
    }
  };

  const handleDeleteProject = async (projectId: string, projectName: string) => {
    setProjectToDelete({ id: projectId, name: projectName });
    setShowDeleteDialog(true);
  };

  const confirmDeleteProject = async () => {
    if (!projectToDelete) return;

    try {
      setIsSaving(true);
      const toastId = toast.loading("Excluindo projeto...");

      await projectService.deleteProject(projectToDelete.id);
      
      toast.success("✅ Projeto excluído com sucesso!", { id: toastId });
      
      // Recarregar lista
      await loadProjects();
      
      // Fechar modais se estiverem abertos
      handleCloseEditForm();
      handleCloseDetails();
      
      // Resetar projeto a deletar
      setProjectToDelete(null);
    } catch (error: any) {
      console.error("Erro ao excluir projeto:", error);
      toast.error(error.message || "Erro ao excluir projeto");
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateProject = async () => {
    if (!editingProject.name || !editingProject.client) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    try {
      setIsSaving(true);
      toast.loading("Atualizando projeto...");

      const selectedClient = clients.find(c => c.id === editingProject.client);

      const projectData = {
        name: editingProject.name,
        client_id: editingProject.client || undefined,
        client_name: selectedClient?.name || editingProject.client,
        category: editingProject.category,
        type: editingProject.type,
        status: editingProject.status,
        priority: editingProject.priority,
        start_date: editingProject.startDate || undefined,
        end_date: editingProject.endDate || undefined,
        budget: editingProject.budget ? parseFloat(editingProject.budget) : undefined,
        area_sqm: editingProject.area ? parseFloat(editingProject.area) : undefined,
        address: editingProject.address || undefined,
        city: editingProject.city || undefined,
        state: editingProject.state || undefined,
        description: editingProject.description || undefined,
        notes: editingProject.notes || undefined,
        image_url: editingProject.imageUrl || undefined,
        floors: editingProject.floors ? parseInt(editingProject.floors) : undefined,
        bedrooms: editingProject.rooms ? parseInt(editingProject.rooms) : undefined,
      };

      await projectService.updateProject(editingProject.id, projectData);
      
      toast.dismiss();
      toast.success("✅ Projeto atualizado com sucesso!");
      
      await loadProjects();
      handleCloseEditForm();
    } catch (error: any) {
      console.error("Erro ao atualizar projeto:", error);
      toast.dismiss();
      toast.error(error.message || "Erro ao atualizar projeto");
    } finally {
      setIsSaving(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      setUploadedImages(prev => [...prev, ...files]);
    }
  };

  const handleDocumentUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      setUploadedDocuments(prev => [...prev, ...files]);
    }
  };

  const removeImage = (index: number) => {
    setUploadedImages(prev => prev.filter((_, i) => i !== index));
  };

  const removeDocument = (index: number) => {
    setUploadedDocuments(prev => prev.filter((_, i) => i !== index));
  };

  // Carregar projetos e clientes ao montar o componente
  useEffect(() => {
    loadProjects();
    loadClients();
  }, []);

  const loadProjects = async () => {
    try {
      setIsLoading(true);
      console.log("🔄 Carregando projetos...");
      const data = await projectService.getAllProjects();
      
      // Mapear dados do Supabase para o formato da interface
      const mappedProjects: Project[] = data.map((p: ProjectType) => ({
        id: p.id,
        name: p.name,
        clientName: p.client_name || "Sem cliente",
        clientId: p.client_id,
        address: p.address,
        city: p.city,
        state: p.state,
        status: p.status,
        category: p.category,
        type: p.type,
        priority: p.priority,
        imageUrl: p.image_url,
        startDate: p.start_date,
        endDate: p.end_date,
        budget: p.budget,
        actualCost: p.actual_cost,
        areaSqm: p.area_sqm,
        description: p.description
      }));
      
      setProjects(mappedProjects);
      console.log(`✅ ${mappedProjects.length} projetos carregados`);
    } catch (error: any) {
      console.error("❌ Erro ao carregar projetos:", error);
      toast.error("Erro ao carregar projetos");
      setProjects([]);
    } finally {
      setIsLoading(false);
    }
  };

  const loadClients = async () => {
    try {
      const data = await clientService.getAllClients();
      setClients(data);
    } catch (error) {
      console.error("Erro ao carregar clientes:", error);
    }
  };

  const handleSubmitProject = async () => {
    console.log("=== Iniciando handleSubmitProject ===");
    console.log("newProject:", newProject);
    
    if (!newProject.name || !newProject.client) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    // Prevenir múltiplos cliques
    if (isSaving) {
      console.log("Já está salvando, ignorando clique");
      return;
    }

    const toastId = toast.loading("Salvando projeto...");

    try {
      setIsSaving(true);
      console.log("Estado isSaving definido como true");

      // Encontrar o cliente selecionado
      const selectedClient = clients.find(c => c.id === newProject.client);
      console.log("Cliente selecionado:", selectedClient);

      const projectData = {
        name: newProject.name,
        client_id: newProject.client || undefined,
        client_name: selectedClient?.name || newProject.client,
        category: newProject.category,
        type: newProject.type,
        status: newProject.status,
        priority: newProject.priority,
        start_date: newProject.startDate || undefined,
        end_date: newProject.endDate || undefined,
        budget: newProject.budget ? parseFloat(newProject.budget) : undefined,
        area_sqm: newProject.area ? parseFloat(newProject.area) : undefined,
        address: newProject.address || undefined,
        city: newProject.city || undefined,
        state: newProject.state || undefined,
        zip_code: newProject.zipCode || undefined,
        description: newProject.description || undefined,
        notes: newProject.notes || undefined,
        image_url: newProject.imageUrl || undefined,
        floors: newProject.floors ? parseInt(newProject.floors) : undefined,
        bedrooms: newProject.rooms ? parseInt(newProject.rooms) : undefined,
      };

      console.log("Dados do projeto preparados:", projectData);
      console.log("Chamando projectService.createProject...");
      
      const result = await projectService.createProject(projectData);
      console.log("Projeto criado com sucesso:", result);
      
      toast.dismiss(toastId);
      toast.success("✅ Projeto criado com sucesso!");
      
      // Recarregar lista
      console.log("Recarregando lista de projetos...");
      await loadProjects();
      
      // Fechar modal e resetar form
      console.log("Fechando formulário...");
      handleCloseForm();
      console.log("=== handleSubmitProject concluído com sucesso ===");
    } catch (error: any) {
      console.error("=== ERRO ao criar projeto ===");
      console.error("Tipo de erro:", typeof error);
      console.error("Erro completo:", error);
      console.error("Mensagem de erro:", error?.message);
      console.error("Stack trace:", error?.stack);
      
      toast.dismiss(toastId);
      toast.error(error?.message || "Erro ao criar projeto. Verifique o console.");
    } finally {
      console.log("Executando finally, definindo isSaving como false");
      setIsSaving(false);
    }
  };

  const filteredProjects = projects.filter(project => {
    if (!searchQuery.trim()) return true;
    
    const query = searchQuery.toLowerCase().trim();
    
    // Busca por nome do projeto
    if (project.name?.toLowerCase().includes(query)) return true;
    
    // Busca por cliente
    if (project.clientName?.toLowerCase().includes(query)) return true;
    
    // Busca por localização
    if (project.city?.toLowerCase().includes(query)) return true;
    if (project.state?.toLowerCase().includes(query)) return true;
    if (project.address?.toLowerCase().includes(query)) return true;
    
    // Busca por status
    if (statusLabels[project.status]?.label.toLowerCase().includes(query)) return true;
    
    // Busca por categoria
    if (categoryLabels[project.category]?.label.toLowerCase().includes(query)) return true;
    
    // Busca por tipo (residencial/comercial)
    if (project.type === "residential" && ["residencial", "residencia", "casa"].some(term => query.includes(term))) return true;
    if (project.type === "commercial" && ["comercial", "comercio", "loja", "empresa"].some(term => query.includes(term))) return true;
    
    // Busca por prioridade
    if (project.priority && priorityLabels[project.priority]?.label.toLowerCase().includes(query)) return true;
    
    // Busca por descrição
    if (project.description?.toLowerCase().includes(query)) return true;
    
    return false;
  });

  return (
    <DynamicContainer className="overflow-x-hidden">
      <div className="space-y-3 sm:space-y-4 lg:space-y-6">
        {/* Título da Página */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground">
              Projetos
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">
              {isLoading ? "Carregando..." : `${filteredProjects.length} ${filteredProjects.length === 1 ? 'projeto' : 'projetos'}`}
            </p>
          </div>
          <Button className="gap-2 w-full sm:w-auto" size="sm" onClick={() => setShowAddForm(true)}>
            <Plus className="h-4 w-4" />
            <span className="hidden xs:inline">Novo Projeto</span>
            <span className="xs:hidden">Novo</span>
          </Button>
        </div>

        {/* Header com busca e ações */}
        <div className="flex flex-col gap-2 sm:gap-3 lg:gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar projetos..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 pr-9 text-sm"
          />
          {searchQuery && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSearchQuery("")}
              className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
            >
              <X className="h-3 w-3" />
              <span className="sr-only">Limpar busca</span>
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

      {/* Badge de resultados da busca */}
      {searchQuery && (
        <div className="flex items-center justify-between bg-muted/50 rounded-lg px-4 py-2.5 border">
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">
              {filteredProjects.length === 0
                ? 'Nenhum projeto encontrado'
                : `${filteredProjects.length} ${filteredProjects.length === 1 ? 'projeto encontrado' : 'projetos encontrados'}`
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
          <span className="ml-3 text-muted-foreground">Carregando projetos...</span>
        </div>
      ) : (
        <>
          {/* Grid de projetos */}
          {viewMode === "grid" ? (
            <DynamicGrid 
              columns={4}
              minCardWidth={240}
            >
              {filteredProjects.map((project) => (
                <Card 
                  key={project.id} 
                  className="group cursor-pointer hover:shadow-lg transition-all duration-200 overflow-hidden"
                  onClick={() => handleOpenDetails(project)}
                >
                  {/* Imagem do projeto */}
                  {project.imageUrl && (
                    <div className="relative h-32 sm:h-36 lg:h-40 overflow-hidden bg-muted">
                      <img
                        src={project.imageUrl}
                        alt={project.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                        }}
                      />
                      <div className="absolute top-2 right-2">
                        <Badge className={cn("text-[10px] sm:text-xs", statusLabels[project.status].color)}>
                          {statusLabels[project.status].label}
                        </Badge>
                      </div>
                    </div>
                  )}

                  {/* Informações do projeto */}
                  <CardContent className={cn(
                    "p-3 sm:p-4 lg:p-5 space-y-1.5 sm:space-y-2",
                    !project.imageUrl && "pt-4 sm:pt-5 lg:pt-6"
                  )}>
                    {!project.imageUrl && (
                      <div className="flex justify-end mb-1 sm:mb-2">
                        <Badge className={cn("text-[10px] sm:text-xs", statusLabels[project.status].color)}>
                          {statusLabels[project.status].label}
                        </Badge>
                      </div>
                    )}
                    <h3 className="font-semibold text-xs sm:text-sm line-clamp-2 min-h-[2rem] sm:min-h-[2.5rem]">
                      {project.name}
                    </h3>

                    <div className="space-y-1 sm:space-y-1.5 text-[10px] sm:text-xs text-muted-foreground">
                      <div className="flex items-start gap-1.5 sm:gap-2">
                        <User className="h-3 w-3 sm:h-3.5 sm:w-3.5 mt-0.5 flex-shrink-0" />
                        <span className="line-clamp-1 truncate">{project.clientName}</span>
                      </div>

                      {project.address && (
                        <div className="flex items-start gap-1.5 sm:gap-2">
                          <MapPin className="h-3 w-3 sm:h-3.5 sm:w-3.5 mt-0.5 flex-shrink-0" />
                          <div className="flex flex-col flex-1 min-w-0">
                            <span className="line-clamp-1 truncate">{project.address}</span>
                            <span className="line-clamp-1 truncate">
                              {project.city}{project.state ? `, ${project.state}` : ''}
                            </span>
                          </div>
                        </div>
                      )}

                      {project.startDate && (
                        <div className="flex items-center gap-1.5 sm:gap-2 pt-0.5 sm:pt-1">
                          <Calendar className="h-3 w-3 sm:h-3.5 sm:w-3.5 flex-shrink-0" />
                          <span className="truncate">
                            {new Date(project.startDate).toLocaleDateString("pt-BR")}
                          </span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </DynamicGrid>
          ) : (
            /* Lista de projetos */
            <div className="space-y-2">
              {filteredProjects.map((project) => (
                <Card 
                  key={project.id}
                  className="hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => handleOpenDetails(project)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      {/* Imagem miniatura */}
                      {project.imageUrl && (
                        <div className="w-24 h-24 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                          <img
                            src={project.imageUrl}
                            alt={project.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                            }}
                          />
                        </div>
                      )}

                      {/* Informações */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4 mb-2">
                          <h3 className="font-semibold text-base">{project.name}</h3>
                          <Badge className={statusLabels[project.status].color}>
                            {statusLabels[project.status].label}
                          </Badge>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4" />
                            <span>{project.clientName}</span>
                          </div>
                          {project.city && (
                            <div className="flex items-center gap-2">
                              <Building2 className="h-4 w-4" />
                              <span>{project.city}{project.state ? `, ${project.state}` : ''}</span>
                            </div>
                          )}
                          {project.startDate && (
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4" />
                              <span>
                                {new Date(project.startDate).toLocaleDateString("pt-BR")}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Mensagem quando não há resultados */}
          {filteredProjects.length === 0 && !isLoading && (
            <div className="text-center py-12">
              <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-2">
                {searchQuery ? "Nenhum projeto encontrado" : "Nenhum projeto cadastrado"}
              </h3>
              <p className="text-muted-foreground mb-4">
                {searchQuery 
                  ? "Tente ajustar os termos da sua busca"
                  : "Comece adicionando seu primeiro projeto ao sistema"
                }
              </p>
              {!searchQuery && (
                <Button
                  onClick={() => setShowAddForm(true)}
                  className="gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Adicionar Primeiro Projeto
                </Button>
              )}
            </div>
          )}
        </>
      )}

      {/* Modal de Adicionar Projeto */}
      {showAddForm && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-5xl max-h-[90vh] flex flex-col">
            <CardHeader className="border-b flex-shrink-0">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Briefcase className="h-5 w-5" />
                    Criar Novo Projeto
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
                  className={`flex-1 min-w-[160px] px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    currentStep === 1
                      ? "bg-lumina-100 text-lumina-700 dark:bg-lumina-900/30 dark:text-lumina-400"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  }`}
                >
                  <div className="flex items-center gap-2 justify-center">
                    <FileText className="h-4 w-4" />
                    <span>Informações Básicas</span>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentStep(2)}
                  className={`flex-1 min-w-[160px] px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    currentStep === 2
                      ? "bg-lumina-100 text-lumina-700 dark:bg-lumina-900/30 dark:text-lumina-400"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  }`}
                >
                  <div className="flex items-center gap-2 justify-center">
                    <Ruler className="h-4 w-4" />
                    <span>Detalhes Técnicos</span>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentStep(3)}
                  className={`flex-1 min-w-[160px] px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    currentStep === 3
                      ? "bg-lumina-100 text-lumina-700 dark:bg-lumina-900/30 dark:text-lumina-400"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  }`}
                >
                  <div className="flex items-center gap-2 justify-center">
                    <Users className="h-4 w-4" />
                    <span>Equipe & Orçamento</span>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentStep(4)}
                  className={`flex-1 min-w-[160px] px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    currentStep === 4
                      ? "bg-lumina-100 text-lumina-700 dark:bg-lumina-900/30 dark:text-lumina-400"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  }`}
                >
                  <div className="flex items-center gap-2 justify-center">
                    <Upload className="h-4 w-4" />
                    <span>Arquivos & Mídias</span>
                  </div>
                </button>
              </div>
            </CardHeader>

            <CardContent className="p-6 overflow-y-auto flex-1">
              <form className="space-y-6">
                {/* ETAPA 1: INFORMAÇÕES BÁSICAS */}
                {currentStep === 1 && (
                  <div className="space-y-6">
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <FileText className="h-5 w-5 text-lumina-600" />
                        <h3 className="text-lg font-semibold">Dados do Projeto</h3>
                      </div>
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2 md:col-span-2">
                          <Label htmlFor="name">Nome do Projeto *</Label>
                          <Input
                            id="name"
                            value={newProject.name}
                            onChange={(e) => setNewProject({...newProject, name: e.target.value})}
                            placeholder="Ex: Residência Silva, Condomínio Park..."
                            required
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="client">Cliente *</Label>
                          <select
                            id="client"
                            value={newProject.client}
                            onChange={(e) => setNewProject({...newProject, client: e.target.value})}
                            className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm"
                            required
                          >
                            <option value="">Selecione um cliente</option>
                            {clients.map((client) => (
                              <option key={client.id} value={client.id}>
                                {client.name}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="category">Categoria *</Label>
                          <select
                            id="category"
                            value={newProject.category}
                            onChange={(e) => setNewProject({...newProject, category: e.target.value as any})}
                            className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm"
                            required
                          >
                            <option value="architecture">🏛️ Arquitetura</option>
                            <option value="interior_design">🛋️ Design de Interiores</option>
                            <option value="landscape">🌳 Paisagismo</option>
                            <option value="renovation">🔨 Reforma</option>
                            <option value="other">📋 Outro</option>
                          </select>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="type">Tipo de Projeto *</Label>
                          <select
                            id="type"
                            value={newProject.type}
                            onChange={(e) => setNewProject({...newProject, type: e.target.value as "residential" | "commercial"})}
                            className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm"
                            required
                          >
                            <option value="residential">🏠 Residencial</option>
                            <option value="commercial">🏢 Comercial</option>
                          </select>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="status">Status *</Label>
                          <select
                            id="status"
                            value={newProject.status}
                            onChange={(e) => setNewProject({...newProject, status: e.target.value as any})}
                            className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm"
                            required
                          >
                            <option value="planning">📋 Planejamento</option>
                            <option value="in_progress">🚀 Em Andamento</option>
                            <option value="paused">⏸️ Pausado</option>
                            <option value="completed">✅ Concluído</option>
                            <option value="cancelled">❌ Cancelado</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <Target className="h-5 w-5 text-lumina-600" />
                        <h3 className="text-lg font-semibold">Prazos e Valores</h3>
                      </div>
                      <div className="grid gap-4 md:grid-cols-3">
                        <div className="space-y-2">
                          <Label htmlFor="priority">Prioridade *</Label>
                          <select
                            id="priority"
                            value={newProject.priority}
                            onChange={(e) => setNewProject({...newProject, priority: e.target.value as any})}
                            className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm"
                            required
                          >
                            <option value="low">🟢 Baixa</option>
                            <option value="medium">🟡 Média</option>
                            <option value="high">🟠 Alta</option>
                            <option value="urgent">🔴 Urgente</option>
                          </select>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="startDate">Data de Início *</Label>
                          <Input
                            id="startDate"
                            type="date"
                            value={newProject.startDate}
                            onChange={(e) => setNewProject({...newProject, startDate: e.target.value})}
                            required
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="endDate">Data de Conclusão Prevista</Label>
                          <Input
                            id="endDate"
                            type="date"
                            value={newProject.endDate}
                            onChange={(e) => setNewProject({...newProject, endDate: e.target.value})}
                          />
                        </div>

                        <div className="space-y-2 md:col-span-3">
                          <Label htmlFor="value">Valor do Projeto (R$)</Label>
                          <Input
                            id="value"
                            type="number"
                            value={newProject.value}
                            onChange={(e) => setNewProject({...newProject, value: e.target.value})}
                            placeholder="150000.00"
                            step="0.01"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* ETAPA 2: DETALHES TÉCNICOS */}
                {currentStep === 2 && (
                  <div className="space-y-6">
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <Home className="h-5 w-5 text-lumina-600" />
                        <h3 className="text-lg font-semibold">Localização</h3>
                      </div>
                      <div className="grid gap-4 md:grid-cols-6">
                        <div className="space-y-2 md:col-span-2">
                          <Label htmlFor="zipCode">CEP</Label>
                          <Input
                            id="zipCode"
                            value={newProject.zipCode}
                            onChange={(e) => setNewProject({...newProject, zipCode: e.target.value})}
                            placeholder="90000-000"
                          />
                        </div>

                        <div className="space-y-2 md:col-span-4">
                          <Label htmlFor="address">Endereço *</Label>
                          <Input
                            id="address"
                            value={newProject.address}
                            onChange={(e) => setNewProject({...newProject, address: e.target.value})}
                            placeholder="Rua Example, 123"
                            required
                          />
                        </div>

                        <div className="space-y-2 md:col-span-3">
                          <Label htmlFor="city">Cidade *</Label>
                          <Input
                            id="city"
                            value={newProject.city}
                            onChange={(e) => setNewProject({...newProject, city: e.target.value})}
                            placeholder="Porto Alegre"
                            required
                          />
                        </div>

                        <div className="space-y-2 md:col-span-3">
                          <Label htmlFor="state">Estado *</Label>
                          <Input
                            id="state"
                            value={newProject.state}
                            onChange={(e) => setNewProject({...newProject, state: e.target.value})}
                            placeholder="RS"
                            maxLength={2}
                            required
                          />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <Ruler className="h-5 w-5 text-lumina-600" />
                        <h3 className="text-lg font-semibold">Especificações Técnicas</h3>
                      </div>
                      <div className="grid gap-4 md:grid-cols-3">
                        <div className="space-y-2">
                          <Label htmlFor="area">Área Total (m²) *</Label>
                          <Input
                            id="area"
                            type="number"
                            value={newProject.area}
                            onChange={(e) => setNewProject({...newProject, area: e.target.value})}
                            placeholder="250.50"
                            step="0.01"
                            required
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="rooms">Número de Cômodos</Label>
                          <Input
                            id="rooms"
                            type="number"
                            value={newProject.rooms}
                            onChange={(e) => setNewProject({...newProject, rooms: e.target.value})}
                            placeholder="5"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="floors">Pavimentos</Label>
                          <Input
                            id="floors"
                            type="number"
                            value={newProject.floors}
                            onChange={(e) => setNewProject({...newProject, floors: e.target.value})}
                            placeholder="2"
                          />
                        </div>

                        <div className="space-y-2 md:col-span-3">
                          <Label htmlFor="style">Estilo/Conceito</Label>
                          <select
                            id="style"
                            value={newProject.style}
                            onChange={(e) => setNewProject({...newProject, style: e.target.value as any})}
                            className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm"
                          >
                            <option value="contemporary">Contemporâneo</option>
                            <option value="modern">Moderno</option>
                            <option value="classic">Clássico</option>
                            <option value="industrial">Industrial</option>
                            <option value="minimalist">Minimalista</option>
                            <option value="rustic">Rústico</option>
                            <option value="other">Outro</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="description">Descrição do Projeto</Label>
                        <textarea
                          id="description"
                          value={newProject.description}
                          onChange={(e) => setNewProject({...newProject, description: e.target.value})}
                          className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm min-h-[100px]"
                          placeholder="Descreva o projeto, suas características principais e diferenciais..."
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="objectives">Objetivos e Metas</Label>
                        <textarea
                          id="objectives"
                          value={newProject.objectives}
                          onChange={(e) => setNewProject({...newProject, objectives: e.target.value})}
                          className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm min-h-[80px]"
                          placeholder="Liste os principais objetivos e metas do projeto..."
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* ETAPA 3: EQUIPE E ORÇAMENTO */}
                {currentStep === 3 && (
                  <div className="space-y-6">
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <Users className="h-5 w-5 text-lumina-600" />
                        <h3 className="text-lg font-semibold">Equipe do Projeto</h3>
                      </div>
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2 md:col-span-2">
                          <Label htmlFor="architect">Arquiteto Responsável *</Label>
                          <select
                            id="architect"
                            value={newProject.architect}
                            onChange={(e) => setNewProject({...newProject, architect: e.target.value})}
                            className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm"
                            required
                          >
                            <option value="">Selecione o responsável</option>
                            <option value="João Silva">João Silva - Arquiteto Sênior</option>
                            <option value="Maria Santos">Maria Santos - Arquiteta</option>
                            <option value="Carlos Oliveira">Carlos Oliveira - Designer</option>
                          </select>
                        </div>

                        <div className="space-y-2 md:col-span-2">
                          <Label htmlFor="consultants">Consultores Externos</Label>
                          <Input
                            id="consultants"
                            value={newProject.consultants}
                            onChange={(e) => setNewProject({...newProject, consultants: e.target.value})}
                            placeholder="Ex: Engenheiro estrutural, Paisagista..."
                          />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-5 w-5 text-lumina-600" />
                        <h3 className="text-lg font-semibold">Orçamento e Recursos</h3>
                      </div>
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="budget">Orçamento Total (R$) *</Label>
                          <Input
                            id="budget"
                            type="number"
                            value={newProject.budget}
                            onChange={(e) => setNewProject({...newProject, budget: e.target.value})}
                            placeholder="200000.00"
                            step="0.01"
                            required
                          />
                          <p className="text-xs text-muted-foreground">
                            Incluindo materiais, mão de obra e consultoria
                          </p>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="estimatedHours">Horas Estimadas</Label>
                          <Input
                            id="estimatedHours"
                            type="number"
                            value={newProject.estimatedHours}
                            onChange={(e) => setNewProject({...newProject, estimatedHours: e.target.value})}
                            placeholder="240"
                          />
                          <p className="text-xs text-muted-foreground">
                            Total de horas previstas para o projeto
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* ETAPA 4: ARQUIVOS E MÍDIAS */}
                {currentStep === 4 && (
                  <div className="space-y-6">
                    {/* Imagem de Capa */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <ImageIcon className="h-5 w-5 text-lumina-600" />
                        <h3 className="text-lg font-semibold">Imagem de Capa</h3>
                      </div>
                      
                      {!coverImagePreview ? (
                        <div className="border-2 border-dashed rounded-lg p-8 text-center">
                          <input
                            type="file"
                            id="coverImageUpload"
                            accept="image/*"
                            onChange={(e) => handleCoverImageUpload(e, false)}
                            className="hidden"
                          />
                          <label
                            htmlFor="coverImageUpload"
                            className="cursor-pointer flex flex-col items-center gap-3"
                          >
                            <ImageIcon className="h-12 w-12 text-muted-foreground" />
                            <div>
                              <p className="font-medium">Clique para adicionar imagem de capa</p>
                              <p className="text-sm text-muted-foreground">PNG, JPG, JPEG até 10MB (opcional)</p>
                            </div>
                          </label>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <p className="text-sm font-medium">Preview da Imagem de Capa:</p>
                          <div className="relative h-48 w-full rounded-lg overflow-hidden bg-muted">
                            <img
                              src={coverImagePreview}
                              alt="Preview"
                              className="w-full h-full object-cover"
                            />
                            <Button
                              type="button"
                              variant="destructive"
                              size="icon"
                              className="absolute top-2 right-2"
                              onClick={() => removeCoverImage(false)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <ImageIcon className="h-5 w-5 text-lumina-600" />
                        <h3 className="text-lg font-semibold">Imagens de Referência</h3>
                      </div>
                      
                      <div className="border-2 border-dashed rounded-lg p-8 text-center">
                        <input
                          type="file"
                          id="imageUpload"
                          multiple
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="hidden"
                        />
                        <label
                          htmlFor="imageUpload"
                          className="cursor-pointer flex flex-col items-center gap-3"
                        >
                          <ImageIcon className="h-12 w-12 text-muted-foreground" />
                          <div>
                            <p className="font-medium">Clique para adicionar imagens</p>
                            <p className="text-sm text-muted-foreground">PNG, JPG, JPEG até 10MB</p>
                          </div>
                        </label>
                      </div>

                      {uploadedImages.length > 0 && (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          {uploadedImages.map((file, index) => (
                            <div key={index} className="relative group">
                              <div className="aspect-square rounded-lg bg-muted overflow-hidden">
                                <img
                                  src={URL.createObjectURL(file)}
                                  alt={`Preview ${index + 1}`}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                              <Button
                                type="button"
                                variant="destructive"
                                size="icon"
                                className="absolute top-2 right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={() => removeImage(index)}
                              >
                                <X className="h-3 w-3" />
                              </Button>
                              <p className="text-xs text-muted-foreground mt-1 truncate">
                                {file.name}
                              </p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <File className="h-5 w-5 text-lumina-600" />
                        <h3 className="text-lg font-semibold">Documentos e Plantas</h3>
                      </div>
                      
                      <div className="border-2 border-dashed rounded-lg p-8 text-center">
                        <input
                          type="file"
                          id="documentUpload"
                          multiple
                          accept=".pdf,.doc,.docx,.dwg,.skp"
                          onChange={handleDocumentUpload}
                          className="hidden"
                        />
                        <label
                          htmlFor="documentUpload"
                          className="cursor-pointer flex flex-col items-center gap-3"
                        >
                          <File className="h-12 w-12 text-muted-foreground" />
                          <div>
                            <p className="font-medium">Clique para adicionar documentos</p>
                            <p className="text-sm text-muted-foreground">PDF, DWG, SKP, DOC até 50MB</p>
                          </div>
                        </label>
                      </div>

                      {uploadedDocuments.length > 0 && (
                        <div className="space-y-2">
                          {uploadedDocuments.map((file, index) => (
                            <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                              <div className="flex items-center gap-3">
                                <File className="h-5 w-5 text-muted-foreground" />
                                <div>
                                  <p className="text-sm font-medium">{file.name}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {(file.size / 1024 / 1024).toFixed(2)} MB
                                  </p>
                                </div>
                              </div>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => removeDocument(index)}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <LinkIcon className="h-5 w-5 text-lumina-600" />
                        <h3 className="text-lg font-semibold">Links e Observações</h3>
                      </div>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="externalLinks">Links Externos</Label>
                          <textarea
                            id="externalLinks"
                            value={newProject.externalLinks}
                            onChange={(e) => setNewProject({...newProject, externalLinks: e.target.value})}
                            className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm min-h-[80px]"
                            placeholder="Cole links de referências, Drive, Pinterest, etc..."
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="notes">Observações Finais</Label>
                          <textarea
                            id="notes"
                            value={newProject.notes}
                            onChange={(e) => setNewProject({...newProject, notes: e.target.value})}
                            className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm min-h-[100px]"
                            placeholder="Informações adicionais, requisitos especiais, observações importantes..."
                          />
                        </div>
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
                  {currentStep === 1 && "Defina as informações principais do projeto"}
                  {currentStep === 2 && "Especifique os detalhes técnicos e localização"}
                  {currentStep === 3 && "Configure a equipe e orçamento"}
                  {currentStep === 4 && "Adicione arquivos, imagens e referências (opcional)"}
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
                      onClick={handleSubmitProject}
                      disabled={isSaving}
                    >
                      {isSaving ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Salvando...
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="h-4 w-4" />
                          Criar Projeto
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

      {/* Modal de Detalhes do Projeto com Abas */}
      {showDetailsModal && selectedProject && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
          <Card className="w-full max-w-5xl h-[95vh] sm:h-auto sm:max-h-[90vh] flex flex-col my-auto">
            <CardHeader className="border-b flex-shrink-0 p-3 sm:p-4 lg:p-6">
              <div className="flex items-center justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-lg sm:text-xl lg:text-2xl truncate">{selectedProject.name}</CardTitle>
                  <div className="flex items-center gap-1.5 sm:gap-2 mt-2 flex-wrap">
                    <Badge className={`text-xs ${statusLabels[selectedProject.status].color}`}>
                      {statusLabels[selectedProject.status].label}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {categoryLabels[selectedProject.category].label}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {selectedProject.type === "residential" ? "Residencial" : "Comercial"}
                    </Badge>
                    {selectedProject.priority && (
                      <Badge className={`text-xs ${priorityLabels[selectedProject.priority].color}`}>
                        {priorityLabels[selectedProject.priority].label}
                      </Badge>
                    )}
                  </div>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={handleCloseDetails}
                  className="h-8 w-8 sm:h-10 sm:w-10 flex-shrink-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {/* Tabs de navegação */}
              <div className="flex border-b mt-3 sm:mt-4 -mb-4 overflow-x-auto scrollbar-thin">
                <button
                  onClick={() => setActiveTab("info")}
                  className={`px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                    activeTab === "info"
                      ? "border-lumina-500 text-lumina-600 dark:text-lumina-400"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <span className="hidden sm:inline">📋 Informações Básicas</span>
                  <span className="sm:hidden">📋 Info</span>
                </button>
                <button
                  onClick={() => setActiveTab("technical")}
                  className={`px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                    activeTab === "technical"
                      ? "border-lumina-500 text-lumina-600 dark:text-lumina-400"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <span className="hidden sm:inline">🏗️ Detalhes Técnicos</span>
                  <span className="sm:hidden">🏗️ Técnico</span>
                </button>
                <button
                  onClick={() => setActiveTab("team")}
                  className={`px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                    activeTab === "team"
                      ? "border-lumina-500 text-lumina-600 dark:text-lumina-400"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <span className="hidden sm:inline">👥 Equipe & Orçamento</span>
                  <span className="sm:hidden">👥 Equipe</span>
                </button>
                <button
                  onClick={() => setActiveTab("files")}
                  className={`px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                    activeTab === "files"
                      ? "border-lumina-500 text-lumina-600 dark:text-lumina-400"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <span className="hidden sm:inline">📂 Arquivos & Mídias</span>
                  <span className="sm:hidden">📂 Mídias</span>
                </button>
              </div>
            </CardHeader>

            <CardContent className="flex-1 overflow-y-auto p-3 sm:p-4 lg:p-6 min-h-0">
              {activeTab === "info" && <ProjectInfoTab project={selectedProject} />}
              {activeTab === "technical" && <ProjectTechnicalTab project={selectedProject} />}
              {activeTab === "team" && <ProjectTeamTab project={selectedProject} />}
              {activeTab === "files" && <ProjectMediaTab />}
            </CardContent>

            <div className="border-t p-3 sm:p-4 flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 flex-shrink-0">
              <div className="text-xs sm:text-sm text-muted-foreground text-center sm:text-left">
                ID: {selectedProject.id}
              </div>
              <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                <Button 
                  variant="destructive"
                  onClick={() => handleDeleteProject(selectedProject.id, selectedProject.name)}
                  disabled={isSaving}
                  className="flex-1 sm:flex-none text-xs sm:text-sm h-9 sm:h-10"
                >
                  <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5" />
                  Excluir
                </Button>
                <Button 
                  variant="outline" 
                  onClick={handleCloseDetails}
                  className="flex-1 sm:flex-none text-xs sm:text-sm h-9 sm:h-10"
                >
                  Fechar
                </Button>
                <Button 
                  variant="outline" 
                  className="gap-1.5 sm:gap-2 flex-1 sm:flex-none text-xs sm:text-sm h-9 sm:h-10" 
                  onClick={() => {
                    setShowDetailsModal(false);
                    setShowMediaManager(true);
                  }}
                >
                  <ImageIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  <span className="hidden sm:inline">Mídias do Projeto</span>
                  <span className="sm:hidden">Mídias</span>
                </Button>
                <Button 
                  className="gap-1.5 sm:gap-2 flex-1 sm:flex-none text-xs sm:text-sm h-9 sm:h-10" 
                  onClick={() => handleOpenEditForm(selectedProject)}
                >
                  <FileText className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  Editar
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Modal de Editar Projeto - Completo com 4 Etapas */}
      {showEditForm && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
          <Card className="w-full max-w-5xl h-[95vh] sm:h-auto sm:max-h-[90vh] flex flex-col my-auto">
            <CardHeader className="border-b flex-shrink-0 p-3 sm:p-4 lg:p-6">
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                    <Briefcase className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
                    <span className="truncate">Editar Projeto</span>
                  </CardTitle>
                  <CardDescription className="mt-1 sm:mt-1.5 text-xs sm:text-sm">
                    Etapa {currentEditStep} de 4
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
                      step <= currentEditStep 
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
                  onClick={() => setCurrentEditStep(1)}
                  className={`flex-1 min-w-[80px] sm:min-w-[140px] px-2 sm:px-4 py-2 sm:py-2.5 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                    currentEditStep === 1
                      ? "bg-lumina-100 text-lumina-700 dark:bg-lumina-900/30 dark:text-lumina-400"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  }`}
                >
                  <div className="flex items-center gap-1.5 sm:gap-2 justify-center">
                    <FileText className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
                    <span className="hidden sm:inline">Dados Básicos</span>
                    <span className="sm:hidden">Dados</span>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentEditStep(2)}
                  className={`flex-1 min-w-[80px] sm:min-w-[140px] px-2 sm:px-4 py-2 sm:py-2.5 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                    currentEditStep === 2
                      ? "bg-lumina-100 text-lumina-700 dark:bg-lumina-900/30 dark:text-lumina-400"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  }`}
                >
                  <div className="flex items-center gap-1.5 sm:gap-2 justify-center">
                    <Ruler className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
                    <span className="hidden sm:inline">Detalhes Técnicos</span>
                    <span className="sm:hidden">Técnico</span>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentEditStep(3)}
                  className={`flex-1 min-w-[80px] sm:min-w-[140px] px-2 sm:px-4 py-2 sm:py-2.5 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                    currentEditStep === 3
                      ? "bg-lumina-100 text-lumina-700 dark:bg-lumina-900/30 dark:text-lumina-400"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  }`}
                >
                  <div className="flex items-center gap-1.5 sm:gap-2 justify-center">
                    <Users className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
                    <span className="hidden sm:inline">Equipe & Orçamento</span>
                    <span className="sm:hidden">Equipe</span>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentEditStep(4)}
                  className={`flex-1 min-w-[90px] sm:min-w-[160px] px-2 sm:px-4 py-2 sm:py-2.5 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                    currentEditStep === 4
                      ? "bg-lumina-100 text-lumina-700 dark:bg-lumina-900/30 dark:text-lumina-400"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  }`}
                >
                  <div className="flex items-center gap-1.5 sm:gap-2 justify-center">
                    <Upload className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
                    <span className="hidden sm:inline">Arquivos & Mídias</span>
                    <span className="sm:hidden">Mídias</span>
                  </div>
                </button>
              </div>
            </CardHeader>

            <CardContent className="p-3 sm:p-4 lg:p-6 overflow-y-auto flex-1 min-h-0">
              <form className="space-y-4 sm:space-y-6">
                {/* ETAPA 1: INFORMAÇÕES BÁSICAS */}
                {currentEditStep === 1 && (
                  <div className="space-y-4 sm:space-y-6">
                    <div className="space-y-3 sm:space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-name">Nome do Projeto *</Label>
                    <Input
                      id="edit-name"
                      value={editingProject.name}
                      onChange={(e) => setEditingProject({...editingProject, name: e.target.value})}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="edit-client">Cliente *</Label>
                    <select
                      id="edit-client"
                      value={editingProject.client}
                      onChange={(e) => setEditingProject({...editingProject, client: e.target.value})}
                      className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm"
                      required
                    >
                      <option value="">Selecione um cliente</option>
                      {clients.map((client) => (
                        <option key={client.id} value={client.id}>
                          {client.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="edit-category">Categoria *</Label>
                      <select
                        id="edit-category"
                        value={editingProject.category}
                        onChange={(e) => setEditingProject({...editingProject, category: e.target.value as any})}
                        className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm"
                      >
                        <option value="architecture">Arquitetura</option>
                        <option value="interior_design">Design de Interiores</option>
                        <option value="landscape">Paisagismo</option>
                        <option value="renovation">Reforma</option>
                        <option value="other">Outro</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="edit-type">Tipo *</Label>
                      <select
                        id="edit-type"
                        value={editingProject.type}
                        onChange={(e) => setEditingProject({...editingProject, type: e.target.value as any})}
                        className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm"
                      >
                        <option value="residential">Residencial</option>
                        <option value="commercial">Comercial</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="edit-status">Status *</Label>
                      <select
                        id="edit-status"
                        value={editingProject.status}
                        onChange={(e) => setEditingProject({...editingProject, status: e.target.value as any})}
                        className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm"
                      >
                        <option value="planning">Planejamento</option>
                        <option value="in_progress">Em Andamento</option>
                        <option value="completed">Concluído</option>
                        <option value="paused">Pausado</option>
                        <option value="cancelled">Cancelado</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="edit-priority">Prioridade</Label>
                      <select
                        id="edit-priority"
                        value={editingProject.priority}
                        onChange={(e) => setEditingProject({...editingProject, priority: e.target.value as any})}
                        className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm"
                      >
                        <option value="low">Baixa</option>
                        <option value="medium">Média</option>
                        <option value="high">Alta</option>
                        <option value="urgent">Urgente</option>
                      </select>
                    </div>
                  </div>
                    </div>
                  </div>
                )}

                {/* ETAPA 2: DETALHES TÉCNICOS */}
                {currentEditStep === 2 && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="edit-address">Endereço</Label>
                      <Input
                        id="edit-address"
                        value={editingProject.address}
                        onChange={(e) => setEditingProject({...editingProject, address: e.target.value})}
                        placeholder="Rua, Avenida..."
                      />
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2 col-span-2">
                        <Label htmlFor="edit-city">Cidade</Label>
                        <Input
                          id="edit-city"
                          value={editingProject.city}
                          onChange={(e) => setEditingProject({...editingProject, city: e.target.value})}
                          placeholder="Porto Alegre"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="edit-state">Estado</Label>
                        <Input
                          id="edit-state"
                          value={editingProject.state}
                          onChange={(e) => setEditingProject({...editingProject, state: e.target.value})}
                          placeholder="RS"
                          maxLength={2}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="edit-area">Área (m²)</Label>
                      <Input
                        id="edit-area"
                        type="number"
                        value={editingProject.area}
                        onChange={(e) => setEditingProject({...editingProject, area: e.target.value})}
                        placeholder="0"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="edit-description">Descrição do Projeto</Label>
                      <textarea
                        id="edit-description"
                        value={editingProject.description}
                        onChange={(e) => setEditingProject({...editingProject, description: e.target.value})}
                        className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm min-h-[100px]"
                        placeholder="Descreva o projeto..."
                      />
                    </div>
                  </div>
                )}

                {/* ETAPA 3: EQUIPE & ORÇAMENTO */}
                {currentEditStep === 3 && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="edit-budget">Orçamento (R$)</Label>
                        <Input
                          id="edit-budget"
                          type="number"
                          value={editingProject.budget}
                          onChange={(e) => setEditingProject({...editingProject, budget: e.target.value})}
                          placeholder="0.00"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="edit-startDate">Data de Início</Label>
                        <Input
                          id="edit-startDate"
                          type="date"
                          value={editingProject.startDate}
                          onChange={(e) => setEditingProject({...editingProject, startDate: e.target.value})}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="edit-endDate">Data de Término Prevista</Label>
                      <Input
                        id="edit-endDate"
                        type="date"
                        value={editingProject.endDate}
                        onChange={(e) => setEditingProject({...editingProject, endDate: e.target.value})}
                      />
                    </div>
                  </div>
                )}

                {/* ETAPA 4: ARQUIVOS & MÍDIAS */}
                {currentEditStep === 4 && (
                  <div className="space-y-6">
                    {/* Imagem de Capa */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <ImageIcon className="h-5 w-5 text-lumina-600" />
                        <h3 className="text-lg font-semibold">Imagem de Capa</h3>
                      </div>
                      
                      {!coverImagePreview ? (
                        <div className="border-2 border-dashed rounded-lg p-8 text-center">
                          <input
                            type="file"
                            id="editCoverImageUpload"
                            accept="image/*"
                            onChange={(e) => handleCoverImageUpload(e, true)}
                            className="hidden"
                          />
                          <label
                            htmlFor="editCoverImageUpload"
                            className="cursor-pointer flex flex-col items-center gap-3"
                          >
                            <ImageIcon className="h-12 w-12 text-muted-foreground" />
                            <div>
                              <p className="font-medium">Clique para adicionar/alterar imagem de capa</p>
                              <p className="text-sm text-muted-foreground">PNG, JPG, JPEG até 10MB (opcional)</p>
                            </div>
                          </label>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <p className="text-sm font-medium">Preview da Imagem de Capa:</p>
                          <div className="relative h-48 w-full rounded-lg overflow-hidden bg-muted">
                            <img
                              src={coverImagePreview}
                              alt="Preview"
                              className="w-full h-full object-cover"
                            />
                            <Button
                              type="button"
                              variant="destructive"
                              size="icon"
                              className="absolute top-2 right-2"
                              onClick={() => removeCoverImage(true)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </form>
            </CardContent>

            <div className="border-t p-3 sm:p-4 flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 flex-shrink-0 bg-muted/30">
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="destructive"
                  onClick={() => handleDeleteProject(editingProject.id, editingProject.name)}
                  disabled={isSaving}
                  className="text-xs sm:text-sm h-9 sm:h-10"
                >
                  <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5" />
                  Excluir Projeto
                </Button>
              </div>
              <div className="flex gap-2 sm:gap-3 w-full sm:w-auto">
                {currentEditStep > 1 && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setCurrentEditStep(currentEditStep - 1)}
                    className="flex-1 sm:flex-none text-xs sm:text-sm h-9 sm:h-10"
                  >
                    Anterior
                  </Button>
                )}
                {currentEditStep < 4 ? (
                  <Button
                    type="button"
                    onClick={() => setCurrentEditStep(currentEditStep + 1)}
                    className="flex-1 sm:flex-none text-xs sm:text-sm h-9 sm:h-10"
                  >
                    Próximo
                  </Button>
                ) : (
                  <Button 
                    className="gap-1.5 sm:gap-2 flex-1 sm:flex-none text-xs sm:text-sm h-9 sm:h-10" 
                    onClick={handleUpdateProject} 
                    disabled={isSaving}
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 animate-spin" />
                        Salvando...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                        Salvar
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Project Media Manager */}
      {showMediaManager && selectedProject && (
        <ProjectMediaManager
          projectId={selectedProject.id}
          projectName={selectedProject.name}
          onClose={() => {
            setShowMediaManager(false);
            setShowDetailsModal(true);
          }}
        />
      )}

      {/* Diálogo de Confirmação de Exclusão */}
      <DeleteConfirmDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        onConfirm={confirmDeleteProject}
        title="Excluir Projeto"
        description="Tem certeza que deseja excluir este projeto? Esta ação não pode ser desfeita e todos os dados relacionados, incluindo arquivos e mídias, serão perdidos."
        itemName={projectToDelete?.name}
      />
      </div>
    </DynamicContainer>
  );
}

