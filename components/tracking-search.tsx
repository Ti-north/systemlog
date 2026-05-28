'use client';

import { useMemo, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/status-badge';
import { Search, Package, MapPin, User, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { TrackingDelivery } from '@/lib/tracking';

interface TrackingSearchProps {
  deliveries: TrackingDelivery[];
  selectedDelivery: TrackingDelivery | null;
  isLoading: boolean;
  onSelectDelivery: (delivery: TrackingDelivery) => void;
}

export function TrackingSearch({ deliveries, selectedDelivery, isLoading, onSelectDelivery }: TrackingSearchProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredDeliveries = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    if (!query) {
      return deliveries;
    }

    return deliveries.filter((delivery) =>
      delivery.codigo_rastreio.toLowerCase().includes(query) ||
      delivery.destinatario_nome.toLowerCase().includes(query) ||
      (delivery.pedido_id ?? '').toLowerCase().includes(query),
    );
  }, [deliveries, searchQuery]);

  return (
    <div className="space-y-4">
      <Card className="bg-card">
        <CardContent className="p-4">
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Buscar por codigo, pedido ou destinatario..."
                className="pl-9"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
              />
            </div>
            <Button type="button">Buscar</Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {isLoading && <p className="text-sm text-muted-foreground">Carregando entregas...</p>}
        {!isLoading && filteredDeliveries.length === 0 && (
          <p className="text-sm text-muted-foreground">Nenhuma entrega encontrada.</p>
        )}

        {filteredDeliveries.slice(0, 6).map((delivery) => (
          <Card
            key={delivery.id}
            className={`cursor-pointer bg-card transition-all hover:border-primary ${
              selectedDelivery?.id === delivery.id ? 'border-primary ring-1 ring-primary' : ''
            }`}
            onClick={() => onSelectDelivery(delivery)}
          >
            <CardContent className="p-4">
              <div className="mb-3 flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4 text-primary" />
                  <span className="font-semibold">{delivery.codigo_rastreio}</span>
                </div>
                <StatusBadge status={delivery.status} size="sm" showIcon={false} />
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <User className="h-3 w-3" />
                  <span className="truncate">{delivery.destinatario_nome}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="h-3 w-3" />
                  <span className="truncate">
                    {delivery.destinatario_bairro || 'Sem bairro'}, {delivery.destinatario_cidade}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="h-3 w-3" />
                  <span>
                    Prazo:{' '}
                    {delivery.prazo_entrega
                      ? format(new Date(delivery.prazo_entrega), 'dd/MM HH:mm', { locale: ptBR })
                      : 'Sem prazo'}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
