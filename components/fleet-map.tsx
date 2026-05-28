'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin, Truck, User, Signal } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { DashboardDriver } from '@/lib/dashboard';

export function FleetMap({ drivers }: { drivers: DashboardDriver[] }) {
  const activeDrivers = drivers.filter((driver) => driver.status === 'EM_ROTA');

  return (
    <Card className="bg-card">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg font-semibold">Frota em Tempo Real</CardTitle>
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1 text-sm text-muted-foreground">
            <Signal className="h-4 w-4 text-success animate-pulse" />
            {activeDrivers.length} ativos
          </span>
        </div>
      </CardHeader>
      <CardContent>
        <div className="relative h-[300px] overflow-hidden rounded-lg bg-secondary/50">
          <div className="absolute inset-0 opacity-20">
            <svg className="h-full w-full" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-foreground" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid)" />
            </svg>
          </div>

          {activeDrivers.map((driver, index) => {
            const positions = [
              { left: '30%', top: '40%' },
              { left: '55%', top: '25%' },
              { left: '70%', top: '60%' },
              { left: '45%', top: '70%' },
            ];
            const pos = positions[index % positions.length];

            return (
              <div key={driver.id} className="absolute z-10 group cursor-pointer" style={{ left: pos.left, top: pos.top }}>
                <div className="absolute -inset-2 rounded-full bg-primary/30 animate-ping" />
                <div className="relative flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg">
                  <Truck className="h-4 w-4" />
                </div>
                <div className="absolute bottom-full left-1/2 z-20 mb-2 -translate-x-1/2 opacity-0 transition-opacity group-hover:opacity-100">
                  <div className="whitespace-nowrap rounded-lg border border-border bg-popover px-3 py-2 shadow-lg">
                    <p className="text-sm font-medium">{driver.nome}</p>
                    <p className="text-xs text-muted-foreground">{driver.veiculos?.placa || 'Sem placa'}</p>
                    {driver.latitude && driver.longitude && (
                      <p className="text-xs text-muted-foreground">{driver.latitude}, {driver.longitude}</p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          <div className="absolute bottom-3 left-3 rounded-lg border border-border bg-card/90 px-3 py-2 text-xs backdrop-blur">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                <div className="h-3 w-3 rounded-full bg-primary" />
                <span>Em rota</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="h-3 w-3 rounded-full bg-muted-foreground" />
                <span>Disponivel</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4 space-y-2">
          {activeDrivers.map((driver) => (
            <div key={driver.id} className="flex items-center justify-between rounded-lg border border-border bg-secondary/30 px-3 py-2">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                  <User className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium">{driver.nome}</p>
                  <p className="text-xs text-muted-foreground">{driver.veiculos?.placa || 'Sem veiculo'} - {driver.veiculos?.modelo || 'Sem modelo'}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={cn('inline-flex items-center gap-1 rounded-full bg-success/20 px-2 py-0.5 text-xs font-medium text-success')}>
                  <MapPin className="h-3 w-3" />
                  Em rota
                </span>
              </div>
            </div>
          ))}
          {activeDrivers.length === 0 && <p className="text-sm text-muted-foreground">Nenhum motorista em rota.</p>}
        </div>
      </CardContent>
    </Card>
  );
}
