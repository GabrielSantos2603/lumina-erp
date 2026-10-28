/**
 * Serviço para gerenciar análises de IA de reuniões no Supabase
 */

import { supabase } from "@/lib/supabase";

// 🚨 INTERFACE ATUALIZADA para dados completos de transcrição JSON
export interface TranscriptionData {
  meetingId: string;
  startTime: number;
  endTime?: number;
  duration: number;
  participants: Array<{
    name: string;
    role?: string;
    speakingTime: number;
  }>;
  segments: Array<{
    id: string;
    text: string;
    timestamp: number;
    confidence: number;
    speaker?: string;
    audioSource: 'microphone' | 'system' | 'meeting';
    meetingApp?: 'teams' | 'meet' | 'zoom' | 'whatsapp' | 'generic';
  }>;
  audioSources: {
    microphone: boolean;
    systemAudio: boolean;
    detectedApps: string[];
  };
  quality: {
    averageConfidence: number;
    totalWords: number;
    silenceTime: number;
  };
  metadata: {
    language: string;
    model: string;
    version: string;
    createdAt: string;
    lastUpdated: string;
  };
}

// Interfaces para análise de reunião
export interface MeetingAnalysis {
  summary: string;
  mood: 'positive' | 'neutral' | 'negative';
  duration: number;
  decisions: Array<{
    decision: string;
    responsible: string;
    priority: 'high' | 'medium' | 'low';
    timestamp?: number;
  }>;
  actionItems: Array<{
    action: string;
    responsible: string;
    priority: 'high' | 'medium' | 'low';
    timestamp?: number;
  }>;
  keyPoints: string[];
  concerns: string[];
  nextSteps: string[];
  transcriptionData?: TranscriptionData; // 🚨 NOVO: dados JSON completos
}

export interface AnalysisRecord {
  id: string;
  meeting_id: string;
  user_id: string;
  full_analysis: MeetingAnalysis;
  summary: string;
  mood: string;
  duration_minutes: number;
  total_segments: number;
  total_decisions: number;
  total_action_items: number;
  total_key_points: number;
  total_concerns: number;
  ai_model: string;
  confidence_score: number;
  processing_time_ms?: number;
  created_at: string;
  updated_at: string;
}

export interface DecisionRecord {
  id: string;
  meeting_id: string;
  analysis_id: string;
  decision: string;
  responsible: string;
  priority: 'high' | 'medium' | 'low';
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  timestamp_minutes?: number;
  due_date?: string;
  completed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface ActionItemRecord {
  id: string;
  meeting_id: string;
  analysis_id: string;
  action: string;
  responsible: string;
  priority: 'high' | 'medium' | 'low';
  completed: boolean;
  due_date?: string;
  completed_at?: string;
  notes?: string;
  timestamp_minutes?: number;
  created_at: string;
  updated_at: string;
}

export interface TranscriptionSegment {
  id: string;
  meeting_id: string;
  text_segment: string;
  timestamp_minutes: number;
  confidence: number;
  speaker?: string;
  ai_processed: boolean;
  ai_action_items?: any;
  ai_key_points?: any;
  created_at: string;
}

export class MeetingAnalysisService {
  /**
   * 🚨 NOVO: Salva dados completos de transcrição em JSON
   */
  async saveTranscriptionData(meetingId: string, transcriptionData: TranscriptionData): Promise<string> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      // Salvar dados JSON na tabela meeting_ai_analysis
      const analysisData = {
        meeting_id: meetingId,
        user_id: user.id,
        full_analysis: transcriptionData,
        summary: `Transcrição completa com ${transcriptionData.segments.length} segmentos`,
        mood: 'neutral' as const,
        duration_minutes: Math.floor(transcriptionData.duration / 60000),
        total_segments: transcriptionData.segments.length,
        total_decisions: 0,
        total_action_items: 0,
        total_key_points: transcriptionData.segments.length,
        total_concerns: 0,
        ai_model: transcriptionData.metadata.model,
        confidence_score: transcriptionData.quality.averageConfidence
      };

      const { data, error } = await supabase
        .from('meeting_ai_analysis')
        .insert(analysisData)
        .select()
        .single();

      if (error) throw error;

      console.log('✅ Dados de transcrição JSON salvos:', data);
      return data.id;
    } catch (error) {
      console.error('❌ Erro ao salvar dados de transcrição JSON:', error);
      throw error;
    }
  }

  /**
   * Salva um segmento de transcrição em tempo real
   */
  async saveTranscriptionSegment(
    meetingId: string,
    segment: {
      text: string;
      timestamp: number;
      confidence: number;
      speaker?: string;
    }
  ): Promise<TranscriptionSegment> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Usuário não autenticado");

    const { data, error } = await supabase
      .from("meeting_realtime_transcription")
      .insert({
        meeting_id: meetingId,
        user_id: user.id,
        text_segment: segment.text,
        timestamp_minutes: Math.floor(segment.timestamp / 60),
        confidence: segment.confidence,
        speaker: segment.speaker
      })
      .select()
      .single();

    if (error) {
      console.error("Erro ao salvar segmento:", error);
      throw error;
    }

    return data as TranscriptionSegment;
  }

  /**
   * Salva múltiplos segmentos de transcrição de uma vez
   */
  async saveBatchTranscriptionSegments(
    meetingId: string,
    segments: Array<{
      text: string;
      timestamp: number;
      confidence: number;
      speaker?: string;
    }>
  ): Promise<TranscriptionSegment[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Usuário não autenticado");

    const insertData = segments.map(segment => ({
      meeting_id: meetingId,
      user_id: user.id,
      text_segment: segment.text,
      timestamp_minutes: Math.floor(segment.timestamp / 60),
      confidence: segment.confidence,
      speaker: segment.speaker
    }));

    const { data, error } = await supabase
      .from("meeting_realtime_transcription")
      .insert(insertData)
      .select();

    if (error) {
      console.error("Erro ao salvar segmentos:", error);
      throw error;
    }

    return data as TranscriptionSegment[];
  }

  /**
   * Salva ata final da reunião
   */
  async saveFinalAta(
    meetingId: string,
    finalAta: {
      summary: string;
      decisions: any[];
      actionItems: any[];
      nextSteps: string[];
      transcription: string;
      duration: number;
      participants: string[];
    }
  ): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Usuário não autenticado");

    const { error } = await supabase
      .from("meetings")
      .update({
        ata_status: 'completed',
        ata_final_content: {
          ...finalAta,
          generated_at: new Date().toISOString(),
          generated_by: user.id
        },
        ata_generated_at: new Date().toISOString(),
        has_transcription: true
      })
      .eq("id", meetingId)
      .eq("user_id", user.id);

    if (error) {
      console.error("Erro ao salvar ata final:", error);
      throw error;
    }
  }

  /**
   * Busca análise de reunião
   */
  async getAnalysis(meetingId: string): Promise<AnalysisRecord | null> {
    const { data, error } = await supabase
      .from("meeting_ai_analysis")
      .select("*")
      .eq("meeting_id", meetingId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error("Erro ao buscar análise:", error);
      throw error;
    }

    return data as AnalysisRecord | null;
  }

  /**
   * Busca segmentos de transcrição
   */
  async getTranscriptionSegments(meetingId: string): Promise<TranscriptionSegment[]> {
    const { data, error } = await supabase
      .from("meeting_realtime_transcription")
      .select("*")
      .eq("meeting_id", meetingId)
      .order("timestamp_minutes", { ascending: true });

    if (error) {
      console.error("Erro ao buscar segmentos:", error);
      throw error;
    }

    return data as TranscriptionSegment[];
  }

  /**
   * Busca decisões de reunião
   */
  async getDecisions(meetingId: string): Promise<DecisionRecord[]> {
    const { data, error } = await supabase
      .from("meeting_decisions")
      .select("*")
      .eq("meeting_id", meetingId)
      .order("timestamp_minutes", { ascending: true });

    if (error) {
      console.error("Erro ao buscar decisões:", error);
      throw error;
    }

    return data as DecisionRecord[];
  }

  /**
   * Busca itens de ação
   */
  async getActionItems(meetingId: string): Promise<ActionItemRecord[]> {
    const { data, error } = await supabase
      .from("meeting_action_items")
      .select("*")
      .eq("meeting_id", meetingId)
      .order("timestamp_minutes", { ascending: true });

    if (error) {
      console.error("Erro ao buscar itens de ação:", error);
      throw error;
    }

    return data as ActionItemRecord[];
  }

  /**
   * Atualiza status de item de ação
   */
  async updateActionItemStatus(
    actionId: string,
    completed: boolean,
    notes?: string
  ): Promise<ActionItemRecord> {
    const updateData: any = {
      completed,
      updated_at: new Date().toISOString()
    };

    if (completed) {
      updateData.completed_at = new Date().toISOString();
    } else {
      updateData.completed_at = null;
    }

    if (notes) {
      updateData.notes = notes;
    }

    const { data, error } = await supabase
      .from("meeting_action_items")
      .update(updateData)
      .eq("id", actionId)
      .select()
      .single();

    if (error) {
      console.error("Erro ao atualizar item de ação:", error);
      throw error;
    }

    return data as ActionItemRecord;
  }

  /**
   * Atualiza status de decisão
   */
  async updateDecisionStatus(
    decisionId: string,
    status: 'pending' | 'in_progress' | 'completed' | 'cancelled'
  ): Promise<DecisionRecord> {
    const updateData: any = {
      status,
      updated_at: new Date().toISOString()
    };

    if (status === 'completed') {
      updateData.completed_at = new Date().toISOString();
    }

    const { data, error } = await supabase
      .from("meeting_decisions")
      .update(updateData)
      .eq("id", decisionId)
      .select()
      .single();

    if (error) {
      console.error("Erro ao atualizar decisão:", error);
      throw error;
    }

    return data as DecisionRecord;
  }

  /**
   * Busca estatísticas de análises do usuário
   */
  async getAnalyticsStats(): Promise<{
    total_meetings: number;
    analyzed_meetings: number;
    total_decisions: number;
    completed_decisions: number;
    total_action_items: number;
    completed_action_items: number;
    total_transcription_hours: number;
  }> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Usuário não autenticado");

    // Buscar estatísticas em paralelo
    const [meetingsData, analysisData, decisionsData, actionItemsData] = await Promise.all([
      supabase.from("meetings").select("id, actual_duration").eq("user_id", user.id),
      supabase.from("meeting_ai_analysis").select("id").eq("user_id", user.id),
      supabase.from("meeting_decisions").select("id, status").eq("user_id", user.id),
      supabase.from("meeting_action_items").select("id, completed").eq("user_id", user.id)
    ]);

    const totalMeetings = meetingsData.data?.length || 0;
    const analyzedMeetings = analysisData.data?.length || 0;
    const decisions = decisionsData.data || [];
    const actionItems = actionItemsData.data || [];

    const totalTranscriptionHours = meetingsData.data?.reduce(
      (acc, meeting) => acc + (meeting.actual_duration || 0), 0
    ) / 60 || 0;

    return {
      total_meetings: totalMeetings,
      analyzed_meetings: analyzedMeetings,
      total_decisions: decisions.length,
      completed_decisions: decisions.filter(d => d.status === 'completed').length,
      total_action_items: actionItems.length,
      completed_action_items: actionItems.filter(a => a.completed).length,
      total_transcription_hours: Math.round(totalTranscriptionHours * 10) / 10
    };
  }

  /**
   * Gera relatório de reunião em formato estruturado
   */
  async generateMeetingReport(meetingId: string): Promise<{
    meeting: any;
    analysis?: AnalysisRecord;
    decisions: DecisionRecord[];
    actionItems: ActionItemRecord[];
    transcriptionSegments: TranscriptionSegment[];
  }> {
    // Buscar todos os dados em paralelo
    const [meetingData, analysis, decisions, actionItems, segments] = await Promise.all([
      supabase.from("meetings").select("*").eq("id", meetingId).single(),
      this.getAnalysis(meetingId),
      this.getDecisions(meetingId),
      this.getActionItems(meetingId),
      this.getTranscriptionSegments(meetingId)
    ]);

    return {
      meeting: meetingData.data,
      analysis,
      decisions,
      actionItems,
      transcriptionSegments: segments
    };
  }

  /**
   * Exporta ata em formato texto
   */
  async exportAtaAsText(meetingId: string): Promise<string> {
    const report = await this.generateMeetingReport(meetingId);
    
    let text = `ATA DA REUNIÃO\n`;
    text += `=================\n\n`;
    
    if (report.meeting) {
      text += `Título: ${report.meeting.title}\n`;
      text += `Data: ${new Date(report.meeting.meeting_date).toLocaleDateString('pt-BR')}\n`;
      text += `Horário: ${report.meeting.start_time} - ${report.meeting.end_time || 'N/A'}\n`;
      text += `Local: ${report.meeting.location || 'Não informado'}\n\n`;
    }

    if (report.analysis) {
      text += `RESUMO\n------\n${report.analysis.summary}\n\n`;
      text += `HUMOR DA REUNIÃO: ${report.analysis.mood.toUpperCase()}\n\n`;
    }

    if (report.decisions.length > 0) {
      text += `DECISÕES TOMADAS\n----------------\n`;
      report.decisions.forEach((decision, index) => {
        text += `${index + 1}. ${decision.decision}\n`;
        text += `   Responsável: ${decision.responsible}\n`;
        text += `   Prioridade: ${decision.priority.toUpperCase()}\n`;
        text += `   Status: ${decision.status.toUpperCase()}\n\n`;
      });
    }

    if (report.actionItems.length > 0) {
      text += `ITENS DE AÇÃO\n-------------\n`;
      report.actionItems.forEach((item, index) => {
        text += `${index + 1}. ${item.action}\n`;
        text += `   Responsável: ${item.responsible}\n`;
        text += `   Prioridade: ${item.priority.toUpperCase()}\n`;
        text += `   Status: ${item.completed ? 'CONCLUÍDO' : 'PENDENTE'}\n`;
        if (item.due_date) text += `   Prazo: ${item.due_date}\n`;
        text += `\n`;
      });
    }

    text += `\nDocumento gerado automaticamente pelo Sistema Lumina AI ERP\n`;
    text += `Data de geração: ${new Date().toLocaleString('pt-BR')}\n`;

    return text;
  }
}

export const meetingAnalysisService = new MeetingAnalysisService();