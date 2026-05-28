'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatusBadge } from '@/components/status-badge';
import { Package, Truck, CheckCircle, MapPin, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import type { DeliveryStatus } from '@/lib/types';
import type { TrackingDelivery, TrackingEvent } from '@/lib/tracking';

interface TimelineEventView {
  id: string
  status: DeliveryStatus
  title: string
  description: string
  time: string
  completed: boolean
  current?: boolean
  icon: React.ComponentType<{ className?: string }>
  latitude?: number | null
  longitude?: number | null
}

interface TrackingTimelineProps {
  delivery: TrackingDelivery | null;
  events: TrackingEvent[];
}

const statusTitle: Record<DeliveryStatus, string> = {
  PENDENTE: 'Pedido cadastrado',
  COLETADO: 'Mercadoria coletada',
  EM_TRANSITO: 'Em rota de entrega',
  ENTREGUE: 'Entrega concluida',
  INSUCESSO: 'Entrega com insucesso',
  REENTREGA: 'Reentrega programada',
  DEVOLUCAO: 'Devolucao iniciada',
};

const statusIcon: Record<DeliveryStatus, React.ComponentType<{ className?: string }>> = {
  PENDENTE: Package,
  COLETADO: Package,
  EM_TRANSITO: Truck,
  ENTREGUE: CheckCircle,
  INSUCESSO: Clock,
  REENTREGA: Truck,
  DEVOLUCAO: Truck,
};

export function TrackingTimeline({ delivery, events }: TrackingTimelineProps) {
  if (!delivery) {
    return (
      <Card className="bg-card">
        <CardContent className="p-6 text-sm text-muted-foreground">
          Selecione uma entrega.
        </CardContent>
      </Card>
    );
  }

  const timelineEvents = buildTimeline(delivery, events);

  return (
    <Card className="bg-card">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">Historico</CardTitle>
          <StatusBadge status={delivery.status} size="sm" />
        </div>
        <div className="mt-2 text-sm text-muted-foreground">
          <p className="font-medium text-foreground">{delivery.codigo_rastreio}</p>
          <p>{delivery.destinatario_nome}</p>
        </div>
      </CardHeader>
      <CardContent>
        <div className="relative">
          <div className="absolute bottom-2 left-4 top-2 w-0.5 bg-border" />

          <div className="space-y-6">
            {timelineEvents.map((event) => {
              const Icon = event.icon;
              return (
                <div key={event.id} className="relative flex gap-4">
                  <div
                    className={cn(
                      'relative z-10 flex h-8 w-8 items-center justify-center rounded-full',
                      event.current
                        ? 'bg-primary text-primary-foreground ring-4 ring-primary/20'
                        : event.completed
                          ? 'bg-success text-success-foreground'
                          : 'bg-muted text-muted-foreground',
                    )}
                  >
                    <Icon className="h-4 w-4" />
                  </div>

                  <div className="flex-1 pb-2">
                    <p className={cn('font-medium', event.current ? 'text-primary' : !event.completed && 'text-muted-foreground')}>
                      {event.title}
                    </p>
                    <p className="text-sm text-muted-foreground">{event.description}</p>
                    <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      <span>{format(new Date(event.time), "dd/MM/yyyy 'as' HH:mm", { locale: ptBR })}</span>
                    </div>
                    {event.current && (
                      <div className="mt-2 flex items-center gap-2 rounded-lg bg-primary/10 px-3 py-2 text-sm">
                        <MapPin className="h-4 w-4 text-primary" />
                        <span>
                          {event.latitude && event.longitude
                            ? `Localizacao atual: ${event.latitude}, ${event.longitude}`
                            : `Localizacao atual: ${delivery.rotas?.veiculos?.placa || delivery.rotas?.codigo || 'sem coordenadas'}`}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function buildTimeline(delivery: TrackingDelivery, events: TrackingEvent[]): TimelineEventView[] {
  if (events.length > 0) {
    return events
      .slice()
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
      .map((event) => ({
        id: event.id,
        status: event.status,
        title: statusTitle[event.status],
        description: event.descricao,
        time: event.created_at,
        completed: true,
        current: event.status === delivery.status,
        icon: statusIcon[event.status],
        latitude: event.latitude,
        longitude: event.longitude,
      }));
  }

  const fallback: TimelineEventView[] = [
    {
      id: 'created',
      status: 'PENDENTE',
      title: 'Pedido cadastrado',
      description: 'Pedido recebido no sistema',
      time: delivery.created_at,
      completed: true,
      current: delivery.status === 'PENDENTE',
      icon: Package,
    },
  ];

  if (delivery.data_coleta) {
    fallback.push({
      id: 'coleta',
      status: 'COLETADO',
      title: 'Mercadoria coletada',
      description: delivery.remetente_nome ? `Coletado no remetente ${delivery.remetente_nome}` : 'Mercadoria coletada',
      time: delivery.data_coleta,
      completed: true,
      current: delivery.status === 'COLETADO',
      icon: Package,
    });
  }

  if (delivery.status === 'EM_TRANSITO') {
    fallback.push({
      id: 'transito',
      status: 'EM_TRANSITO',
      title: 'Em rota de entrega',
      description: delivery.rotas?.motoristas?.nome
        ? `Motorista ${delivery.rotas.motoristas.nome}`
        : 'Entrega em deslocamento',
      time: delivery.data_coleta || delivery.created_at,
      completed: true,
      current: true,
      icon: Truck,
      latitude: delivery.rotas?.veiculos?.latitude ?? delivery.rotas?.motoristas?.latitude,
      longitude: delivery.rotas?.veiculos?.longitude ?? delivery.rotas?.motoristas?.longitude,
    });
  }

  if (delivery.data_entrega || delivery.status === 'ENTREGUE') {
    fallback.push({
      id: 'entrega',
      status: 'ENTREGUE',
      title: 'Entrega concluida',
      description: `Entregue para ${delivery.destinatario_nome}`,
      time: delivery.data_entrega || delivery.created_at,
      completed: true,
      current: delivery.status === 'ENTREGUE',
      icon: CheckCircle,
    });
  } else if (delivery.prazo_entrega) {
    fallback.push({
      id: 'prevista',
      status: 'ENTREGUE',
      title: 'Entrega prevista',
      description: `${delivery.destinatario_logradouro}, ${delivery.destinatario_numero || ''} - ${delivery.destinatario_cidade}`,
      time: delivery.prazo_entrega,
      completed: false,
      icon: CheckCircle,
    });
  }

  return fallback;
}
