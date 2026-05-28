'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatusBadge } from '@/components/status-badge';
import { MapPin, Clock, Package } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { DashboardDelivery } from '@/lib/dashboard';

export function DeliveryList({ deliveries }: { deliveries: DashboardDelivery[] }) {
  const recentDeliveries = deliveries.slice(0, 5);
  return (
    <Card className="bg-card">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg font-semibold">Entregas Recentes</CardTitle>
        <a href="/rastreamento" className="text-sm text-primary hover:underline">
          Ver todas
        </a>
      </CardHeader>
      <CardContent className="space-y-4">
        {recentDeliveries.map((delivery) => (
          <div
            key={delivery.id}
            className="flex items-center justify-between rounded-lg border border-border bg-secondary/30 p-4 transition-colors hover:bg-secondary/50"
          >
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Package className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-medium">{delivery.codigo_rastreio}</p>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="h-3 w-3" />
                  <span className="truncate max-w-[200px]">
                    {delivery.destinatario_cidade}, {delivery.destinatario_uf}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <StatusBadge status={delivery.status} size="sm" />
                <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  <span>
                    {delivery.prazo_entrega
                      ? formatDistanceToNow(new Date(delivery.prazo_entrega), {
                          addSuffix: true,
                          locale: ptBR,
                        })
                      : 'Sem prazo'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
        {recentDeliveries.length === 0 && (
          <p className="text-sm text-muted-foreground">Nenhuma entrega cadastrada.</p>
        )}
      </CardContent>
    </Card>
  );
}
