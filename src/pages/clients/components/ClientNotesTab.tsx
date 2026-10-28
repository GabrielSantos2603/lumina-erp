import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText } from "lucide-react";

interface Client {
  notes?: string;
}

interface ClientNotesTabProps {
  client: Client;
}

export function ClientNotesTab({ client }: ClientNotesTabProps) {
  return (
    <div className="space-y-6">
      {client.notes ? (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              📝 Observações
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-base whitespace-pre-wrap">{client.notes}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="text-center py-12 text-muted-foreground">
          <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
          <p>Nenhuma observação registrada para este cliente</p>
        </div>
      )}
    </div>
  );
}
