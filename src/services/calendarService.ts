import { supabase } from "@/lib/supabase";

export type EventType = "meeting" | "delivery" | "milestone" | "deadline" | "reminder" | "other";
export type EventStatus = "scheduled" | "completed" | "cancelled" | "rescheduled";

export interface CalendarEvent {
  id: string;
  user_id: string;
  project_id?: string;
  task_id?: string;
  title: string;
  description?: string;
  location?: string;
  event_type: EventType;
  start_time: string;
  end_time?: string;
  all_day: boolean;
  recurring: boolean;
  recurrence_rule?: string;
  participants?: string[];
  status: EventStatus;
  reminder_minutes?: number[];
  color?: string;
  meeting_url?: string;
  attachments?: any;
  created_at: string;
  updated_at: string;
}

export interface CalendarEventInsert extends Omit<CalendarEvent, 'id' | 'created_at' | 'updated_at'> {}

export interface CalendarEventFull extends CalendarEvent {
  project_name?: string;
  creator_name?: string;
  task_title?: string;
  time_status?: 'past' | 'upcoming' | 'future';
}

class CalendarService {
  /**
   * Criar novo evento
   */
  async createEvent(data: Partial<CalendarEventInsert>) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Usuário não autenticado");

    const event: CalendarEventInsert = {
      user_id: user.id,
      title: data.title || "",
      event_type: data.event_type || "other",
      start_time: data.start_time || new Date().toISOString(),
      all_day: data.all_day || false,
      recurring: data.recurring || false,
      status: data.status || "scheduled",
      color: data.color || "#3b82f6",
      ...data,
    };

    const { data: newEvent, error } = await supabase
      .from("calendar_events")
      .insert(event)
      .select()
      .single();

    if (error) throw error;
    return newEvent as CalendarEvent;
  }

  /**
   * Obter eventos do calendário
   */
  async getEvents(filters?: {
    start_date?: string;
    end_date?: string;
    project_id?: string;
    event_type?: EventType;
    status?: EventStatus;
  }) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Usuário não autenticado");

    let query = supabase
      .from("calendar_events")
      .select("*")
      .or(`user_id.eq.${user.id},participants.cs.{${user.id}}`)
      .order("start_time", { ascending: true });

    if (filters?.start_date) {
      query = query.gte("start_time", filters.start_date);
    }

    if (filters?.end_date) {
      query = query.lte("start_time", filters.end_date);
    }

    if (filters?.project_id) {
      query = query.eq("project_id", filters.project_id);
    }

    if (filters?.event_type) {
      query = query.eq("event_type", filters.event_type);
    }

    if (filters?.status) {
      query = query.eq("status", filters.status);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data as CalendarEvent[];
  }

  /**
   * Obter eventos com detalhes completos
   */
  async getEventsWithDetails(filters?: {
    start_date?: string;
    end_date?: string;
    project_id?: string;
  }) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Usuário não autenticado");

    let query = supabase
      .from("calendar_events_full")
      .select("*")
      .or(`user_id.eq.${user.id},participants.cs.{${user.id}}`);

    if (filters?.start_date) {
      query = query.gte("start_time", filters.start_date);
    }

    if (filters?.end_date) {
      query = query.lte("start_time", filters.end_date);
    }

    if (filters?.project_id) {
      query = query.eq("project_id", filters.project_id);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data as CalendarEventFull[];
  }

  /**
   * Obter evento por ID
   */
  async getEventById(id: string) {
    const { data, error } = await supabase
      .from("calendar_events")
      .select("*")
      .eq("id", id)
      .single();

    if (error) throw error;
    return data as CalendarEvent;
  }

  /**
   * Atualizar evento
   */
  async updateEvent(id: string, updates: Partial<CalendarEventInsert>) {
    const { data, error } = await supabase
      .from("calendar_events")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return data as CalendarEvent;
  }

  /**
   * Deletar evento
   */
  async deleteEvent(id: string) {
    const { error } = await supabase
      .from("calendar_events")
      .delete()
      .eq("id", id);

    if (error) throw error;
  }

  /**
   * Completar evento
   */
  async completeEvent(id: string) {
    const { data, error } = await supabase
      .from("calendar_events")
      .update({ status: "completed" })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return data as CalendarEvent;
  }

  /**
   * Cancelar evento
   */
  async cancelEvent(id: string) {
    const { data, error } = await supabase
      .from("calendar_events")
      .update({ status: "cancelled" })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return data as CalendarEvent;
  }

  /**
   * Obter eventos do dia
   */
  async getTodayEvents() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return this.getEvents({
      start_date: today.toISOString(),
      end_date: tomorrow.toISOString(),
      status: "scheduled",
    });
  }

  /**
   * Obter próximos eventos
   */
  async getUpcomingEvents(days: number = 7) {
    const start = new Date();
    const end = new Date();
    end.setDate(end.getDate() + days);

    return this.getEvents({
      start_date: start.toISOString(),
      end_date: end.toISOString(),
      status: "scheduled",
    });
  }

  /**
   * Adicionar participantes ao evento
   */
  async addParticipants(eventId: string, participantIds: string[]) {
    const event = await this.getEventById(eventId);
    const currentParticipants = event.participants || [];
    const updatedParticipants = [...new Set([...currentParticipants, ...participantIds])];

    return this.updateEvent(eventId, { participants: updatedParticipants });
  }

  /**
   * Remover participante do evento
   */
  async removeParticipant(eventId: string, participantId: string) {
    const event = await this.getEventById(eventId);
    const currentParticipants = event.participants || [];
    const updatedParticipants = currentParticipants.filter(id => id !== participantId);

    return this.updateEvent(eventId, { participants: updatedParticipants });
  }
}

export const calendarService = new CalendarService();

