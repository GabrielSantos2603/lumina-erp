import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { User, Calendar, FileText } from "lucide-react";

interface Project {
  id: string;
  name: string;
  clientName: string;
  imageUrl?: string;
  startDate?: string;
  description?: string;
}

interface ProjectInfoTabProps {
  project: Project;
}

export function ProjectInfoTab({ project }: ProjectInfoTabProps) {
  return (
    <div className="space-y-6">
      {/* Imagem de Capa */}
      {project.imageUrl && (
        <div className="relative h-64 rounded-lg overflow-hidden bg-muted">
          <img
            src={project.imageUrl}
            alt={project.name}
            className="w-full h-full object-cover"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
            }}
          />
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <User className="h-4 w-4" />
              Cliente
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-semibold">{project.clientName}</p>
          </CardContent>
        </Card>

        {project.startDate && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Data de Início
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg font-semibold">
                {new Date(project.startDate).toLocaleDateString("pt-BR", {
                  day: "2-digit",
                  month: "long",
                  year: "numeric"
                })}
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {project.description && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Descrição
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-base whitespace-pre-wrap">{project.description}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
