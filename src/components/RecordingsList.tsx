import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Video,
  Monitor,
  Camera,
  MonitorUp,
  Clock,
  Eye,
  Trash2,
  Share2,
  Download,
  MoreVertical,
  Play,
} from "lucide-react";
import { cn } from "@/utils/cn";
import type { Recording } from "@/types";

interface RecordingsListProps {
  recordings: Recording[];
  onRecordingClick?: (recording: Recording) => void;
  onDelete?: (recordingId: string) => void;
  onShare?: (recording: Recording) => void;
  compact?: boolean;
}

export function RecordingsList({
  recordings,
  onRecordingClick,
  onDelete,
  onShare,
  compact = false,
}: RecordingsListProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const getTypeIcon = (type: Recording["type"]) => {
    switch (type) {
      case "screen":
        return <Monitor className="h-4 w-4" />;
      case "camera":
        return <Camera className="h-4 w-4" />;
      case "screen_camera":
        return <MonitorUp className="h-4 w-4" />;
    }
  };

  const getTypeLabel = (type: Recording["type"]) => {
    switch (type) {
      case "screen":
        return "Tela";
      case "camera":
        return "Câmera";
      case "screen_camera":
        return "Tela + Câmera";
    }
  };

  const formatDuration = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    }
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(0) + " KB";
    if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + " MB";
    return (bytes / (1024 * 1024 * 1024)).toFixed(2) + " GB";
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Hoje";
    if (diffDays === 1) return "Ontem";
    if (diffDays < 7) return `${diffDays} dias atrás`;
    
    return date.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
      year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
    });
  };

  if (recordings.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <div className="inline-flex p-4 rounded-full bg-muted mb-4">
            <Video className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="font-semibold mb-2">Nenhuma gravação ainda</h3>
          <p className="text-sm text-muted-foreground">
            Crie sua primeira gravação para começar
          </p>
        </CardContent>
      </Card>
    );
  }

  if (compact) {
    return (
      <div className="space-y-2">
        {recordings.map((recording) => (
          <div
            key={recording.id}
            onClick={() => onRecordingClick?.(recording)}
            className="flex items-center gap-3 p-3 rounded-lg border hover:bg-accent cursor-pointer transition-colors"
          >
            <div className="flex-shrink-0">
              <div className="relative w-24 h-16 bg-black rounded overflow-hidden">
                {recording.thumbnailUrl ? (
                  <img
                    src={recording.thumbnailUrl}
                    alt={recording.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-lumina-500 to-lumina-700">
                    <Play className="h-6 w-6 text-white" />
                  </div>
                )}
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-sm truncate">{recording.title}</h4>
              <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                <span>{formatDuration(recording.duration)}</span>
                <span>•</span>
                <span>{formatDate(recording.created_at)}</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {getTypeIcon(recording.type)}
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {recordings.map((recording) => (
        <Card
          key={recording.id}
          className="overflow-hidden hover:shadow-md transition-all cursor-pointer group"
          onMouseEnter={() => setHoveredId(recording.id)}
          onMouseLeave={() => setHoveredId(null)}
        >
          <div
            onClick={() => onRecordingClick?.(recording)}
            className="relative"
          >
            {/* Thumbnail */}
            <div className="relative aspect-video bg-black">
              {recording.thumbnailUrl ? (
                <img
                  src={recording.thumbnailUrl}
                  alt={recording.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-lumina-500 to-lumina-700">
                  <Video className="h-12 w-12 text-white opacity-50" />
                </div>
              )}

              {/* Duration badge */}
              <div className="absolute bottom-2 right-2 px-2 py-1 rounded bg-black/80 text-white text-xs font-medium">
                {formatDuration(recording.duration)}
              </div>

              {/* Play overlay */}
              <div
                className={cn(
                  "absolute inset-0 bg-black/40 flex items-center justify-center transition-opacity",
                  hoveredId === recording.id ? "opacity-100" : "opacity-0"
                )}
              >
                <div className="p-3 rounded-full bg-lumina-500">
                  <Play className="h-8 w-8 text-white fill-white" />
                </div>
              </div>
            </div>
          </div>

          <CardContent className="p-4">
            <div className="space-y-3">
              {/* Title and description */}
              <div>
                <h3 className="font-semibold line-clamp-2 mb-1">
                  {recording.title}
                </h3>
                {recording.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {recording.description}
                  </p>
                )}
              </div>

              {/* Metadata */}
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Eye className="h-3.5 w-3.5" />
                  {recording.views}
                </div>
                <span>•</span>
                <div className="flex items-center gap-1">
                  {getTypeIcon(recording.type)}
                  {getTypeLabel(recording.type)}
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{formatDate(recording.created_at)}</span>
                <span>{formatFileSize(recording.size)}</span>
              </div>

              {/* Tags */}
              {recording.tags && recording.tags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {recording.tags.slice(0, 3).map((tag, idx) => (
                    <Badge key={idx} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                  {recording.tags.length > 3 && (
                    <Badge variant="secondary" className="text-xs">
                      +{recording.tags.length - 3}
                    </Badge>
                  )}
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-1 pt-2 border-t">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={(e) => {
                    e.stopPropagation();
                    onShare?.(recording);
                  }}
                  className="flex-1 gap-1.5 h-8 text-xs"
                >
                  <Share2 className="h-3.5 w-3.5" />
                  Compartilhar
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onDelete && confirm("Deseja realmente deletar esta gravação?")) {
                      onDelete(recording.id);
                    }
                  }}
                  className="h-8 w-8"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

