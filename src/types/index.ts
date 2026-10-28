import type { Database } from "./database.types";

// Extract types from database
export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type Client = Database["public"]["Tables"]["clients"]["Row"];
export type Project = Database["public"]["Tables"]["projects"]["Row"];
export type Event = Database["public"]["Tables"]["events"]["Row"];
export type Transaction = Database["public"]["Tables"]["transactions"]["Row"];

// Insert types
export type ProfileInsert = Database["public"]["Tables"]["profiles"]["Insert"];
export type ClientInsert = Database["public"]["Tables"]["clients"]["Insert"];
export type ProjectInsert = Database["public"]["Tables"]["projects"]["Insert"];
export type EventInsert = Database["public"]["Tables"]["events"]["Insert"];
export type TransactionInsert =
  Database["public"]["Tables"]["transactions"]["Insert"];

// Update types
export type ProfileUpdate = Database["public"]["Tables"]["profiles"]["Update"];
export type ClientUpdate = Database["public"]["Tables"]["clients"]["Update"];
export type ProjectUpdate = Database["public"]["Tables"]["projects"]["Update"];
export type EventUpdate = Database["public"]["Tables"]["events"]["Update"];
export type TransactionUpdate =
  Database["public"]["Tables"]["transactions"]["Update"];

// Enum types
export type UserRole = Database["public"]["Enums"]["user_role"];
export type ProjectStatus = Database["public"]["Enums"]["project_status"];
export type EventType = Database["public"]["Enums"]["event_type"];

// Extended types with relations
export interface ClientWithProjects extends Client {
  projects?: Project[];
}

export interface ProjectWithClient extends Project {
  client?: Client;
  transactions?: Transaction[];
}

export interface EventWithRelations extends Event {
  client?: Client;
  project?: Project;
}

// Dashboard metrics
export interface DashboardMetrics {
  totalClients: number;
  activeProjects: number;
  monthlyRevenue: number;
  pendingTasks: number;
  recentClients: Client[];
  recentProjects: Project[];
  monthlyTransactions: Transaction[];
}

// Auth types
export interface AuthUser {
  id: string;
  email: string;
}

export interface AuthState {
  user: AuthUser | null;
  profile: Profile | null;
  loading: boolean;
}

// Recording types
export interface Recording {
  id: string;
  title: string;
  description?: string;
  type: "screen" | "camera" | "screen_camera";
  duration: number; // em segundos
  fileUrl: string;
  thumbnailUrl?: string;
  size: number; // em bytes
  created_at: string;
  updated_at: string;
  user_id: string;
  meeting_id?: string;
  project_id?: string;
  client_id?: string;
  is_public: boolean;
  views: number;
  transcription?: string;
  tags?: string[];
}

export type RecordingInsert = Omit<Recording, "id" | "created_at" | "updated_at" | "views">;
export type RecordingUpdate = Partial<RecordingInsert>;

export interface RecordingOptions {
  type: "screen" | "camera" | "screen_camera";
  audio?: boolean;
  video?: boolean;
}

export interface RecordingMetadata {
  title: string;
  description?: string;
  type: RecordingOptions["type"];
  duration: number;
  meeting_id?: string;
  project_id?: string;
  client_id?: string;
}

// Transcription Service types
export interface TranscriptionSegment {
  id: string;
  text: string;
  speaker?: string;
  timestamp: number;
  isFinal: boolean;
}

export interface TranscriptionOptions {
  language?: string;
  continuous?: boolean;
  interimResults?: boolean;
  maxAlternatives?: number;
}

// Meeting Transcription and AI Summary types
export interface MeetingTranscript {
  id: string;
  meeting_id: string;
  transcript: string;
  summary?: MeetingSummary;
  created_at: string;
  updated_at: string;
}

export interface MeetingSummary {
  overview: string;
  speakers: SpeakerContribution[];
  keyPoints: string[];
  actionItems: ActionItem[];
  commitments: Commitment[];
  decisions: string[];
  nextSteps: string[];
}

export interface SpeakerContribution {
  speaker: string;
  summary: string;
  keyPoints: string[];
}

export interface ActionItem {
  task: string;
  assignedTo?: string;
  dueDate?: string;
  priority?: "high" | "medium" | "low";
  completed?: boolean;
}

export interface Commitment {
  commitment: string;
  person: string;
  deadline?: string;
}


