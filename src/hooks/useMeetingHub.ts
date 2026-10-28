// ============================================================================
// LUMINA AI ERP - HOOK PARA HUB DE REUNIÕES
// ============================================================================
// Hook customizado com real-time subscriptions e estado integrado
// ============================================================================

import { useState, useEffect, useCallback } from 'react';
import { 
  meetingService, 
  type MeetingComplete, 
  type MeetingAgenda,
  type MeetingChecklist,
  type MeetingDecision,
  type MeetingAttendee,
  type MeetingRecording,
  type CreateCompleteMeetingData
} from '@/services/meetingService';

export interface MeetingHubState {
  // Reunião principal
  meeting: MeetingComplete | null;
  
  // Componentes do Hub
  agenda: MeetingAgenda[];
  checklist: MeetingChecklist[];
  decisions: MeetingDecision[];
  attendees: MeetingAttendee[];
  recordings: MeetingRecording[];
  
  // Estados de loading
  loading: boolean;
  saving: boolean;
  uploading: boolean;
  
  // Erros
  error: string | null;
  
  // Progresso calculado
  progress: {
    agenda: number;
    checklist: number;
    overall: number;
  };
}

export interface MeetingHubActions {
  // Reunião principal
  loadMeeting: (meetingId: string) => Promise<void>;
  updateMeeting: (updates: Partial<MeetingComplete>) => Promise<void>;
  createMeeting: (data: CreateCompleteMeetingData) => Promise<string>;
  
  // Agenda
  loadAgenda: (meetingId: string) => Promise<void>;
  addAgendaItem: (item: Omit<MeetingAgenda, 'id' | 'user_id'>) => Promise<void>;
  updateAgendaItem: (itemId: string, updates: Partial<MeetingAgenda>) => Promise<void>;
  deleteAgendaItem: (itemId: string) => Promise<void>;
  toggleAgendaItem: (itemId: string) => Promise<void>;
  
  // Checklist
  loadChecklist: (meetingId: string) => Promise<void>;
  addChecklistItem: (item: Omit<MeetingChecklist, 'id' | 'user_id'>) => Promise<void>;
  updateChecklistItem: (itemId: string, updates: Partial<MeetingChecklist>) => Promise<void>;
  toggleChecklistItem: (itemId: string) => Promise<void>;
  
  // Decisões
  loadDecisions: (meetingId: string) => Promise<void>;
  addDecision: (decision: Omit<MeetingDecision, 'id' | 'user_id'>) => Promise<void>;
  updateDecision: (decisionId: string, updates: Partial<MeetingDecision>) => Promise<void>;
  
  // Participantes
  loadAttendees: (meetingId: string) => Promise<void>;
  addAttendee: (attendee: Omit<MeetingAttendee, 'id' | 'user_id'>) => Promise<void>;
  updateAttendee: (attendeeId: string, updates: Partial<MeetingAttendee>) => Promise<void>;
  
  // Gravações
  loadRecordings: (meetingId: string) => Promise<void>;
  uploadRecording: (meetingId: string, file: File) => Promise<void>;
  
  // Utilidades
  refreshAll: () => Promise<void>;
  clearState: () => void;
  calculateProgress: () => void;
}

export function useMeetingHub(meetingId?: string): MeetingHubState & MeetingHubActions {
  // ============================================================================
  // ESTADO
  // ============================================================================
  
  const [state, setState] = useState<MeetingHubState>({
    meeting: null,
    agenda: [],
    checklist: [],
    decisions: [],
    attendees: [],
    recordings: [],
    loading: false,
    saving: false,
    uploading: false,
    error: null,
    progress: {
      agenda: 0,
      checklist: 0,
      overall: 0
    }
  });

  // ============================================================================
  // FUNÇÕES AUXILIARES
  // ============================================================================
  
  const setLoading = useCallback((loading: boolean) => {
    setState(prev => ({ ...prev, loading }));
  }, []);

  const setSaving = useCallback((saving: boolean) => {
    setState(prev => ({ ...prev, saving }));
  }, []);

  const setUploading = useCallback((uploading: boolean) => {
    setState(prev => ({ ...prev, uploading }));
  }, []);

  const setError = useCallback((error: string | null) => {
    setState(prev => ({ ...prev, error }));
  }, []);

  const calculateProgress = useCallback(() => {
    setState(prev => {
      const { agenda, checklist } = prev;
      
      const agendaProgress = agenda.length > 0 
        ? Math.round((agenda.filter(item => item.completed).length / agenda.length) * 100)
        : 100;

      const checklistProgress = checklist.length > 0
        ? Math.round((checklist.filter(item => item.completed).length / checklist.length) * 100)
        : 100;

      const overallProgress = Math.round((agendaProgress + checklistProgress) / 2);

      return {
        ...prev,
        progress: {
          agenda: agendaProgress,
          checklist: checklistProgress,
          overall: overallProgress
        }
      };
    });
  }, []);

  // ============================================================================
  // AÇÕES - REUNIÃO PRINCIPAL
  // ============================================================================
  
  const loadMeeting = useCallback(async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const meeting = await meetingService.getMeetingCompleteById(id);
      setState(prev => ({ ...prev, meeting }));
      
    } catch (error) {
      console.error('Erro ao carregar reunião:', error);
      setError(error instanceof Error ? error.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  }, [setLoading, setError]);

  const updateMeeting = useCallback(async (updates: Partial<MeetingComplete>) => {
    if (!state.meeting?.id) return;

    try {
      setSaving(true);
      setError(null);
      
      // Converter updates para o formato aceito pelo serviço
      const validUpdates: Record<string, unknown> = {};
      
      Object.entries(updates).forEach(([key, value]) => {
        // Só incluir campos que existem no tipo UpdateMeetingData
        if (['title', 'description', 'location', 'meeting_date', 'start_time', 'end_time', 
             'status', 'project_id', 'project_name', 'client_id', 'client_name', 
             'participants', 'notes', 'template_type', 'minutes_status', 
             'transcription', 'ai_summary', 'tags'].includes(key)) {
          validUpdates[key] = value;
        }
      });
      
      await meetingService.updateMeeting(state.meeting.id, validUpdates);
      
      // Recarregar dados
      await loadMeeting(state.meeting.id);
      
    } catch (error) {
      console.error('Erro ao atualizar reunião:', error);
      setError(error instanceof Error ? error.message : 'Erro desconhecido');
    } finally {
      setSaving(false);
    }
  }, [state.meeting?.id, setSaving, setError, loadMeeting]);

  const createMeeting = useCallback(async (data: CreateCompleteMeetingData): Promise<string> => {
    try {
      setSaving(true);
      setError(null);
      
      const meetingId = await meetingService.createCompleteMeeting(data);
      
      // Carregar a reunião criada
      await loadMeeting(meetingId);
      
      return meetingId;
    } catch (error) {
      console.error('Erro ao criar reunião:', error);
      setError(error instanceof Error ? error.message : 'Erro desconhecido');
      throw error;
    } finally {
      setSaving(false);
    }
  }, [setSaving, setError, loadMeeting]);

  // ============================================================================
  // AÇÕES - AGENDA
  // ============================================================================
  
  const loadAgenda = useCallback(async (id: string) => {
    try {
      const agenda = await meetingService.getAgendaItems(id);
      setState(prev => ({ ...prev, agenda }));
    } catch (error) {
      console.error('Erro ao carregar agenda:', error);
      setError(error instanceof Error ? error.message : 'Erro ao carregar agenda');
    }
  }, [setError]);

  const addAgendaItem = useCallback(async (item: Omit<MeetingAgenda, 'id' | 'user_id'>) => {
    try {
      setSaving(true);
      await meetingService.createAgendaItem(item);
      
      // Recarregar agenda
      if (item.meeting_id) {
        await loadAgenda(item.meeting_id);
      }
    } catch (error) {
      console.error('Erro ao adicionar item da agenda:', error);
      setError(error instanceof Error ? error.message : 'Erro ao adicionar item');
    } finally {
      setSaving(false);
    }
  }, [setSaving, setError, loadAgenda]);

  const updateAgendaItem = useCallback(async (itemId: string, updates: Partial<MeetingAgenda>) => {
    try {
      setSaving(true);
      await meetingService.updateAgendaItem(itemId, updates);
      
      // Atualizar estado local
      setState(prev => ({
        ...prev,
        agenda: prev.agenda.map(item => 
          item.id === itemId ? { ...item, ...updates } : item
        )
      }));
      
    } catch (error) {
      console.error('Erro ao atualizar item da agenda:', error);
      setError(error instanceof Error ? error.message : 'Erro ao atualizar item');
    } finally {
      setSaving(false);
    }
  }, [setSaving, setError]);

  const deleteAgendaItem = useCallback(async (itemId: string) => {
    try {
      setSaving(true);
      await meetingService.deleteAgendaItem(itemId);
      
      // Remover do estado local
      setState(prev => ({
        ...prev,
        agenda: prev.agenda.filter(item => item.id !== itemId)
      }));
      
    } catch (error) {
      console.error('Erro ao excluir item da agenda:', error);
      setError(error instanceof Error ? error.message : 'Erro ao excluir item');
    } finally {
      setSaving(false);
    }
  }, [setSaving, setError]);

  const toggleAgendaItem = useCallback(async (itemId: string) => {
    const item = state.agenda.find(item => item.id === itemId);
    if (!item) return;

    await updateAgendaItem(itemId, { completed: !item.completed });
  }, [state.agenda, updateAgendaItem]);

  // ============================================================================
  // AÇÕES - CHECKLIST
  // ============================================================================
  
  const loadChecklist = useCallback(async (id: string) => {
    try {
      const checklist = await meetingService.getChecklistItems(id);
      setState(prev => ({ ...prev, checklist }));
    } catch (error) {
      console.error('Erro ao carregar checklist:', error);
      setError(error instanceof Error ? error.message : 'Erro ao carregar checklist');
    }
  }, [setError]);

  const addChecklistItem = useCallback(async (item: Omit<MeetingChecklist, 'id' | 'user_id'>) => {
    try {
      setSaving(true);
      const newItem = await meetingService.createChecklistItem(item);
      
      setState(prev => ({
        ...prev,
        checklist: [...prev.checklist, newItem]
      }));
      
    } catch (error) {
      console.error('Erro ao adicionar item do checklist:', error);
      setError(error instanceof Error ? error.message : 'Erro ao adicionar item');
    } finally {
      setSaving(false);
    }
  }, [setSaving, setError]);

  const updateChecklistItem = useCallback(async (itemId: string, updates: Partial<MeetingChecklist>) => {
    try {
      setSaving(true);
      await meetingService.updateChecklistItem(itemId, updates);
      
      setState(prev => ({
        ...prev,
        checklist: prev.checklist.map(item => 
          item.id === itemId ? { ...item, ...updates } : item
        )
      }));
      
    } catch (error) {
      console.error('Erro ao atualizar item do checklist:', error);
      setError(error instanceof Error ? error.message : 'Erro ao atualizar item');
    } finally {
      setSaving(false);
    }
  }, [setSaving, setError]);

  const toggleChecklistItem = useCallback(async (itemId: string) => {
    const item = state.checklist.find(item => item.id === itemId);
    if (!item) return;

    await updateChecklistItem(itemId, { completed: !item.completed });
  }, [state.checklist, updateChecklistItem]);

  // ============================================================================
  // AÇÕES - DECISÕES
  // ============================================================================
  
  const loadDecisions = useCallback(async (id: string) => {
    try {
      const decisions = await meetingService.getDecisions(id);
      setState(prev => ({ ...prev, decisions }));
    } catch (error) {
      console.error('Erro ao carregar decisões:', error);
      setError(error instanceof Error ? error.message : 'Erro ao carregar decisões');
    }
  }, [setError]);

  const addDecision = useCallback(async (decision: Omit<MeetingDecision, 'id' | 'user_id'>) => {
    try {
      setSaving(true);
      const newDecision = await meetingService.createDecision(decision);
      
      setState(prev => ({
        ...prev,
        decisions: [...prev.decisions, newDecision]
      }));
      
    } catch (error) {
      console.error('Erro ao adicionar decisão:', error);
      setError(error instanceof Error ? error.message : 'Erro ao adicionar decisão');
    } finally {
      setSaving(false);
    }
  }, [setSaving, setError]);

  const updateDecision = useCallback(async (decisionId: string, updates: Partial<MeetingDecision>) => {
    try {
      setSaving(true);
      // Note: Precisaria implementar updateDecision no service
      // await meetingService.updateDecision(decisionId, updates);
      
      setState(prev => ({
        ...prev,
        decisions: prev.decisions.map(decision => 
          decision.id === decisionId ? { ...decision, ...updates } : decision
        )
      }));
      
    } catch (error) {
      console.error('Erro ao atualizar decisão:', error);
      setError(error instanceof Error ? error.message : 'Erro ao atualizar decisão');
    } finally {
      setSaving(false);
    }
  }, [setSaving, setError]);

  // ============================================================================
  // AÇÕES - PARTICIPANTES
  // ============================================================================
  
  const loadAttendees = useCallback(async (id: string) => {
    try {
      const attendees = await meetingService.getAttendees(id);
      setState(prev => ({ ...prev, attendees }));
    } catch (error) {
      console.error('Erro ao carregar participantes:', error);
      setError(error instanceof Error ? error.message : 'Erro ao carregar participantes');
    }
  }, [setError]);

  const addAttendee = useCallback(async (attendee: Omit<MeetingAttendee, 'id' | 'user_id'>) => {
    try {
      setSaving(true);
      const newAttendee = await meetingService.createAttendee(attendee);
      
      setState(prev => ({
        ...prev,
        attendees: [...prev.attendees, newAttendee]
      }));
      
    } catch (error) {
      console.error('Erro ao adicionar participante:', error);
      setError(error instanceof Error ? error.message : 'Erro ao adicionar participante');
    } finally {
      setSaving(false);
    }
  }, [setSaving, setError]);

  const updateAttendee = useCallback(async (attendeeId: string, updates: Partial<MeetingAttendee>) => {
    try {
      setSaving(true);
      // Note: Precisaria implementar updateAttendee no service
      // await meetingService.updateAttendee(attendeeId, updates);
      
      setState(prev => ({
        ...prev,
        attendees: prev.attendees.map(attendee => 
          attendee.id === attendeeId ? { ...attendee, ...updates } : attendee
        )
      }));
      
    } catch (error) {
      console.error('Erro ao atualizar participante:', error);
      setError(error instanceof Error ? error.message : 'Erro ao atualizar participante');
    } finally {
      setSaving(false);
    }
  }, [setSaving, setError]);

  // ============================================================================
  // AÇÕES - GRAVAÇÕES
  // ============================================================================
  
  const loadRecordings = useCallback(async (id: string) => {
    try {
      const recordings = await meetingService.getRecordings(id);
      setState(prev => ({ ...prev, recordings }));
    } catch (error) {
      console.error('Erro ao carregar gravações:', error);
      setError(error instanceof Error ? error.message : 'Erro ao carregar gravações');
    }
  }, [setError]);

  const uploadRecording = useCallback(async (id: string, file: File) => {
    try {
      setUploading(true);
      const recording = await meetingService.uploadRecording(id, file);
      
      setState(prev => ({
        ...prev,
        recordings: [recording, ...prev.recordings]
      }));
      
    } catch (error) {
      console.error('Erro ao fazer upload da gravação:', error);
      setError(error instanceof Error ? error.message : 'Erro ao fazer upload');
    } finally {
      setUploading(false);
    }
  }, [setUploading, setError]);

  // ============================================================================
  // AÇÕES - UTILIDADES
  // ============================================================================
  
  const refreshAll = useCallback(async () => {
    if (!meetingId) return;

    try {
      setLoading(true);
      await Promise.all([
        loadMeeting(meetingId),
        loadAgenda(meetingId),
        loadChecklist(meetingId),
        loadDecisions(meetingId),
        loadAttendees(meetingId),
        loadRecordings(meetingId)
      ]);
    } catch (error) {
      console.error('Erro ao recarregar dados:', error);
      setError(error instanceof Error ? error.message : 'Erro ao recarregar');
    } finally {
      setLoading(false);
    }
  }, [meetingId, setLoading, setError, loadMeeting, loadAgenda, loadChecklist, loadDecisions, loadAttendees, loadRecordings]);

  const clearState = useCallback(() => {
    setState({
      meeting: null,
      agenda: [],
      checklist: [],
      decisions: [],
      attendees: [],
      recordings: [],
      loading: false,
      saving: false,
      uploading: false,
      error: null,
      progress: {
        agenda: 0,
        checklist: 0,
        overall: 0
      }
    });
  }, []);

  // ============================================================================
  // EFEITOS
  // ============================================================================
  
  // Carregar dados iniciais quando meetingId mudar
  useEffect(() => {
    if (meetingId) {
      refreshAll();
    } else {
      clearState();
    }
  }, [meetingId, refreshAll, clearState]);

  // Recalcular progresso quando agenda ou checklist mudarem
  useEffect(() => {
    calculateProgress();
  }, [calculateProgress]);

  // ============================================================================
  // REAL-TIME SUBSCRIPTIONS
  // ============================================================================
  
  useEffect(() => {
    if (!meetingId) return;

    const meetingSubscription = meetingService.subscribeToMeeting(meetingId, (payload) => {
      console.log('Meeting updated:', payload);
      loadMeeting(meetingId);
    });

    const agendaSubscription = meetingService.subscribeToAgenda(meetingId, (payload) => {
      console.log('Agenda updated:', payload);
      loadAgenda(meetingId);
    });

    return () => {
      meetingSubscription?.unsubscribe();
      agendaSubscription?.unsubscribe();
    };
  }, [meetingId, loadMeeting, loadAgenda]);

  // ============================================================================
  // RETORNO DO HOOK
  // ============================================================================
  
  return {
    // Estado
    ...state,
    
    // Ações
    loadMeeting,
    updateMeeting,
    createMeeting,
    
    loadAgenda,
    addAgendaItem,
    updateAgendaItem,
    deleteAgendaItem,
    toggleAgendaItem,
    
    loadChecklist,
    addChecklistItem,
    updateChecklistItem,
    toggleChecklistItem,
    
    loadDecisions,
    addDecision,
    updateDecision,
    
    loadAttendees,
    addAttendee,
    updateAttendee,
    
    loadRecordings,
    uploadRecording,
    
    refreshAll,
    clearState,
    calculateProgress
  };
}

// Hook para listar reuniões por projeto
export function useProjectMeetings(projectId?: string) {
  const [meetings, setMeetings] = useState<MeetingComplete[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadMeetings = useCallback(async (filters?: {
    status?: string;
    meeting_type?: string;
    date_from?: string;
    date_to?: string;
  }) => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await meetingService.getMeetingsComplete(projectId, filters);
      setMeetings(data);
      
    } catch (error) {
      console.error('Erro ao carregar reuniões:', error);
      setError(error instanceof Error ? error.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    if (projectId) {
      loadMeetings();
    } else {
      setMeetings([]);
    }
  }, [projectId, loadMeetings]);

  return {
    meetings,
    loading,
    error,
    loadMeetings
  };
}

export default useMeetingHub;