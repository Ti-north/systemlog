'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { mockDeliveries, mockDrivers, mockRoutes } from '@/lib/mock-data';
import { StatusBadge } from '@/components/status-badge';
import {
  Truck,
  Package,
  MapPin,
  Navigation,
  Phone,
  CheckCircle,
  XCircle,
  Camera,
  PenLine,
  MessageSquare,
  Menu,
  User,
  Clock,
  ChevronRight,
  Fuel,
  Coffee,
  Wrench,
  AlertTriangle,
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { Delivery } from '@/lib/types';

type Tab = 'rota' | 'entregas' | 'chat';
type StopType = 'ABASTECIMENTO' | 'DESCANSO' | 'MANUTENCAO' | 'REFEICAO';

const stopTypes = [
  { type: 'ABASTECIMENTO' as StopType, icon: Fuel, label: 'Abastecimento' },
  { type: 'DESCANSO' as StopType, icon: Coffee, label: 'Descanso' },
  { type: 'MANUTENCAO' as StopType, icon: Wrench, label: 'Manutencao' },
  { type: 'REFEICAO' as StopType, icon: Coffee, label: 'Refeicao' },
];

export default function DriverAppPage() {
  const [activeTab, setActiveTab] = useState<Tab>('rota');
  const [selectedDelivery, setSelectedDelivery] = useState<Delivery | null>(null);
  const [showStopModal, setShowStopModal] = useState(false);

  const driver = mockDrivers[0];
  const route = mockRoutes[0];
  const deliveries = mockDeliveries.filter((d) => d.rota_id === route.id);

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Container */}
      <div className="mx-auto max-w-md">
        {/* Status Bar */}
        <div className="flex items-center justify-between bg-primary px-4 py-2 text-primary-foreground">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-success animate-pulse" />
            <span className="text-xs">Online</span>
          </div>
          <span className="text-xs">{format(new Date(), "HH:mm")}</span>
        </div>

        {/* Header */}
        <header className="flex items-center justify-between bg-card px-4 py-3 border-b border-border">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon">
              <Menu className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-2">
              <Truck className="h-5 w-5 text-primary" />
              <span className="font-semibold">LogiTrack</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="relative">
              <MessageSquare className="h-5 w-5" />
              <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] text-white">
                2
              </span>
            </Button>
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
              <User className="h-4 w-4 text-primary" />
            </div>
          </div>
        </header>

        {/* Driver Info Card */}
        <div className="bg-card px-4 py-3 border-b border-border">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold">{driver.nome}</p>
              <p className="text-sm text-muted-foreground">Rota: {route.codigo}</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium text-primary">{deliveries.length} entregas</p>
              <p className="text-xs text-muted-foreground">{route.km_total - route.km_percorrido} km restantes</p>
            </div>
          </div>
          {/* Progress bar */}
          <div className="mt-2">
            <div className="flex justify-between text-xs text-muted-foreground mb-1">
              <span>Progresso</span>
              <span>{Math.round((route.km_percorrido / route.km_total) * 100)}%</span>
            </div>
            <div className="h-2 rounded-full bg-secondary">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{ width: `${(route.km_percorrido / route.km_total) * 100}%` }}
              />
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-border bg-card">
          {[
            { id: 'rota' as Tab, label: 'Rota', icon: Navigation },
            { id: 'entregas' as Tab, label: 'Entregas', icon: Package },
            { id: 'chat' as Tab, label: 'Chat', icon: MessageSquare },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'flex flex-1 items-center justify-center gap-2 py-3 text-sm font-medium transition-colors',
                activeTab === tab.id
                  ? 'border-b-2 border-primary text-primary'
                  : 'text-muted-foreground'
              )}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="p-4">
          {activeTab === 'rota' && (
            <div className="space-y-4">
              {/* Current Delivery */}
              <Card className="bg-primary/5 border-primary">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">Proxima Entrega</CardTitle>
                    <StatusBadge status="EM_TRANSITO" size="sm" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <p className="font-semibold">{deliveries[0]?.destinatario.nome}</p>
                      <div className="flex items-start gap-2 mt-1 text-sm text-muted-foreground">
                        <MapPin className="h-4 w-4 mt-0.5 shrink-0" />
                        <span>
                          {deliveries[0]?.destinatario.endereco.logradouro},{' '}
                          {deliveries[0]?.destinatario.endereco.numero} -{' '}
                          {deliveries[0]?.destinatario.endereco.bairro}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        <span>ETA: 15 min</span>
                      </div>
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Package className="h-4 w-4" />
                        <span>{deliveries[0]?.volumes} vol.</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button className="flex-1 gap-2">
                        <Navigation className="h-4 w-4" />
                        Navegar
                      </Button>
                      <Button variant="outline" size="icon">
                        <Phone className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Upcoming Deliveries */}
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-3">Proximas na rota</h3>
                <div className="space-y-2">
                  {deliveries.slice(1).map((delivery, index) => (
                    <Card key={delivery.id} className="bg-card">
                      <CardContent className="p-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary text-sm font-medium">
                              {index + 2}
                            </div>
                            <div>
                              <p className="font-medium text-sm">{delivery.destinatario.nome}</p>
                              <p className="text-xs text-muted-foreground">
                                {delivery.destinatario.endereco.bairro}
                              </p>
                            </div>
                          </div>
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Register Stop Button */}
              <Button
                variant="outline"
                className="w-full gap-2"
                onClick={() => setShowStopModal(true)}
              >
                <AlertTriangle className="h-4 w-4" />
                Registrar Parada
              </Button>
            </div>
          )}

          {activeTab === 'entregas' && (
            <div className="space-y-3">
              {deliveries.map((delivery) => (
                <Card
                  key={delivery.id}
                  className={cn(
                    'bg-card cursor-pointer transition-all',
                    selectedDelivery?.id === delivery.id && 'border-primary ring-1 ring-primary'
                  )}
                  onClick={() => setSelectedDelivery(delivery)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-semibold">{delivery.codigo_rastreio}</p>
                        <p className="text-sm text-muted-foreground">{delivery.destinatario.nome}</p>
                      </div>
                      <StatusBadge status={delivery.status} size="sm" showIcon={false} />
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                      <MapPin className="h-3 w-3" />
                      <span className="truncate">
                        {delivery.destinatario.endereco.logradouro}, {delivery.destinatario.endereco.numero}
                      </span>
                    </div>

                    {/* Action Buttons for selected delivery */}
                    {selectedDelivery?.id === delivery.id && delivery.status === 'EM_TRANSITO' && (
                      <div className="flex gap-2 pt-3 border-t border-border">
                        <Button size="sm" className="flex-1 gap-1 bg-success hover:bg-success/90">
                          <CheckCircle className="h-4 w-4" />
                          Entregar
                        </Button>
                        <Button size="sm" variant="destructive" className="flex-1 gap-1">
                          <XCircle className="h-4 w-4" />
                          Insucesso
                        </Button>
                      </div>
                    )}

                    {/* Proof of delivery buttons */}
                    {selectedDelivery?.id === delivery.id && delivery.status === 'EM_TRANSITO' && (
                      <div className="flex gap-2 mt-2">
                        <Button size="sm" variant="outline" className="flex-1 gap-1">
                          <Camera className="h-4 w-4" />
                          Foto Canhoto
                        </Button>
                        <Button size="sm" variant="outline" className="flex-1 gap-1">
                          <PenLine className="h-4 w-4" />
                          Assinatura
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {activeTab === 'chat' && (
            <div className="space-y-4">
              {/* Chat Header */}
              <Card className="bg-card">
                <CardContent className="p-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                      <User className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">Base Operacional</p>
                      <p className="text-xs text-success">Online</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Messages */}
              <div className="space-y-3">
                <div className="flex justify-start">
                  <div className="max-w-[80%] rounded-lg bg-secondary px-3 py-2">
                    <p className="text-sm">Boa tarde! Como esta o transito?</p>
                    <p className="text-xs text-muted-foreground mt-1">14:32</p>
                  </div>
                </div>
                <div className="flex justify-end">
                  <div className="max-w-[80%] rounded-lg bg-primary px-3 py-2 text-primary-foreground">
                    <p className="text-sm">Boa tarde! Transito intenso na Marginal, mas seguindo a rota.</p>
                    <p className="text-xs opacity-70 mt-1">14:35</p>
                  </div>
                </div>
                <div className="flex justify-start">
                  <div className="max-w-[80%] rounded-lg bg-secondary px-3 py-2">
                    <p className="text-sm">Ok! A entrega 3 foi cancelada. Pode pular para a proxima.</p>
                    <p className="text-xs text-muted-foreground mt-1">14:40</p>
                  </div>
                </div>
              </div>

              {/* Input */}
              <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border p-4 max-w-md mx-auto">
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Digite sua mensagem..."
                    className="flex-1 rounded-lg border border-input bg-background px-3 py-2 text-sm"
                  />
                  <Button size="icon">
                    <MessageSquare className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Stop Modal */}
        {showStopModal && (
          <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50">
            <div className="w-full max-w-md rounded-t-xl bg-card p-4">
              <h3 className="text-lg font-semibold mb-4">Registrar Parada</h3>
              <div className="grid grid-cols-2 gap-3">
                {stopTypes.map((stop) => (
                  <Button
                    key={stop.type}
                    variant="outline"
                    className="h-20 flex-col gap-2"
                    onClick={() => setShowStopModal(false)}
                  >
                    <stop.icon className="h-6 w-6" />
                    <span>{stop.label}</span>
                  </Button>
                ))}
              </div>
              <Button
                variant="ghost"
                className="w-full mt-4"
                onClick={() => setShowStopModal(false)}
              >
                Cancelar
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
