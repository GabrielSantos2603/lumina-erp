export type MeetingType = 
  | 'briefing' 
  | 'budget' 
  | 'concept' 
  | 'presentation' 
  | 'revision' 
  | 'construction' 
  | 'delivery';

export type MeetingStatus = 'scheduled' | 'completed' | 'cancelled' | 'rescheduled';

export type ProjectPhase = 
  | 'initial' 
  | 'contract' 
  | 'design' 
  | 'execution' 
  | 'construction' 
  | 'delivery' 
  | 'finished';

export interface MeetingTypeConfig {
  type: MeetingType;
  name: string;
  icon: string;
  color: string;
  bgColor: string;
  description: string;
  phase: ProjectPhase;
  defaultDuration: number; // em minutos
  checklist: ChecklistItem[];
  requiredDocuments: string[];
  aiPrompt: string;
}

export interface ChecklistItem {
  id: string;
  text: string;
  required: boolean;
  category: string;
  description?: string;
}

export interface MeetingDecision {
  id: string;
  description: string;
  responsible: string;
  deadline?: string;
  status: 'pending' | 'completed' | 'overdue';
  priority: 'low' | 'medium' | 'high';
}

export interface MeetingAttendee {
  id: string;
  name: string;
  email: string;
  role: 'architect' | 'client' | 'engineer' | 'contractor' | 'supplier' | 'team';
  confirmed: boolean;
}

export interface ProjectTimeline {
  projectId: string;
  projectName: string;
  clientName: string;
  startDate: string;
  estimatedEndDate: string;
  currentPhase: ProjectPhase;
  meetings: TimelineMeeting[];
  progress: number; // 0-100
  totalMeetings: number;
  completedMeetings: number;
}

export interface TimelineMeeting {
  id: string;
  type: MeetingType;
  title: string;
  date: string;
  status: MeetingStatus;
  attendees: MeetingAttendee[];
  decisions: MeetingDecision[];
  documents: string[];
  hasRecording: boolean;
  hasTranscription: boolean;
  mood?: 'positive' | 'neutral' | 'negative';
  satisfactionScore?: number; // 1-5
}

export interface MeetingTemplate {
  type: MeetingType;
  agenda: AgendaItem[];
  checklist: ChecklistItem[];
  followUpTemplate: string;
  estimatedDuration: number;
}

export interface AgendaItem {
  id: string;
  title: string;
  duration: number;
  description: string;
  required: boolean;
  order: number;
}

export interface MeetingInsights {
  totalMeetings: number;
  averageDuration: number;
  conversionRate: number; // briefing -> contrato
  revisionRate: number; // quantas revisões por projeto
  clientSatisfaction: number;
  onTimeDelivery: number;
  mostCommonIssues: string[];
  peakMeetingDays: string[];
}

export interface SmartSuggestion {
  type: 'next_meeting' | 'follow_up' | 'document' | 'alert' | 'improvement';
  title: string;
  description: string;
  actionRequired: boolean;
  priority: 'low' | 'medium' | 'high';
  relatedMeetingId?: string;
}