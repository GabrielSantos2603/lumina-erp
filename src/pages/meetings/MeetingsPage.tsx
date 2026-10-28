import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Building2, Users, Loader2 } from "lucide-react";
import { SmartMeetingHub } from "./components/SmartMeetingHub";
import { projectService, type Project } from "@/services/projectService";
import { DynamicContainer } from "@/components/responsive";

export function MeetingsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initProjects = async () => {
      try {
        setIsLoading(true);
        const projectsData = await projectService.getAllProjects();
        setProjects(projectsData);
        
        // Se houver projetos, selecionar o primeiro por padrão
        if (projectsData.length > 0 && !selectedProject) {
          setSelectedProject(projectsData[0].id);
        }
      } catch (error) {
        console.error("Erro ao carregar projetos:", error);
      } finally {
        setIsLoading(false);
      }
    };

    initProjects();
  }, [selectedProject]);

  const getSelectedProjectData = () => {
    return projects.find(p => p.id === selectedProject);
  };

  const handleNewProject = () => {
    // TODO: Implementar modal de criação de projeto
    console.log('Criar novo projeto');
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center h-96">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto" />
          <p className="text-muted-foreground">Carregando projetos...</p>
        </div>
      </div>
    );
  }

  return (
    <DynamicContainer className="overflow-x-hidden">
      <div className="space-y-3 sm:space-y-4 lg:space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-3 sm:gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0 flex-1">
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight truncate">
              📝 Hub de Reuniões Inteligente
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2">
              Gerencie reuniões completas com IA: timeline, pautas, gravações e decisões por projeto
            </p>
          </div>
          <Button 
            onClick={handleNewProject}
            className="gap-1.5 sm:gap-2 h-9 sm:h-10 lg:h-11 w-full sm:w-auto text-sm sm:text-base"
          >
            <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">Novo Projeto</span>
            <span className="sm:hidden">Novo</span>
          </Button>
        </div>

        {/* Project Selector */}
        {projects.length > 0 ? (
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Building2 className="h-5 w-5" />
                Selecionar Projeto
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <Select value={selectedProject} onValueChange={setSelectedProject}>
                    <SelectTrigger>
                      <SelectValue placeholder="Escolha um projeto para gerenciar as reuniões" />
                    </SelectTrigger>
                    <SelectContent>
                      {projects.map((project) => (
                        <SelectItem key={project.id} value={project.id}>
                          <div className="flex items-center gap-2">
                            <div className="flex items-center gap-2">
                              <div className={`w-2 h-2 rounded-full ${
                                project.status === 'completed' ? 'bg-green-500' :
                                project.status === 'in_progress' ? 'bg-blue-500' :
                                project.status === 'planning' ? 'bg-yellow-500' :
                                project.status === 'paused' ? 'bg-gray-500' :
                                'bg-red-500'
                              }`} />
                              <span className="font-medium">{project.name}</span>
                            </div>
                            {project.client_name && (
                              <span className="text-muted-foreground text-sm">
                                • {project.client_name}
                              </span>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                {getSelectedProjectData() && (
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      {getSelectedProjectData()?.client_name || 'Sem cliente'}
                    </div>
                    <div className="flex items-center gap-1">
                      <Building2 className="h-4 w-4" />
                      {getSelectedProjectData()?.category === 'architecture' ? 'Arquitetura' :
                       getSelectedProjectData()?.category === 'interior_design' ? 'Design de Interiores' :
                       getSelectedProjectData()?.category === 'landscape' ? 'Paisagismo' :
                       getSelectedProjectData()?.category === 'renovation' ? 'Reforma' :
                       'Outros'}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="pt-6 text-center">
              <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-2">Nenhum projeto encontrado</h3>
              <p className="text-muted-foreground mb-4">
                Para começar a usar o Hub de Reuniões, você precisa ter pelo menos um projeto cadastrado
              </p>
              <Button onClick={handleNewProject} className="gap-2">
                <Plus className="h-4 w-4" />
                Criar Primeiro Projeto
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Smart Meeting Hub */}
        {selectedProject && (
          <SmartMeetingHub 
            projectId={selectedProject}
            initialTab="timeline"
          />
        )}
      </div>
    </DynamicContainer>
  );
}
