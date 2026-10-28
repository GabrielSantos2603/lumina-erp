export interface Project {
  id: string;
  name: string;
  clientId: string;
  clientName: string;
  type: "residential" | "commercial";
  category: "architecture" | "interior" | "landscape" | "consulting";
  status: "planning" | "in-progress" | "paused" | "completed" | "cancelled";
  priority: "low" | "medium" | "high";
  startDate?: string;
  endDate?: string;
  deadline?: string;
  description?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  areaSqm?: number;
  budget?: number;
  actualCost?: number;
  progress: number;
  team?: string[];
  tags?: string[];
  imageUrl?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface ProjectFormData {
  id?: string;
  name: string;
  clientId: string;
  clientName: string;
  type: "residential" | "commercial";
  category: "architecture" | "interior" | "landscape" | "consulting";
  status: "planning" | "in-progress" | "paused" | "completed" | "cancelled";
  priority: "low" | "medium" | "high";
  startDate?: string;
  endDate?: string;
  deadline?: string;
  description?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  areaSqm?: number;
  budget?: number;
  actualCost?: number;
}
