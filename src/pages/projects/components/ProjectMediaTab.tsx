import { FileText } from "lucide-react";

export function ProjectMediaTab() {
  return (
    <div className="space-y-6">
      <div className="text-center py-12 text-muted-foreground">
        <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
        <p>Funcionalidade de arquivos em desenvolvimento</p>
      </div>
    </div>
  );
}
