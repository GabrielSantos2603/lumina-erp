import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { CreateMeetingModal } from './CreateMeetingModal';
import { MeetingView } from './MeetingView';
import type { Project } from './ProjectSelector';
import {
  useMeetingHub,
  type MeetingHubData,
  type MeetingNoteCreate
} from '@/hooks/useMeetingHubUpdated';
import {
  Calendar,
  FileText,
  Brain,
  Activity,
  ArrowLeft,
  Plus,
  Send
} from 'lucide-react';

interface SmartMeetingHubProps {
  project: Project;
  onBack: () => void;
}

const SUGGESTED_QUESTIONS = [
  'Qual o resumo das reuniões realizadas?',
  'Quais são as próximas ações?',
  'Qual o status do orçamento?',
  'Há algum risco identificado?'
];

const formatDate = (value?: string) => {
  if (!value) return 'Data não definida';
  return new Date(value).toLocaleDateString('pt-BR');
};

export function SmartMeetingHub({ project, onBack }: SmartMeetingHubProps) {
  const {
    meetings,
    selectedMeeting,
    selectMeeting,
    clearSelectedMeeting,
    hubAnalytics,
    aiChats,
    loading,
    askAI,
    notes,
    addNote,
    updateNote,
    loadProjectMeetings,
    loadHubAnalytics,
    loadProjectAIChats
  } = useMeetingHub(project.id);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'meetings' | 'ai-chat' | 'analytics'>('meetings');
  const [aiQuestion, setAiQuestion] = useState('');
  const [isProcessingAI, setIsProcessingAI] = useState(false);

  useEffect(() => {
    clearSelectedMeeting();
    setActiveTab('meetings');
    setAiQuestion('');
  }, [project.id, clearSelectedMeeting]);

  const handleAIQuestion = async () => {
    if (!aiQuestion.trim() || isProcessingAI) return;

    try {
      setIsProcessingAI(true);
      await askAI(aiQuestion.trim());
      setAiQuestion('');
    } catch (error) {
      console.error('Erro ao processar pergunta IA:', error);
    } finally {
      setIsProcessingAI(false);
    }
  };

  const handleSuggestedQuestion = async (question: string) => {
    if (isProcessingAI) return;

    try {
      setIsProcessingAI(true);
      await askAI(question);
    } catch (error) {
      console.error('Erro ao processar pergunta IA:', error);
    } finally {
      setIsProcessingAI(false);
    }
  };

  const handleSelectMeeting = (meeting: MeetingHubData) => {
    selectMeeting(meeting);
  };

  const handleModalSuccess = () => {
    setShowCreateModal(false);
    void loadProjectMeetings();
    void loadHubAnalytics();
    void loadProjectAIChats();
  };

  if (selectedMeeting) {
    return (
      <MeetingView
        meeting={selectedMeeting}
        projectName={project.name}
        notes={notes}
        onAddNote={(note: MeetingNoteCreate) => addNote(selectedMeeting.id, note)}
        onUpdateNote={(noteId: string, updates: Partial<MeetingNoteCreate>) => updateNote(noteId, updates)}
        onBack={clearSelectedMeeting}
      />
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="outline" size="sm" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Hub Inteligente</h1>
          <p className="text-muted-foreground">
            {project.name} • Cliente: {project.client_name || 'Não informado'}
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as typeof activeTab)} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="meetings">
            <Calendar className="h-4 w-4 mr-2" />
            Reuniões
          </TabsTrigger>
          <TabsTrigger value="ai-chat">
            <Brain className="h-4 w-4 mr-2" />
            Chat IA
          </TabsTrigger>
          <TabsTrigger value="analytics">
            <Activity className="h-4 w-4 mr-2" />
            Análise do Projeto
          </TabsTrigger>
        </TabsList>

        <TabsContent value="meetings" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold">Reuniões do Projeto</h2>
            <Button onClick={() => setShowCreateModal(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Nova Reunião
            </Button>
          </div>

          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
              <p className="mt-2 text-sm text-muted-foreground">Carregando reuniões...</p>
            </div>
          ) : meetings.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Nenhuma reunião encontrada</h3>
                <p className="text-muted-foreground mb-4">
                  Comece criando sua primeira reunião para este projeto.
                </p>
                <Button onClick={() => setShowCreateModal(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Criar Primeira Reunião
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {meetings.map((meeting) => (
                <Card
                  key={meeting.id}
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => handleSelectMeeting(meeting)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <h3 className="font-semibold">{meeting.title}</h3>
                          <Badge
                            variant={
                              meeting.status === 'completed'
                                ? 'default'
                                : meeting.status === 'scheduled'
                                  ? 'secondary'
                                  : 'destructive'
                            }
                          >
                            {meeting.status === 'completed'
                              ? 'Concluída'
                              : meeting.status === 'scheduled'
                                ? 'Agendada'
                                : 'Cancelada'}
                          </Badge>
                          <Badge variant="outline">
                            {meeting.meeting_type || 'Sem tipo'}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                          <span>{formatDate(meeting.meeting_date)}</span>
                          <span>{meeting.estimated_duration ?? 60} min</span>
                          <span>Fase: {meeting.phase || 'Não informada'}</span>
                        </div>
                        {meeting.description && (
                          <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                            {meeting.description}
                          </p>
                        )}
                      </div>
                      <Button variant="outline" size="sm">
                        Visualizar
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
        <TabsContent value="ai-chat" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5" />
                Assistente IA do Projeto
              </CardTitle>
              <CardDescription>
                Pergunte qualquer coisa sobre as reuniões, decisões e arquivos do projeto
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <ScrollArea className="h-96 border rounded-md p-4">
                <div className="space-y-4">
                  {aiChats.length === 0 ? (
                    <div className="bg-muted/50 rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <Brain className="h-4 w-4" />
                        <span className="font-medium text-sm">Assistente IA</span>
                      </div>
                      <p className="text-sm">
                        Olá! Posso te ajudar a analisar o projeto. Pergunte sobre reuniões, decisões ou próximos passos.
                      </p>
                    </div>
                  ) : (
                    aiChats.map((chat) => (
                      <div key={chat.id} className="space-y-2">
                        <div className="flex justify-end">
                          <div className="bg-blue-500 text-white p-3 rounded-lg max-w-xs">
                            {chat.message}
                          </div>
                        </div>
                        <div className="flex justify-start">
                          <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-lg max-w-sm">
                            <div className="flex items-center gap-2 mb-1">
                              <Brain className="h-4 w-4 text-blue-500 dark:text-blue-400" />
                              <span className="text-xs text-muted-foreground">
                                {formatDate(chat.created_at)}
                              </span>
                            </div>
                            <p className="text-sm whitespace-pre-line">{chat.response}</p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}

                  {isProcessingAI && (
                    <div className="flex justify-start">
                      <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-lg">
                        <div className="flex items-center gap-2">
                          <Brain className="h-4 w-4 text-blue-500 animate-pulse" />
                          <span className="text-sm">IA está pensando...</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </ScrollArea>

              <div className="flex gap-2">
                <Textarea
                  placeholder="Digite sua pergunta sobre o projeto..."
                  className="flex-1 resize-none"
                  rows={2}
                  value={aiQuestion}
                  onChange={(e) => setAiQuestion(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleAIQuestion();
                    }
                  }}
                />
                <Button
                  size="sm"
                  className="self-end"
                  onClick={handleAIQuestion}
                  disabled={isProcessingAI || !aiQuestion.trim()}
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>

              <div className="flex flex-wrap gap-2">
                {SUGGESTED_QUESTIONS.map((question) => (
                  <Button
                    key={question}
                    variant="outline"
                    size="sm"
                    onClick={() => handleSuggestedQuestion(question)}
                    disabled={isProcessingAI}
                  >
                    {question}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Progresso das Reuniões</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-2xl font-bold">{hubAnalytics?.meetings.total ?? 0}</p>
                    <p className="text-sm text-muted-foreground">Total de reuniões</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{hubAnalytics?.meetings.completed ?? 0}</p>
                    <p className="text-sm text-muted-foreground">Concluídas</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Progresso</span>
                    <span>{hubAnalytics?.meetings.progress ?? 0}%</span>
                  </div>
                  <Progress value={hubAnalytics?.meetings.progress ?? 0} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Fase Atual</CardTitle>
              </CardHeader>
              <CardContent>
                <Badge className="mb-2">
                  {hubAnalytics?.meetings.current_phase || 'Não informado'}
                </Badge>
                <p className="text-sm text-muted-foreground">
                  Última reunião registrada: {meetings[0]?.meeting_type || 'Sem dados'}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Conteúdo Gerado</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-2xl font-bold">{hubAnalytics?.content.files ?? 0}</p>
                    <p className="text-sm text-muted-foreground">Arquivos</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{hubAnalytics?.content.notes ?? 0}</p>
                    <p className="text-sm text-muted-foreground">Anotações</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Inteligência Artificial</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-2xl font-bold">{hubAnalytics?.ai.transcription_hours?.toFixed?.(1) ?? '0.0'}</p>
                    <p className="text-sm text-muted-foreground">Horas transcritas</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{hubAnalytics?.ai.interactions ?? 0}</p>
                    <p className="text-sm text-muted-foreground">Consultas IA</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {showCreateModal && (
        <CreateMeetingModal
          project={project}
          onClose={() => setShowCreateModal(false)}
          onSuccess={handleModalSuccess}
        />
      )}
    </div>
  );
}
