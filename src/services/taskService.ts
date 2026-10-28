import { supabase } from "@/lib/supabase";
import { getOrganizationId } from "@/utils/getOrganizationId";

export type TaskStatus = "pending" | "in_progress" | "completed" | "cancelled" | "on_hold";
export type TaskPriority = "low" | "medium" | "high" | "urgent";

export interface Task {
  id: string;
  user_id: string;
  project_id?: string;
  parent_id?: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  start_date?: string;
  due_date?: string;
  completed_at?: string;
  assigned_to?: string;
  assigned_team_member_id?: string;
  estimated_hours?: number;
  actual_hours?: number;
  progress: number;
  weight?: number;
  level?: number;
  order_index?: number;
  tags?: string[];
  category?: string;
  created_at: string;
  updated_at: string;
}

export interface TaskInsert extends Omit<Task, 'id' | 'created_at' | 'updated_at' | 'actual_hours'> {}

export interface TaskWithDetails extends Task {
  project_name?: string;
  creator_name?: string;
  assignee_name?: string;
  time_progress_percent?: number;
  is_overdue?: boolean;
}

class TaskService {
  /**
   * Criar nova tarefa
   */
  async createTask(data: Partial<TaskInsert>) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Usuário não autenticado");

    // Buscar organization_id do usuário
    const organizationId = await getOrganizationId();

    // Preparar dados - remover undefined e campos que podem não existir
    const task: any = {
      user_id: user.id,
      organization_id: organizationId,
      title: data.title || "",
      status: data.status || "pending",
      priority: data.priority || "medium",
      progress: data.progress || 0,
    };

    // Adicionar campos opcionais apenas se definidos
    if (data.description) task.description = data.description;
    if (data.project_id) task.project_id = data.project_id;
    if (data.parent_id) task.parent_id = data.parent_id;
    if (data.assigned_to) task.assigned_to = data.assigned_to;
    if (data.assigned_team_member_id) task.assigned_team_member_id = data.assigned_team_member_id;
    if (data.start_date) task.start_date = data.start_date;
    if (data.due_date) task.due_date = data.due_date;
    if (data.estimated_hours) task.estimated_hours = data.estimated_hours;
    if (data.tags && data.tags.length > 0) task.tags = data.tags;
    if (data.category) task.category = data.category;
    
    // Campos novos (podem não existir se o SQL não foi executado)
    // Vamos tentar inserir, mas se der erro relacionado a esses campos, removê-los e tentar novamente
    if (data.weight !== undefined && data.weight !== null) task.weight = data.weight;
    if (data.level !== undefined && data.level !== null) task.level = data.level;
    if (data.order_index !== undefined && data.order_index !== null) task.order_index = data.order_index;
    if (data.assigned_team_member_id) task.assigned_team_member_id = data.assigned_team_member_id;

    let { data: newTask, error } = await supabase
      .from("tasks")
      .insert(task)
      .select()
      .single();

    // Se o erro for relacionado a campos que podem não existir, tentar sem eles
    if (error && (
      error.message?.includes('weight') ||
      error.message?.includes('level') ||
      error.message?.includes('order_index') ||
      error.message?.includes('assigned_team_member_id') ||
      error.code === '42703' // column does not exist
    )) {
      console.warn("Alguns campos não existem no banco, tentando sem eles:", error.message);
      
      // Remover campos problemáticos
      delete task.weight;
      delete task.level;
      delete task.order_index;
      delete task.assigned_team_member_id;
      
      // Tentar novamente
      const retry = await supabase
        .from("tasks")
        .insert(task)
        .select()
        .single();
      
      newTask = retry.data;
      error = retry.error;
    }

    if (error) {
      console.error("Erro detalhado ao criar tarefa:", error);
      throw error;
    }
    return newTask as Task;
  }

  /**
   * Obter todas as tarefas do usuário
   */
  async getTasks(filters?: {
    project_id?: string;
    status?: TaskStatus;
    priority?: TaskPriority;
    assigned_to?: string;
  }) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Usuário não autenticado");

    let query = supabase
      .from("tasks")
      .select("*")
      .or(`user_id.eq.${user.id},assigned_to.eq.${user.id}`)
      .order("created_at", { ascending: false });

    if (filters?.project_id) {
      query = query.eq("project_id", filters.project_id);
    }

    if (filters?.status) {
      query = query.eq("status", filters.status);
    }

    if (filters?.priority) {
      query = query.eq("priority", filters.priority);
    }

    if (filters?.assigned_to) {
      query = query.eq("assigned_to", filters.assigned_to);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data as Task[];
  }

  /**
   * Obter tarefas com detalhes (usando view)
   */
  async getTasksWithDetails(filters?: {
    project_id?: string;
    status?: TaskStatus;
    overdue_only?: boolean;
  }) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Usuário não autenticado");

    let query = supabase
      .from("tasks_with_progress")
      .select("*")
      .or(`user_id.eq.${user.id},assigned_to.eq.${user.id}`);

    if (filters?.project_id) {
      query = query.eq("project_id", filters.project_id);
    }

    if (filters?.status) {
      query = query.eq("status", filters.status);
    }

    if (filters?.overdue_only) {
      query = query.eq("is_overdue", true);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data as TaskWithDetails[];
  }

  /**
   * Obter tarefa por ID
   */
  async getTaskById(id: string) {
    const { data, error } = await supabase
      .from("tasks")
      .select("*")
      .eq("id", id)
      .single();

    if (error) throw error;
    return data as Task;
  }

  /**
   * Atualizar tarefa
   */
  async updateTask(id: string, updates: Partial<TaskInsert>) {
    const { data, error } = await supabase
      .from("tasks")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return data as Task;
  }

  /**
   * Deletar tarefa
   */
  async deleteTask(id: string) {
    const { error } = await supabase
      .from("tasks")
      .delete()
      .eq("id", id);

    if (error) throw error;
  }

  /**
   * Completar tarefa
   */
  async completeTask(id: string) {
    const { data, error } = await supabase
      .from("tasks")
      .update({
        status: "completed",
        completed_at: new Date().toISOString(),
        progress: 100,
      })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return data as Task;
  }

  /**
   * Atualizar progresso da tarefa
   */
  async updateProgress(id: string, progress: number) {
    const status = progress === 100 ? "completed" : "in_progress";
    const completed_at = progress === 100 ? new Date().toISOString() : null;

    const { data, error } = await supabase
      .from("tasks")
      .update({ progress, status, completed_at })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return data as Task;
  }

  /**
   * Obter tarefas por data
   */
  async getTasksByDateRange(startDate: string, endDate: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Usuário não autenticado");

    const { data, error } = await supabase
      .from("tasks")
      .select("*")
      .or(`user_id.eq.${user.id},assigned_to.eq.${user.id}`)
      .or(`and(due_date.gte.${startDate},due_date.lte.${endDate}),and(start_date.gte.${startDate},start_date.lte.${endDate})`);

    if (error) throw error;
    return data as Task[];
  }
}

export const taskService = new TaskService();

