import { type FrotaRow, vehicleStatusLabels, vehicleTypeLabels } from '@/lib/frota';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Gauge, MapPin, Truck, User } from 'lucide-react';

interface FleetGridProps {
  veiculos: FrotaRow[];
  isLoading: boolean;
}

const statusClassName: Record<FrotaRow['status'], string> = {
  DISPONIVEL: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-500',
  EM_USO: 'border-amber-500/30 bg-amber-500/10 text-amber-500',
  MANUTENCAO: 'border-destructive/30 bg-destructive/10 text-destructive',
};

export function FleetGrid({ veiculos, isLoading }: FleetGridProps) {
  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Carregando veiculos...</p>;
  }

  if (veiculos.length === 0) {
    return <p className="text-sm text-muted-foreground">Nenhum veiculo encontrado.</p>;
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {veiculos.map((veiculo) => (
        <Card key={veiculo.id}>
          <CardHeader className="flex flex-row items-start justify-between space-y-0">
            <div>
              <CardTitle className="text-base">{veiculo.modelo || 'Sem modelo'}</CardTitle>
              <p className="text-sm text-muted-foreground">{veiculo.placa}</p>
            </div>
            <Badge variant="outline" className={statusClassName[veiculo.status]}>
              {vehicleStatusLabels[veiculo.status]}
            </Badge>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <InfoLine icon={Truck} label="Tipo" value={vehicleTypeLabels[veiculo.tipo] ?? veiculo.tipo} />
            <InfoLine icon={User} label="Motorista" value={veiculo.motoristas?.nome ?? 'Sem motorista'} />
            <InfoLine icon={Gauge} label="KM atual" value={`${(veiculo.km_atual ?? 0).toLocaleString('pt-BR')} km`} />
            <InfoLine
              icon={MapPin}
              label="Localizacao"
              value={
                veiculo.latitude && veiculo.longitude
                  ? `${veiculo.latitude}, ${veiculo.longitude}`
                  : 'Sem coordenadas'
              }
            />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function InfoLine({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <Icon className="h-4 w-4 text-muted-foreground" />
      <span className="text-muted-foreground">{label}:</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
