import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AIRealTimeTranscription } from './AIRealTimeTranscription';
import {
  ArrowLeft,
  Calendar,
  Clock,
  Users,
  FileText,
  Plus,
  Edit3,
  Save,
  X,
  Sparkles,
  MessageSquare,
  Mic
} from 'lucide-react';
import type { MeetingHubData, MeetingNote, MeetingNoteCreate } from '@/hooks/useMeetingHubUpdated';

interface MeetingViewProps {
  meeting: MeetingHubData;
  projectName: string;
  notes: MeetingNote[];
  onAddNote: (note: MeetingNoteCreate) => Promise<unknown> | unknown;
  onUpdateNote: (noteId: string, updates: Partial<MeetingNoteCreate>) => Promise<unknown> | unknown;
  onBack: () => void;
}

const NOTE_TYPES: Array<{ value: MeetingNote['note_type']; label: string; color: string }> = [
  { value: 'general', label: 'Geral', color: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-300' },
  { value: 'action', label: 'Ação', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' },
  { value: 'decision', label: 'Decisão', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' },
  { value: 'question', label: 'Questão', color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300' },
  { value: 'important', label: 'Importante', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' }
];

const getMeetingTypeLabel = (type?: string) => {
  if (!type) return 'Sem tipo';
  const types: Record<string, string> = {
    briefing: 'Briefing',
    budget: 'Orçamento',
    concept: 'Conceitual',
    presentation: 'Apresentação',
    revision: 'Revisão',
    construction: 'Obra',
    delivery: 'Entrega'
  };
  return types[type] || type;
};

const getStatusConfig = (status?: string) => {
  const configs: Record<string, { label: string; color: string }> = {
    scheduled: { label: 'Agendada', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' },
    in_progress: { label: 'Em Andamento', color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300' },
    completed: { label: 'Concluída', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' },
    cancelled: { label: 'Cancelada', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' }
  };
  return configs[status ?? ''] || { label: status || 'Sem status', color: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-300' };
};

const getNoteTypeConfig = (type: MeetingNote['note_type']) => {
  return NOTE_TYPES.find((noteType) => noteType.value === type) ?? NOTE_TYPES[0];
};

export function MeetingView({ meeting, projectName, notes, onAddNote, onUpdateNote, onBack }: MeetingViewProps) {
  const [activeTab, setActiveTab] = useState<'notes' | 'transcription'>('notes');
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [newNoteContent, setNewNoteContent] = useState('');
  const [newNoteType, setNewNoteType] = useState<MeetingNote['note_type']>('general');
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState('');

  const statusConfig = useMemo(() => getStatusConfig(meeting.status), [meeting.status]);

  const handleSaveNote = async () => {
    if (!newNoteContent.trim()) return;

    const noteData: MeetingNoteCreate = {
      content: newNoteContent.trim(),
      note_type: newNoteType,
      ai_enhanced: false
    };

    await onAddNote(noteData);
    setNewNoteContent('');
    setNewNoteType('general');
    setIsAddingNote(false);
  };

  const handleEditNote = (note: MeetingNote) => {
    setEditingNoteId(note.id);
    setEditingContent(note.content);
  };

  const handleSaveEdit = async (noteId: string) => {
    if (!editingContent.trim()) return;

    await onUpdateNote(noteId, { content: editingContent.trim() });
    setEditingNoteId(null);
    setEditingContent('');
  };

  const handleCancelEdit = () => {
    setEditingNoteId(null);
    setEditingContent('');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{meeting.title}</h1>
          <p className="text-sm text-muted-foreground">{projectName}</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Informações da Reunião</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">
                {meeting.meeting_date
                  ? new Date(meeting.meeting_date).toLocaleDateString('pt-BR', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric'
                    })
                  : 'Data não definida'}
              </span>
            </div>

            {meeting.estimated_duration && (
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{meeting.estimated_duration} min</span>
              </div>
            )}

            {meeting.attendees_total !== undefined && (
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{meeting.attendees_total} participantes</span>
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <Badge className={statusConfig.color}>{statusConfig.label}</Badge>
            <Badge variant="outline">{getMeetingTypeLabel(meeting.meeting_type)}</Badge>
          </div>

          {meeting.description && (
            <p className="text-sm text-muted-foreground">{meeting.description}</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Atas da Reunião
              </CardTitle>
              <CardDescription>Anotações, transcrições e pontos importantes da reunião</CardDescription>
            </div>
            <div className="flex gap-2">
              {activeTab === 'notes' && (
                <Button onClick={() => setIsAddingNote(true)} size="sm" className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Nova Ata
                </Button>
              )}
            </div>
          </div>

          <div className="flex gap-1 mt-4">
            <Button
              variant={activeTab === 'notes' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setActiveTab('notes')}
              className="flex items-center gap-2"
            >
              <MessageSquare className="h-4 w-4" />
              Atas Manuais
            </Button>
            <Button
              variant={activeTab === 'transcription' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setActiveTab('transcription')}
              className="flex items-center gap-2"
            >
              <Mic className="h-4 w-4" />
              Transcrição IA
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {activeTab === 'notes' ? (
            <ScrollArea className="h-[600px] pr-4">
              <div className="space-y-4">
                {isAddingNote && (
                  <Card className="border-2 border-dashed border-muted">
                    <CardContent className="p-4 space-y-4">
                      <div className="flex gap-2 flex-wrap">
                        {NOTE_TYPES.map((type) => (
                          <Button
                            key={type.value}
                            variant={newNoteType === type.value ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setNewNoteType(type.value)}
                          >
                            {type.label}
                          </Button>
                        ))}
                      </div>

                      <Textarea
                        placeholder="Digite o conteúdo da ata..."
                        value={newNoteContent}
                        onChange={(e) => setNewNoteContent(e.target.value)}
                        className="min-h-[120px]"
                      />

                      <div className="flex gap-2">
                        <Button onClick={handleSaveNote} size="sm">
                          <Save className="h-4 w-4 mr-2" />
                          Salvar
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setIsAddingNote(false);
                            setNewNoteContent('');
                            setNewNoteType('general');
                          }}
                        >
                          <X className="h-4 w-4 mr-2" />
                          Cancelar
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {notes.length === 0 && !isAddingNote ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <h3 className="font-semibold mb-2">Nenhuma ata encontrada</h3>
                    <p className="text-sm mb-4">Comece criando sua primeira ata para esta reunião</p>
                    <Button onClick={() => setIsAddingNote(true)} variant="outline">
                      <Plus className="h-4 w-4 mr-2" />
                      Criar Primeira Ata
                    </Button>
                  </div>
                ) : (
                  notes.map((note) => (
                    <Card key={note.id} className="relative">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Badge className={getNoteTypeConfig(note.note_type).color}>
                              {getNoteTypeConfig(note.note_type).label}
                            </Badge>
                            {note.ai_enhanced && (
                              <Badge variant="outline" className="text-purple-600 dark:text-purple-400">
                                <Sparkles className="h-3 w-3 mr-1" />
                                IA
                              </Badge>
                            )}
                          </div>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="sm" onClick={() => handleEditNote(note)}>
                              <Edit3 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>

                        {editingNoteId === note.id ? (
                          <div className="space-y-2">
                            <Textarea
                              value={editingContent}
                              onChange={(e) => setEditingContent(e.target.value)}
                              className="min-h-[100px]"
                            />
                            <div className="flex gap-2">
                              <Button onClick={() => handleSaveEdit(note.id)} size="sm">
                                <Save className="h-4 w-4 mr-2" />
                                Salvar
                              </Button>
                              <Button variant="outline" size="sm" onClick={handleCancelEdit}>
                                <X className="h-4 w-4 mr-2" />
                                Cancelar
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <p className="text-sm whitespace-pre-wrap">{note.content}</p>
                            <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                              <span>
                                Criado em{' '}
                                {new Date(note.created_at).toLocaleString('pt-BR', {
                                  day: '2-digit',
                                  month: '2-digit',
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </span>
                              {note.updated_at && note.updated_at !== note.created_at && (
                                <span>
                                  Editado em{' '}
                                  {new Date(note.updated_at).toLocaleString('pt-BR', {
                                    day: '2-digit',
                                    month: '2-digit',
                                    year: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </span>
                              )}
                            </div>
                          </>
                        )}
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </ScrollArea>
          ) : (
            <div className="min-h-[600px]">
              <AIRealTimeTranscription
                meetingId={meeting.id}
                projectId={meeting.project_id ?? ''}
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
