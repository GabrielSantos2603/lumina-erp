import { useState, useCallback, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  X,
  Upload,
  Search,
  Grid3x3,
  List,
  Download,
  Trash2,
  Eye,
  FileText,
  Image as ImageIcon,
  File,
  FileVideo,
  Folder,
  Filter,
  ArrowLeft,
  Calendar,
  FolderOpen,
  CheckCircle2,
  Loader2,
  AlertCircle,
  RefreshCw
} from "lucide-react";
import { projectMediaService, type MediaCategory } from "@/services/projectMediaService";
import toast from "react-hot-toast";

interface ProjectMedia {
  id: string;
  name: string;
  original_name: string;
  file_type: string;
  file_size: number;
  category: MediaCategory;
  created_at?: string;
  user_id: string;
  url?: string;
  thumbnail_url?: string;
  tags?: string[];
}

interface ProjectMediaManagerProps {
  projectId: string;
  projectName: string;
  onClose: () => void;
}

const categoryConfig = {
  renders: {
    label: "Renders",
    icon: ImageIcon,
    color: "bg-purple-500/10 text-purple-700 dark:text-purple-400",
    extensions: [".jpg", ".jpeg", ".png", ".webp"]
  },
  plantas: {
    label: "Plantas",
    icon: FileText,
    color: "bg-blue-500/10 text-blue-700 dark:text-blue-400",
    extensions: [".pdf", ".dwg", ".dxf", ".rvt"]
  },
  descritivos: {
    label: "Descritivos",
    icon: FileText,
    color: "bg-green-500/10 text-green-700 dark:text-green-400",
    extensions: [".pdf", ".doc", ".docx", ".txt"]
  },
  fotos: {
    label: "Fotos",
    icon: ImageIcon,
    color: "bg-pink-500/10 text-pink-700 dark:text-pink-400",
    extensions: [".jpg", ".jpeg", ".png", ".heic"]
  },
  "3d": {
    label: "Modelos 3D",
    icon: FileVideo,
    color: "bg-orange-500/10 text-orange-700 dark:text-orange-400",
    extensions: [".skp", ".3ds", ".obj", ".fbx", ".blend"]
  },
  documentos: {
    label: "Documentos",
    icon: File,
    color: "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400",
    extensions: [".pdf", ".doc", ".docx", ".xls", ".xlsx"]
  },
  outros: {
    label: "Outros",
    icon: Folder,
    color: "bg-gray-500/10 text-gray-700 dark:text-gray-400",
    extensions: []
  }
};

export function ProjectMediaManager({ projectId, projectName, onClose }: ProjectMediaManagerProps) {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<MediaCategory | "all">("all");
  const [isUploading, setIsUploading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [dragActive, setDragActive] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [uploadConfig, setUploadConfig] = useState<{category: MediaCategory; tags: string}>({
    category: "outros",
    tags: ""
  });
  const [mediaFiles, setMediaFiles] = useState<ProjectMedia[]>([]);

  // Carregar mídias do projeto ao abrir
  useEffect(() => {
    loadProjectMedia();
  }, [projectId]);

  const loadProjectMedia = async () => {
    setIsLoading(true);
    try {
      const media = await projectMediaService.getProjectMedia(projectId);
      setMediaFiles(media);
    } catch (error) {
      console.error("Erro ao carregar mídias:", error);
      toast.error("Erro ao carregar mídias do projeto");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      openUploadModal(e.dataTransfer.files);
    }
  }, []);

  const openUploadModal = (files: FileList) => {
    setPendingFiles(Array.from(files));
    // Auto-detectar categoria do primeiro arquivo
    const firstFile = files[0];
    const detectedCategory = projectMediaService.detectCategory(firstFile.name, firstFile.type);
    setUploadConfig({ category: detectedCategory, tags: "" });
    setShowUploadModal(true);
  };

  const handleConfirmUpload = async () => {
    if (pendingFiles.length === 0) return;
    
    setIsUploading(true);
    setShowUploadModal(false);
    
    try {
      const tags = uploadConfig.tags
        .split(",")
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0);

      const uploads = pendingFiles.map((file) => ({
        file,
        category: uploadConfig.category,
        tags
      }));

      const { success, failed } = await projectMediaService.uploadMultipleFiles(projectId, uploads);

      if (success.length > 0) {
        toast.success(`${success.length} arquivo(s) enviado(s) com sucesso!`);
        await loadProjectMedia();
      }

      if (failed.length > 0) {
        toast.error(`${failed.length} arquivo(s) falharam: ${failed.join(", ")}`);
      }
    } catch (error) {
      console.error("Erro no upload:", error);
      toast.error("Erro ao enviar arquivos");
    } finally {
      setIsUploading(false);
      setPendingFiles([]);
      setUploadConfig({ category: "outros", tags: "" });
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + " " + sizes[i];
  };

  const formatDate = (dateString?: string): string => {
    if (!dateString) return "Data não disponível";
    
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Hoje";
    if (diffDays === 1) return "Ontem";
    if (diffDays < 7) return `${diffDays} dias atrás`;
    
    return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
  };

  const handleDelete = async (id: string) => {
    if (confirm("Deseja realmente excluir este arquivo?")) {
      const success = await projectMediaService.deleteMedia(id);
      if (success) {
        toast.success("Arquivo excluído com sucesso!");
        await loadProjectMedia();
      } else {
        toast.error("Erro ao excluir arquivo");
      }
    }
  };

  const handleDeleteMultiple = async () => {
    if (selectedFiles.length === 0) return;
    
    if (confirm(`Deseja realmente excluir ${selectedFiles.length} arquivo(s)?`)) {
      const { success, failed } = await projectMediaService.deleteMultipleMedia(selectedFiles);
      
      if (success > 0) {
        toast.success(`${success} arquivo(s) excluído(s) com sucesso!`);
        setSelectedFiles([]);
        await loadProjectMedia();
      }
      
      if (failed > 0) {
        toast.error(`${failed} arquivo(s) falharam ao ser excluídos`);
      }
    }
  };

  const handleDownload = (file: ProjectMedia) => {
    if (file.url) {
      window.open(file.url, "_blank");
      toast.success(`Download iniciado: ${file.original_name}`);
    } else {
      toast.error("URL do arquivo não disponível");
    }
  };

  const toggleFileSelection = (id: string) => {
    setSelectedFiles(prev =>
      prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]
    );
  };

  const filteredFiles = mediaFiles.filter(file => {
    const matchesSearch = file.original_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      file.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      file.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = selectedCategory === "all" || file.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const getFileIcon = (fileType: string, category: MediaCategory) => {
    if (fileType.startsWith("image/")) return ImageIcon;
    if (fileType.includes("pdf")) return FileText;
    if (fileType.includes("video")) return FileVideo;
    return categoryConfig[category].icon;
  };

  const categoryStats = Object.keys(categoryConfig).reduce((acc, cat) => {
    acc[cat as MediaCategory] = mediaFiles.filter(f => f.category === cat).length;
    return acc;
  }, {} as Record<MediaCategory, number>);

  return (
    <div className="fixed inset-0 bg-background/95 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-7xl h-[90vh] flex flex-col">
        {/* Header */}
        <CardHeader className="border-b flex-shrink-0 space-y-4">
          <div className="flex items-start justify-between">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" onClick={onClose}>
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <CardTitle className="text-2xl flex items-center gap-2">
                  <FolderOpen className="h-6 w-6 text-lumina-600" />
                  Mídias do Projeto
                </CardTitle>
              </div>
              <p className="text-sm text-muted-foreground ml-12">{projectName}</p>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Actions Bar */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Upload Button */}
            <div className="relative">
              <input
                type="file"
                id="file-upload"
                multiple
                accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.dwg,.dxf,.rvt,.skp,.3ds,.obj,.fbx,.blend"
                onChange={(e) => e.target.files && openUploadModal(e.target.files)}
                className="hidden"
              />
              <Button 
                className="gap-2" 
                disabled={isUploading}
                onClick={() => document.getElementById('file-upload')?.click()}
              >
                {isUploading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4" />
                    Adicionar Arquivos
                  </>
                )}
              </Button>
            </div>

            {/* Search */}
            <div className="relative flex-1 min-w-[200px] max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar arquivos, tags..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center gap-1 border rounded-lg p-1">
              <Button
                variant={viewMode === "grid" ? "secondary" : "ghost"}
                size="icon"
                className="h-8 w-8"
                onClick={() => setViewMode("grid")}
              >
                <Grid3x3 className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === "list" ? "secondary" : "ghost"}
                size="icon"
                className="h-8 w-8"
                onClick={() => setViewMode("list")}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>

            {/* Filters */}
            <Button
              variant={showFilters ? "secondary" : "outline"}
              size="icon"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="h-4 w-4" />
            </Button>

            {/* Refresh Button */}
            <Button
              variant="outline"
              size="icon"
              onClick={loadProjectMedia}
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
            </Button>

            {/* Bulk Actions */}
            {selectedFiles.length > 0 && (
              <div className="flex items-center gap-2 ml-auto">
                <span className="text-sm text-muted-foreground">
                  {selectedFiles.length} selecionado(s)
                </span>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="gap-2 text-destructive"
                  onClick={handleDeleteMultiple}
                >
                  <Trash2 className="h-4 w-4" />
                  Excluir
                </Button>
              </div>
            )}
          </div>

          {/* Categories Filter */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            <Button
              variant={selectedCategory === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory("all")}
            >
              Todos ({mediaFiles.length})
            </Button>
            {Object.entries(categoryConfig).map(([key, config]) => {
              const CategoryIcon = config.icon;
              const count = categoryStats[key as MediaCategory] || 0;
              
              return (
                <Button
                  key={key}
                  variant={selectedCategory === key ? "default" : "outline"}
                  size="sm"
                  className="gap-2"
                  onClick={() => setSelectedCategory(key as MediaCategory)}
                >
                  <CategoryIcon className="h-4 w-4" />
                  {config.label} ({count})
                </Button>
              );
            })}
          </div>
        </CardHeader>

        {/* Content */}
        <CardContent className="flex-1 overflow-y-auto p-6">
          {/* Loading State */}
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="h-12 w-12 animate-spin text-lumina-600 mb-4" />
              <p className="text-muted-foreground">Carregando mídias do projeto...</p>
            </div>
          ) : (
            <>
              {/* Drag & Drop Zone */}
              {mediaFiles.length === 0 || dragActive ? (
            <div
              className={`border-2 border-dashed rounded-lg p-12 text-center ${
                dragActive
                  ? "border-lumina-500 bg-lumina-50 dark:bg-lumina-950"
                  : "border-muted-foreground/25"
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <Upload className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">
                {dragActive ? "Solte os arquivos aqui" : "Arraste e solte seus arquivos"}
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                ou clique no botão <strong>"Adicionar Arquivos"</strong> acima
              </p>
              <p className="text-xs text-muted-foreground">
                Suporta: Imagens, PDFs, Documentos, Plantas (DWG, DXF), Modelos 3D (SKP, 3DS, OBJ) e mais
              </p>
            </div>
          ) : (
            <>
              {/* Grid View */}
              {viewMode === "grid" && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {filteredFiles.map((file) => {
                    const FileIcon = getFileIcon(file.file_type, file.category);
                    const isImage = file.file_type.startsWith("image/");
                    const isSelected = selectedFiles.includes(file.id);

                    return (
                      <Card
                        key={file.id}
                        className={`group cursor-pointer hover:shadow-lg transition-all ${
                          isSelected ? "ring-2 ring-lumina-500" : ""
                        }`}
                        onClick={() => toggleFileSelection(file.id)}
                      >
                        <CardContent className="p-0">
                          {/* Thumbnail/Preview */}
                          <div className="relative aspect-video bg-muted rounded-t-lg overflow-hidden">
                            {isImage ? (
                              <img
                                src={file.url}
                                alt={file.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <FileIcon className="h-16 w-16 text-muted-foreground" />
                              </div>
                            )}
                            
                            {/* Overlay Actions */}
                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                              <Button
                                size="icon"
                                variant="secondary"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  // Preview
                                }}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                size="icon"
                                variant="secondary"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDownload(file);
                                }}
                              >
                                <Download className="h-4 w-4" />
                              </Button>
                              <Button
                                size="icon"
                                variant="destructive"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDelete(file.id);
                                }}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>

                            {/* Selected Indicator */}
                            {isSelected && (
                              <div className="absolute top-2 left-2">
                                <CheckCircle2 className="h-6 w-6 text-lumina-500 fill-white" />
                              </div>
                            )}

                            {/* Category Badge */}
                            <Badge className={`absolute top-2 right-2 ${categoryConfig[file.category].color}`}>
                              {categoryConfig[file.category].label}
                            </Badge>
                          </div>

                          {/* File Info */}
                          <div className="p-3 space-y-2">
                            <h4 className="font-medium text-sm truncate" title={file.original_name}>
                              {file.original_name}
                            </h4>
                            <div className="flex items-center justify-between text-xs text-muted-foreground">
                              <span>{formatFileSize(file.file_size)}</span>
                              <span>{formatDate(file.created_at)}</span>
                            </div>
                            {file.tags && file.tags.length > 0 && (
                              <div className="flex flex-wrap gap-1">
                                {file.tags.map((tag, index) => (
                                  <Badge key={index} variant="outline" className="text-xs">
                                    {tag}
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}

              {/* List View */}
              {viewMode === "list" && (
                <div className="space-y-2">
                  {filteredFiles.map((file) => {
                    const FileIcon = getFileIcon(file.file_type, file.category);
                    const isSelected = selectedFiles.includes(file.id);

                    return (
                      <Card
                        key={file.id}
                        className={`group cursor-pointer hover:shadow-md transition-all ${
                          isSelected ? "ring-2 ring-lumina-500" : ""
                        }`}
                        onClick={() => toggleFileSelection(file.id)}
                      >
                        <CardContent className="p-4 flex items-center gap-4">
                          {/* Icon */}
                          <div className="flex-shrink-0">
                            <FileIcon className="h-8 w-8 text-muted-foreground" />
                          </div>

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium truncate">{file.original_name}</h4>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {formatDate(file.created_at)}
                              </span>
                              <span>{formatFileSize(file.file_size)}</span>
                              <Badge className={`${categoryConfig[file.category].color}`}>
                                {categoryConfig[file.category].label}
                              </Badge>
                            </div>
                          </div>

                          {/* Tags */}
                          {file.tags && file.tags.length > 0 && (
                            <div className="flex gap-1 flex-shrink-0">
                              {file.tags.map((tag, index) => (
                                <Badge key={index} variant="outline" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          )}

                          {/* Actions */}
                          <div className="flex items-center gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button size="icon" variant="ghost">
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDownload(file);
                              }}
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDelete(file.id);
                              }}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}

              {/* Empty State */}
              {filteredFiles.length === 0 && (
                <div className="text-center py-12">
                  <AlertCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">Nenhum arquivo encontrado</h3>
                  <p className="text-sm text-muted-foreground">
                    {searchQuery ? "Tente ajustar sua busca" : "Faça upload de arquivos para começar"}
                  </p>
                </div>
              )}
            </>
          )}
          </>
          )}
        </CardContent>

        {/* Footer Stats */}
        <div className="border-t p-4 flex items-center justify-between text-sm text-muted-foreground flex-shrink-0 bg-muted/30">
          <div className="flex items-center gap-6">
            <span>{filteredFiles.length} arquivo(s)</span>
            <span>
              {formatFileSize(filteredFiles.reduce((acc, f) => acc + f.file_size, 0))} total
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs">ID do Projeto: {projectId}</span>
          </div>
        </div>
      </Card>

      {/* Modal de Configuração de Upload */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <Card className="w-full max-w-2xl">
            <CardHeader className="border-b">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Upload className="h-5 w-5" />
                    Configurar Upload
                  </CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    {pendingFiles.length} arquivo(s) selecionado(s)
                  </p>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => {
                    setShowUploadModal(false);
                    setPendingFiles([]);
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>

            <CardContent className="p-6 space-y-6">
              {/* Lista de arquivos */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Arquivos:</label>
                <div className="max-h-40 overflow-y-auto space-y-1 border rounded-lg p-3 bg-muted/30">
                  {pendingFiles.map((file, index) => (
                    <div key={index} className="flex items-center gap-2 text-sm">
                      <File className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <span className="truncate flex-1">{file.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {formatFileSize(file.size)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Categoria */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Categoria *</label>
                <select
                  value={uploadConfig.category}
                  onChange={(e) => setUploadConfig({...uploadConfig, category: e.target.value as MediaCategory})}
                  className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm"
                >
                  {Object.entries(categoryConfig).map(([key, config]) => {
                    const CategoryIcon = config.icon;
                    return (
                      <option key={key} value={key}>
                        {config.label}
                      </option>
                    );
                  })}
                </select>
                <p className="text-xs text-muted-foreground">
                  Categoria detectada automaticamente. Você pode alterá-la se necessário.
                </p>
              </div>

              {/* Tags */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Tags (opcional)</label>
                <Input
                  placeholder="Ex: fachada, externa, noturno (separadas por vírgula)"
                  value={uploadConfig.tags}
                  onChange={(e) => setUploadConfig({...uploadConfig, tags: e.target.value})}
                />
                <p className="text-xs text-muted-foreground">
                  Adicione palavras-chave para facilitar a busca posteriormente
                </p>
              </div>

              {/* Preview das tags */}
              {uploadConfig.tags.split(",").filter(t => t.trim()).length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {uploadConfig.tags.split(",").map((tag, index) => {
                    const trimmedTag = tag.trim();
                    if (!trimmedTag) return null;
                    return (
                      <Badge key={index} variant="secondary" className="gap-1">
                        {trimmedTag}
                        <button
                          onClick={() => {
                            const tags = uploadConfig.tags.split(",").filter((_, i) => i !== index);
                            setUploadConfig({...uploadConfig, tags: tags.join(", ")});
                          }}
                          className="ml-1 hover:text-destructive"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    );
                  })}
                </div>
              )}
            </CardContent>

            <div className="border-t p-4 flex justify-end gap-3">
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowUploadModal(false);
                  setPendingFiles([]);
                }}
              >
                Cancelar
              </Button>
              <Button className="gap-2" onClick={handleConfirmUpload}>
                <Upload className="h-4 w-4" />
                Enviar {pendingFiles.length} Arquivo(s)
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

