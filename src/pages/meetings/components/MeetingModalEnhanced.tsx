import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ImageUploadGallery } from "@/components/ImageUploadGallery";
import { X, Plus, Info, Image, CheckSquare, FileText } from "lucide-react";
import type { Meeting, CreateMeetingData } from "@/services/meetingService";

interface ImageFile {
  id: string;
  file?: File;
  url: string;
  name: string;
  size?: number;
  uploaded?: boolean;
}

interface ChecklistItem {
  id: string;
  text: string;
  completed: boolean;
}

interface MeetingModalEnhancedProps {
  meeting?: Meeting | null;
  onClose: () => void;
  onSave: (data: CreateMeetingData, images: ImageFile[], checklist: ChecklistItem[]) => Promise<void>;
  isLoading?: boolean;
}

export function MeetingModalEnhanced({
  meeting,
  onClose,
  onSave,
  isLoading,
}: MeetingModalEnhancedProps) {
  const isEditing = !!meeting;

  const [formData, setFormData] = useState<CreateMeetingData>({
    title: meeting?.title || "",
    description: meeting?.description || "",
    location: meeting?.location || "",
    meeting_date: meeting?.meeting_date || "",
    start_time: meeting?.start_time || "",
    end_time: meeting?.end_time || "",
    status: meeting?.status || "scheduled",
    project_name: meeting?.project_name || "",
    client_name: meeting?.client_name || "",
    participants: meeting?.participants || [],
    notes: meeting?.notes || "",
  });

  const [participantInput, setParticipantInput] = useState("");
  const [images, setImages] = useState<ImageFile[]>([]);
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
  const [checklistInput, setChecklistInput] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSave(formData, images, checklist);
  };

  const handleChange = (field: keyof CreateMeetingData, value: string | string[]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleAddParticipant = () => {
    if (participantInput.trim()) {
      handleChange("participants", [...(formData.participants || []), participantInput.trim()]);
      setParticipantInput("");
    }
  };

  const handleRemoveParticipant = (participant: string) => {
    handleChange(
      "participants",
      (formData.participants || []).filter((p) => p !== participant)
    );
  };

  const handleAddChecklistItem = () => {
    if (checklistInput.trim()) {
      setChecklist([
        ...checklist,
        {
          id: `checklist-${Date.now()}-${Math.random()}`,
          text: checklistInput.trim(),
          completed: false,
        },
      ]);
      setChecklistInput("");
    }
  };

  const handleToggleChecklistItem = (id: string) => {
    setChecklist(
      checklist.map((item) =>
        item.id === id ? { ...item, completed: !item.completed } : item
      )
    );
  };

  const handleRemoveChecklistItem = (id: string) => {
    setChecklist(checklist.filter((item) => item.id !== id));
  };

  const completedCount = checklist.filter((item) => item.completed).length;
  const totalCount = checklist.length;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-5xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>{isEditing ? "Editar Reunião" : "Nova Reunião"}</CardTitle>
            <Button variant="ghost" size="icon" onClick={onClose} disabled={isLoading}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <Tabs defaultValue="info" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="info" className="gap-2">
                  <Info className="h-4 w-4" />
                  Informações
                </TabsTrigger>
                <TabsTrigger value="images" className="gap-2">
                  <Image className="h-4 w-4" />
                  Imagens {images.length > 0 && `(${images.length})`}
                </TabsTrigger>
                <TabsTrigger value="checklist" className="gap-2">
                  <CheckSquare className="h-4 w-4" />
                  Checklist {totalCount > 0 && `(${completedCount}/${totalCount})`}
                </TabsTrigger>
                <TabsTrigger value="notes" className="gap-2">
                  <FileText className="h-4 w-4" />
                  Notas
                </TabsTrigger>
              </TabsList>

              {/* TAB 1: Informações Básicas */}
              <TabsContent value="info" className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Título *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => handleChange("title", e.target.value)}
                    placeholder="Ex: Reunião de Planejamento"
                    required
                    disabled={isLoading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Descrição</Label>
                  <textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleChange("description", e.target.value)}
                    className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm min-h-[100px]"
                    placeholder="Descreva os objetivos da reunião..."
                    disabled={isLoading}
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="meeting_date">Data *</Label>
                    <Input
                      id="meeting_date"
                      type="date"
                      value={formData.meeting_date}
                      onChange={(e) => handleChange("meeting_date", e.target.value)}
                      required
                      disabled={isLoading}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="start_time">Início *</Label>
                    <Input
                      id="start_time"
                      type="time"
                      value={formData.start_time}
                      onChange={(e) => handleChange("start_time", e.target.value)}
                      required
                      disabled={isLoading}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="end_time">Término</Label>
                    <Input
                      id="end_time"
                      type="time"
                      value={formData.end_time}
                      onChange={(e) => handleChange("end_time", e.target.value)}
                      disabled={isLoading}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="project_name">Projeto</Label>
                    <Input
                      id="project_name"
                      value={formData.project_name}
                      onChange={(e) => handleChange("project_name", e.target.value)}
                      placeholder="Ex: Sistema ERP"
                      disabled={isLoading}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="client_name">Cliente</Label>
                    <Input
                      id="client_name"
                      value={formData.client_name}
                      onChange={(e) => handleChange("client_name", e.target.value)}
                      placeholder="Ex: Empresa ABC"
                      disabled={isLoading}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location">Local</Label>
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) => handleChange("location", e.target.value)}
                    placeholder="Ex: Sala 3 ou Link da reunião online"
                    disabled={isLoading}
                  />
                </div>

                {isEditing && (
                  <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <select
                      id="status"
                      title="Selecione o status"
                      className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm"
                      value={formData.status}
                      onChange={(e) => handleChange("status", e.target.value)}
                      disabled={isLoading}
                    >
                      <option value="scheduled">Agendada</option>
                      <option value="in_progress">Em Andamento</option>
                      <option value="completed">Concluída</option>
                      <option value="cancelled">Cancelada</option>
                    </select>
                  </div>
                )}

                <div className="space-y-2">
                  <Label>Participantes</Label>
                  <div className="flex gap-2">
                    <Input
                      value={participantInput}
                      onChange={(e) => setParticipantInput(e.target.value)}
                      onKeyPress={(e) =>
                        e.key === "Enter" && (e.preventDefault(), handleAddParticipant())
                      }
                      placeholder="Digite o nome e pressione Enter"
                      disabled={isLoading}
                    />
                    <Button
                      type="button"
                      onClick={handleAddParticipant}
                      variant="outline"
                      disabled={isLoading}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  {formData.participants && formData.participants.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {formData.participants.map((participant, idx) => (
                        <Badge key={idx} variant="secondary" className="gap-1">
                          {participant}
                          <button
                            type="button"
                            onClick={() => handleRemoveParticipant(participant)}
                            className="ml-1 hover:text-destructive"
                            disabled={isLoading}
                            title="Remover participante"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </TabsContent>

              {/* TAB 2: Imagens */}
              <TabsContent value="images" className="mt-4">
                <ImageUploadGallery
                  images={images}
                  onImagesChange={setImages}
                  maxImages={20}
                  maxSizeMB={10}
                />
              </TabsContent>

              {/* TAB 3: Checklist */}
              <TabsContent value="checklist" className="space-y-4 mt-4">
                <div className="flex gap-2">
                  <Input
                    value={checklistInput}
                    onChange={(e) => setChecklistInput(e.target.value)}
                    onKeyPress={(e) =>
                      e.key === "Enter" && (e.preventDefault(), handleAddChecklistItem())
                    }
                    placeholder="Digite o item e pressione Enter"
                    disabled={isLoading}
                  />
                  <Button
                    type="button"
                    onClick={handleAddChecklistItem}
                    variant="outline"
                    disabled={isLoading}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>

                {totalCount > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span>Progresso</span>
                      <span>
                        {completedCount} de {totalCount} concluídos
                      </span>
                    </div>
                    <div className="w-full bg-secondary h-2 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary transition-all"
                        {...({ style: { width: `${totalCount > 0 ? (completedCount / totalCount) * 100 : 0}%` } })}
                      />
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  {checklist.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-3 p-3 border rounded-lg hover:bg-accent/50 transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={item.completed}
                        onChange={() => handleToggleChecklistItem(item.id)}
                        className="h-5 w-5 rounded border-input"
                        disabled={isLoading}
                        aria-label={`Marcar "${item.text}" como ${item.completed ? 'incompleto' : 'completo'}`}
                      />
                      <span
                        className={`flex-1 ${
                          item.completed ? "line-through text-muted-foreground" : ""
                        }`}
                      >
                        {item.text}
                      </span>
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        onClick={() => handleRemoveChecklistItem(item.id)}
                        disabled={isLoading}
                        className="text-muted-foreground hover:text-destructive"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>

                {totalCount === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <CheckSquare className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>Nenhum item no checklist</p>
                    <p className="text-sm">Adicione itens para acompanhar tarefas</p>
                  </div>
                )}
              </TabsContent>

              {/* TAB 4: Notas */}
              <TabsContent value="notes" className="mt-4">
                <div className="space-y-2">
                  <Label htmlFor="notes">Anotações Adicionais</Label>
                  <textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => handleChange("notes", e.target.value)}
                    className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm min-h-[300px]"
                    placeholder="Digite suas anotações, observações ou detalhes importantes sobre a reunião..."
                    disabled={isLoading}
                  />
                  <p className="text-xs text-muted-foreground">
                    Use este espaço para anotar pontos importantes, decisões, próximos passos, etc.
                  </p>
                </div>
              </TabsContent>
            </Tabs>

            <div className="flex gap-3 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={onClose}
                disabled={isLoading}
              >
                Cancelar
              </Button>
              <Button type="submit" className="flex-1" disabled={isLoading}>
                {isLoading
                  ? "Salvando..."
                  : isEditing
                  ? "Salvar Alterações"
                  : "Criar Reunião"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
