import { useState, useEffect, useCallback } from 'react';
import type { RealtimeChannel } from '@supabase/supabase-js';
import {
  meetingService,
  type MeetingComplete,
  type MeetingAgenda as ServiceMeetingAgenda,
  type MeetingChecklist as ServiceMeetingChecklist,
  type MeetingDecision as ServiceMeetingDecision,
  type MeetingAttendee as ServiceMeetingAttendee,
  type MeetingNote as ServiceMeetingNote,
  type MeetingNoteInput,
  type CreateCompleteMeetingData
} from '@/services/meetingService';
import { supabase } from '@/lib/supabase';

export type MeetingHubData = MeetingComplete;
export type MeetingAgenda = ServiceMeetingAgenda;
export type MeetingChecklist = ServiceMeetingChecklist;
export type MeetingDecision = ServiceMeetingDecision;
export type MeetingAttendee = ServiceMeetingAttendee;
export type MeetingNote = ServiceMeetingNote;
export type MeetingNoteCreate = MeetingNoteInput;

export interface MeetingFile {
  id: string;
  file_name: string;
  file_url: string;
  file_size: number;
  file_type: string;
  ai_analyzed: boolean;
  ai_content_summary?: string;
}

export interface ProjectAIChat {
  id: string;
  message: string;
  response: string;
  context_type: string;
  created_at: string;
}

export interface ProjectHubAnalytics {
  meetings: {
    total: number;
    completed: number;
    progress: number;
    current_phase: string;
  };
  content: {
    files: number;
    notes: number;
    decisions_total: number;
    decisions_pending: number;
  };
  ai: {
    interactions: number;
    transcription_hours: number;
  };
}

export function useMeetingHub(projectId?: string) {
  const [meetings, setMeetings] = useState<MeetingHubData[]>([]);
  const [selectedMeeting, setSelectedMeeting] = useState<MeetingHubData | null>(null);
  const [agendas, setAgendas] = useState<MeetingAgenda[]>([]);
  const [checklists, setChecklists] = useState<MeetingChecklist[]>([]);
  const [decisions, setDecisions] = useState<MeetingDecision[]>([]);
  const [attendees, setAttendees] = useState<MeetingAttendee[]>([]);
  const [files, setFiles] = useState<MeetingFile[]>([]);
  const [notes, setNotes] = useState<MeetingNote[]>([]);
  const [aiChats, setAiChats] = useState<ProjectAIChat[]>([]);
  const [hubAnalytics, setHubAnalytics] = useState<ProjectHubAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);

  // Carregar reuniões do projeto
  const loadProjectMeetings = useCallback(async () => {
    if (!projectId) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const data = await meetingService.getMeetingsByProject(projectId);
      setMeetings(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar reuniões');
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  // Carregar analytics do Hub
  const loadHubAnalytics = useCallback(async () => {
    if (!projectId) return;
    
    try {
      const analytics = await meetingService.getProjectHubAnalytics(projectId);
      setHubAnalytics(analytics);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar analytics');
    }
  }, [projectId]);

  // Carregar detalhes da reunião selecionada
  const loadMeetingDetails = useCallback(async (meetingId: string) => {
    try {
      const [
        agendasData, 
        checklistsData, 
        decisionsData, 
        attendeesData,
        filesData,
        notesData
      ] = await Promise.all([
        meetingService.getMeetingAgendas(meetingId),
        meetingService.getMeetingChecklists(meetingId),
        meetingService.getMeetingDecisions(meetingId),
        meetingService.getMeetingAttendees(meetingId),
        meetingService.getMeetingFiles(meetingId),
        meetingService.getMeetingNotes(meetingId)
      ]);

      setAgendas(agendasData);
      setChecklists(checklistsData);
      setDecisions(decisionsData);
      setAttendees(attendeesData);
      setFiles(filesData);
      setNotes(notesData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar detalhes da reunião');
    }
  }, []);

  // Carregar chat IA do projeto
  const loadProjectAIChats = useCallback(async () => {
    if (!projectId) return;
    
    try {
      const chats = await meetingService.getProjectAIChats(projectId);
      setAiChats(chats);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar chat IA');
    }
  }, [projectId]);

  // Selecionar reunião
  const selectMeeting = useCallback((meeting: MeetingHubData) => {
    setSelectedMeeting(meeting);
    loadMeetingDetails(meeting.id);
  }, [loadMeetingDetails]);

  const clearSelectedMeeting = useCallback(() => {
    setSelectedMeeting(null);
    setAgendas([]);
    setChecklists([]);
    setDecisions([]);
    setAttendees([]);
    setFiles([]);
    setNotes([]);
  }, []);

  // Criar nova reunião completa
  const createCompleteMeeting = useCallback(async (meetingData: CreateCompleteMeetingData) => {
    try {
      const meeting = await meetingService.createCompleteMeeting(meetingData);
      await loadProjectMeetings();
      await loadHubAnalytics();
      return meeting;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar reunião');
      throw err;
    }
  }, [loadProjectMeetings, loadHubAnalytics]);

  // Iniciar gravação com transcrição
  const startRecording = useCallback(async (meetingId: string) => {
    try {
      setIsRecording(true);
      await meetingService.startRealtimeTranscription(meetingId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao iniciar gravação');
      setIsRecording(false);
    }
  }, []);

  // Parar gravação
  const stopRecording = useCallback(async (meetingId: string) => {
    try {
      await meetingService.stopRealtimeTranscription(meetingId);
      setIsRecording(false);
      // Recarregar dados após gravação
      await loadMeetingDetails(meetingId);
      await loadHubAnalytics();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao parar gravação');
    }
  }, [loadMeetingDetails, loadHubAnalytics]);

  // Enviar pergunta para IA
  const askAI = useCallback(async (question: string) => {
    if (!projectId) return null;
    
    try {
      const response = await meetingService.askProjectAI(projectId, question);
      await loadProjectAIChats(); // Recarregar chat
      return response;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao consultar IA');
      return null;
    }
  }, [projectId, loadProjectAIChats]);

  // Upload de arquivo
  const uploadFile = useCallback(async (meetingId: string, file: File) => {
    if (!projectId) return null;
    
    try {
      const uploadedFile = await meetingService.uploadMeetingFile(meetingId, projectId, file);
      await loadMeetingDetails(meetingId);
      await loadHubAnalytics();
      return uploadedFile;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao fazer upload');
      return null;
    }
  }, [projectId, loadMeetingDetails, loadHubAnalytics]);

  // Adicionar nota
  const addNote = useCallback(async (meetingId: string, note: MeetingNoteCreate) => {
    try {
      if (!note.content) throw new Error('Conteúdo da nota é obrigatório');

      const newNote = await meetingService.addMeetingNote(meetingId, note);
      setNotes(prev => [...prev, newNote]);
      return newNote;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao adicionar nota');
      return null;
    }
  }, []);

  // Atualizar nota
  const updateNote = useCallback(async (noteId: string, updates: Partial<MeetingNoteCreate>) => {
    try {
      const updatedNote = await meetingService.updateMeetingNote(noteId, updates);
      if (!updatedNote) return null;
      setNotes(prev => prev.map(note => note.id === noteId ? updatedNote : note));
      return updatedNote;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao atualizar nota');
      return null;
    }
  }, []);

  // Atualizar item da agenda
  const updateAgendaItem = useCallback(async (id: string, updates: Partial<MeetingAgenda>) => {
    try {
      await meetingService.updateMeetingAgenda(id, updates);
      setAgendas(prev => prev.map(item => 
        item.id === id ? { ...item, ...updates } : item
      ));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao atualizar agenda');
    }
  }, []);

  // Atualizar item do checklist
  const updateChecklistItem = useCallback(async (id: string, updates: Partial<MeetingChecklist>) => {
    try {
      await meetingService.updateMeetingChecklist(id, updates);
      setChecklists(prev => prev.map(item => 
        item.id === id ? { ...item, ...updates } : item
      ));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao atualizar checklist');
    }
  }, []);

  // Calcular progresso da reunião
  const calculateMeetingProgress = useCallback(() => {
    if (!selectedMeeting) return 0;
    
    const totalItems = agendas.length + checklists.length;
    const completedItems = 
      agendas.filter(a => a.completed).length + 
      checklists.filter(c => c.completed).length;
    
    return totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;
  }, [selectedMeeting, agendas, checklists]);

  // Subscriptions em tempo real
  useEffect(() => {
    if (!projectId) return;

    // Subscription para reuniões
    const meetingsChannel = supabase
      .channel('meetings_changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'meetings',
        filter: `project_id=eq.${projectId}`
      }, () => {
        loadProjectMeetings();
        loadHubAnalytics();
      });

    // Subscription para chat IA
    const aiChatChannel = supabase
      .channel('ai_chat_changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'project_ai_chat',
        filter: `project_id=eq.${projectId}`
      }, () => {
        loadProjectAIChats();
      });

    // Subscription para detalhes da reunião
  let detailsChannels: RealtimeChannel[] = [];
    if (selectedMeeting) {
      const tables = [
        'meeting_agendas',
        'meeting_checklists', 
        'meeting_decisions',
        'meeting_attendees',
        'meeting_files',
        'meeting_notes',
        'meeting_realtime_transcription'
      ];

      detailsChannels = tables.map(table => {
        const channel = supabase
          .channel(`${table}_changes`)
          .on('postgres_changes', {
            event: '*',
            schema: 'public',
            table,
            filter: `meeting_id=eq.${selectedMeeting.id}`
          }, () => {
            loadMeetingDetails(selectedMeeting.id);
          });
        
        channel.subscribe();
        return channel;
      });
    }

    meetingsChannel.subscribe();
    aiChatChannel.subscribe();

    return () => {
      meetingsChannel.unsubscribe();
      aiChatChannel.unsubscribe();
      detailsChannels.forEach(channel => channel.unsubscribe());
    };
  }, [projectId, selectedMeeting, loadProjectMeetings, loadMeetingDetails, loadHubAnalytics, loadProjectAIChats]);

  // Carregar dados iniciais
  useEffect(() => {
    if (projectId) {
      loadProjectMeetings();
      loadHubAnalytics();
      loadProjectAIChats();
    }
  }, [projectId, loadProjectMeetings, loadHubAnalytics, loadProjectAIChats]);

  return {
    // Estado
    meetings,
    selectedMeeting,
    agendas,
    checklists,
    decisions,
    attendees,
    files,
    notes,
    aiChats,
    hubAnalytics,
    loading,
    error,
    isRecording,
    
    // Computadas
    meetingProgress: calculateMeetingProgress(),
    
    // Ações
    selectMeeting,
    createCompleteMeeting,
    startRecording,
    stopRecording,
    askAI,
    uploadFile,
    addNote,
  updateNote,
    updateAgendaItem,
    updateChecklistItem,
    loadProjectMeetings,
    loadMeetingDetails,
    loadHubAnalytics,
    loadProjectAIChats,
    clearSelectedMeeting
  };
}