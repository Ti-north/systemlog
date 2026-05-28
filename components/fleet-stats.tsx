import { type FrotaRow } from '@/lib/frota';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Car, CheckCircle2, AlertTriangle, Wrench } from 'lucide-react';

interface FleetStatsProps {
  veiculos: FrotaRow[];
  isLoading: boolean;
}

export function FleetStats({ veiculos, isLoading }: FleetStatsProps) {
  const totalVeiculos = veiculos.length;
  const emUso = veiculos.filter((veiculo) => veiculo.status === 'EM_USO').length;
  const disponiveis = veiculos.filter((veiculo) => veiculo.status === 'DISPONIVEL').length;
  const manutencao = veiculos.filter((veiculo) => veiculo.status === 'MANUTENCAO').length;

  function renderValue(value: number) {
    return isLoading ? (
      <span className="text-2xl font-bold text-muted-foreground animate-pulse">...</span>
    ) : (
      <span className="text-2xl font-bold">{value}</span>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total da Frota</CardTitle>
          <Car className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          {renderValue(totalVeiculos)}
          <p className="text-xs text-muted-foreground">Veiculos cadastrados</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Disponiveis</CardTitle>
          <CheckCircle2 className="h-4 w-4 text-emerald-500" />
        </CardHeader>
        <CardContent>
          {renderValue(disponiveis)}
          <p className="text-xs text-muted-foreground">Prontos para rodar</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Em Operacao</CardTitle>
          <AlertTriangle className="h-4 w-4 text-amber-500" />
        </CardHeader>
        <CardContent>
          {renderValue(emUso)}
          <p className="text-xs text-muted-foreground">Em transito no momento</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Em Manutencao</CardTitle>
          <Wrench className="h-4 w-4 text-destructive" />
        </CardHeader>
        <CardContent>
          {renderValue(manutencao)}
          <p className="text-xs text-muted-foreground">Necessitam de atencao</p>
        </CardContent>
      </Card>
    </div>
  );
}
