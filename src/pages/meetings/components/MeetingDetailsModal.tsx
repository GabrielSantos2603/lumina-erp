import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { X, Send, Paperclip, MessageSquare, FileText } from "lucide-react";
import { cn } from "@/utils/cn";
import { MinutesTab } from "./MinutesTab";
import { PrintButtons } from "@/components/PrintButtons";
import { 
  meetingService, 
  type Meeting, 
  type MeetingComment, 
  type MeetingAttachment 
} from "@/services/meetingService";

interface MeetingDetailsModalProps {
  meeting: Meeting;
  onClose: () => void;
  onUpdate: () => void;
}

export function MeetingDetailsModal({ meeting, onClose, onUpdate }: MeetingDetailsModalProps) {
  const [activeTab, setActiveTab] = useState<"info" | "minutes" | "files" | "comments">("minutes");
  const [comments, setComments] = useState<MeetingComment[]>([]);
  const [attachments, setAttachments] = useState<MeetingAttachment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const loadComments = useCallback(async () => {
    try {
      const data = await meetingService.getMeetingComments(meeting.id);
      setComments(data);
    } catch (error) {
      console.error("Erro ao carregar comentários:", error);
    }
  }, [meeting.id]);

  const loadAttachments = useCallback(async () => {
    try {
      const data = await meetingService.getMeetingAttachments(meeting.id);
      setAttachments(data);
    } catch (error) {
      console.error("Erro ao carregar anexos:", error);
    }
  }, [meeting.id]);

  useEffect(() => {
    loadComments();
    loadAttachments();
  }, [loadComments, loadAttachments]);

  const handleAddComment = async () => {
    if (!newComment.trim()) return;

    try {
      setIsLoading(true);
      await meetingService.createComment(meeting.id, newComment, "Você");
      setNewComment("");
      await loadComments();
      onUpdate();
    } catch (error) {
      console.error("Erro ao adicionar comentário:", error);
      alert("Erro ao adicionar comentário. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsLoading(true);
      await meetingService.uploadAttachment(meeting.id, file, "Você");
      await loadAttachments();
      onUpdate();
    } catch (error) {
      console.error("Erro ao fazer upload:", error);
      alert("Erro ao fazer upload do arquivo. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-start justify-center z-50 p-2 sm:p-4 sm:items-center">
      <Card className="w-full max-w-4xl h-[calc(100vh-1rem)] sm:h-auto sm:max-h-[90vh] overflow-hidden flex flex-col" id="meeting-details-print">
        <CardHeader className="flex-shrink-0 pb-3 sm:pb-6">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <CardTitle className="text-lg sm:text-xl truncate pr-2">{meeting.title}</CardTitle>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                {new Date(meeting.meeting_date).toLocaleDateString("pt-BR")} • {meeting.start_time}
                {meeting.end_time && ` - ${meeting.end_time}`}
              </p>
            </div>
            <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
              <div className="hidden sm:block">
                <PrintButtons 
                  elementId="meeting-details-print" 
                  fileName={`reuniao-${meeting.title.toLowerCase().replace(/\s+/g, '-')}`}
                />
              </div>
              <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8 sm:h-10 sm:w-10">
                <X className="h-3 w-3 sm:h-4 sm:w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="flex-1 overflow-hidden flex flex-col p-3 sm:p-6">
          {/* Tabs - Responsive */}
          <div className="border-b flex-shrink-0 mb-4">
            <div className="flex overflow-x-auto scrollbar-hide -mx-3 px-3 sm:mx-0 sm:px-0">
              <div className="flex space-x-1 sm:space-x-6 min-w-max">
                <button
                  onClick={() => setActiveTab("info")}
                  className={cn(
                    "px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium border-b-2 transition-colors whitespace-nowrap",
                    activeTab === "info"
                      ? "border-lumina-500 text-lumina-600 dark:text-lumina-400"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  )}
                >
                  <FileText className="h-3 w-3 sm:h-4 sm:w-4 inline mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">Informações</span>
                  <span className="sm:hidden">Info</span>
                </button>
                <button
                  onClick={() => setActiveTab("minutes")}
                  className={cn(
                    "px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium border-b-2 transition-colors whitespace-nowrap",
                    activeTab === "minutes"
                      ? "border-lumina-500 text-lumina-600 dark:text-lumina-400"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  )}
                >
                  <span className="text-xs sm:text-sm">🤖</span>
                  <span className="hidden sm:inline"> Ata com IA</span>
                  <span className="sm:hidden"> IA</span>
                </button>
                <button
                  onClick={() => setActiveTab("files")}
                  className={cn(
                    "px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium border-b-2 transition-colors whitespace-nowrap",
                    activeTab === "files"
                      ? "border-lumina-500 text-lumina-600 dark:text-lumina-400"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Paperclip className="h-3 w-3 sm:h-4 sm:w-4 inline mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">Arquivos ({attachments.length})</span>
                  <span className="sm:hidden">Files ({attachments.length})</span>
                </button>
                <button
                  onClick={() => setActiveTab("comments")}
                  className={cn(
                    "px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium border-b-2 transition-colors whitespace-nowrap",
                    activeTab === "comments"
                      ? "border-lumina-500 text-lumina-600 dark:text-lumina-400"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  )}
                >
                  <MessageSquare className="h-3 w-3 sm:h-4 sm:w-4 inline mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">Comentários ({comments.length})</span>
                  <span className="sm:hidden">Chat ({comments.length})</span>
                </button>
              </div>
            </div>
          </div>

          {/* Tab Content - Scrollable */}
          <div className="flex-1 overflow-y-auto">
            {/* Tab: Informações */}
            {activeTab === "info" && (
              <div className="space-y-4">
                {meeting.description && (
                  <div className="p-3 sm:p-4 bg-muted/30 rounded-lg">
                    <Label className="text-xs sm:text-sm font-medium">Descrição</Label>
                    <p className="text-sm mt-2 leading-relaxed">{meeting.description}</p>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  {meeting.project_name && (
                    <div className="p-3 sm:p-4 bg-muted/30 rounded-lg">
                      <Label className="text-xs sm:text-sm font-medium">Projeto</Label>
                      <p className="text-sm mt-1 break-words">{meeting.project_name}</p>
                    </div>
                  )}
                  {meeting.client_name && (
                    <div className="p-3 sm:p-4 bg-muted/30 rounded-lg">
                      <Label className="text-xs sm:text-sm font-medium">Cliente</Label>
                      <p className="text-sm mt-1 break-words">{meeting.client_name}</p>
                    </div>
                  )}
                </div>

                {meeting.location && (
                  <div className="p-3 sm:p-4 bg-muted/30 rounded-lg">
                    <Label className="text-xs sm:text-sm font-medium">Local</Label>
                    <p className="text-sm mt-2">{meeting.location}</p>
                  </div>
                )}

                {meeting.participants && meeting.participants.length > 0 && (
                  <div className="p-3 sm:p-4 bg-muted/30 rounded-lg">
                    <Label className="text-xs sm:text-sm font-medium">Participantes</Label>
                    <div className="flex flex-wrap gap-1.5 sm:gap-2 mt-2">
                      {meeting.participants.map((participant, idx) => (
                        <Badge key={idx} variant="secondary" className="text-xs">
                          {participant}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {meeting.notes && (
                  <div className="p-3 sm:p-4 bg-muted/30 rounded-lg">
                    <Label className="text-xs sm:text-sm font-medium">Observações</Label>
                    <p className="text-sm mt-2 whitespace-pre-wrap leading-relaxed">{meeting.notes}</p>
                  </div>
                )}
            </div>
          )}

          {/* Tab: Ata com IA */}
          {activeTab === "minutes" && (
            <MinutesTab meeting={meeting} onUpdate={onUpdate} />
          )}

            {/* Tab: Arquivos */}
            {activeTab === "files" && (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <Label className="text-sm font-medium">Arquivos Anexados</Label>
                  <Button 
                    size="sm" 
                    className="gap-2 w-full sm:w-auto text-xs sm:text-sm h-8 sm:h-9" 
                    disabled={isLoading} 
                    onClick={() => document.getElementById("file-upload")?.click()}
                  >
                    <Paperclip className="h-3 w-3 sm:h-4 sm:w-4" />
                    {isLoading ? "Uploading..." : "Adicionar"}
                  </Button>
                  <input
                    id="file-upload"
                    type="file"
                    className="hidden"
                    onChange={handleFileUpload}
                    disabled={isLoading}
                    title="Selecionar arquivo"
                    aria-label="Selecionar arquivo para upload"
                  />
                </div>

                {attachments.length > 0 ? (
                  <div className="space-y-3">
                    {attachments.map((file) => (
                      <div key={file.id} className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 sm:p-4 rounded-lg border">
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <Paperclip className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium truncate">{file.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {formatFileSize(file.file_size)} • {file.uploaded_by_name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(file.created_at).toLocaleDateString("pt-BR")}
                            </p>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => window.open(file.file_url, "_blank")}
                          className="w-full sm:w-auto h-8 text-xs"
                        >
                          Baixar
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 sm:py-12 text-muted-foreground">
                    <Paperclip className="h-8 w-8 sm:h-12 sm:w-12 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Nenhum arquivo anexado ainda</p>
                  </div>
                )}
              </div>
            )}

            {/* Tab: Comentários */}
            {activeTab === "comments" && (
              <div className="space-y-4 flex flex-col h-full">
                <Label className="text-sm font-medium">Comentários e Anotações</Label>

                {/* Lista de Comentários - Scrollable */}
                <div className="flex-1 overflow-y-auto">
                  {comments.length > 0 ? (
                    <div className="space-y-3">
                      {comments.map((comment) => (
                        <div key={comment.id} className="p-3 sm:p-4 rounded-lg border bg-muted/30">
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-2 mb-2">
                            <span className="text-xs sm:text-sm font-medium">{comment.author_name}</span>
                            <span className="text-xs text-muted-foreground">
                              {new Date(comment.created_at).toLocaleString("pt-BR")}
                            </span>
                          </div>
                          <p className="text-sm whitespace-pre-wrap leading-relaxed">{comment.content}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <MessageSquare className="h-8 w-8 sm:h-12 sm:w-12 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">Nenhum comentário ainda</p>
                    </div>
                  )}
                </div>

                {/* Área de Novo Comentário - Fixed */}
                <div className="flex flex-col gap-2 pt-3 sm:pt-4 border-t bg-background">
                  <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm min-h-[60px] sm:min-h-[80px] resize-none"
                    placeholder="Adicione um comentário ou anotação..."
                    disabled={isLoading}
                  />
                  <Button
                    onClick={handleAddComment}
                    disabled={!newComment.trim() || isLoading}
                    className="gap-2 self-end w-full sm:w-auto h-8 sm:h-9 text-xs sm:text-sm"
                  >
                    <Send className="h-3 w-3 sm:h-4 sm:w-4" />
                    {isLoading ? "Enviando..." : "Enviar"}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
