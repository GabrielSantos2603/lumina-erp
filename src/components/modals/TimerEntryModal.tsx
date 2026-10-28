import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Clock, DollarSign, Calendar, User, Trash2, Edit2, Save, X } from "lucide-react";
import { timeTrackingService } from "@/services/timeTrackingService";

// Função auxiliar para formatar segundos
function formatSeconds(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  return `${hours.toString().padStart(2, "0")}:${minutes
    .toString()
    .padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}

interface TimerEntry {
  id: string;
  user_id: string;
  project_id?: string;
  start_time: string;
  end_time: string;
  duration_seconds: number;
  description?: string;
  hourly_rate?: number;
  cost: number;
  project_name?: string;
  user_name?: string;
}

interface TimerEntryModalProps {
  entry: TimerEntry | null;
  open: boolean;
  onClose: () => void;
  onUpdate: () => void;
}

export function TimerEntryModal({ entry, open, onClose, onUpdate }: TimerEntryModalProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Estados para edição
  const [editDescription, setEditDescription] = useState("");
  const [editHourlyRate, setEditHourlyRate] = useState("");

  // Inicializar valores quando o modal abrir ou entry mudar
  useEffect(() => {
    if (open && entry) {
      setEditDescription(entry.description || "");
      setEditHourlyRate(entry.hourly_rate?.toString() || "0");
      setIsEditing(false);
    }
  }, [open, entry]);

  if (!open || !entry) return null;

  // Formatar datas
  const startDate = new Date(entry.start_time);
  const endDate = new Date(entry.end_time);
  const dateFormatted = startDate.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
  const startTimeFormatted = startDate.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
  const endTimeFormatted = endDate.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });

  // Calcular custo recalculado se houver mudança no hourly_rate
  const recalculatedCost = () => {
    const rate = parseFloat(editHourlyRate) || 0;
    const hours = entry.duration_seconds / 3600;
    return rate * hours;
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);

      // Validação
      const rate = parseFloat(editHourlyRate);
      if (isNaN(rate) || rate < 0) {
        alert("Valor por hora inválido");
        return;
      }

      // Atualizar no banco
      await timeTrackingService.updateTimeEntry(entry.id, {
        description: editDescription,
        hourly_rate: rate,
      });

      alert("Timer atualizado com sucesso!");
      setIsEditing(false);
      onUpdate(); // Atualizar lista
    } catch (error) {
      console.error("Erro ao salvar timer:", error);
      alert("Erro ao salvar alterações");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      setIsDeleting(true);

      await timeTrackingService.deleteTimeEntry(entry.id);

      alert("Timer excluído com sucesso!");
      onClose();
      onUpdate(); // Atualizar lista
    } catch (error) {
      console.error("Erro ao excluir timer:", error);
      alert("Erro ao excluir timer");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCancel = () => {
    setEditDescription(entry.description || "");
    setEditHourlyRate(entry.hourly_rate?.toString() || "0");
    setIsEditing(false);
  };

  const handleConfirmDelete = () => {
    if (window.confirm("Tem certeza que deseja excluir este registro de tempo? Esta ação não pode ser desfeita.")) {
      handleDelete();
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        {/* Modal Content */}
        <Card 
          className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-900"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b">
            <div>
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Detalhes do Timer
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Visualize, edite ou exclua este registro de tempo
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={onClose}
              className="rounded-full h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Body */}
          <div className="p-6 space-y-6">
            {/* Projeto */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right font-medium">Projeto:</Label>
              <div className="col-span-3">
                <Badge variant="secondary" className="text-sm">
                  {entry.project_name || "Sem projeto"}
                </Badge>
              </div>
            </div>

            {/* Usuário */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right font-medium flex items-center justify-end gap-2">
                <User className="h-4 w-4" />
                Usuário:
              </Label>
              <div className="col-span-3">
                <span className="text-sm">{entry.user_name || "Usuário"}</span>
              </div>
            </div>

            {/* Data */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right font-medium flex items-center justify-end gap-2">
                <Calendar className="h-4 w-4" />
                Data:
              </Label>
              <div className="col-span-3">
                <span className="text-sm">{dateFormatted}</span>
              </div>
            </div>

            {/* Horário */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right font-medium flex items-center justify-end gap-2">
                <Clock className="h-4 w-4" />
                Horário:
              </Label>
              <div className="col-span-3">
                <span className="text-sm">
                  {startTimeFormatted} - {endTimeFormatted}
                </span>
              </div>
            </div>

            {/* Duração */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right font-medium">Duração:</Label>
              <div className="col-span-3">
                <span className="text-sm font-semibold">
                  {formatSeconds(entry.duration_seconds)}
                </span>
              </div>
            </div>

            {/* Descrição */}
            <div className="grid grid-cols-4 items-start gap-4">
              <Label className="text-right font-medium pt-2">Descrição:</Label>
              <div className="col-span-3">
                {isEditing ? (
                  <textarea
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    placeholder="Adicione uma descrição..."
                    rows={3}
                    className="w-full px-3 py-2 border rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                ) : (
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {entry.description || "Sem descrição"}
                  </p>
                )}
              </div>
            </div>

            {/* Valor por Hora */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right font-medium flex items-center justify-end gap-2">
                <DollarSign className="h-4 w-4" />
                Valor/hora:
              </Label>
              <div className="col-span-3">
                {isEditing ? (
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={editHourlyRate}
                    onChange={(e) => setEditHourlyRate(e.target.value)}
                    className="max-w-[200px]"
                  />
                ) : (
                  <span className="text-sm">
                    R$ {(entry.hourly_rate || 0).toFixed(2)}
                  </span>
                )}
              </div>
            </div>

            {/* Custo Total */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right font-medium">Custo Total:</Label>
              <div className="col-span-3">
                <span className="text-sm font-semibold text-green-600">
                  R$ {isEditing ? recalculatedCost().toFixed(2) : entry.cost.toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-between items-center p-6 border-t">
            <div>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="gap-2"
              >
                <Trash2 className="h-4 w-4" />
                {isDeleting ? "Excluindo..." : "Excluir"}
              </Button>
            </div>

            <div className="flex gap-2">
              {isEditing ? (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCancel}
                    disabled={isSaving}
                    className="gap-2"
                  >
                    <X className="h-4 w-4" />
                    Cancelar
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleSave}
                    disabled={isSaving}
                    className="gap-2"
                  >
                    {isSaving ? (
                      <>Salvando...</>
                    ) : (
                      <>
                        <Save className="h-4 w-4" />
                        Salvar
                      </>
                    )}
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="outline" size="sm" onClick={onClose}>
                    Fechar
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => setIsEditing(true)}
                    className="gap-2"
                  >
                    <Edit2 className="h-4 w-4" />
                    Editar
                  </Button>
                </>
              )}
            </div>
          </div>
        </Card>
      </div>
    </>
  );
}
