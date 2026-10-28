/**
 * Serviço para salvar e gerenciar transcrições e resumos no Supabase
 */

import { supabase } from "@/lib/supabase";
import type { MeetingSummary } from "@/types";

export interface TranscriptRecord {
  id: string;
  meeting_id: string;
  transcript: string;
  duration?: number;
  word_count?: number;
  language?: string;
  created_at: string;
  updated_at: string;
  user_id: string;
}

export interface SummaryRecord {
  id: string;
  transcript_id: string;
  meeting_id: string;
  overview: string;
  key_points: string[];
  decisions: string[];
  next_steps: string[];
  speakers: any[];
  action_items: any[];
  commitments: any[];
  ai_provider?: string;
  ai_model?: string;
  processing_time?: number;
  created_at: string;
  updated_at: string;
}

export interface TranscriptWithSummary extends TranscriptRecord {
  summary?: SummaryRecord;
}

export class MeetingTranscriptService {
  /**
   * Salva uma transcrição no Supabase
   */
  async saveTranscript(
    meetingId: string,
    transcript: string,
    userId: string,
    options?: {
      duration?: number;
      language?: string;
    }
  ): Promise<TranscriptRecord> {
    const wordCount = transcript.split(/\s+/).length;

    const { data, error } = await supabase
      .from("meeting_transcripts")
      .insert({
        meeting_id: meetingId,
        transcript,
        word_count: wordCount,
        duration: options?.duration,
        language: options?.language ?? "pt-BR",
        user_id: userId,
      })
      .select()
      .single();

    if (error) {
      console.error("Erro ao salvar transcrição:", error);
      throw error;
    }

    return data as TranscriptRecord;
  }

  /**
   * Salva um resumo gerado por IA
   */
  async saveSummary(
    transcriptId: string,
    meetingId: string,
    summary: MeetingSummary,
    metadata?: {
      ai_provider?: string;
      ai_model?: string;
      processing_time?: number;
    }
  ): Promise<SummaryRecord> {
    const { data, error } = await supabase
      .from("meeting_summaries")
      .insert({
        transcript_id: transcriptId,
        meeting_id: meetingId,
        overview: summary.overview,
        key_points: summary.keyPoints,
        decisions: summary.decisions,
        next_steps: summary.nextSteps,
        speakers: summary.speakers,
        action_items: summary.actionItems,
        commitments: summary.commitments,
        ai_provider: metadata?.ai_provider,
        ai_model: metadata?.ai_model,
        processing_time: metadata?.processing_time,
      })
      .select()
      .single();

    if (error) {
      console.error("Erro ao salvar resumo:", error);
      throw error;
    }

    return data as SummaryRecord;
  }

  /**
   * Salva transcrição e resumo juntos
   */
  async saveTranscriptAndSummary(
    meetingId: string,
    transcript: string,
    summary: MeetingSummary,
    userId: string,
    options?: {
      duration?: number;
      language?: string;
      ai_provider?: string;
      ai_model?: string;
      processing_time?: number;
    }
  ): Promise<{ transcript: TranscriptRecord; summary: SummaryRecord }> {
    // Salvar transcrição
    const transcriptRecord = await this.saveTranscript(
      meetingId,
      transcript,
      userId,
      {
        duration: options?.duration,
        language: options?.language,
      }
    );

    // Salvar resumo
    const summaryRecord = await this.saveSummary(
      transcriptRecord.id,
      meetingId,
      summary,
      {
        ai_provider: options?.ai_provider,
        ai_model: options?.ai_model,
        processing_time: options?.processing_time,
      }
    );

    return { transcript: transcriptRecord, summary: summaryRecord };
  }

  /**
   * Busca transcrições de uma reunião
   */
  async getTranscripts(meetingId: string): Promise<TranscriptWithSummary[]> {
    const { data, error } = await supabase
      .from("meeting_transcripts")
      .select(
        `
        *,
        summary:meeting_summaries(*)
      `
      )
      .eq("meeting_id", meetingId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Erro ao buscar transcrições:", error);
      throw error;
    }

    return (data as any[]).map((item) => ({
      ...item,
      summary: item.summary?.[0] || null,
    }));
  }

  /**
   * Busca uma transcrição específica com resumo
   */
  async getTranscriptById(
    transcriptId: string
  ): Promise<TranscriptWithSummary | null> {
    const { data, error } = await supabase
      .from("meeting_transcripts")
      .select(
        `
        *,
        summary:meeting_summaries(*)
      `
      )
      .eq("id", transcriptId)
      .single();

    if (error) {
      console.error("Erro ao buscar transcrição:", error);
      return null;
    }

    return {
      ...data,
      summary: (data as any).summary?.[0] || null,
    };
  }

  /**
   * Atualiza uma transcrição
   */
  async updateTranscript(
    transcriptId: string,
    updates: Partial<Pick<TranscriptRecord, "transcript" | "duration">>
  ): Promise<TranscriptRecord> {
    const updateData: any = { ...updates };

    // Recalcular word_count se transcript foi atualizado
    if (updates.transcript) {
      updateData.word_count = updates.transcript.split(/\s+/).length;
    }

    const { data, error } = await supabase
      .from("meeting_transcripts")
      .update(updateData)
      .eq("id", transcriptId)
      .select()
      .single();

    if (error) {
      console.error("Erro ao atualizar transcrição:", error);
      throw error;
    }

    return data as TranscriptRecord;
  }

  /**
   * Atualiza um resumo
   */
  async updateSummary(
    summaryId: string,
    summary: Partial<MeetingSummary>
  ): Promise<SummaryRecord> {
    const updateData: any = {};

    if (summary.overview) updateData.overview = summary.overview;
    if (summary.keyPoints) updateData.key_points = summary.keyPoints;
    if (summary.decisions) updateData.decisions = summary.decisions;
    if (summary.nextSteps) updateData.next_steps = summary.nextSteps;
    if (summary.speakers) updateData.speakers = summary.speakers;
    if (summary.actionItems) updateData.action_items = summary.actionItems;
    if (summary.commitments) updateData.commitments = summary.commitments;

    const { data, error } = await supabase
      .from("meeting_summaries")
      .update(updateData)
      .eq("id", summaryId)
      .select()
      .single();

    if (error) {
      console.error("Erro ao atualizar resumo:", error);
      throw error;
    }

    return data as SummaryRecord;
  }

  /**
   * Deleta uma transcrição (e seu resumo automaticamente via CASCADE)
   */
  async deleteTranscript(transcriptId: string): Promise<void> {
    const { error } = await supabase
      .from("meeting_transcripts")
      .delete()
      .eq("id", transcriptId);

    if (error) {
      console.error("Erro ao deletar transcrição:", error);
      throw error;
    }
  }

  /**
   * Obtém estatísticas de uma reunião
   */
  async getStats(meetingId: string): Promise<{
    total_transcripts: number;
    total_words: number;
    total_duration: number;
    has_summary: boolean;
  }> {
    const { data, error } = await supabase.rpc("get_transcript_stats", {
      p_meeting_id: meetingId,
    });

    if (error) {
      console.error("Erro ao buscar estatísticas:", error);
      return {
        total_transcripts: 0,
        total_words: 0,
        total_duration: 0,
        has_summary: false,
      };
    }

    return data[0];
  }

  /**
   * Marca uma action item como concluída
   */
  async toggleActionItem(
    summaryId: string,
    actionItemIndex: number,
    completed: boolean
  ): Promise<void> {
    // Buscar resumo atual
    const { data: summary, error: fetchError } = await supabase
      .from("meeting_summaries")
      .select("action_items")
      .eq("id", summaryId)
      .single();

    if (fetchError) throw fetchError;

    const actionItems = summary.action_items || [];
    if (actionItems[actionItemIndex]) {
      actionItems[actionItemIndex].completed = completed;
    }

    const { error: updateError } = await supabase
      .from("meeting_summaries")
      .update({ action_items: actionItems })
      .eq("id", summaryId);

    if (updateError) throw updateError;
  }
}

export const meetingTranscriptService = new MeetingTranscriptService();

