'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getAddressLine, type TrackingDelivery } from '@/lib/tracking';
import { Truck, MapPin, Navigation } from 'lucide-react';

interface TrackingMapProps {
  delivery: TrackingDelivery | null;
}

export function TrackingMap({ delivery }: TrackingMapProps) {
  if (!delivery) {
    return (
      <Card className="bg-card">
        <CardContent className="flex h-[400px] items-center justify-center text-sm text-muted-foreground">
          Selecione uma entrega para visualizar o rastreamento.
        </CardContent>
      </Card>
    );
  }

  const route = delivery.rotas;
  const driver = route?.motoristas;
  const vehicle = route?.veiculos;
  const currentLatitude = vehicle?.latitude ?? driver?.latitude ?? null;
  const currentLongitude = vehicle?.longitude ?? driver?.longitude ?? null;
  const hasDestinationCoordinates = delivery.destinatario_latitude && delivery.destinatario_longitude;
  const distanceRemaining = route?.km_total && route.km_percorrido !== null
    ? Math.max(route.km_total - (route.km_percorrido ?? 0), 0)
    : null;

  return (
    <Card className="bg-card">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg font-semibold">Localizacao em Tempo Real</CardTitle>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Navigation className="h-4 w-4 text-primary animate-pulse" />
          Dados do Supabase
        </div>
      </CardHeader>
      <CardContent>
        <div className="relative h-[400px] overflow-hidden rounded-lg bg-secondary/50">
          <div className="absolute inset-0 opacity-20">
            <svg className="h-full w-full" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern id="trackingGrid" width="30" height="30" patternUnits="userSpaceOnUse">
                  <path d="M 30 0 L 0 0 0 30" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-foreground" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#trackingGrid)" />
            </svg>
          </div>

          <svg className="absolute inset-0 h-full w-full" xmlns="http://www.w3.org/2000/svg">
            <path d="M 100 350 Q 200 300 250 250 T 350 180 T 450 120" fill="none" stroke="var(--primary)" strokeWidth="3" strokeDasharray="8 4" className="opacity-60" />
            <path d="M 100 350 Q 200 300 250 250" fill="none" stroke="var(--primary)" strokeWidth="3" />
          </svg>

          <MapMarker className="left-[100px] top-[330px]" colorClass="bg-chart-2" label={`Origem: ${delivery.remetente_bairro || delivery.remetente_cidade || 'sem origem'}`} />

          <div className="absolute left-[240px] top-[230px]">
            <div className="absolute -inset-3 rounded-full bg-primary/30 animate-ping" />
            <div className="relative flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg">
              <Truck className="h-5 w-5" />
            </div>
            <div className="absolute left-12 top-0 whitespace-nowrap rounded border border-border bg-popover px-2 py-1 text-xs shadow">
              <p className="font-medium">{driver?.nome || 'Motorista nao vinculado'}</p>
              <p className="text-muted-foreground">{vehicle?.placa || 'Sem veiculo'}</p>
              {currentLatitude && currentLongitude && (
                <p className="text-muted-foreground">{currentLatitude}, {currentLongitude}</p>
              )}
            </div>
          </div>

          <MapMarker className="left-[430px] top-[100px]" colorClass="bg-success" label={`Destino: ${delivery.destinatario_bairro || delivery.destinatario_cidade}`} />

          <div className="absolute bottom-4 left-4 rounded-lg border border-border bg-card/95 px-4 py-2 shadow-lg backdrop-blur">
            <p className="text-xs text-muted-foreground">Tempo estimado</p>
            <p className="text-lg font-bold text-primary">{route?.tempo_estimado_min ? `${route.tempo_estimado_min} min` : 'Sem ETA'}</p>
          </div>

          <div className="absolute bottom-4 right-4 rounded-lg border border-border bg-card/95 px-4 py-2 shadow-lg backdrop-blur">
            <p className="text-xs text-muted-foreground">Distancia restante</p>
            <p className="text-lg font-bold">{distanceRemaining !== null ? `${distanceRemaining.toFixed(1)} km` : 'Sem dado'}</p>
          </div>
        </div>

        <div className="mt-4 grid gap-3 text-sm md:grid-cols-2">
          <p className="text-muted-foreground">Origem: <span className="text-foreground">{getAddressLine(delivery, 'origin') || 'Nao informado'}</span></p>
          <p className="text-muted-foreground">Destino: <span className="text-foreground">{getAddressLine(delivery, 'destination')}</span></p>
          <p className="text-muted-foreground">Rota: <span className="text-foreground">{route?.codigo || 'Sem rota'}</span></p>
          <p className="text-muted-foreground">Coordenadas destino: <span className="text-foreground">{hasDestinationCoordinates ? `${delivery.destinatario_latitude}, ${delivery.destinatario_longitude}` : 'Nao informadas'}</span></p>
        </div>
      </CardContent>
    </Card>
  );
}

function MapMarker({ className, colorClass, label }: { className: string; colorClass: string; label: string }) {
  return (
    <div className={`absolute ${className}`}>
      <div className={`flex h-8 w-8 items-center justify-center rounded-full text-white shadow-lg ${colorClass}`}>
        <MapPin className="h-4 w-4" />
      </div>
      <div className="absolute left-10 top-0 whitespace-nowrap rounded border border-border bg-popover px-2 py-1 text-xs shadow">
        {label}
      </div>
    </div>
  );
}
