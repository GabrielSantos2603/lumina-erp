import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPinned } from "lucide-react";

interface Client {
  address?: string;
  addressNumber?: string;
  complement?: string;
  neighborhood?: string;
  city: string;
  state?: string;
  zipCode?: string;
}

interface ClientAddressTabProps {
  client: Client;
}

export function ClientAddressTab({ client }: ClientAddressTabProps) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            📍 Endereço Completo
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {client.zipCode && (
            <div>
              <p className="text-xs text-muted-foreground">CEP</p>
              <p className="text-lg font-semibold">{client.zipCode}</p>
            </div>
          )}
          
          {client.address && (
            <div className="pt-2 border-t">
              <p className="text-xs text-muted-foreground">Logradouro</p>
              <p className="text-lg font-semibold">
                {client.address}
                {client.addressNumber && `, ${client.addressNumber}`}
              </p>
            </div>
          )}

          {client.complement && (
            <div className="pt-2 border-t">
              <p className="text-xs text-muted-foreground">Complemento</p>
              <p className="text-lg font-semibold">{client.complement}</p>
            </div>
          )}

          {client.neighborhood && (
            <div className="pt-2 border-t">
              <p className="text-xs text-muted-foreground">Bairro</p>
              <p className="text-lg font-semibold">{client.neighborhood}</p>
            </div>
          )}

          <div className="pt-2 border-t">
            <p className="text-xs text-muted-foreground">Cidade/Estado</p>
            <p className="text-lg font-semibold">
              {client.city}{client.state && `, ${client.state}`}
            </p>
          </div>

          <div className="pt-4">
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                `${client.address || ""} ${client.addressNumber || ""} ${client.city} ${client.state || ""}`
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-lumina-600 hover:text-lumina-700 font-medium"
            >
              <MapPinned className="h-4 w-4" />
              Ver no Google Maps
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
