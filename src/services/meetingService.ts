import { supabase } from "@/lib/supabase";
import { getOrganizationId } from "@/utils/getOrganizationId";

export interface AISummary {
  resumo: string;
  pontos_principais?: string[];
  tarefas?: Array<{
    tarefa: string;
    responsavel?: string;
    prazo?: string;
  }>;
  decisoes?: string[];
  proximos_passos?: string[];
}

// ============================================================================
// INTERFACES DO HUB DE REUNIÕES
// ============================================================================

export interface MeetingComplete extends Meeting {
  // Campos do Hub
  meeting_type?: 'briefing' | 'budget' | 'concept' | 'presentation' | 'revision' | 'construction' | 'delivery';
  phase?: 'initial' | 'contract' | 'design' | 'execution' | 'construction' | 'delivery' | 'finished';
  mood?: 'positive' | 'neutral' | 'negative';
  satisfaction_score?: number;
  has_recording?: boolean;
  has_transcription?: boolean;
  audio_url?: string;
  transcription_summary?: AISummary;
  estimated_duration?: number;
  actual_duration?: number;
  
  // Contadores (da view)
  agenda_items_total?: number;
  agenda_items_completed?: number;
  checklist_items_total?: number;
  checklist_items_completed?: number;
  decisions_total?: number;
  decisions_pending?: number;
  attendees_total?: number;
  attendees_confirmed?: number;
  recording_url?: string;
  transcription_status?: string;
}

export interface MeetingAgenda {
  id?: string;
  meeting_id: string;
  user_id?: string;
  title: string;
  description?: string;
  duration_minutes: number;
  order_index: number;
  required: boolean;
  completed: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface MeetingChecklist {
  id?: string;
  meeting_id: string;
  user_id?: string;
  text: string;
  description?: string;
  category: string;
  required: boolean;
  completed: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface MeetingDecision {
  id?: string;
  meeting_id: string;
  user_id?: string;
  description: string;
  responsible: string;
  deadline?: string;
  priority: 'low' | 'medium' | 'high';
  status: 'pending' | 'completed' | 'overdue';
  signature_requested: boolean;
  signature_completed: boolean;
  signature_date?: string;
  signature_ip?: string;
  created_at?: string;
  updated_at?: string;
}

export interface MeetingAttendee {
  id?: string;
  meeting_id: string;
  user_id?: string;
  name: string;
  email?: string;
  role: 'architect' | 'client' | 'engineer' | 'contractor' | 'supplier' | 'team' | 'other';
  confirmed: boolean;
  attended: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface MeetingRecording {
  id?: string;
  meeting_id: string;
  user_id?: string;
  file_name: string;
  file_url: string;
  file_size?: number;
  duration_seconds?: number;
  mime_type: string;
  transcription?: string;
  transcription_status: 'pending' | 'processing' | 'completed' | 'failed';
  transcription_progress: number;
  ai_summary?: AISummary;
  ai_extracted_decisions?: MeetingDecision[];
  ai_processing_status: 'pending' | 'processing' | 'completed' | 'failed';
  created_at?: string;
  updated_at?: string;
}

export interface CreateCompleteMeetingData {
  project_id: string;
  meeting_type: string;
  title: string;
  description?: string;
  meeting_date: string;
  start_time: string;
  estimated_duration?: number;
  agenda_items?: Omit<MeetingAgenda, 'id' | 'meeting_id' | 'user_id'>[];
  checklist_items?: Omit<MeetingChecklist, 'id' | 'meeting_id' | 'user_id'>[];
  attendees?: Omit<MeetingAttendee, 'id' | 'meeting_id' | 'user_id'>[];
}

export interface Meeting {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  location?: string;
  meeting_date: string;
  start_time: string;
  end_time?: string;
  status: "scheduled" | "in_progress" | "completed" | "cancelled";
  project_id?: string;
  project_name?: string;
  client_id?: string;
  client_name?: string;
  participants?: string[];
  notes?: string;
  
  // Campos específicos de ata
  minutes_status?: "draft" | "in_review" | "approved" | "archived";
  transcription?: string;
  ai_summary?: AISummary;
  tags?: string[];
  template_type?: "formal" | "informal" | "technical" | "board" | "custom";
  approval_required?: boolean;
  approved_by?: string[];
  approved_at?: string;
  
  created_at: string;
  updated_at: string;
}

export interface MeetingComment {
  id: string;
  meeting_id: string;
  user_id: string;
  author_name: string;
  content: string;
  created_at: string;
  updated_at: string;
}

export interface MeetingAttachment {
  id: string;
  meeting_id: string;
  user_id: string;
  name: string;
  file_url: string;
  file_size?: number;
  mime_type?: string;
  uploaded_by_name: string;
  created_at: string;
}

export interface CreateMeetingData {
  title: string;
  description?: string;
  location?: string;
  meeting_date: string;
  start_time: string;
  end_time?: string;
  status?: "scheduled" | "in_progress" | "completed" | "cancelled";
  project_id?: string;
  project_name?: string;
  client_id?: string;
  client_name?: string;
  participants?: string[];
  notes?: string;
}

export interface MeetingNote {
  id: string;
  meeting_id: string;
  user_id: string;
  content: string;
  note_type: 'general' | 'action' | 'decision' | 'question' | 'important';
  timestamp_minutes: number | null;
  ai_enhanced: boolean;
  created_at: string;
  updated_at?: string | null;
}

export interface MeetingNoteInput {
  content: string;
  note_type?: string;
  timestamp_minutes?: number | null;
  ai_enhanced?: boolean;
}

export type UpdateMeetingData = Partial<CreateMeetingData> & {
  template_type?: "standard" | "formal" | "informal" | "technical" | "board";
  minutes_status?: "draft" | "in_review" | "approved" | "archived";
  transcription?: string;
  ai_summary?: AISummary;
  tags?: string[];
};

export interface MeetingStats {
  total: number;
  scheduled: number;
  inProgress: number;
  completed: number;
  cancelled: number;
  totalParticipants: number;
  averageParticipants: number;
}

class MeetingService {
  // ==================== MEETINGS ====================
  
  async getMeetings(status?: string): Promise<Meeting[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Usuário não autenticado");

    let query = supabase
      .from("meetings")
      .select("*")
      .eq("user_id", user.id)
      .order("meeting_date", { ascending: false });

    if (status && status !== "all") {
      query = query.eq("status", status);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data || [];
  }

  async getMeetingById(id: string): Promise<Meeting | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Usuário não autenticado");

    const { data, error } = await supabase
      .from("meetings")
      .select("*")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (error) throw error;
    return data;
  }

  async createMeeting(meetingData: CreateMeetingData): Promise<Meeting> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Usuário não autenticado");

    // Buscar organization_id do usuário
    const organizationId = await getOrganizationId();

    // Limpar campos vazios (converter "" para undefined que vira null no DB)
    const cleanData: CreateMeetingData = {
      ...meetingData,
      end_time: meetingData.end_time?.trim() || undefined,
      description: meetingData.description?.trim() || undefined,
      location: meetingData.location?.trim() || undefined,
      project_name: meetingData.project_name?.trim() || undefined,
      client_name: meetingData.client_name?.trim() || undefined,
      notes: meetingData.notes?.trim() || undefined,
    };

    const dataToInsert = {
      ...cleanData,
      user_id: user.id,
      organization_id: organizationId,
      status: cleanData.status || "scheduled",
    };

    console.log("Dados para inserir:", dataToInsert);

    const { data, error } = await supabase
      .from("meetings")
      .insert([dataToInsert])
      .select()
      .single();

    if (error) {
      console.error("Erro do Supabase:", error);
      throw error;
    }
    
    console.log("Reunião criada com sucesso:", data);
    return data;
  }

  async updateMeeting(id: string, meetingData: UpdateMeetingData): Promise<Meeting> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Usuário não autenticado");

    // Limpar campos vazios
    const cleanData: UpdateMeetingData = { ...meetingData };
    
    // Converter strings vazias em undefined
    Object.keys(cleanData).forEach((key) => {
      const value = cleanData[key as keyof UpdateMeetingData];
      if (typeof value === 'string' && value.trim() === '') {
        (cleanData as Record<string, unknown>)[key] = undefined;
      }
    });

    const { data, error } = await supabase
      .from("meetings")
      .update({
        ...cleanData,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("user_id", user.id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async deleteMeeting(id: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Usuário não autenticado");

    const { error } = await supabase
      .from("meetings")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) throw error;
  }

  async searchMeetings(searchTerm: string): Promise<Meeting[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Usuário não autenticado");

    const { data, error } = await supabase
      .from("meetings")
      .select("*")
      .eq("user_id", user.id)
      .or(`title.ilike.%${searchTerm}%,project_name.ilike.%${searchTerm}%,client_name.ilike.%${searchTerm}%`)
      .order("meeting_date", { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async getMeetingStats(): Promise<MeetingStats> {
    const meetings = await this.getMeetings();

    const total = meetings.length;
    const scheduled = meetings.filter((m) => m.status === "scheduled").length;
    const inProgress = meetings.filter((m) => m.status === "in_progress").length;
    const completed = meetings.filter((m) => m.status === "completed").length;
    const cancelled = meetings.filter((m) => m.status === "cancelled").length;

    const allParticipants = meetings.flatMap((m) => m.participants || []);
    const uniqueParticipants = [...new Set(allParticipants)];
    const totalParticipants = uniqueParticipants.length;
    const averageParticipants = total > 0 
      ? Math.round(allParticipants.length / total) 
      : 0;

    return {
      total,
      scheduled,
      inProgress,
      completed,
      cancelled,
      totalParticipants,
      averageParticipants,
    };
  }

  // ==================== COMMENTS ====================

  async getMeetingComments(meetingId: string): Promise<MeetingComment[]> {
    const { data, error } = await supabase
      .from("meeting_comments")
      .select("*")
      .eq("meeting_id", meetingId)
      .order("created_at", { ascending: true });

    if (error) throw error;
    return data || [];
  }

  async createComment(meetingId: string, content: string, authorName: string): Promise<MeetingComment> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Usuário não autenticado");

    const { data, error } = await supabase
      .from("meeting_comments")
      .insert([
        {
          meeting_id: meetingId,
          user_id: user.id,
          author_name: authorName,
          content,
        },
      ])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async deleteComment(commentId: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Usuário não autenticado");

    const { error } = await supabase
      .from("meeting_comments")
      .delete()
      .eq("id", commentId)
      .eq("user_id", user.id);

    if (error) throw error;
  }

  // ==================== ATTACHMENTS ====================

  async getMeetingAttachments(meetingId: string): Promise<MeetingAttachment[]> {
    const { data, error } = await supabase
      .from("meeting_attachments")
      .select("*")
      .eq("meeting_id", meetingId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async uploadAttachment(
    meetingId: string,
    file: File,
    uploadedByName: string
  ): Promise<MeetingAttachment> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Usuário não autenticado");

    // Upload file to storage
    const fileName = `${Date.now()}_${file.name}`;
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("meeting-attachments")
      .upload(`${user.id}/${meetingId}/${fileName}`, file);

    if (uploadError) throw uploadError;

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from("meeting-attachments")
      .getPublicUrl(uploadData.path);

    // Save metadata
    const { data, error } = await supabase
      .from("meeting_attachments")
      .insert([
        {
          meeting_id: meetingId,
          user_id: user.id,
          name: file.name,
          file_url: publicUrl,
          file_size: file.size,
          mime_type: file.type,
          uploaded_by_name: uploadedByName,
        },
      ])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async deleteAttachment(attachmentId: string, fileUrl: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Usuário não autenticado");

    // Extract file path from URL
    const path = fileUrl.split("/meeting-attachments/").pop();
    if (path) {
      await supabase.storage.from("meeting-attachments").remove([path]);
    }

    const { error } = await supabase
      .from("meeting_attachments")
      .delete()
      .eq("id", attachmentId)
      .eq("user_id", user.id);

    if (error) throw error;
  }

  // ==================== ATAS (MINUTES) ====================

  async saveTranscription(meetingId: string, transcription: string): Promise<Meeting> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Usuário não autenticado");

    const { data, error } = await supabase
      .from("meetings")
      .update({
        transcription,
        minutes_status: "draft",
        updated_at: new Date().toISOString(),
      })
      .eq("id", meetingId)
      .eq("user_id", user.id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async saveAISummary(meetingId: string, aiSummary: AISummary): Promise<Meeting> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Usuário não autenticado");

    const { data, error } = await supabase
      .from("meetings")
      .update({
        ai_summary: aiSummary,
        minutes_status: "draft",
        updated_at: new Date().toISOString(),
      })
      .eq("id", meetingId)
      .eq("user_id", user.id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async updateMinutesStatus(
    meetingId: string,
    status: "draft" | "in_review" | "approved" | "archived"
  ): Promise<Meeting> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Usuário não autenticado");

    const updateData: Record<string, unknown> = {
      minutes_status: status,
      updated_at: new Date().toISOString(),
    };

    if (status === "approved") {
      updateData.approved_at = new Date().toISOString();
    }

    const { data, error } = await supabase
      .from("meetings")
      .update(updateData)
      .eq("id", meetingId)
      .eq("user_id", user.id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async addTags(meetingId: string, tags: string[]): Promise<Meeting> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Usuário não autenticado");

    const { data, error } = await supabase
      .from("meetings")
      .update({
        tags,
        updated_at: new Date().toISOString(),
      })
      .eq("id", meetingId)
      .eq("user_id", user.id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async getMeetingsByTag(tag: string): Promise<Meeting[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Usuário não autenticado");

    const { data, error } = await supabase
      .from("meetings")
      .select("*")
      .eq("user_id", user.id)
      .contains("tags", [tag])
      .order("meeting_date", { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async exportMinutes(meetingId: string, format: "txt" | "json"): Promise<string> {
    const meeting = await this.getMeetingById(meetingId);
    if (!meeting) throw new Error("Reunião não encontrada");

    if (format === "json") {
      return JSON.stringify(
        {
          title: meeting.title,
          date: meeting.meeting_date,
          participants: meeting.participants,
          transcription: meeting.transcription,
          summary: meeting.ai_summary,
          comments: await this.getMeetingComments(meetingId),
        },
        null,
        2
      );
    }

    // Formato texto
    let content = `ATA DA REUNIÃO\n\n`;
    content += `Título: ${meeting.title}\n`;
    content += `Data: ${new Date(meeting.meeting_date).toLocaleDateString("pt-BR")}\n`;
    content += `Horário: ${meeting.start_time}${meeting.end_time ? ` - ${meeting.end_time}` : ""}\n`;
    if (meeting.location) content += `Local: ${meeting.location}\n`;
    if (meeting.participants) content += `\nParticipantes:\n${meeting.participants.map((p) => `- ${p}`).join("\n")}\n`;

    if (meeting.ai_summary) {
      content += `\n\nRESUMO:\n${meeting.ai_summary.resumo}\n`;

      if (meeting.ai_summary.pontos_principais) {
        content += `\n\nPONTOS PRINCIPAIS:\n`;
        meeting.ai_summary.pontos_principais.forEach((p, i) => {
          content += `${i + 1}. ${p}\n`;
        });
      }

      if (meeting.ai_summary.tarefas) {
        content += `\n\nTAREFAS:\n`;
        meeting.ai_summary.tarefas.forEach((t, i) => {
          content += `${i + 1}. ${t.tarefa}`;
          if (t.responsavel) content += ` (${t.responsavel})`;
          if (t.prazo) content += ` - Prazo: ${t.prazo}`;
          content += `\n`;
        });
      }

      if (meeting.ai_summary.decisoes) {
        content += `\n\nDECISÕES:\n`;
        meeting.ai_summary.decisoes.forEach((d, i) => {
          content += `${i + 1}. ${d}\n`;
        });
      }
    }

    if (meeting.transcription) {
      content += `\n\nTRANSCRIÇÃO COMPLETA:\n${meeting.transcription}\n`;
    }

    return content;
  }

  // ==================== HUB DE REUNIÕES ====================

  /**
   * Buscar reuniões completas com informações consolidadas
   */
  async getMeetingsComplete(projectId?: string, filters?: {
    status?: string;
    meeting_type?: string;
    date_from?: string;
    date_to?: string;
  }): Promise<MeetingComplete[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      let query = supabase
        .from('meetings_complete')
        .select('*')
        .eq('user_id', user.id)
        .order('meeting_date', { ascending: false });

      // Filtro por projeto
      if (projectId) {
        query = query.eq('project_id', projectId);
      }

      // Filtros adicionais
      if (filters?.status) {
        query = query.eq('status', filters.status);
      }
      
      if (filters?.meeting_type) {
        query = query.eq('meeting_type', filters.meeting_type);
      }

      if (filters?.date_from) {
        query = query.gte('meeting_date', filters.date_from);
      }

      if (filters?.date_to) {
        query = query.lte('meeting_date', filters.date_to);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Erro ao buscar reuniões completas:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Erro no getMeetingsComplete:', error);
      throw error;
    }
  }

  /**
   * Buscar reunião completa por ID
   */
  async getMeetingCompleteById(meetingId: string): Promise<MeetingComplete | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const { data, error } = await supabase
        .from('meetings_complete')
        .select('*')
        .eq('id', meetingId)
        .eq('user_id', user.id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null; // Não encontrado
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Erro ao buscar reunião completa:', error);
      throw error;
    }
  }

  /**
   * Criar reunião completa usando stored procedure
   */
  async createCompleteMeeting(data: CreateCompleteMeetingData): Promise<string> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const { data: result, error } = await supabase.rpc('create_complete_meeting', {
        p_user_id: user.id,
        p_project_id: data.project_id,
        p_meeting_type: data.meeting_type,
        p_title: data.title,
        p_meeting_date: data.meeting_date,
        p_start_time: data.start_time,
        p_agenda_items: data.agenda_items || [],
        p_checklist_items: data.checklist_items || [],
        p_attendees: data.attendees || []
      });

      if (error) {
        console.error('Erro ao criar reunião completa:', error);
        throw error;
      }

      return result; // ID da reunião criada
    } catch (error) {
      console.error('Erro no createCompleteMeeting:', error);
      throw error;
    }
  }

  // ==================== AGENDA DA REUNIÃO ====================

  /**
   * Buscar itens da agenda
   */
  async getAgendaItems(meetingId: string): Promise<MeetingAgenda[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const { data, error } = await supabase
        .from('meeting_agendas')
        .select('*')
        .eq('meeting_id', meetingId)
        .eq('user_id', user.id)
        .order('order_index');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Erro ao buscar agenda:', error);
      throw error;
    }
  }

  /**
   * Criar item da agenda
   */
  async createAgendaItem(item: Omit<MeetingAgenda, 'id' | 'user_id'>): Promise<MeetingAgenda> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const { data, error } = await supabase
        .from('meeting_agendas')
        .insert({ ...item, user_id: user.id })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Erro ao criar item da agenda:', error);
      throw error;
    }
  }

  /**
   * Atualizar item da agenda
   */
  async updateAgendaItem(itemId: string, updates: Partial<MeetingAgenda>): Promise<MeetingAgenda> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const { data, error } = await supabase
        .from('meeting_agendas')
        .update(updates)
        .eq('id', itemId)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Erro ao atualizar item da agenda:', error);
      throw error;
    }
  }

  /**
   * Excluir item da agenda
   */
  async deleteAgendaItem(itemId: string): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const { error } = await supabase
        .from('meeting_agendas')
        .delete()
        .eq('id', itemId)
        .eq('user_id', user.id);

      if (error) throw error;
    } catch (error) {
      console.error('Erro ao excluir item da agenda:', error);
      throw error;
    }
  }

  // ==================== CHECKLIST DA REUNIÃO ====================

  /**
   * Buscar itens do checklist
   */
  async getChecklistItems(meetingId: string): Promise<MeetingChecklist[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const { data, error } = await supabase
        .from('meeting_checklists')
        .select('*')
        .eq('meeting_id', meetingId)
        .eq('user_id', user.id)
        .order('category', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Erro ao buscar checklist:', error);
      throw error;
    }
  }

  /**
   * Criar item do checklist
   */
  async createChecklistItem(item: Omit<MeetingChecklist, 'id' | 'user_id'>): Promise<MeetingChecklist> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const { data, error } = await supabase
        .from('meeting_checklists')
        .insert({ ...item, user_id: user.id })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Erro ao criar item do checklist:', error);
      throw error;
    }
  }

  /**
   * Atualizar item do checklist
   */
  async updateChecklistItem(itemId: string, updates: Partial<MeetingChecklist>): Promise<MeetingChecklist> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const { data, error } = await supabase
        .from('meeting_checklists')
        .update(updates)
        .eq('id', itemId)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Erro ao atualizar item do checklist:', error);
      throw error;
    }
  }

  // ==================== DECISÕES DA REUNIÃO ====================

  /**
   * Buscar decisões da reunião
   */
  async getDecisions(meetingId: string): Promise<MeetingDecision[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const { data, error } = await supabase
        .from('meeting_decisions')
        .select('*')
        .eq('meeting_id', meetingId)
        .eq('user_id', user.id)
        .order('priority', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Erro ao buscar decisões:', error);
      throw error;
    }
  }

  /**
   * Criar decisão
   */
  async createDecision(decision: Omit<MeetingDecision, 'id' | 'user_id'>): Promise<MeetingDecision> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const { data, error } = await supabase
        .from('meeting_decisions')
        .insert({ ...decision, user_id: user.id })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Erro ao criar decisão:', error);
      throw error;
    }
  }

  // ==================== PARTICIPANTES DA REUNIÃO ====================

  /**
   * Buscar participantes
   */
  async getAttendees(meetingId: string): Promise<MeetingAttendee[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const { data, error } = await supabase
        .from('meeting_attendees')
        .select('*')
        .eq('meeting_id', meetingId)
        .eq('user_id', user.id)
        .order('role', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Erro ao buscar participantes:', error);
      throw error;
    }
  }

  /**
   * Criar participante
   */
  async createAttendee(attendee: Omit<MeetingAttendee, 'id' | 'user_id'>): Promise<MeetingAttendee> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const { data, error } = await supabase
        .from('meeting_attendees')
        .insert({ ...attendee, user_id: user.id })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Erro ao criar participante:', error);
      throw error;
    }
  }

  // ==================== GRAVAÇÕES DA REUNIÃO ====================

  /**
   * Buscar gravações
   */
  async getRecordings(meetingId: string): Promise<MeetingRecording[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const { data, error } = await supabase
        .from('meeting_recordings')
        .select('*')
        .eq('meeting_id', meetingId)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Erro ao buscar gravações:', error);
      throw error;
    }
  }

  /**
   * Upload de gravação de áudio
   */
  async uploadRecording(
    meetingId: string,
    file: File
  ): Promise<MeetingRecording> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      // Gerar nome único para o arquivo
      const timestamp = new Date().getTime();
      const fileName = `${user.id}/${meetingId}/${timestamp}_${file.name}`;

      // Upload para o Storage
      const { error: uploadError } = await supabase.storage
        .from('meeting-recordings')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error('Erro no upload:', uploadError);
        throw uploadError;
      }

      // Obter URL público
      const { data: { publicUrl } } = supabase.storage
        .from('meeting-recordings')
        .getPublicUrl(fileName);

      // Criar registro na tabela
      const recordingData = {
        meeting_id: meetingId,
        user_id: user.id,
        file_name: file.name,
        file_url: publicUrl,
        file_size: file.size,
        mime_type: file.type || 'audio/webm',
        transcription_status: 'pending' as const,
        transcription_progress: 0,
        ai_processing_status: 'pending' as const
      };

      const { data, error } = await supabase
        .from('meeting_recordings')
        .insert(recordingData)
        .select()
        .single();

      if (error) {
        console.error('Erro ao criar registro de gravação:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Erro no uploadRecording:', error);
      throw error;
    }
  }

  // ==================== SUBSCRIPTIONS REAL-TIME ====================

  /**
   * Criar subscription para mudanças na reunião
   */
  subscribeToMeeting(meetingId: string, callback: (payload: unknown) => void) {
    return supabase
      .channel(`meeting:${meetingId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'meetings',
        filter: `id=eq.${meetingId}`
      }, callback)
      .subscribe();
  }

  /**
   * Criar subscription para agenda
   */
  subscribeToAgenda(meetingId: string, callback: (payload: unknown) => void) {
    return supabase
      .channel(`agenda:${meetingId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'meeting_agendas',
        filter: `meeting_id=eq.${meetingId}`
      }, callback)
      .subscribe();
  }

  // ==================== MÉTODOS HUB INTELIGENTE ====================

  /**
   * Buscar reuniões por projeto com dados do Hub
   */
  async getMeetingsByProject(projectId: string): Promise<MeetingComplete[]> {
    try {
      const { data, error } = await supabase
        .from('meetings_complete')
        .select('*')
        .eq('project_id', projectId)
        .order('meeting_date', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Erro ao buscar reuniões do projeto:', error);
      throw error;
    }
  }

  /**
   * Buscar analytics do Hub do projeto
   */
  async getProjectHubAnalytics(projectId: string) {
    try {
      const { data, error } = await supabase
        .rpc('get_project_hub_analytics', { p_project_id: projectId });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Erro ao buscar analytics do Hub:', error);
      throw error;
    }
  }

  /**
   * Buscar agendas da reunião
   */
  async getMeetingAgendas(meetingId: string): Promise<MeetingAgenda[]> {
    try {
      const { data, error } = await supabase
        .from('meeting_agendas')
        .select('*')
        .eq('meeting_id', meetingId)
        .order('order_index');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Erro ao buscar agendas:', error);
      throw error;
    }
  }

  /**
   * Buscar checklists da reunião
   */
  async getMeetingChecklists(meetingId: string): Promise<MeetingChecklist[]> {
    try {
      const { data, error } = await supabase
        .from('meeting_checklists')
        .select('*')
        .eq('meeting_id', meetingId)
        .order('created_at');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Erro ao buscar checklists:', error);
      throw error;
    }
  }

  /**
   * Buscar decisões da reunião
   */
  async getMeetingDecisions(meetingId: string): Promise<MeetingDecision[]> {
    try {
      const { data, error } = await supabase
        .from('meeting_decisions')
        .select('*')
        .eq('meeting_id', meetingId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Erro ao buscar decisões:', error);
      throw error;
    }
  }

  /**
   * Buscar participantes da reunião
   */
  async getMeetingAttendees(meetingId: string): Promise<MeetingAttendee[]> {
    try {
      const { data, error } = await supabase
        .from('meeting_attendees')
        .select('*')
        .eq('meeting_id', meetingId)
        .order('name');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Erro ao buscar participantes:', error);
      throw error;
    }
  }

  /**
   * Buscar arquivos da reunião
   */
  async getMeetingFiles(meetingId: string) {
    try {
      const { data, error } = await supabase
        .from('meeting_files')
        .select('*')
        .eq('meeting_id', meetingId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Erro ao buscar arquivos:', error);
      throw error;
    }
  }

  /**
   * Buscar notas da reunião
   */
  async getMeetingNotes(meetingId: string) {
    try {
      const { data, error } = await supabase
        .from('meeting_notes')
        .select('*')
        .eq('meeting_id', meetingId)
        .order('timestamp_minutes');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Erro ao buscar notas:', error);
      throw error;
    }
  }

  /**
   * Buscar chat IA do projeto
   */
  async getProjectAIChats(projectId: string) {
    try {
      const { data, error } = await supabase
        .from('project_ai_chat')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Erro ao buscar chat IA:', error);
      throw error;
    }
  }

  /**
   * Iniciar transcrição em tempo real
   */
  async startRealtimeTranscription(meetingId: string) {
    // Mock implementation - substituir por integração real
    console.log('Iniciando transcrição em tempo real para:', meetingId);
    return { success: true, message: 'Transcrição iniciada' };
  }

  /**
   * Parar transcrição em tempo real
   */
  async stopRealtimeTranscription(meetingId: string) {
    // Mock implementation - substituir por integração real
    console.log('Parando transcrição em tempo real para:', meetingId);
    return { success: true, message: 'Transcrição finalizada' };
  }

  /**
   * Perguntar para IA do projeto
   */
  async askProjectAI(projectId: string, question: string) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      // Buscar contexto do projeto
      const { data: context, error: contextError } = await supabase
        .rpc('get_project_ai_context', { p_project_id: projectId });

      if (contextError) throw contextError;

      // Mock de resposta IA - substituir por integração real com OpenAI
      const mockResponse = `Com base nas reuniões e arquivos do projeto, posso responder: ${question}. Análise baseada em ${context?.meetings?.length || 0} reuniões e ${context?.files?.length || 0} arquivos.`;

      // Salvar chat
      const chatData = {
        project_id: projectId,
        user_id: user.id,
        message: question,
        response: mockResponse,
        context_type: 'general',
        model_used: 'gpt-4',
        tokens_used: 150,
        processing_time_ms: 1500
      };

      const { data, error } = await supabase
        .from('project_ai_chat')
        .insert(chatData)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Erro ao consultar IA:', error);
      throw error;
    }
  }

  /**
   * Upload de arquivo da reunião
   */
  async uploadMeetingFile(meetingId: string, projectId: string, file: File) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      // Upload para o bucket de projetos (mesmo bucket!)
      const fileName = `${user.id}/${projectId}/meetings/${meetingId}/${Date.now()}_${file.name}`;
      
      const { error: uploadError } = await supabase.storage
        .from('project-files')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('project-files')
        .getPublicUrl(fileName);

      // Salvar registro
      const fileData = {
        meeting_id: meetingId,
        project_id: projectId,
        user_id: user.id,
        file_name: file.name,
        file_url: publicUrl,
        file_size: file.size,
        file_type: file.type,
        mime_type: file.type,
        ai_analyzed: false
      };

      const { data, error } = await supabase
        .from('meeting_files')
        .insert(fileData)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Erro ao fazer upload:', error);
      throw error;
    }
  }

  /**
   * Adicionar nota na reunião
   */
  async addMeetingNote(meetingId: string, note: MeetingNoteInput) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const noteData = {
        meeting_id: meetingId,
        user_id: user.id,
        content: note.content,
  note_type: note.note_type || 'general',
  timestamp_minutes: note.timestamp_minutes ?? null,
  ai_enhanced: note.ai_enhanced ?? false
      };

      const { data, error } = await supabase
        .from('meeting_notes')
        .insert(noteData)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Erro ao adicionar nota:', error);
      throw error;
    }
  }

  /**
   * Atualizar nota da reunião
   */
  async updateMeetingNote(noteId: string, updates: {
    content?: string;
    note_type?: string;
    timestamp_minutes?: number | null;
    ai_enhanced?: boolean;
  }) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { data, error } = await supabase
        .from('meeting_notes')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', noteId)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Erro ao atualizar nota:', error);
      throw error;
    }
  }

  /**
   * Atualizar agenda
   */
  async updateMeetingAgenda(id: string, updates: Partial<MeetingAgenda>) {
    try {
      const { data, error } = await supabase
        .from('meeting_agendas')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Erro ao atualizar agenda:', error);
      throw error;
    }
  }

  /**
   * Atualizar checklist
   */
  async updateMeetingChecklist(id: string, updates: Partial<MeetingChecklist>) {
    try {
      const { data, error } = await supabase
        .from('meeting_checklists')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Erro ao atualizar checklist:', error);
      throw error;
    }
  }
}

export const meetingService = new MeetingService();
