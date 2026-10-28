import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin, Ruler } from "lucide-react";

interface Project {
  address?: string;
  city?: string;
  state?: string;
  areaSqm?: number;
}

interface ProjectTechnicalTabProps {
  project: Project;
}

export function ProjectTechnicalTab({ project }: ProjectTechnicalTabProps) {
  return (
    <div className="space-y-6">
      {(project.address || project.city) && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Localização
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {project.address && <p>{project.address}</p>}
            <p className="font-semibold">
              {project.city}{project.state ? `, ${project.state}` : ''}
            </p>
          </CardContent>
        </Card>
      )}

      {project.areaSqm && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Ruler className="h-4 w-4" />
              Área do Projeto
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-semibold">{project.areaSqm}m²</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
