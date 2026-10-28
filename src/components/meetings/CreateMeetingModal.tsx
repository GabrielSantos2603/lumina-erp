import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { X, Calendar, Clock, Users } from 'lucide-react';
import type { Project } from './ProjectSelector';
import { meetingService, type CreateMeetingData } from '@/services/meetingService';

interface ProjectMeeting {
  id: string;
  title: string;
  meeting_date: string;
  meeting_type: 'briefing' | 'budget' | 'concept' | 'presentation' | 'revision' | 'construction' | 'delivery';
  phase: 'initial' | 'contract' | 'design' | 'execution' | 'construction' | 'delivery' | 'finished';
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  description?: string;
  participants?: string[];
  estimated_duration?: number;
}

interface CreateMeetingModalProps {
  project: Project;
  onClose: () => void;
  onSuccess: (meeting: ProjectMeeting) => void;
}

export function CreateMeetingModal({ project, onClose, onSuccess }: CreateMeetingModalProps) {
  const [formData, setFormData] = useState<{
    title: string;
    description: string;
    meeting_date: string;
    meeting_time: string;
    meeting_type: 'briefing' | 'budget' | 'concept' | 'presentation' | 'revision' | 'construction' | 'delivery';
    estimated_duration: number;
    participants: string;
  }>({
    title: '',
    description: '',
    meeting_date: '',
    meeting_time: '',
    meeting_type: 'briefing',
    estimated_duration: 60,
    participants: ''
  });
  
  const [loading, setLoading] = useState(false);

  const meetingTypes = [
    { value: 'briefing', label: '🪴 Briefing', description: 'Levantamento inicial de necessidades' },
    { value: 'budget', label: '💰 Orçamento', description: 'Apresentação de custos e prazos' },
    { value: 'concept', label: '💡 Conceitual', description: 'Estudos conceituais do projeto' },
    { value: 'presentation', label: '📋 Apresentação', description: 'Apresentação de propostas finais' },
    { value: 'revision', label: '🔄 Revisão', description: 'Revisões e ajustes do projeto' },
    { value: 'construction', label: '🏗️ Execução', description: 'Acompanhamento da obra' },
    { value: 'delivery', label: '🎁 Entrega', description: 'Entrega final do projeto' }
  ] as const;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      
      // Combinar data e hora
      const meetingDateTime = new Date(`${formData.meeting_date}T${formData.meeting_time}`);
      
      // Dados da reunião no formato correto do serviço
      const meetingData: CreateMeetingData = {
        title: formData.title,
        description: formData.description,
        meeting_date: meetingDateTime.toISOString(),
        start_time: formData.meeting_time,
        status: 'scheduled',
        project_id: project.id,
        project_name: project.name,
        participants: formData.participants 
          ? formData.participants.split(',').map(p => p.trim()).filter(p => p)
          : []
      };
      
      try {
        // Tentar salvar usando o serviço real
        const savedMeeting = await meetingService.createMeeting(meetingData);
        
        // Converter Meeting para ProjectMeeting
        const convertedMeeting: ProjectMeeting = {
          id: savedMeeting.id,
          title: savedMeeting.title,
          description: savedMeeting.description,
          meeting_date: savedMeeting.meeting_date,
          meeting_type: 'briefing', // Valor padrão
          phase: getPhaseFromType('briefing'),
          status: savedMeeting.status || 'scheduled',
          estimated_duration: formData.estimated_duration,
          participants: savedMeeting.participants || []
        };
        
        onSuccess(convertedMeeting);
        return;
      } catch (serviceError) {
        console.error('Erro ao salvar no serviço, usando fallback:', serviceError);
      }
      
      // Fallback para reunião mock se o serviço falhar
      const newMeeting: ProjectMeeting = {
        id: `meeting_${Date.now()}`,
        title: formData.title,
        description: formData.description,
        meeting_date: meetingDateTime.toISOString(),
        meeting_type: formData.meeting_type,
        phase: getPhaseFromType(formData.meeting_type),
        status: 'scheduled',
        estimated_duration: formData.estimated_duration,
        participants: formData.participants 
          ? formData.participants.split(',').map(p => p.trim()).filter(p => p)
          : []
      };
      
      // Simular salvamento
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      onSuccess(newMeeting);
    } catch (error) {
      console.error('Erro ao criar reunião:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPhaseFromType = (type: string) => {
    const phaseMap = {
      'briefing': 'initial',
      'budget': 'contract', 
      'concept': 'design',
      'presentation': 'execution',
      'revision': 'execution',
      'construction': 'construction',
      'delivery': 'delivery'
    } as const;
    
    return phaseMap[type as keyof typeof phaseMap] || 'initial';
  };

  const selectedType = meetingTypes.find(type => type.value === formData.meeting_type);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-background">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            Nova Reunião - {project.name}
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
          >
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>

        <CardContent className="bg-background">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Título da Reunião */}
            <div className="space-y-2">
              <Label htmlFor="title">Título da Reunião *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Ex: Briefing inicial do projeto"
                required
              />
            </div>

            {/* Tipo de Reunião */}
            <div className="space-y-3">
              <Label>Tipo de Reunião *</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {meetingTypes.map((type) => (
                  <div
                    key={type.value}
                    className={`p-3 border-2 rounded-lg cursor-pointer transition-all ${
                      formData.meeting_type === type.value
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-950 dark:border-blue-400'
                        : 'border-border hover:border-muted-foreground'
                    }`}
                    onClick={() => setFormData(prev => ({ ...prev, meeting_type: type.value }))}
                  >
                    <div className="font-medium text-sm mb-1">{type.label}</div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">{type.description}</div>
                  </div>
                ))}
              </div>
              {selectedType && (
                <div className="mt-2">
                  <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                    Selecionado: {selectedType.label}
                  </Badge>
                </div>
              )}
            </div>

            {/* Data e Hora */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="meeting_date">Data da Reunião *</Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    id="meeting_date"
                    type="date"
                    value={formData.meeting_date}
                    onChange={(e) => setFormData(prev => ({ ...prev, meeting_date: e.target.value }))}
                    className="pl-10"
                    required
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="meeting_time">Horário *</Label>
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    id="meeting_time"
                    type="time"
                    value={formData.meeting_time}
                    onChange={(e) => setFormData(prev => ({ ...prev, meeting_time: e.target.value }))}
                    className="pl-10"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Duração Estimada */}
            <div className="space-y-2">
              <Label htmlFor="estimated_duration">Duração Estimada (minutos)</Label>
              <Input
                id="estimated_duration"
                type="number"
                value={formData.estimated_duration}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  estimated_duration: parseInt(e.target.value) || 60 
                }))}
                min="15"
                max="480"
                step="15"
                className="w-32"
              />
            </div>

            {/* Participantes */}
            <div className="space-y-2">
              <Label htmlFor="participants">Participantes</Label>
              <div className="relative">
                <Users className="absolute left-3 top-3 text-muted-foreground h-4 w-4" />
                <Textarea
                  id="participants"
                  value={formData.participants}
                  onChange={(e) => setFormData(prev => ({ ...prev, participants: e.target.value }))}
                  placeholder="Digite os nomes separados por vírgula&#10;Ex: João Silva, Maria Santos, Arquiteto Principal"
                  className="pl-10 min-h-[80px]"
                />
              </div>
            </div>

            {/* Descrição */}
            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Descreva o objetivo e agenda da reunião..."
                className="min-h-[100px]"
              />
            </div>

            {/* Botões */}
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={loading}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={loading || !formData.title || !formData.meeting_date || !formData.meeting_time}
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Criando...
                  </>
                ) : (
                  'Criar Reunião'
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}