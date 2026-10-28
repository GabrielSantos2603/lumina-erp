import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Video,
  Plus,
  Search,
  Filter,
  Grid3x3,
  List,
  TrendingUp,
  Clock,
  Eye,
  Download,
  Share2,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { VideoRecorder } from "@/components/VideoRecorder";
import { VideoPlayer } from "@/components/VideoPlayer";
import { RecordingsList } from "@/components/RecordingsList";
import { recordingService } from "@/services/recordingService";
import { cn } from "@/utils/cn";
import type { Recording, RecordingMetadata } from "@/types";
import toast from "react-hot-toast";
import { useAuthStore } from "@/store/authStore";

type ViewMode = "grid" | "list";
type FilterType = "all" | "recent" | "popular";

export function RecordingsPage() {
  const { user } = useAuthStore();
  const [showRecorder, setShowRecorder] = useState(false);
  const [showPlayer, setShowPlayer] = useState(false);
  const [selectedRecording, setSelectedRecording] = useState<Recording | null>(null);
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [filteredRecordings, setFilteredRecordings] = useState<Recording[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [filterType, setFilterType] = useState<FilterType>("all");
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [isBrowserSupported, setIsBrowserSupported] = useState(true);

  useEffect(() => {
    // Verificar suporte do navegador
    if (!recordingService.constructor.isSupported()) {
      setIsBrowserSupported(false);
      toast.error("Seu navegador não suporta gravação de tela");
    }

    // Carregar gravações
    loadRecordings();
  }, []);

  useEffect(() => {
    // Filtrar gravações
    let filtered = [...recordings];

    // Filtro de busca
    if (searchQuery.trim()) {
      filtered = filtered.filter(
        (r) =>
          r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          r.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          r.tags?.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    // Filtro de tipo
    switch (filterType) {
      case "recent":
        filtered = filtered.sort(
          (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        break;
      case "popular":
        filtered = filtered.sort((a, b) => b.views - a.views);
        break;
    }

    setFilteredRecordings(filtered);
  }, [recordings, searchQuery, filterType]);

  const loadRecordings = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      const data = await recordingService.listRecordings(user.id);
      setRecordings(data);
    } catch (error) {
      console.error("Erro ao carregar gravações:", error);
      toast.error("Erro ao carregar gravações");
      // Usar dados mock para demonstração
      setRecordings(mockRecordings);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRecordingComplete = async (blob: Blob, metadata: RecordingMetadata) => {
    if (!user) {
      toast.error("Você precisa estar logado");
      return;
    }

    setIsUploading(true);
    setShowRecorder(false);

    try {
      toast.loading("Fazendo upload da gravação...");
      
      const recording = await recordingService.uploadRecording(blob, {
        ...metadata,
        user_id: user.id,
      });

      setRecordings([recording, ...recordings]);
      toast.dismiss();
      toast.success("Gravação salva com sucesso!");
    } catch (error) {
      console.error("Erro ao salvar gravação:", error);
      toast.dismiss();
      toast.error("Erro ao salvar gravação");
    } finally {
      setIsUploading(false);
    }
  };

  const handleRecordingClick = (recording: Recording) => {
    setSelectedRecording(recording);
    setShowPlayer(true);
  };

  const handleDeleteRecording = async (recordingId: string) => {
    try {
      toast.loading("Deletando gravação...");
      await recordingService.deleteRecording(recordingId);
      setRecordings(recordings.filter((r) => r.id !== recordingId));
      toast.dismiss();
      toast.success("Gravação deletada");
    } catch (error) {
      console.error("Erro ao deletar:", error);
      toast.dismiss();
      toast.error("Erro ao deletar gravação");
    }
  };

  const handleShareRecording = (recording: Recording) => {
    // Copiar link para clipboard
    const link = `${window.location.origin}/recordings/${recording.id}`;
    navigator.clipboard.writeText(link);
    toast.success("Link copiado para a área de transferência!");
  };

  const handleViewIncrement = async () => {
    if (selectedRecording) {
      await recordingService.incrementViews(selectedRecording.id);
      
      // Atualizar localmente
      setRecordings(
        recordings.map((r) =>
          r.id === selectedRecording.id ? { ...r, views: r.views + 1 } : r
        )
      );
    }
  };

  const totalDuration = recordings.reduce((acc, r) => acc + r.duration, 0);
  const totalViews = recordings.reduce((acc, r) => acc + r.views, 0);
  const totalSize = recordings.reduce((acc, r) => acc + r.size, 0);

  const formatTotalDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  const formatTotalSize = (bytes: number) => {
    return (bytes / (1024 * 1024 * 1024)).toFixed(2) + " GB";
  };

  if (!isBrowserSupported) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <Card className="max-w-md">
          <CardContent className="p-8 text-center">
            <div className="inline-flex p-4 rounded-full bg-red-100 dark:bg-red-900/30 mb-4">
              <AlertCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
            </div>
            <h2 className="text-xl font-bold mb-2">Navegador não suportado</h2>
            <p className="text-muted-foreground">
              Seu navegador não suporta gravação de tela. Por favor, utilize Chrome, Edge ou
              Firefox atualizado.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (showRecorder) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-6">
        <VideoRecorder
          onRecordingComplete={handleRecordingComplete}
          onCancel={() => setShowRecorder(false)}
        />
      </div>
    );
  }

  if (showPlayer && selectedRecording) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => setShowPlayer(false)}>
            ← Voltar
          </Button>
          <h1 className="text-2xl font-bold">Reprodução</h1>
        </div>

        <div className="max-w-5xl mx-auto">
          <VideoPlayer
            recording={selectedRecording}
            onViewIncrement={handleViewIncrement}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Gravações</h1>
          <p className="text-sm text-muted-foreground">
            Crie e gerencie suas gravações de tela e câmera
          </p>
        </div>
        <Button className="gap-2" onClick={() => setShowRecorder(true)}>
          <Plus className="h-4 w-4" />
          Nova Gravação
        </Button>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Total de Gravações</p>
                <p className="text-2xl font-bold">{recordings.length}</p>
              </div>
              <div className="p-3 bg-lumina-100 dark:bg-lumina-900/30 rounded-lg">
                <Video className="h-6 w-6 text-lumina-600 dark:text-lumina-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Duração Total</p>
                <p className="text-2xl font-bold">{formatTotalDuration(totalDuration)}</p>
              </div>
              <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <Clock className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Visualizações</p>
                <p className="text-2xl font-bold">{totalViews}</p>
              </div>
              <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <Eye className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Armazenamento</p>
                <p className="text-2xl font-bold">{formatTotalSize(totalSize)}</p>
              </div>
              <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                <Download className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar gravações..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="flex gap-2">
          <div className="flex gap-1 p-1 bg-muted rounded-lg">
            <button
              onClick={() => setFilterType("all")}
              className={cn(
                "px-3 py-1.5 text-sm font-medium rounded transition-colors",
                filterType === "all"
                  ? "bg-background shadow-sm"
                  : "hover:bg-background/50"
              )}
            >
              Todas
            </button>
            <button
              onClick={() => setFilterType("recent")}
              className={cn(
                "px-3 py-1.5 text-sm font-medium rounded transition-colors flex items-center gap-1",
                filterType === "recent"
                  ? "bg-background shadow-sm"
                  : "hover:bg-background/50"
              )}
            >
              <Clock className="h-3.5 w-3.5" />
              Recentes
            </button>
            <button
              onClick={() => setFilterType("popular")}
              className={cn(
                "px-3 py-1.5 text-sm font-medium rounded transition-colors flex items-center gap-1",
                filterType === "popular"
                  ? "bg-background shadow-sm"
                  : "hover:bg-background/50"
              )}
            >
              <TrendingUp className="h-3.5 w-3.5" />
              Populares
            </button>
          </div>

          <div className="flex gap-1 p-1 bg-muted rounded-lg">
            <button
              onClick={() => setViewMode("grid")}
              className={cn(
                "p-1.5 rounded transition-colors",
                viewMode === "grid"
                  ? "bg-background shadow-sm"
                  : "hover:bg-background/50"
              )}
            >
              <Grid3x3 className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={cn(
                "p-1.5 rounded transition-colors",
                viewMode === "list"
                  ? "bg-background shadow-sm"
                  : "hover:bg-background/50"
              )}
            >
              <List className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-lumina-500" />
        </div>
      )}

      {/* Recordings List */}
      {!isLoading && (
        <RecordingsList
          recordings={filteredRecordings}
          onRecordingClick={handleRecordingClick}
          onDelete={handleDeleteRecording}
          onShare={handleShareRecording}
          compact={viewMode === "list"}
        />
      )}

      {/* Uploading overlay */}
      {isUploading && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="max-w-sm">
            <CardContent className="p-8 text-center">
              <Loader2 className="h-12 w-12 animate-spin text-lumina-500 mx-auto mb-4" />
              <h3 className="font-semibold mb-2">Salvando gravação...</h3>
              <p className="text-sm text-muted-foreground">
                Aguarde enquanto fazemos upload da sua gravação
              </p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

// Mock data para demonstração
const mockRecordings: Recording[] = [
  {
    id: "1",
    title: "Tutorial - Como usar o Dashboard",
    description: "Explicação completa sobre as funcionalidades do dashboard",
    type: "screen_camera",
    duration: 320,
    fileUrl: "https://example.com/video1.webm",
    size: 45000000,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    user_id: "1",
    is_public: false,
    views: 24,
    tags: ["tutorial", "dashboard"],
  },
  {
    id: "2",
    title: "Apresentação para Cliente - Casa Moderna",
    description: "Walkthrough do projeto Casa Moderna para aprovação do cliente",
    type: "screen",
    duration: 180,
    fileUrl: "https://example.com/video2.webm",
    size: 32000000,
    created_at: new Date(Date.now() - 86400000).toISOString(),
    updated_at: new Date(Date.now() - 86400000).toISOString(),
    user_id: "1",
    meeting_id: "1",
    is_public: true,
    views: 12,
    tags: ["projeto", "cliente"],
  },
];

