import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Briefcase } from "lucide-react";

interface Client {
  id: string;
  name: string;
  type: "residential" | "commercial";
  personType: "pf" | "pj";
  cpfCnpj?: string;
  status: "active" | "inactive" | "potential";
  phone: string;
  phoneSecondary?: string;
  email: string;
  emailSecondary?: string;
  website?: string;
  address?: string;
  addressNumber?: string;
  complement?: string;
  neighborhood?: string;
  city: string;
  state?: string;
  zipCode?: string;
  howMetUs?: string;
  referredBy?: string;
  notes?: string;
  activeProjects: number;
  registrationDate: string;
  avatar?: string;
}

interface ClientInfoTabProps {
  client: Client;
}

export function ClientInfoTab({ client }: ClientInfoTabProps) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Tipo de Cliente
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-semibold">
              {client.personType === "pf" ? "👤 Pessoa Física" : "🏢 Pessoa Jurídica"}
            </p>
          </CardContent>
        </Card>

        {client.cpfCnpj && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {client.personType === "pf" ? "CPF" : "CNPJ"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg font-semibold">{client.cpfCnpj}</p>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Categoria
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-semibold">
              {client.type === "residential" ? "🏠 Residencial" : "🏢 Comercial"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Projetos Ativos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-semibold flex items-center gap-2">
              <Briefcase className="h-5 w-5 text-lumina-500" />
              {client.activeProjects} projeto{client.activeProjects !== 1 ? "s" : ""}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Cliente desde
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-semibold flex items-center gap-2">
              <Calendar className="h-5 w-5 text-lumina-500" />
              {new Date(client.registrationDate).toLocaleDateString("pt-BR", {
                day: "2-digit",
                month: "long",
                year: "numeric"
              })}
            </p>
          </CardContent>
        </Card>

        {(client.howMetUs || client.referredBy) && (
          <Card className="md:col-span-2">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Origem do Contato
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {client.howMetUs && (
                <p className="text-sm">
                  <strong>Como conheceu:</strong> {client.howMetUs}
                </p>
              )}
              {client.referredBy && (
                <p className="text-sm">
                  <strong>Indicado por:</strong> {client.referredBy}
                </p>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
