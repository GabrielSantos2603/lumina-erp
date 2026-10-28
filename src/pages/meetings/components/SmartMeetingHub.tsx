import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Calendar,
  Clock,
  FileText,
  Mic,
  Target,
  CheckCircle,
  Settings,
  Download,
  Eye,
  Edit3
} from 'lucide-react';
import { cn } from '@/utils/cn';
import { ProjectTimeline } from './ProjectTimeline';
import { MeetingAgendaBuilder } from './MeetingAgendaBuilder';
import { AudioRecorder } from './AudioRecorder';
import { MeetingDecisionTracker } from './MeetingDecisionTracker';
import type { 
  MeetingType, 
  ProjectTimeline as ProjectTimelineType,
  AgendaItem,
  ChecklistItem,
  MeetingDecision,
  TimelineMeeting
} from '@/types/meetingTypes';
import { getMeetingTypeConfig } from '@/utils/meetingConfig';

interface SmartMeetingHubProps {
  projectId: string;
  meetingId?: string;
  initialTab?: string;
  className?: string;
}

interface MeetingSession {
  id: string;
  type: MeetingType;
  title: string;
  date: string;
  agenda: AgendaItem[];
  checklist: ChecklistItem[];
  decisions: MeetingDecision[];
  transcription?: string;
  summary?: string;
  audioUrl?: string;
  duration: number;
  attendees: string[];
  status: 'preparation' | 'active' | 'completed';
}

export function SmartMeetingHub({ 
  projectId,
  initialTab = 'timeline',
  className 
}: SmartMeetingHubProps) {
  const [activeTab, setActiveTab] = useState(initialTab);
  const [currentSession, setCurrentSession] = useState<MeetingSession | null>(null);
  
  // Mock data - substituir por dados reais da API
  const [projectTimeline] = useState<ProjectTimelineType>({
    projectId: projectId,
    projectName: 'Projeto Selecionado',
    clientName: 'Cliente do Projeto',
    startDate: '2024-01-15',
    estimatedEndDate: '2024-06-15',
    currentPhase: 'design',
    progress: 45,
    totalMeetings: 7,
    completedMeetings: 3,
    meetings: [
      {
        id: 'meet-001',
        type: 'briefing',
        title: 'Briefing Inicial - Definição do Projeto',
        date: '2024-01-15T14:00:00',
        status: 'completed',
        attendees: [
          { id: '1', name: 'João Silva', email: 'joao@email.com', role: 'client', confirmed: true },
          { id: '2', name: 'Maria Santos', email: 'maria@arquitetura.com', role: 'architect', confirmed: true }
        ],
        decisions: [
          { id: 'd1', description: 'Reforma da área social', responsible: 'Maria Santos', status: 'completed', priority: 'high' },
          { id: 'd2', description: 'Orçamento definido: R$ 90.000', responsible: 'João Silva', status: 'completed', priority: 'high' }
        ],
        documents: ['briefing-inicial.pdf'],
        hasRecording: true,
        hasTranscription: true,
        mood: 'positive',
        satisfactionScore: 5
      }
    ]
  });

  // Iniciar nova reunião
  const startNewMeeting = (type: MeetingType) => {
    const config = getMeetingTypeConfig(type);
    const newSession: MeetingSession = {
      id: Date.now().toString(),
      type,
      title: `${config.name} - ${projectTimeline.projectName}`,
      date: new Date().toISOString(),
      agenda: [],
      checklist: config.checklist || [],
      decisions: [],
      duration: 0,
      attendees: [],
      status: 'preparation'
    };
    
    setCurrentSession(newSession);
    setActiveTab('agenda');
  };

  // Salvar agenda da reunião
  const handleAgendaSave = (agenda: AgendaItem[], checklist: ChecklistItem[]) => {
    if (currentSession) {
      setCurrentSession(prev => prev ? {
        ...prev,
        agenda,
        checklist,
        status: 'active' as const
      } : null);
      setActiveTab('recording');
    }
  };

  // Cancelar criação de reunião
  const handleAgendaCancel = () => {
    setCurrentSession(null);
    setActiveTab('timeline');
  };

  // Finalizar transcrição
  const handleTranscriptionComplete = (transcription: string, summary?: string) => {
    if (currentSession) {
      setCurrentSession(prev => prev ? {
        ...prev,
        transcription,
        summary
      } : null);
      setActiveTab('decisions');
    }
  };

  // Atualizar decisões
  const handleDecisionsUpdate = (decisions: MeetingDecision[]) => {
    if (currentSession) {
      setCurrentSession(prev => prev ? {
        ...prev,
        decisions
      } : null);
    }
  };

  // Finalizar reunião
  const finalizeMeeting = () => {
    if (currentSession) {
      setCurrentSession(prev => prev ? {
        ...prev,
        status: 'completed'
      } : null);
      
      alert('Reunião finalizada com sucesso! Ata e decisões foram salvas.');
      setActiveTab('timeline');
    }
  };

  // Exportar ata completa
  const exportMeetingMinutes = () => {
    if (!currentSession) return;

    const config = getMeetingTypeConfig(currentSession.type);
    const content = `
ATA DE REUNIÃO - ${config.name.toUpperCase()}
${config.icon} ${currentSession.title}

📅 Data: ${new Date(currentSession.date).toLocaleDateString('pt-BR', { 
  weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
})}
⏰ Horário: ${new Date(currentSession.date).toLocaleTimeString()}
⏱️ Duração: ${currentSession.duration} minutos
👥 Participantes: ${currentSession.attendees.join(', ')}

${currentSession.agenda.length > 0 ? `
📋 PAUTA DA REUNIÃO
${currentSession.agenda.map((item, index) => `
${index + 1}. ${item.title} (${item.duration}min)
   ${item.description}
`).join('')}
` : ''}

${currentSession.transcription ? `
📝 TRANSCRIÇÃO COMPLETA
${currentSession.transcription}

` : ''}

${currentSession.summary ? `
📊 RESUMO EXECUTIVO
${currentSession.summary}

` : ''}

${currentSession.decisions.length > 0 ? `
🎯 DECISÕES E AÇÕES
${currentSession.decisions.map((decision, index) => `
${index + 1}. ${decision.description}
   👤 Responsável: ${decision.responsible}
   📅 Prazo: ${decision.deadline ? new Date(decision.deadline).toLocaleDateString() : 'Não definido'}
   🚨 Prioridade: ${decision.priority === 'high' ? 'Alta' : decision.priority === 'medium' ? 'Média' : 'Baixa'}
   ✅ Status: ${decision.status === 'completed' ? 'Concluída' : decision.status === 'overdue' ? 'Atrasada' : 'Pendente'}
`).join('')}
` : ''}

---
📋 Checklist de Verificação
${currentSession.checklist.map(item => `
⬜ ${item.text}${item.required ? ' (Obrigatório)' : ''}
`).join('')}

---
Ata gerada automaticamente pelo Sistema Lumina ERP
Data de geração: ${new Date().toLocaleString()}
    `.trim();

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ata-${currentSession.type}-${new Date().toISOString().slice(0, 10)}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getTotalMinutesFromAgenda = (agenda: AgendaItem[]) => {
    return agenda.reduce((total, item) => total + item.duration, 0);
  };

  return (
    <div className={cn('w-full space-y-6', className)}>
      {/* Cabeçalho */}
      <Card>
        <CardHeader>
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <CardTitle className="text-2xl">Hub Inteligente de Reuniões</CardTitle>
              <p className="text-muted-foreground mt-1">
                Gerencie todo o ciclo de vida das reuniões com IA integrada
              </p>
            </div>
            
            {currentSession && (
              <div className="flex items-center gap-3">
                <Badge 
                  variant={currentSession.status === 'active' ? 'destructive' : 'outline'}
                  className="gap-1 text-sm"
                >
                  {currentSession.status === 'preparation' && <Settings className="h-3 w-3" />}
                  {currentSession.status === 'active' && <Mic className="h-3 w-3" />}
                  {currentSession.status === 'completed' && <CheckCircle className="h-3 w-3" />}
                  
                  {currentSession.status === 'preparation' && 'Preparação'}
                  {currentSession.status === 'active' && 'Em Andamento'}
                  {currentSession.status === 'completed' && 'Finalizada'}
                </Badge>
                
                <div className="flex gap-2">
                  <Button onClick={exportMeetingMinutes} variant="outline" size="sm" className="gap-1">
                    <Download className="h-4 w-4" />
                    Exportar Ata
                  </Button>
                  
                  {currentSession.status === 'active' && (
                    <Button onClick={finalizeMeeting} size="sm" className="gap-1">
                      <CheckCircle className="h-4 w-4" />
                      Finalizar Reunião
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>
        </CardHeader>
      </Card>

      {/* Status da Sessão Atual */}
      {currentSession && (
        <Card className="border-blue-200 bg-blue-50/50">
          <CardContent className="pt-4">
            <div className="flex flex-col lg:flex-row lg:items-center gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xl">
                    {getMeetingTypeConfig(currentSession.type).icon}
                  </span>
                  <h3 className="font-semibold">{currentSession.title}</h3>
                </div>
                <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {new Date(currentSession.date).toLocaleDateString()}
                  </div>
                  <div className="flex items-center gap-1">
                    <FileText className="h-3 w-3" />
                    {currentSession.agenda.length} itens na pauta
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {getTotalMinutesFromAgenda(currentSession.agenda)}min estimados
                  </div>
                  <div className="flex items-center gap-1">
                    <Target className="h-3 w-3" />
                    {currentSession.decisions.length} decisões
                  </div>
                </div>
              </div>
              
              <div className="flex gap-2">
                <Button 
                  onClick={() => setActiveTab('agenda')} 
                  variant="outline" 
                  size="sm"
                  className="gap-1"
                >
                  <Edit3 className="h-4 w-4" />
                  Editar Pauta
                </Button>
                <Button 
                  onClick={() => setActiveTab('timeline')} 
                  variant="outline" 
                  size="sm"
                  className="gap-1"
                >
                  <Eye className="h-4 w-4" />
                  Ver Timeline
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Navegação Principal */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="timeline" className="gap-2">
            <Calendar className="h-4 w-4" />
            Timeline
          </TabsTrigger>
          <TabsTrigger value="agenda" className="gap-2">
            <FileText className="h-4 w-4" />
            Agenda
          </TabsTrigger>
          <TabsTrigger value="recording" className="gap-2">
            <Mic className="h-4 w-4" />
            Gravação
          </TabsTrigger>
          <TabsTrigger value="decisions" className="gap-2">
            <Target className="h-4 w-4" />
            Decisões
          </TabsTrigger>
        </TabsList>

        <TabsContent value="timeline" className="space-y-6">
          <ProjectTimeline 
            timeline={projectTimeline}
            onMeetingClick={(meeting: TimelineMeeting) => {
              console.log('Meeting clicked:', meeting);
            }}
            onNewMeetingClick={startNewMeeting}
          />
        </TabsContent>

        <TabsContent value="agenda" className="space-y-6">
          {currentSession ? (
            <MeetingAgendaBuilder
              meetingType={currentSession.type}
              onSave={handleAgendaSave}
              onCancel={handleAgendaCancel}
            />
          ) : (
            <Card>
              <CardContent className="pt-6 text-center">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-muted-foreground mb-4">
                  Selecione um tipo de reunião na Timeline para começar a configurar a agenda
                </p>
                <Button onClick={() => setActiveTab('timeline')} variant="outline">
                  Ir para Timeline
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="recording" className="space-y-6">
          {currentSession && currentSession.status !== 'preparation' ? (
            <AudioRecorder
              onTranscriptionComplete={handleTranscriptionComplete}
              onRecordingComplete={(blob, duration) => {
                if (currentSession) {
                  setCurrentSession(prev => prev ? {
                    ...prev,
                    duration,
                    audioUrl: URL.createObjectURL(blob)
                  } : null);
                }
              }}
            />
          ) : (
            <Card>
              <CardContent className="pt-6 text-center">
                <Mic className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-muted-foreground mb-4">
                  {!currentSession 
                    ? 'Configure uma reunião na Timeline e defina a agenda antes de iniciar a gravação'
                    : 'Finalize a configuração da agenda para habilitar a gravação'
                  }
                </p>
                <Button 
                  onClick={() => setActiveTab(currentSession ? 'agenda' : 'timeline')} 
                  variant="outline"
                >
                  {currentSession ? 'Configurar Agenda' : 'Ir para Timeline'}
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="decisions" className="space-y-6">
          {currentSession ? (
            <MeetingDecisionTracker
              decisions={currentSession.decisions}
              transcription={currentSession.transcription}
              onDecisionsUpdate={handleDecisionsUpdate}
              onSignatureRequest={(decisionId) => {
                console.log('Signature requested for decision:', decisionId);
              }}
            />
          ) : (
            <Card>
              <CardContent className="pt-6 text-center">
                <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-muted-foreground mb-4">
                  Inicie uma reunião para gerenciar decisões e ações
                </p>
                <Button onClick={() => setActiveTab('timeline')} variant="outline">
                  Ir para Timeline
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}