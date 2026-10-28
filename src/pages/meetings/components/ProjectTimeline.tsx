import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Calendar,
  Clock,
  Users,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Plus,
  Eye,
  MessageSquare,
  Mic,
  TrendingUp,
  Filter
} from 'lucide-react';
import { cn } from '@/utils/cn';
import type { ProjectTimeline as ProjectTimelineType, TimelineMeeting, MeetingType, MeetingStatus } from '@/types/meetingTypes';
import { getMeetingTypeConfig } from '@/utils/meetingConfig';

interface ProjectTimelineProps {
  timeline: ProjectTimelineType;
  onMeetingClick?: (meeting: TimelineMeeting) => void;
  onNewMeetingClick?: (type: MeetingType) => void;
  className?: string;
}

export function ProjectTimeline({ timeline, onMeetingClick, onNewMeetingClick, className }: ProjectTimelineProps) {
  const [filterType, setFilterType] = useState<MeetingType | 'all'>('all');
  const [filterStatus, setFilterStatus] = useState<MeetingStatus | 'all'>('all');

  const filteredMeetings = timeline.meetings.filter(meeting => {
    if (filterType !== 'all' && meeting.type !== filterType) return false;
    if (filterStatus !== 'all' && meeting.status !== filterStatus) return false;
    return true;
  });

  const getStatusIcon = (status: MeetingStatus) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case 'scheduled':
        return <Clock className="h-4 w-4 text-blue-600" />;
      case 'cancelled':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'rescheduled':
        return <RotateCcw className="h-4 w-4 text-orange-600" />;
    }
  };

  const getStatusColor = (status: MeetingStatus) => {
    switch (status) {
      case 'completed':
        return 'text-green-600 bg-green-100 dark:bg-green-900/30';
      case 'scheduled':
        return 'text-blue-600 bg-blue-100 dark:bg-blue-900/30';
      case 'cancelled':
        return 'text-red-600 bg-red-100 dark:bg-red-900/30';
      case 'rescheduled':
        return 'text-orange-600 bg-orange-100 dark:bg-orange-900/30';
    }
  };

  const getMoodEmoji = (mood?: 'positive' | 'neutral' | 'negative') => {
    switch (mood) {
      case 'positive':
        return '😊';
      case 'neutral':
        return '😐';
      case 'negative':
        return '😞';
      default:
        return '';
    }
  };

  return (
    <div className={cn('space-y-6', className)}>
      {/* Cabeçalho do Projeto */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="space-y-1">
              <CardTitle className="text-xl sm:text-2xl flex items-center gap-2">
                📋 {timeline.projectName}
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Cliente: {timeline.clientName} • Início: {new Date(timeline.startDate).toLocaleDateString('pt-BR')}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="text-sm">
                {timeline.currentPhase}
              </Badge>
              <Button size="sm" className="gap-2">
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">Nova Reunião</span>
                <span className="sm:hidden">Nova</span>
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Progresso Visual */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="font-medium">Progresso do Projeto</span>
                <span className="text-muted-foreground">
                  {timeline.completedMeetings} de {timeline.totalMeetings} reuniões
                </span>
              </div>
              <Progress value={timeline.progress} className="h-3" />
              <p className="text-xs text-muted-foreground">
                {timeline.progress}% concluído • Previsão: {new Date(timeline.estimatedEndDate).toLocaleDateString('pt-BR')}
              </p>
            </div>

            {/* Stats Rápidas */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="text-center p-3 bg-muted/30 rounded-lg">
                <div className="text-lg font-bold text-blue-600">{timeline.meetings.filter(m => m.status === 'completed').length}</div>
                <div className="text-xs text-muted-foreground">Concluídas</div>
              </div>
              <div className="text-center p-3 bg-muted/30 rounded-lg">
                <div className="text-lg font-bold text-orange-600">{timeline.meetings.filter(m => m.status === 'scheduled').length}</div>
                <div className="text-xs text-muted-foreground">Agendadas</div>
              </div>
              <div className="text-center p-3 bg-muted/30 rounded-lg">
                <div className="text-lg font-bold text-green-600">{timeline.meetings.filter(m => m.decisions.length > 0).length}</div>
                <div className="text-xs text-muted-foreground">Com Decisões</div>
              </div>
              <div className="text-center p-3 bg-muted/30 rounded-lg">
                <div className="text-lg font-bold text-purple-600">{timeline.meetings.filter(m => m.hasRecording).length}</div>
                <div className="text-xs text-muted-foreground">Gravadas</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filtros */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Filtros:</span>
            </div>
            
            {/* Filtro por Tipo */}
            <select 
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as MeetingType | 'all')}
              className="text-sm border rounded-md px-2 py-1 bg-background"
              title="Filtrar por tipo de reunião"
              aria-label="Filtrar por tipo de reunião"
            >
              <option value="all">Todos os tipos</option>
              <option value="briefing">🪴 Briefing</option>
              <option value="budget">💰 Orçamento</option>
              <option value="concept">🎨 Conceito</option>
              <option value="presentation">🏗️ Apresentação</option>
              <option value="revision">🔁 Revisões</option>
              <option value="construction">🧱 Obra</option>
              <option value="delivery">🎁 Entrega</option>
            </select>

            {/* Filtro por Status */}
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as MeetingStatus | 'all')}
              className="text-sm border rounded-md px-2 py-1 bg-background"
              title="Filtrar por status da reunião"
              aria-label="Filtrar por status da reunião"
            >
              <option value="all">Todos status</option>
              <option value="completed">✅ Concluídas</option>
              <option value="scheduled">⏰ Agendadas</option>
              <option value="cancelled">❌ Canceladas</option>
              <option value="rescheduled">🔄 Reagendadas</option>
            </select>

            <div className="text-sm text-muted-foreground">
              {filteredMeetings.length} {filteredMeetings.length === 1 ? 'reunião' : 'reuniões'}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Timeline de Reuniões */}
      <div className="space-y-4">
        {filteredMeetings.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
              <p className="text-muted-foreground mb-4">
                {filterType === 'all' && filterStatus === 'all' 
                  ? 'Nenhuma reunião cadastrada ainda' 
                  : 'Nenhuma reunião encontrada com os filtros aplicados'
                }
              </p>
              <Button onClick={() => onNewMeetingClick?.('briefing')} className="gap-2">
                <Plus className="h-4 w-4" />
                Agendar Primeira Reunião
              </Button>
            </CardContent>
          </Card>
        ) : (
          filteredMeetings
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
            .map((meeting, index) => {
              const config = getMeetingTypeConfig(meeting.type);
              const isLast = index === filteredMeetings.length - 1;

              return (
                <div key={meeting.id} className="relative">
                  {/* Linha da Timeline */}
                  {!isLast && (
                    <div className="absolute left-8 top-20 bottom-0 w-0.5 bg-border" />
                  )}

                  <Card className="relative ml-0 hover:shadow-md transition-shadow cursor-pointer" 
                        onClick={() => onMeetingClick?.(meeting)}>
                    <CardContent className="p-4 sm:p-6">
                      <div className="flex gap-4">
                        {/* Ícone do Tipo */}
                        <div className={cn(
                          "flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold z-10",
                          config.bgColor
                        )}>
                          {config.icon}
                        </div>

                        {/* Conteúdo */}
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 sm:gap-4">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-semibold text-base truncate">
                                  {meeting.title}
                                </h3>
                                <Badge className={getStatusColor(meeting.status)}>
                                  {getStatusIcon(meeting.status)}
                                  <span className="ml-1 text-xs">{meeting.status}</span>
                                </Badge>
                                {meeting.mood && (
                                  <span className="text-lg" title={`Cliente: ${meeting.mood}`}>
                                    {getMoodEmoji(meeting.mood)}
                                  </span>
                                )}
                              </div>

                              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-3">
                                <div className="flex items-center gap-1">
                                  <Calendar className="h-4 w-4" />
                                  {new Date(meeting.date).toLocaleDateString('pt-BR')}
                                </div>
                                <div className="flex items-center gap-1">
                                  <Users className="h-4 w-4" />
                                  {meeting.attendees.length} participantes
                                </div>
                                {meeting.decisions.length > 0 && (
                                  <div className="flex items-center gap-1">
                                    <CheckCircle2 className="h-4 w-4" />
                                    {meeting.decisions.length} decisões
                                  </div>
                                )}
                                {meeting.hasRecording && (
                                  <div className="flex items-center gap-1">
                                    <Mic className="h-4 w-4" />
                                    Gravação
                                  </div>
                                )}
                              </div>

                              {/* Decisões Principais */}
                              {meeting.decisions.length > 0 && (
                                <div className="space-y-1 mb-3">
                                  <p className="text-xs font-medium text-muted-foreground">
                                    Principais decisões:
                                  </p>
                                  {meeting.decisions.slice(0, 2).map((decision) => (
                                    <div key={decision.id} className="flex items-center gap-2">
                                      <div className={cn(
                                        "w-2 h-2 rounded-full flex-shrink-0",
                                        decision.status === 'completed' ? 'bg-green-500' :
                                        decision.status === 'overdue' ? 'bg-red-500' : 'bg-orange-500'
                                      )} />
                                      <span className="text-xs text-muted-foreground truncate">
                                        {decision.description}
                                      </span>
                                    </div>
                                  ))}
                                  {meeting.decisions.length > 2 && (
                                    <p className="text-xs text-muted-foreground">
                                      +{meeting.decisions.length - 2} outras decisões
                                    </p>
                                  )}
                                </div>
                              )}
                            </div>

                            {/* Ações */}
                            <div className="flex items-center gap-2 flex-shrink-0">
                              {meeting.satisfactionScore && (
                                <Badge variant="outline" className="gap-1">
                                  <TrendingUp className="h-3 w-3" />
                                  {meeting.satisfactionScore}/5
                                </Badge>
                              )}
                              <Button size="sm" variant="ghost" className="gap-1">
                                <Eye className="h-3 w-3" />
                                <span className="hidden sm:inline">Ver</span>
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              );
            })
        )}
      </div>

      {/* Sugestões de Próxima Reunião */}
      {timeline.meetings.length > 0 && (
        <Card className="border-dashed">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="inline-flex items-center gap-2 text-sm text-muted-foreground mb-3">
                <MessageSquare className="h-4 w-4" />
                Sugestão da IA
              </div>
              <p className="text-sm mb-4">
                Com base no progresso atual, recomendamos agendar uma <strong>Reunião de Acompanhamento de Obra</strong> para a próxima semana.
              </p>
              <Button variant="outline" size="sm" className="gap-2">
                <Plus className="h-4 w-4" />
                Agendar Sugerida
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}