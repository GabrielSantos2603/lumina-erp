import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Download, 
  Send, 
  X, 
  Tag as TagIcon,
  CheckCircle2,
  Clock,
  AlertCircle,
  Archive,
  FileText
} from "lucide-react";
import { meetingService, type Meeting } from "@/services/meetingService";
import { MeetingTranscriber } from "@/components/MeetingTranscriber";
import { 
  getAllTemplates, 
  getTemplate, 
  type TemplateType 
} from "@/utils/minutesTemplates";
import { exportMeetingToPDF } from "@/utils/pdfExport";

interface MinutesTabProps {
  meeting: Meeting;
  onUpdate: () => void;
}

const statusConfig = {
  draft: {
    label: "Rascunho",
    icon: Clock,
    color: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  },
  in_review: {
    label: "Em Revisão",
    icon: AlertCircle,
    color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  },
  approved: {
    label: "Aprovada",
    icon: CheckCircle2,
    color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  },
  archived: {
    label: "Arquivada",
    icon: Archive,
    color: "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400",
  },
};

export function MinutesTab({ meeting, onUpdate }: MinutesTabProps) {
  const [newTag, setNewTag] = useState("");
  const [tags, setTags] = useState<string[]>(meeting.tags || []);
  const [isExporting, setIsExporting] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateType>(
    (meeting.template_type as TemplateType) || "standard"
  );

  const currentStatus = meeting.minutes_status || "draft";
  const StatusIcon = statusConfig[currentStatus].icon;
  const templates = getAllTemplates();

  const handleAddTag = async () => {
    if (!newTag.trim() || tags.includes(newTag.trim())) return;

    try {
      const updatedTags = [...tags, newTag.trim()];
      await meetingService.addTags(meeting.id, updatedTags);
      setTags(updatedTags);
      setNewTag("");
      onUpdate();
    } catch (error) {
      console.error("Erro ao adicionar tag:", error);
      alert("Erro ao adicionar tag");
    }
  };

  const handleRemoveTag = async (tagToRemove: string) => {
    try {
      const updatedTags = tags.filter(t => t !== tagToRemove);
      await meetingService.addTags(meeting.id, updatedTags);
      setTags(updatedTags);
      onUpdate();
    } catch (error) {
      console.error("Erro ao remover tag:", error);
      alert("Erro ao remover tag");
    }
  };

  const handleStatusChange = async (newStatus: "draft" | "in_review" | "approved" | "archived") => {
    try {
      await meetingService.updateMinutesStatus(meeting.id, newStatus);
      onUpdate();
    } catch (error) {
      console.error("Erro ao atualizar status:", error);
      alert("Erro ao atualizar status");
    }
  };

  const handleTemplateChange = async (templateType: TemplateType) => {
    try {
      setSelectedTemplate(templateType);
      await meetingService.updateMeeting(meeting.id, { template_type: templateType });
      onUpdate();
    } catch (error) {
      console.error("Erro ao mudar template:", error);
      alert("Erro ao mudar template");
    }
  };

  const handleExport = async (format: "txt" | "json" | "pdf") => {
    try {
      setIsExporting(true);
      
      if (format === "pdf") {
        const template = getTemplate(selectedTemplate);
        
        // Transformar Meeting para PDFMeeting
        const pdfMeeting = {
          title: meeting.title,
          date: meeting.meeting_date,
          time: meeting.start_time,
          location: meeting.location,
          transcription: meeting.transcription,
          ai_summary: meeting.ai_summary,
          minutes_status: meeting.minutes_status,
          approved_at: meeting.approved_at,
          tags: meeting.tags,
          template_type: meeting.template_type,
          project_name: meeting.project_name,
          client_name: meeting.client_name,
          participants: meeting.participants?.map(p => ({ name: p }))
        };
        
        exportMeetingToPDF(pdfMeeting, template, {
          includeTranscription: true,
          includeSignatures: meeting.approval_required || false,
          companyName: "Lumina AI ERP"
        });
      } else {
        const content = await meetingService.exportMinutes(meeting.id, format);
        
        // Criar download
        const blob = new Blob([content], { type: format === "json" ? "application/json" : "text/plain" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `ata-${meeting.title.replace(/\s+/g, '-')}.${format}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error("Erro ao exportar:", error);
      alert("Erro ao exportar ata");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Cabeçalho com Status e Ações */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CardTitle className="text-lg">Status da Ata</CardTitle>
              <Badge className={statusConfig[currentStatus].color}>
                <StatusIcon className="h-3 w-3 mr-1" />
                {statusConfig[currentStatus].label}
              </Badge>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleExport("pdf")}
                disabled={isExporting}
                className="gap-2"
              >
                <Download className="h-4 w-4" />
                PDF
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleExport("txt")}
                disabled={isExporting}
                className="gap-2"
              >
                <Download className="h-4 w-4" />
                TXT
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleExport("json")}
                disabled={isExporting}
                className="gap-2"
              >
                <Download className="h-4 w-4" />
                JSON
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Seletor de Template */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Tipo de Ata/Template
            </Label>
            <Select
              value={selectedTemplate}
              onValueChange={(value: string) => handleTemplateChange(value as TemplateType)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione um template" />
              </SelectTrigger>
              <SelectContent>
                {templates.map((template) => (
                  <SelectItem key={template.type} value={template.type}>
                    {template.icon} {template.name} - {template.description}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Mudar Status */}
          <div className="space-y-2">
            <Label>Alterar Status</Label>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant={currentStatus === "draft" ? "default" : "outline"}
                onClick={() => handleStatusChange("draft")}
                className="gap-2"
              >
                <Clock className="h-3 w-3" />
                Rascunho
              </Button>
              <Button
                size="sm"
                variant={currentStatus === "in_review" ? "default" : "outline"}
                onClick={() => handleStatusChange("in_review")}
                className="gap-2"
              >
                <AlertCircle className="h-3 w-3" />
                Em Revisão
              </Button>
              <Button
                size="sm"
                variant={currentStatus === "approved" ? "default" : "outline"}
                onClick={() => handleStatusChange("approved")}
                className="gap-2"
              >
                <CheckCircle2 className="h-3 w-3" />
                Aprovar
              </Button>
              <Button
                size="sm"
                variant={currentStatus === "archived" ? "default" : "outline"}
                onClick={() => handleStatusChange("archived")}
                className="gap-2"
              >
                <Archive className="h-3 w-3" />
                Arquivar
              </Button>
            </div>
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <TagIcon className="h-4 w-4" />
              Tags para Organização
            </Label>
            <div className="flex gap-2">
              <Input
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleAddTag()}
                placeholder="Ex: Planejamento, Sprint, Cliente"
              />
              <Button onClick={handleAddTag} variant="outline">
                <Send className="h-4 w-4" />
              </Button>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {tags.map((tag, idx) => (
                  <Badge key={idx} variant="secondary" className="gap-1">
                    <TagIcon className="h-3 w-3" />
                    {tag}
                    <button
                      onClick={() => handleRemoveTag(tag)}
                      className="ml-1 hover:text-destructive"
                      title="Remover tag"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Info de Aprovação */}
          {meeting.approved_at && (
            <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
              <div className="flex items-center gap-2 text-sm text-green-700 dark:text-green-400">
                <CheckCircle2 className="h-4 w-4" />
                <span className="font-medium">
                  Ata aprovada em {new Date(meeting.approved_at).toLocaleDateString("pt-BR")}
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Transcrição e Resumo com IA */}
      <MeetingTranscriber meetingId={meeting.id} />
    </div>
  );
}
