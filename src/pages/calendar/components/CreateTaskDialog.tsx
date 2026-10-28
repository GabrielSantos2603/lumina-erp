import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { X, Users, Link as LinkIcon, XCircle } from "lucide-react";
import { taskService, type TaskPriority, type Task } from "@/services/taskService";
import { projectService } from "@/services/projectService";
import { teamService, type TeamMember } from "@/services/teamService";
import { toast } from "react-hot-toast";
import { cn } from "@/lib/utils";

interface CreateTaskDialogProps {
  projectId?: string;
  parentId?: string;
  onClose: () => void;
  onSuccess: () => void;
}

export function CreateTaskDialog({
  projectId,
  parentId,
  onClose,
  onSuccess,
}: CreateTaskDialogProps) {
  const [projects, setProjects] = useState<Array<{ id: string; name: string }>>([]);
  const [tasks, setTasks] = useState<Array<{ id: string; title: string; project_id?: string }>>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [parentTask, setParentTask] = useState<Task | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<TaskPriority>("medium");
  const [selectedProject, setSelectedProject] = useState(projectId || "");
  const [selectedParentTask, setSelectedParentTask] = useState(parentId || "");
  const [selectedTeamMember, setSelectedTeamMember] = useState("");
  const [startDate, setStartDate] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [weight, setWeight] = useState("1.0");
  const [estimatedHours, setEstimatedHours] = useState("");
  const [tags, setTags] = useState("");
  const [category, setCategory] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadProjects();
    loadTasks();
    loadTeamMembers();
    
    // Se está criando sub-tarefa (parentId existe), carregar tarefa mãe
    if (parentId) {
      loadParentTask();
    }
  }, [parentId]);

  // Quando selecionar tarefa mãe ou quando parentTask carregar, herdar projeto
  useEffect(() => {
    if (selectedParentTask && !parentId) {
      // Buscar tarefa selecionada nas tasks já carregadas
      const task = tasks.find(t => t.id === selectedParentTask);
      if (task && task.project_id) {
        setSelectedProject(task.project_id);
      }
    } else if (parentTask && parentTask.project_id) {
      // Se parentId veio como prop, usar project_id da tarefa mãe
      setSelectedProject(parentTask.project_id);
    }
  }, [selectedParentTask, parentTask, tasks, parentId]);

  const loadProjects = async () => {
    try {
      const data = await projectService.getAllProjects();
      setProjects(data);
    } catch (error) {
      console.error("Erro ao carregar projetos:", error);
    }
  };

  const loadTasks = async () => {
    try {
      const data = await taskService.getTasks();
      // Incluir project_id para herança
      setTasks(data.map(t => ({ id: t.id, title: t.title, project_id: t.project_id })));
    } catch (error) {
      console.error("Erro ao carregar tarefas:", error);
    }
  };

  const loadParentTask = async () => {
    if (!parentId) return;
    
    try {
      const task = await taskService.getTaskById(parentId);
      setParentTask(task);
      // Herdar projeto da tarefa mãe
      if (task.project_id) {
        setSelectedProject(task.project_id);
      }
    } catch (error) {
      console.error("Erro ao carregar tarefa mãe:", error);
    }
  };

  const loadTeamMembers = async () => {
    try {
      const data = await teamService.getTeamMembers();
      setTeamMembers(data);
    } catch (error) {
      console.error("Erro ao carregar membros da equipe:", error);
    }
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      toast.error("Preencha o título da tarefa");
      return;
    }

    if (!startDate) {
      toast.error("Preencha a data de início");
      return;
    }

    if (!dueDate) {
      toast.error("Preencha a data de vencimento");
      return;
    }

    if (new Date(dueDate) < new Date(startDate)) {
      toast.error("A data de vencimento deve ser posterior à data de início");
      return;
    }

    try {
      setIsSubmitting(true);
      
      // Preparar dados - remover campos vazios
      const taskData: any = {
        title: title.trim(),
        priority,
        status: "pending",
        progress: 0,
      };

      // Adicionar campos opcionais apenas se preenchidos
      if (description.trim()) taskData.description = description.trim();
      if (selectedProject) taskData.project_id = selectedProject;
      
      // Parent ID - só enviar se realmente tiver valor
      const finalParentId = selectedParentTask || parentId;
      if (finalParentId && finalParentId.trim()) {
        taskData.parent_id = finalParentId;
      }
      
      // Team Member - usar assigned_team_member_id que referencia team.id
      if (selectedTeamMember && selectedTeamMember.trim()) {
        taskData.assigned_team_member_id = selectedTeamMember;
      }
      
      if (startDate) taskData.start_date = startDate;
      if (dueDate) taskData.due_date = dueDate;
      
      // Weight - só enviar se o script SQL foi executado
      // Se der erro, o campo pode não existir ainda
      try {
        if (weight && parseFloat(weight) > 0) {
          taskData.weight = parseFloat(weight);
        }
      } catch (e) {
        // Campo weight pode não existir ainda
        console.warn("Campo weight pode não existir no banco ainda");
      }
      
      if (estimatedHours && parseFloat(estimatedHours) > 0) {
        taskData.estimated_hours = parseFloat(estimatedHours);
      }
      
      if (tags.trim()) {
        const tagArray = tags.split(",").map((t) => t.trim()).filter(t => t.length > 0);
        if (tagArray.length > 0) {
          taskData.tags = tagArray;
        }
      }
      
      if (category.trim()) taskData.category = category.trim();

      await taskService.createTask(taskData);

      toast.success((selectedParentTask || parentId) ? "Sub-tarefa criada!" : "Tarefa criada!");
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error("Erro ao criar tarefa:", error);
      const errorMessage = error?.message || error?.error?.message || "Erro desconhecido";
      toast.error(`Erro ao criar tarefa: ${errorMessage}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-3xl max-h-[90vh] flex flex-col">
        <CardHeader className="border-b flex-shrink-0">
          <div className="flex items-center justify-between">
            <CardTitle>
              {parentId ? "Criar Sub-tarefa" : "Criar Nova Tarefa"}
            </CardTitle>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-6 overflow-y-auto flex-1">
          <div className="space-y-4">
            {/* Título */}
            <div className="space-y-2">
              <Label htmlFor="title">
                Título <span className="text-red-500">*</span>
              </Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex: Revisar plantas estruturais..."
                required
              />
            </div>

            {/* Tarefa Mãe */}
            {!parentId && (
              <div className="space-y-2">
                <Label htmlFor="parentTask" className="flex items-center gap-2">
                  <LinkIcon className="h-4 w-4" />
                  Tarefa Mãe (opcional)
                </Label>
                <div className="relative">
                  <select
                    id="parentTask"
                    value={selectedParentTask}
                    onChange={(e) => {
                      const newValue = e.target.value;
                      setSelectedParentTask(newValue);
                      
                      if (newValue) {
                        // Herdar projeto da tarefa mãe selecionada
                        const task = tasks.find(t => t.id === newValue);
                        if (task && task.project_id) {
                          setSelectedProject(task.project_id);
                        }
                      } else {
                        // Limpar projeto herdado quando remover tarefa mãe
                        // Se tinha projectId original, restaurar, senão limpar
                        if (projectId) {
                          setSelectedProject(projectId);
                        } else {
                          setSelectedProject("");
                        }
                      }
                    }}
                    className="w-full px-3 py-2 pr-10 rounded-md border border-input bg-background text-sm"
                  >
                    <option value="">Sem tarefa mãe (tarefa raiz)</option>
                    {tasks.map((task) => (
                      <option key={task.id} value={task.id}>
                        {task.title}
                        {task.project_id && (
                          ` (${projects.find(p => p.id === task.project_id)?.name || 'Projeto'})`
                        )}
                      </option>
                    ))}
                  </select>
                  {selectedParentTask && (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedParentTask("");
                        // Limpar projeto herdado
                        if (projectId) {
                          setSelectedProject(projectId);
                        } else {
                          setSelectedProject("");
                        }
                      }}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                      title="Limpar tarefa mãe"
                    >
                      <XCircle className="h-4 w-4" />
                    </button>
                  )}
                </div>
                {selectedParentTask && (
                  <p className="text-xs text-muted-foreground">
                    Esta tarefa será uma sub-tarefa da tarefa selecionada
                    {tasks.find(t => t.id === selectedParentTask)?.project_id && (
                      <span className="block mt-1 text-lumina-600 dark:text-lumina-400">
                        ✨ O projeto foi herdado automaticamente da tarefa mãe
                      </span>
                    )}
                  </p>
                )}
              </div>
            )}

            {/* Informação de herança quando parentId vem como prop */}
            {parentId && parentTask && (
              <div className="p-3 bg-lumina-50 dark:bg-lumina-900/20 rounded-lg border border-lumina-200 dark:border-lumina-800">
                <div className="flex items-center gap-2 text-sm">
                  <LinkIcon className="h-4 w-4 text-lumina-600" />
                  <span className="font-medium">Sub-tarefa de:</span>
                  <span>{parentTask.title}</span>
                  {parentTask.project_id && (
                    <>
                      <span className="text-muted-foreground">•</span>
                      <span className="text-lumina-600 dark:text-lumina-400">
                        ✨ Projeto herdado: {projects.find(p => p.id === parentTask.project_id)?.name || 'Carregando...'}
                      </span>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Projeto e Prioridade */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="project">
                  Projeto
                  {((parentId && parentTask?.project_id) || (selectedParentTask && tasks.find(t => t.id === selectedParentTask)?.project_id)) && (
                    <span className="ml-2 text-xs text-lumina-600 dark:text-lumina-400">
                      (Herdado da tarefa mãe)
                    </span>
                  )}
                </Label>
                <select
                  id="project"
                  value={selectedProject}
                  onChange={(e) => setSelectedProject(e.target.value)}
                  disabled={!!projectId || !!(parentId && parentTask?.project_id) || !!(selectedParentTask && tasks.find(t => t.id === selectedParentTask)?.project_id)}
                  className={cn(
                    "w-full px-3 py-2 rounded-md border border-input bg-background text-sm",
                    ((parentId && parentTask?.project_id) || (selectedParentTask && tasks.find(t => t.id === selectedParentTask)?.project_id)) && 
                    "bg-muted cursor-not-allowed opacity-75"
                  )}
                >
                  <option value="">Sem projeto</option>
                  {projects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.name}
                    </option>
                  ))}
                </select>
                {((parentId && parentTask?.project_id) || (selectedParentTask && tasks.find(t => t.id === selectedParentTask)?.project_id)) && (
                  <p className="text-xs text-muted-foreground">
                    O projeto foi herdado automaticamente da tarefa mãe. Para alterar, remova a tarefa mãe primeiro.
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="priority">Prioridade</Label>
                <select
                  id="priority"
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as TaskPriority)}
                  className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm"
                >
                  <option value="low">Baixa</option>
                  <option value="medium">Média</option>
                  <option value="high">Alta</option>
                  <option value="urgent">Urgente</option>
                </select>
              </div>
            </div>

            {/* Membro da Equipe */}
            {teamMembers.length > 0 && (
              <div className="space-y-2">
                <Label htmlFor="teamMember" className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Atribuir à (Membro da Equipe)
                </Label>
                <select
                  id="teamMember"
                  value={selectedTeamMember}
                  onChange={(e) => setSelectedTeamMember(e.target.value)}
                  className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm"
                >
                  <option value="">Não atribuir</option>
                  {teamMembers.map((member) => (
                    <option key={member.id} value={member.id}>
                      {member.name} - {member.role} ({member.email})
                    </option>
                  ))}
                </select>
                <p className="text-xs text-muted-foreground">
                  O membro selecionado será notificado sobre esta tarefa
                </p>
              </div>
            )}

            {/* Descrição */}
            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm min-h-[100px]"
                placeholder="Descreva a tarefa em detalhes..."
              />
            </div>

            {/* Datas */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="startDate">
                  Data de Início <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="startDate"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  required
                  className={cn(!startDate && "border-red-500")}
                />
                {!startDate && (
                  <p className="text-xs text-red-500">Campo obrigatório</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="dueDate">
                  Data de Vencimento <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="dueDate"
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  required
                  min={startDate || undefined}
                  className={cn(!dueDate && "border-red-500")}
                />
                {!dueDate && (
                  <p className="text-xs text-red-500">Campo obrigatório</p>
                )}
                {startDate && dueDate && new Date(dueDate) < new Date(startDate) && (
                  <p className="text-xs text-red-500">
                    A data de vencimento deve ser posterior à data de início
                  </p>
                )}
              </div>
            </div>

            {/* Peso e Horas */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="weight">
                  Peso (0-100)
                  <span className="text-xs text-muted-foreground ml-2">
                    Para cálculo de progresso
                  </span>
                </Label>
                <Input
                  id="weight"
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  placeholder="1.0"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="estimatedHours">Horas Estimadas</Label>
                <Input
                  id="estimatedHours"
                  type="number"
                  step="0.5"
                  min="0"
                  value={estimatedHours}
                  onChange={(e) => setEstimatedHours(e.target.value)}
                  placeholder="8.0"
                />
              </div>
            </div>

            {/* Tags e Categoria */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="tags">Tags (separadas por vírgula)</Label>
                <Input
                  id="tags"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  placeholder="design, urgente, revisão"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Categoria</Label>
                <Input
                  id="category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder="Ex: Documentação"
                />
              </div>
            </div>
          </div>
        </CardContent>

        <div className="border-t p-6 flex-shrink-0 flex justify-end gap-3">
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? "Salvando..." : "Criar Tarefa"}
          </Button>
        </div>
      </Card>
    </div>
  );
}

