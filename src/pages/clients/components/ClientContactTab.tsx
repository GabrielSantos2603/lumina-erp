import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Phone, Mail, Globe } from "lucide-react";

interface Client {
  phone: string;
  phoneSecondary?: string;
  email: string;
  emailSecondary?: string;
  website?: string;
}

interface ClientContactTabProps {
  client: Client;
}

export function ClientContactTab({ client }: ClientContactTabProps) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            📞 Telefones
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-3">
            <Phone className="h-5 w-5 text-lumina-500" />
            <div>
              <p className="text-xs text-muted-foreground">Principal</p>
              <p className="text-lg font-semibold">{client.phone}</p>
            </div>
          </div>
          {client.phoneSecondary && (
            <div className="flex items-center gap-3 pt-2 border-t">
              <Phone className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Secundário</p>
                <p className="text-lg font-semibold">{client.phoneSecondary}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            ✉️ E-mails
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-3">
            <Mail className="h-5 w-5 text-lumina-500" />
            <div>
              <p className="text-xs text-muted-foreground">Principal</p>
              <p className="text-lg font-semibold">{client.email}</p>
            </div>
          </div>
          {client.emailSecondary && (
            <div className="flex items-center gap-3 pt-2 border-t">
              <Mail className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Secundário</p>
                <p className="text-lg font-semibold">{client.emailSecondary}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {client.website && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              🌐 Website
            </CardTitle>
          </CardHeader>
          <CardContent>
            <a
              href={client.website}
              target="_blank"
              rel="noopener noreferrer"
              className="text-lg font-semibold text-lumina-600 hover:text-lumina-700 underline flex items-center gap-2"
            >
              <Globe className="h-5 w-5" />
              {client.website}
            </a>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
