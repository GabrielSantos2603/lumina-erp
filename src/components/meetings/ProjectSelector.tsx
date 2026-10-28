import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Search, 
  FolderOpen, 
  Calendar, 
  Users, 
  Building2,
  ChevronRight,
  X,
  LayoutGrid,
  List,
  Plus
} from 'lucide-react';

export interface Project {
  id: string;
  name: string;
  description?: string;
  status: 'planning' | 'active' | 'paused' | 'completed' | 'draft' | 'in_progress' | 'on_hold' | 'cancelled' | 'archived';
  client_name?: string;
  start_date?: string;
  end_date?: string;
  created_at: string;
  updated_at: string;
}

interface ProjectSelectorProps {
  onSelectProject: (project: Project) => void;
}

export function ProjectSelector({ onSelectProject }: ProjectSelectorProps) {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [error, setError] = useState('');

  const statusLabels = {
    planning: { label: 'Planejamento', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' },
    active: { label: 'Ativo', color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' },
    paused: { label: 'Pausado', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300' },
    completed: { label: 'Concluído', color: 'bg-gray-100 text-gray-800 dark:bg-gray-800/30 dark:text-gray-300' },
    // Status adicionais que podem vir do banco
    draft: { label: 'Rascunho', color: 'bg-slate-100 text-slate-800 dark:bg-slate-800/30 dark:text-slate-300' },
    in_progress: { label: 'Em Progresso', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' },
    on_hold: { label: 'Em Espera', color: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300' },
    cancelled: { label: 'Cancelado', color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' },
    archived: { label: 'Arquivado', color: 'bg-gray-100 text-gray-800 dark:bg-gray-800/30 dark:text-gray-300' }
  };

  useEffect(() => {
    loadProjects();
  }, []);

  const filterProjects = useCallback(() => {
    let filtered = projects;

    // Filtrar por termo de busca
    if (searchTerm) {
      filtered = filtered.filter(project =>
        project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.client_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtrar por status
    if (selectedStatus !== 'all') {
      filtered = filtered.filter(project => project.status === selectedStatus);
    }

    setFilteredProjects(filtered);
  }, [projects, searchTerm, selectedStatus]);

  useEffect(() => {
    filterProjects();
  }, [filterProjects]);

  const loadProjects = async () => {
    try {
      setLoading(true);
      setError('');
      
      const { supabase } = await import('@/lib/supabase');
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setError('Usuário não autenticado');
        setProjects([]);
        return;
      }
      
      const { data, error: dbError } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (dbError) {
        console.error('Erro ao carregar projetos:', dbError);
        setError('Erro ao carregar projetos. Tente novamente.');
        setProjects([]);
        return;
      }
      
      if (data) {
        setProjects(data.map(project => {
          // Validar status para evitar erros
          const validStatuses = ['planning', 'active', 'paused', 'completed', 'draft', 'in_progress', 'on_hold', 'cancelled', 'archived'];
          const status = validStatuses.includes(project.status) ? project.status : 'active';
          
          return {
            id: project.id,
            name: project.name,
            description: project.description,
            status: status,
            client_name: project.client_name || 'Cliente não informado',
            start_date: project.start_date,
            end_date: project.end_date,
            created_at: project.created_at,
            updated_at: project.updated_at
          };
        }));
      } else {
        setProjects([]);
      }
    } catch (err) {
      console.error('Erro ao carregar projetos:', err);
      setError('Erro ao carregar projetos');
      setProjects([]);
    } finally {
      setLoading(false);
    }
  };



  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat('pt-BR').format(new Date(dateString));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-8 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600 dark:text-gray-400">Carregando projetos...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background p-8 text-center">
        <div className="text-red-600 mb-4">{error}</div>
        <Button onClick={loadProjects}>Tentar Novamente</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6 max-w-7xl mx-auto">
      {/* Header com título e botão */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2 flex items-center gap-2">
            <Building2 className="h-6 w-6" />
            Hub Inteligente de Reuniões
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Selecione um projeto para gerenciar suas reuniões e acessar o Hub inteligente
          </p>
        </div>
      </div>

      {/* Header com busca e filtros */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar projetos, clientes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 text-sm"
          />
          {searchTerm && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
              onClick={() => setSearchTerm("")}
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>

        <div className="flex items-center gap-2 sm:ml-auto">
          {/* Filtro de status */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="border border-gray-300 dark:border-gray-600 bg-background rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="Filtrar por status do projeto"
          >
            <option value="all">Todos os Status</option>
            <option value="planning">Planejamento</option>
            <option value="active">Ativo</option>
            <option value="paused">Pausado</option>
            <option value="completed">Concluído</option>
          </select>

          {/* Seletor de visualização */}
          <div className="flex items-center rounded-lg border bg-background">
            <Button
              variant={viewMode === "grid" ? "secondary" : "ghost"}
              size="icon"
              onClick={() => setViewMode("grid")}
              className="rounded-r-none h-9 w-9"
            >
              <LayoutGrid className="h-4 w-4" />
              <span className="sr-only">Visualização em Grade</span>
            </Button>
            <Button
              variant={viewMode === "list" ? "secondary" : "ghost"}
              size="icon"
              onClick={() => setViewMode("list")}
              className="rounded-l-none h-9 w-9"
            >
              <List className="h-4 w-4" />
              <span className="sr-only">Visualização em Lista</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Indicador de Resultados da Busca */}
      {searchTerm && !loading && (
        <div className="flex items-center justify-between px-4 py-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800 mb-6">
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
              {filteredProjects.length === 0 
                ? "Nenhum projeto encontrado" 
                : `${filteredProjects.length} ${filteredProjects.length === 1 ? 'projeto encontrado' : 'projetos encontrados'}`
              }
            </span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSearchTerm("")}
            className="text-xs h-7"
          >
            Limpar busca
          </Button>
        </div>
      )}

      {/* Lista de Projetos */}
      <div className={`grid gap-4 ${viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3' : 'grid-cols-1'}`}>
        {filteredProjects.map((project) => (
          <Card 
            key={project.id}
            className={`cursor-pointer hover:shadow-lg transition-all duration-200 border-l-4 border-l-blue-500 ${
              viewMode === 'list' ? 'flex flex-row items-center p-4' : ''
            }`}
            onClick={() => onSelectProject(project)}
          >
            <CardHeader className={`${viewMode === 'list' ? 'flex-1 pb-0 py-0' : 'pb-3'}`}>
              <div className={`flex items-start justify-between ${viewMode === 'list' ? 'items-center' : ''}`}>
                <div className="flex-1">
                  <CardTitle className={`font-semibold text-gray-900 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 ${
                    viewMode === 'list' ? 'text-base mb-0' : 'text-lg mb-1'
                  }`}>
                    {project.name}
                  </CardTitle>
                  {project.description && viewMode === 'grid' && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                      {project.description}
                    </p>
                  )}
                </div>
                
                {viewMode === 'list' && (
                  <div className="flex items-center gap-3">
                    <Badge className={statusLabels[project.status]?.color || 'bg-gray-100 text-gray-800 dark:bg-gray-800/30 dark:text-gray-300'}>
                      {statusLabels[project.status]?.label || project.status}
                    </Badge>
                    {project.client_name && (
                      <span className="text-sm text-gray-600 dark:text-gray-400">{project.client_name}</span>
                    )}
                    <ChevronRight className="h-5 w-5 text-gray-400 flex-shrink-0" />
                  </div>
                )}
                
                {viewMode === 'grid' && (
                  <ChevronRight className="h-5 w-5 text-gray-400 flex-shrink-0" />
                )}
              </div>
              
              {viewMode === 'grid' && (
                <div className="flex items-center gap-2 mt-2">
                  <Badge className={statusLabels[project.status]?.color || 'bg-gray-100 text-gray-800 dark:bg-gray-800/30 dark:text-gray-300'}>
                    {statusLabels[project.status]?.label || project.status}
                  </Badge>
                </div>
              )}
            </CardHeader>

            {viewMode === 'grid' && (
              <CardContent className="pt-0">
                {/* Cliente */}
                {project.client_name && (
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-2">
                    <Users className="h-4 w-4" />
                    <span>{project.client_name}</span>
                  </div>
                )}

                {/* Datas */}
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-3">
                  <Calendar className="h-4 w-4" />
                  <span>
                    {project.start_date && formatDate(project.start_date)}
                    {project.end_date && ` - ${formatDate(project.end_date)}`}
                  </span>
                </div>
              </CardContent>
            )}
          </Card>
        ))}
      </div>

      {/* Estado Vazio */}
      {filteredProjects.length === 0 && !loading && (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <FolderOpen className="h-16 w-16 mx-auto mb-4" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
            {searchTerm || selectedStatus !== 'all' 
              ? 'Nenhum projeto encontrado'
              : 'Você ainda não tem projetos cadastrados'
            }
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {searchTerm || selectedStatus !== 'all' 
              ? 'Tente ajustar os filtros de busca'
              : 'Crie seu primeiro projeto para começar a gerenciar reuniões'
            }
          </p>
          
          <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
            {(searchTerm || selectedStatus !== 'all') ? (
              <Button 
                variant="outline"
                onClick={() => {
                  setSearchTerm('');
                  setSelectedStatus('all');
                }}
              >
                Limpar Filtros
              </Button>
            ) : (
              <>
                <Button 
                  onClick={() => navigate('/projects')}
                  className="gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Criar Primeiro Projeto
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => navigate('/projects')}
                >
                  Ir para Projetos
                </Button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}