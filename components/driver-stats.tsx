'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Users, UserCheck, Truck, UserX } from 'lucide-react';
import type { DriverRow } from '@/lib/drivers';

interface DriverStatsProps {
  drivers: DriverRow[];
  isLoading: boolean;
}

export function DriverStats({ drivers, isLoading }: DriverStatsProps) {
  const stats = {
    total: drivers.length,
    emRota: drivers.filter((driver) => driver.status === 'EM_ROTA').length,
    disponiveis: drivers.filter((driver) => driver.status === 'DISPONIVEL').length,
    indisponiveis: drivers.filter((driver) => driver.status === 'INDISPONIVEL').length,
  };

  function value(number: number) {
    return isLoading ? '...' : number;
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <StatCard icon={Users} label="Total Motoristas" value={value(stats.total)} className="bg-primary/10 text-primary" />
      <StatCard icon={Truck} label="Em Rota" value={value(stats.emRota)} className="bg-chart-2/10 text-chart-2" />
      <StatCard icon={UserCheck} label="Disponiveis" value={value(stats.disponiveis)} className="bg-success/10 text-success" />
      <StatCard icon={UserX} label="Indisponiveis" value={value(stats.indisponiveis)} className="bg-muted text-muted-foreground" />
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  className,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number | string;
  className: string;
}) {
  return (
    <Card className="bg-card">
      <CardContent className="flex items-center gap-4 p-4">
        <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${className}`}>
          <Icon className="h-6 w-6" />
        </div>
        <div>
          <p className="text-2xl font-bold">{value}</p>
          <p className="text-sm text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}
