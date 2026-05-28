'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Package, Truck, CheckCircle, XCircle } from 'lucide-react';
import type { OrderRow } from '@/lib/orders';

interface OrdersStatsProps {
  orders: OrderRow[];
}

export function OrdersStats({ orders }: OrdersStatsProps) {
  const stats = {
    total: orders.length,
    pendentes: orders.filter(d => d.status === 'PENDENTE' || d.status === 'COLETADO').length,
    emTransito: orders.filter(d => d.status === 'EM_TRANSITO').length,
    entregues: orders.filter(d => d.status === 'ENTREGUE').length,
    insucesso: orders.filter(d => d.status === 'INSUCESSO').length,
  };

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card className="bg-card">
        <CardContent className="flex items-center gap-4 p-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
            <Package className="h-6 w-6 text-primary" />
          </div>
          <div>
            <p className="text-2xl font-bold">{stats.total}</p>
            <p className="text-sm text-muted-foreground">Total de entregas</p>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card">
        <CardContent className="flex items-center gap-4 p-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-chart-2/10">
            <Truck className="h-6 w-6 text-chart-2" />
          </div>
          <div>
            <p className="text-2xl font-bold">{stats.emTransito}</p>
            <p className="text-sm text-muted-foreground">Em Transito</p>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card">
        <CardContent className="flex items-center gap-4 p-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-success/10">
            <CheckCircle className="h-6 w-6 text-success" />
          </div>
          <div>
            <p className="text-2xl font-bold">{stats.entregues}</p>
            <p className="text-sm text-muted-foreground">Entregues</p>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card">
        <CardContent className="flex items-center gap-4 p-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-destructive/10">
            <XCircle className="h-6 w-6 text-destructive" />
          </div>
          <div>
            <p className="text-2xl font-bold">{stats.insucesso}</p>
            <p className="text-sm text-muted-foreground">Insucesso</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
