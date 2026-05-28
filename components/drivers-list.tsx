'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { driverStatusLabels, type DriverRow } from '@/lib/drivers';
import { Edit, Mail, MapPin, MessageSquare, MoreVertical, Phone, Trash2, Truck, User } from 'lucide-react';

const statusColors: Record<DriverRow['status'], string> = {
  EM_ROTA: 'bg-chart-2/20 text-chart-2',
  DISPONIVEL: 'bg-success/20 text-success',
  INDISPONIVEL: 'bg-muted text-muted-foreground',
};

interface DriversListProps {
  drivers: DriverRow[];
  isLoading: boolean;
  onEdit: (driver: DriverRow) => void;
  onDelete: (driver: DriverRow) => void;
}

export function DriversList({ drivers, isLoading, onEdit, onDelete }: DriversListProps) {
  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Carregando motoristas...</p>;
  }

  if (drivers.length === 0) {
    return <p className="text-sm text-muted-foreground">Nenhum motorista cadastrado.</p>;
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {drivers.map((driver) => (
        <Card key={driver.id} className="bg-card hover:border-primary transition-colors">
          <CardContent className="p-4">
            <div className="mb-4 flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <User className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="font-bold">{driver.nome}</p>
                  <span className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium', statusColors[driver.status])}>
                    {driverStatusLabels[driver.status]}
                  </span>
                </div>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => onEdit(driver)}>
                    <Edit className="h-4 w-4" />
                    Editar
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem variant="destructive" onClick={() => onDelete(driver)}>
                    <Trash2 className="h-4 w-4" />
                    Excluir
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div className="space-y-2 text-sm">
              <Info icon={Phone} text={driver.telefone || 'Sem telefone'} />
              <Info icon={Mail} text={driver.email || 'Sem e-mail'} />
              <Info icon={Truck} text={driver.veiculos ? `${driver.veiculos.placa} - ${driver.veiculos.modelo || 'Sem modelo'}` : 'Sem veiculo vinculado'} />
              <Info icon={User} text={`CNH ${driver.cnh}`} />
              {driver.latitude && driver.longitude && <Info icon={MapPin} text="Online - com coordenadas registradas" className="text-primary" />}
            </div>

            <div className="mt-4 flex gap-2">
              <Button variant="outline" size="sm" className="flex-1 gap-1">
                <MessageSquare className="h-3 w-3" />
                Mensagem
              </Button>
              {driver.latitude && driver.longitude && (
                <Button variant="outline" size="sm" className="gap-1">
                  <MapPin className="h-3 w-3" />
                  Localizar
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function Info({
  icon: Icon,
  text,
  className,
}: {
  icon: React.ComponentType<{ className?: string }>;
  text: string;
  className?: string;
}) {
  return (
    <div className={cn('flex items-center gap-2 text-muted-foreground', className)}>
      <Icon className="h-4 w-4" />
      <span>{text}</span>
    </div>
  );
}
