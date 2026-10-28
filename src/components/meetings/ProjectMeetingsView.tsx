import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  ArrowLeft, 
  Plus, 
  Calendar, 
  Clock, 
  Users, 
  FileText, 
  BarChart3,
  Video,
  MessageCircle,
  Search,
  X,
  LayoutGrid,
  List
} from 'lucide-react';
import { SmartMeetingHub } from './SmartMeetingHub';
import { CreateMeetingModal } from './CreateMeetingModal';
import type { Project } from './ProjectSelector';
import { meetingService, type MeetingComplete } from '@/services/meetingService';

interface ProjectMeetingsViewProps {
  project: Project;
  onBack: () => void;
}

export function ProjectMeetingsView({ project, onBack }: ProjectMeetingsViewProps) {
  const [meetings, setMeetings] = useState<MeetingComplete[]>([]);
  const [selectedMeeting, setSelectedMeeting] = useState<MeetingComplete | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'list' | 'timeline' | 'hub'>('list');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [displayMode, setDisplayMode] = useState<'grid' | 'list'>('list');

  const meetingTypeLabels = {
    briefing: { label: '🪴 Briefing', color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300' },
    budget: { label: '💰 Orçamento', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' },
    concept: { label: '💡 Conceitual', color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300' },
    presentation: { label: '📋 Apresentação', color: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300' },
    revision: { label: '🔄 Revisão', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300' },
    construction: { label: '🏗️ Execução', color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' },
    delivery: { label: '🎁 Entrega', color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' }
  };

  const statusLabels = {
    scheduled: { label: 'Agendada', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' },
    in_progress: { label: 'Em Andamento', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300' },
    completed: { label: 'Concluída', color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' },
    cancelled: { label: 'Cancelada', color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' }
  };

  // Labels para filtros
  const statusFilterLabels = {
    all: 'Todos os Status',
    scheduled: 'Agendadas',
    in_progress: 'Em Andamento', 
    completed: 'Concluídas',
    cancelled: 'Canceladas'
  };

  const typeFilterLabels = {
    all: 'Todos os Tipos',
    briefing: 'Briefing',
    budget: 'Orçamento',
    concept: 'Conceitual',
    presentation: 'Apresentação',
    revision: 'Revisão',
    construction: 'Execução',
    delivery: 'Entrega'
  };

  useEffect(() => {
    loadMeetings();
  }, [project.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadMeetings = async () => {
    try {
      setLoading(true);
      
      // Carregar reuniões reais usando o serviço existente
      const realMeetings = await meetingService.getMeetingsByProject(project.id);
      
      if (realMeetings && realMeetings.length > 0) {
        setMeetings(realMeetings);
        return;
      }
      
      // Fallback para dados mock se não houver reuniões
      const mockMeetings: MeetingComplete[] = [
        {
          id: '1',
          title: 'Briefing Inicial - Levantamento de Necessidades',
          meeting_date: '2024-01-15T10:00:00Z',
          meeting_type: 'briefing',
          phase: 'initial',
          status: 'completed',
          description: 'Primeira reunião para entender as necessidades do cliente',
          estimated_duration: 60,
          actual_duration: 75,
          has_recording: true,
          has_transcription: true,
          mood: 'positive',
          project_id: project.id,
          user_id: '',
          start_time: '10:00:00',
          created_at: '2024-01-10T10:00:00Z',
          updated_at: '2024-01-15T14:30:00Z'
        },
        {
          id: '2',
          title: 'Apresentação Orçamento Preliminar',
          meeting_date: '2024-01-25T14:00:00Z',
          meeting_type: 'budget',
          phase: 'contract',
          status: 'completed',
          description: 'Apresentação dos custos estimados e cronograma',
          estimated_duration: 45,
          actual_duration: 60,
          has_recording: false,
          has_transcription: false,
          mood: 'neutral',
          project_id: project.id,
          user_id: '',
          start_time: '14:00:00',
          created_at: '2024-01-20T10:00:00Z',
          updated_at: '2024-01-25T16:00:00Z'
        },
        {
          id: '3',
          title: 'Apresentação Conceitual do Projeto',
          meeting_date: '2024-02-05T16:00:00Z',
          meeting_type: 'concept',
          phase: 'design',
          status: 'scheduled',
          description: 'Apresentação dos primeiros estudos conceituais',
          estimated_duration: 90,
          project_id: project.id,
          user_id: '',
          start_time: '16:00:00',
          created_at: '2024-02-01T10:00:00Z',
          updated_at: '2024-02-01T10:00:00Z'
        }
      ];
      
      setMeetings(mockMeetings);
    } catch (error) {
      console.error('Erro ao carregar reuniões:', error);
      setMeetings([]); // Array vazio em caso de erro
    } finally {
      setLoading(false);
    }
  };

  const filteredMeetings = meetings.filter(meeting => {
    const matchesSearch = !searchTerm || 
      meeting.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      meeting.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || meeting.status === filterStatus;
    const matchesType = filterType === 'all' || meeting.meeting_type === filterType;
    
    return matchesSearch && matchesStatus && matchesType;
  });

  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(dateString));
  };

  // Se uma reunião específica foi selecionada, mostrar o Hub
  if (selectedMeeting) {
    return (
      <SmartMeetingHub 
        project={{
          ...project,
          client_name: project.client_name || 'Não informado'
        }}
        currentMeeting={{
          ...selectedMeeting,
          meeting_type: selectedMeeting.meeting_type || 'briefing',
          notes_total: 0,
          files_total: 0,
          decisions_total: 0,
          has_ai_analysis: selectedMeeting.has_transcription || false
        }}
        onMeetingSelect={(meeting) => setSelectedMeeting(meeting as unknown as MeetingComplete)}
        onCreateMeeting={() => setShowCreateModal(true)}
        onBack={() => setSelectedMeeting(null)}
      />
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-8 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600 dark:text-gray-400">Carregando reuniões...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6 max-w-7xl mx-auto">
      {/* Header com navegação */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <Button
            variant="ghost" 
            size="sm"
            onClick={onBack}
            className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Voltar aos Projetos
          </Button>
        </div>
        
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-1">
              {project.name}
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              {project.description} • Cliente: {project.client_name || 'Não informado'}
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Seletor de visualização */}
            <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
                className="px-3 py-1"
              >
                <FileText className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'timeline' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('timeline')}
                className="px-3 py-1"
              >
                <BarChart3 className="h-4 w-4" />
              </Button>
            </div>
            
            <Button onClick={() => setShowCreateModal(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Nova Reunião
            </Button>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <Card className="bg-background mb-6">
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row lg:items-center gap-4">
            {/* Busca */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Buscar reuniões..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-10"
              />
              {searchTerm && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0 hover:bg-gray-100 dark:hover:bg-gray-800"
                  onClick={() => setSearchTerm('')}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>

            {/* Filtro Status */}
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-full lg:w-48">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(statusFilterLabels).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Filtro Tipo */}
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-full lg:w-48">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(typeFilterLabels).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Toggle Visualização */}
            <div className="flex items-center bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
              <Button
                variant={displayMode === 'grid' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setDisplayMode('grid')}
                className="h-8 w-8 p-0"
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
              <Button
                variant={displayMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setDisplayMode('list')}
                className="h-8 w-8 p-0"
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Contador de resultados */}
          {(searchTerm || filterStatus !== 'all' || filterType !== 'all') && (
            <div className="mt-3 text-sm text-gray-600 dark:text-gray-400">
              {filteredMeetings.length} reunião(ões) encontrada(s)
              {(searchTerm || filterStatus !== 'all' || filterType !== 'all') && (
                <Button
                  variant="link"
                  size="sm"
                  onClick={() => {
                    setSearchTerm('');
                    setFilterStatus('all');
                    setFilterType('all');
                  }}
                  className="ml-2 h-auto p-0 text-blue-600 dark:text-blue-400"
                >
                  Limpar filtros
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Lista de Reuniões */}
      <div className={`grid gap-4 ${displayMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3' : 'grid-cols-1'}`}>
        {filteredMeetings.map((meeting) => (
          <Card 
            key={meeting.id}
            className={`cursor-pointer hover:shadow-lg transition-all duration-200 border-l-4 border-l-blue-500 ${
              displayMode === 'list' ? 'flex flex-row items-center p-4' : ''
            }`}
            onClick={() => setSelectedMeeting(meeting)}
          >
            <CardHeader className={`${displayMode === 'list' ? 'flex-1 pb-0 py-0' : 'pb-3'}`}>
              <div className={`flex items-start justify-between ${displayMode === 'list' ? 'items-center' : ''}`}>
                <div className="flex-1">
                  <div className={`flex items-center gap-2 ${displayMode === 'list' ? 'mb-0' : 'mb-2'}`}>
                    <Badge className={meetingTypeLabels[meeting.meeting_type || 'briefing'].color}>
                      {meetingTypeLabels[meeting.meeting_type || 'briefing'].label}
                    </Badge>
                    {displayMode === 'grid' && (
                      <>
                        <Badge className={statusLabels[meeting.status].color}>
                          {statusLabels[meeting.status].label}
                        </Badge>
                        {meeting.mood && (
                          <Badge variant="outline">
                            {meeting.mood === 'positive' ? '😊' : meeting.mood === 'negative' ? '😔' : '😐'}
                          </Badge>
                        )}
                      </>
                    )}
                  </div>
                  
                  <CardTitle className={`${displayMode === 'list' ? 'text-base mb-0' : 'text-lg mb-1'} font-semibold text-gray-900 dark:text-gray-100`}>
                    {meeting.title}
                  </CardTitle>
                  
                  {meeting.description && displayMode === 'grid' && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      {meeting.description}
                    </p>
                  )}
                </div>

                {displayMode === 'list' && (
                  <div className="flex items-center gap-3">
                    <Badge className={statusLabels[meeting.status].color}>
                      {statusLabels[meeting.status].label}
                    </Badge>
                    <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                      <Calendar className="h-4 w-4" />
                      {formatDate(meeting.meeting_date)}
                    </div>
                  </div>
                )}
                
                <div className="flex flex-col items-end gap-2">
                  <div className="flex items-center gap-1">
                    {meeting.has_recording && (
                      <Video className="h-4 w-4 text-blue-600" />
                    )}
                    {meeting.has_transcription && (
                      <MessageCircle className="h-4 w-4 text-green-600" />
                    )}
                  </div>
                </div>
              </div>
            </CardHeader>

            {displayMode === 'grid' && (
              <CardContent className="pt-0">
                <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    <span>{formatDate(meeting.meeting_date)}</span>
                  </div>
                  
                  {meeting.participants && (
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      <span>{meeting.participants.length} participantes</span>
                    </div>
                  )}
                  
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    <span>
                      {meeting.actual_duration 
                        ? `${meeting.actual_duration}min` 
                        : `~${meeting.estimated_duration || 60}min`
                      }
                    </span>
                  </div>
                </div>
              </CardContent>
            )}
          </Card>
        ))}
      </div>

      {/* Estado vazio */}
      {filteredMeetings.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <Calendar className="h-16 w-16 mx-auto mb-4" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
              Nenhuma reunião encontrada
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {searchTerm || filterStatus !== 'all' || filterType !== 'all'
                ? 'Tente ajustar os filtros de busca'
                : 'Comece criando a primeira reunião do projeto'
              }
            </p>
            {(searchTerm || filterStatus !== 'all' || filterType !== 'all') ? (
              <Button 
                variant="outline"
                onClick={() => {
                  setSearchTerm('');
                  setFilterStatus('all');
                  setFilterType('all');
                }}
              >
                Limpar Filtros
              </Button>
            ) : (
              <Button onClick={() => setShowCreateModal(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Criar Primeira Reunião
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Modal de Criação */}
      {showCreateModal && (
        <CreateMeetingModal
          project={project}
          onClose={() => setShowCreateModal(false)}
          onSuccess={(newMeeting) => {
            // Converter ProjectMeeting para MeetingComplete
            const completeMeeting: MeetingComplete = {
              ...newMeeting,
              user_id: '',
              start_time: new Date(newMeeting.meeting_date).toTimeString().split(' ')[0],
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              project_id: project.id
            };
            setMeetings(prev => [...prev, completeMeeting]);
            setShowCreateModal(false);
          }}
        />
      )}
    </div>
  );
}