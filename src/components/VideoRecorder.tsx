import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Video,
  Monitor,
  Camera,
  Square,
  Pause,
  Play,
  X,
  Upload,
  Loader2,
  MonitorUp,
} from "lucide-react";
import { recordingService } from "@/services/recordingService";
import type { RecordingOptions, RecordingMetadata } from "@/types";
import { cn } from "@/utils/cn";
import toast from "react-hot-toast";

interface VideoRecorderProps {
  onRecordingComplete?: (blob: Blob, metadata: RecordingMetadata) => void;
  onCancel?: () => void;
  defaultTitle?: string;
  meetingId?: string;
  projectId?: string;
  clientId?: string;
}

type RecordingStep = "setup" | "recording" | "preview";

export function VideoRecorder({
  onRecordingComplete,
  onCancel,
  defaultTitle = "",
  meetingId,
  projectId,
  clientId,
}: VideoRecorderProps) {
  const [step, setStep] = useState<RecordingStep>("setup");
  const [recordingType, setRecordingType] = useState<RecordingOptions["type"]>("screen_camera");
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [duration, setDuration] = useState(0);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [title, setTitle] = useState(defaultTitle);
  const [description, setDescription] = useState("");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const handleStartRecording = async () => {
    try {
      await recordingService.startRecording({ type: recordingType });
      setIsRecording(true);
      setStep("recording");
      setDuration(0);

      // Iniciar timer
      timerRef.current = setInterval(() => {
        setDuration(recordingService.getCurrentDuration());
      }, 1000);

      toast.success("Gravação iniciada!");
    } catch (error) {
      console.error("Erro ao iniciar gravação:", error);
      toast.error("Erro ao iniciar gravação. Verifique as permissões.");
    }
  };

  const handlePauseRecording = () => {
    recordingService.pauseRecording();
    setIsPaused(true);
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    toast("Gravação pausada");
  };

  const handleResumeRecording = () => {
    recordingService.resumeRecording();
    setIsPaused(false);
    
    // Reiniciar timer
    timerRef.current = setInterval(() => {
      setDuration(recordingService.getCurrentDuration());
    }, 1000);
    
    toast.success("Gravação retomada");
  };

  const handleStopRecording = async () => {
    try {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }

      const blob = await recordingService.stopRecording();
      setRecordedBlob(blob);
      setIsRecording(false);
      setIsPaused(false);
      setStep("preview");

      // Criar preview
      const url = URL.createObjectURL(blob);
      setPreviewUrl(url);

      toast.success("Gravação finalizada!");
    } catch (error) {
      console.error("Erro ao parar gravação:", error);
      toast.error("Erro ao finalizar gravação");
    }
  };

  const handleCancelRecording = () => {
    recordingService.cancelRecording();
    
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    setIsRecording(false);
    setIsPaused(false);
    setDuration(0);
    setStep("setup");
    
    toast("Gravação cancelada");
  };

  const handleSave = () => {
    if (!recordedBlob || !title.trim()) {
      toast.error("Preencha o título da gravação");
      return;
    }

    const metadata: RecordingMetadata = {
      title: title.trim(),
      description: description.trim() || undefined,
      type: recordingType,
      duration,
      meeting_id: meetingId,
      project_id: projectId,
      client_id: clientId,
    };

    onRecordingComplete?.(recordedBlob, metadata);
  };

  const handleCancel = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    onCancel?.();
  };

  const formatDuration = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hrs > 0) {
      return `${hrs.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    }
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + " KB";
    if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(2) + " MB";
    return (bytes / (1024 * 1024 * 1024)).toFixed(2) + " GB";
  };

  // Setup step
  if (step === "setup") {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardContent className="p-6 space-y-6">
          <div className="text-center">
            <div className="inline-flex p-4 rounded-full bg-lumina-100 dark:bg-lumina-900/30 mb-4">
              <Video className="h-8 w-8 text-lumina-600 dark:text-lumina-400" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Nova Gravação</h2>
            <p className="text-muted-foreground">
              Escolha o tipo de gravação que deseja fazer
            </p>
          </div>

          <div className="grid gap-3">
            <button
              onClick={() => setRecordingType("screen_camera")}
              className={cn(
                "flex items-start gap-4 p-4 rounded-lg border-2 transition-all text-left",
                recordingType === "screen_camera"
                  ? "border-lumina-500 bg-lumina-50 dark:bg-lumina-900/20"
                  : "border-border hover:border-lumina-300"
              )}
            >
              <div className={cn(
                "p-2 rounded-lg",
                recordingType === "screen_camera"
                  ? "bg-lumina-500 text-white"
                  : "bg-muted"
              )}>
                <MonitorUp className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <p className="font-semibold">Tela + Câmera</p>
                <p className="text-sm text-muted-foreground">
                  Grave sua tela com sua câmera em PIP (Recomendado)
                </p>
              </div>
            </button>

            <button
              onClick={() => setRecordingType("screen")}
              className={cn(
                "flex items-start gap-4 p-4 rounded-lg border-2 transition-all text-left",
                recordingType === "screen"
                  ? "border-lumina-500 bg-lumina-50 dark:bg-lumina-900/20"
                  : "border-border hover:border-lumina-300"
              )}
            >
              <div className={cn(
                "p-2 rounded-lg",
                recordingType === "screen"
                  ? "bg-lumina-500 text-white"
                  : "bg-muted"
              )}>
                <Monitor className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <p className="font-semibold">Apenas Tela</p>
                <p className="text-sm text-muted-foreground">
                  Grave apenas sua tela, perfeito para demos e tutoriais
                </p>
              </div>
            </button>

            <button
              onClick={() => setRecordingType("camera")}
              className={cn(
                "flex items-start gap-4 p-4 rounded-lg border-2 transition-all text-left",
                recordingType === "camera"
                  ? "border-lumina-500 bg-lumina-50 dark:bg-lumina-900/20"
                  : "border-border hover:border-lumina-300"
              )}
            >
              <div className={cn(
                "p-2 rounded-lg",
                recordingType === "camera"
                  ? "bg-lumina-500 text-white"
                  : "bg-muted"
              )}>
                <Camera className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <p className="font-semibold">Apenas Câmera</p>
                <p className="text-sm text-muted-foreground">
                  Grave apenas você, ideal para mensagens pessoais
                </p>
              </div>
            </button>
          </div>

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={handleCancel}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleStartRecording}
              className="flex-1 gap-2"
            >
              <Video className="h-4 w-4" />
              Iniciar Gravação
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Recording step
  if (step === "recording") {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardContent className="p-6 space-y-6">
          <div className="text-center space-y-4">
            <div className="inline-flex p-4 rounded-full bg-red-100 dark:bg-red-900/30 animate-pulse">
              <div className="h-8 w-8 rounded-full bg-red-500" />
            </div>
            
            <div>
              <h2 className="text-3xl font-bold mb-2 font-mono">
                {formatDuration(duration)}
              </h2>
              <p className="text-muted-foreground">
                {isPaused ? "Gravação pausada" : "Gravando..."}
              </p>
            </div>

            <div className="flex gap-3 justify-center">
              {!isPaused ? (
                <Button
                  onClick={handlePauseRecording}
                  variant="outline"
                  size="lg"
                  className="gap-2"
                >
                  <Pause className="h-5 w-5" />
                  Pausar
                </Button>
              ) : (
                <Button
                  onClick={handleResumeRecording}
                  variant="outline"
                  size="lg"
                  className="gap-2"
                >
                  <Play className="h-5 w-5" />
                  Retomar
                </Button>
              )}

              <Button
                onClick={handleStopRecording}
                variant="default"
                size="lg"
                className="gap-2 bg-red-600 hover:bg-red-700"
              >
                <Square className="h-5 w-5" />
                Parar Gravação
              </Button>

              <Button
                onClick={handleCancelRecording}
                variant="ghost"
                size="lg"
                className="gap-2"
              >
                <X className="h-5 w-5" />
                Cancelar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Preview step
  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardContent className="p-6 space-y-6">
        <div>
          <h2 className="text-2xl font-bold mb-2">Preview da Gravação</h2>
          <p className="text-sm text-muted-foreground">
            Revise sua gravação e adicione informações
          </p>
        </div>

        {previewUrl && (
          <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
            <video
              ref={videoRef}
              src={previewUrl}
              controls
              className="w-full h-full"
            />
          </div>
        )}

        <div className="grid gap-4 text-sm">
          <div className="flex justify-between p-3 rounded-lg bg-muted/50">
            <span className="text-muted-foreground">Duração:</span>
            <span className="font-medium">{formatDuration(duration)}</span>
          </div>
          {recordedBlob && (
            <div className="flex justify-between p-3 rounded-lg bg-muted/50">
              <span className="text-muted-foreground">Tamanho:</span>
              <span className="font-medium">{formatFileSize(recordedBlob.size)}</span>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Título *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Tutorial - Como usar o sistema"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição (Opcional)</Label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm min-h-[80px]"
              placeholder="Adicione uma descrição para sua gravação..."
            />
          </div>
        </div>

        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={handleCancel}
            className="flex-1"
          >
            Descartar
          </Button>
          <Button
            onClick={handleSave}
            disabled={!title.trim()}
            className="flex-1 gap-2"
          >
            <Upload className="h-4 w-4" />
            Salvar Gravação
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

