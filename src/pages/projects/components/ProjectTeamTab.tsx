import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign } from "lucide-react";

interface Project {
  budget?: number;
  actualCost?: number;
}

interface ProjectTeamTabProps {
  project: Project;
}

export function ProjectTeamTab({ project }: ProjectTeamTabProps) {
  return (
    <div className="space-y-6">
      {project.budget && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Orçamento do Projeto
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-lumina-600">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(project.budget)}
            </p>
          </CardContent>
        </Card>
      )}

      {project.actualCost && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Custo Atual
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(project.actualCost)}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
