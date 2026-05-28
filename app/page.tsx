'use client';

import { useEffect, useMemo, useState } from 'react';
import { Sidebar } from '@/components/sidebar';
import { Header } from '@/components/header';
import { AuthGuard } from '@/components/auth-guard';
import { KPICard } from '@/components/kpi-card';
import { DeliveryList } from '@/components/delivery-list';
import { FleetMap } from '@/components/fleet-map';
import { DeliveryChart } from '@/components/delivery-chart';
import { StatusChart } from '@/components/status-chart';
import { AlertsPanel } from '@/components/alerts-panel';
import { supabase } from '@/lib/supabase';
import {
  buildDeliveryTrend,
  buildStatusDistribution,
  calculateDashboardKpis,
  type DashboardDelivery,
  type DashboardDriver,
  type DashboardOccurrence,
  type DashboardPayment,
  type DashboardRoute,
} from '@/lib/dashboard';
import {
  CheckCircle,
  Clock,
  DollarSign,
  XCircle,
  Package,
  Route,
} from 'lucide-react';

export default function Dashboard() {
  const [deliveries, setDeliveries] = useState<DashboardDelivery[]>([]);
  const [routes, setRoutes] = useState<DashboardRoute[]>([]);
  const [drivers, setDrivers] = useState<DashboardDriver[]>([]);
  const [occurrences, setOccurrences] = useState<DashboardOccurrence[]>([]);
  const [payments, setPayments] = useState<DashboardPayment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState('');

  async function loadDashboard() {
    if (!supabase) {
      setMessage('Configure o Supabase para carregar o dashboard real.');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    const [deliveriesResult, routesResult, driversResult, occurrencesResult, paymentsResult] = await Promise.all([
      supabase
        .from('entregas')
        .select('id, codigo_rastreio, destinatario_nome, destinatario_cidade, destinatario_uf, status, prazo_entrega, data_coleta, data_entrega, valor_declarado, created_at')
        .order('created_at', { ascending: false })
        .limit(200),
      supabase
        .from('rotas')
        .select('id, codigo, data_prevista, status, km_total, km_percorrido')
        .order('created_at', { ascending: false })
        .limit(200),
      supabase
        .from('motoristas')
        .select('id, nome, status, veiculo_id, latitude, longitude, veiculos:veiculo_id(id, placa, modelo)')
        .order('created_at', { ascending: false })
        .limit(100),
      supabase
        .from('ocorrencias')
        .select('id, tipo, descricao, gravidade, status, created_at')
        .order('created_at', { ascending: false })
        .limit(5),
      supabase
        .from('pagamentos')
        .select('valor, status')
        .limit(200),
    ]);

    const firstError = deliveriesResult.error || routesResult.error || driversResult.error || occurrencesResult.error || paymentsResult.error;

    if (firstError) {
      setMessage(`Erro ao carregar dashboard: ${firstError.message}`);
    } else {
      const normalizedDrivers = ((driversResult.data ?? []) as unknown as Array<DashboardDriver & { veiculos?: DashboardDriver['veiculos'] | DashboardDriver['veiculos'][] }>).map((driver) => ({
        ...driver,
        veiculos: Array.isArray(driver.veiculos) ? driver.veiculos[0] ?? null : driver.veiculos ?? null,
      }));

      setDeliveries((deliveriesResult.data ?? []) as DashboardDelivery[]);
      setRoutes((routesResult.data ?? []) as DashboardRoute[]);
      setDrivers(normalizedDrivers);
      setOccurrences((occurrencesResult.data ?? []) as DashboardOccurrence[]);
      setPayments((paymentsResult.data ?? []) as DashboardPayment[]);
      setMessage('');
    }

    setIsLoading(false);
  }

  useEffect(() => {
    void loadDashboard();
  }, []);

  const kpis = useMemo(() => calculateDashboardKpis(deliveries, routes, payments), [deliveries, routes, payments]);
  const deliveryTrend = useMemo(() => buildDeliveryTrend(deliveries), [deliveries]);
  const statusDistribution = useMemo(() => buildStatusDistribution(deliveries), [deliveries]);

  return (
    <AuthGuard>
      <div className="flex min-h-screen bg-background">
        <Sidebar />
        
        <div className="ml-64 flex-1">
          <Header />
          
          <main className="p-6">
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-balance">Dashboard NorthSeven</h1>
              <p className="text-muted-foreground">
                Monitoramento em tempo real
              </p>
            </div>

            {message && (
              <div className="mb-4 rounded-lg border border-border bg-card px-4 py-3 text-sm text-muted-foreground">
                {message}
              </div>
            )}

            <div className="mb-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
              <KPICard
                title="OTIF"
                value={isLoading ? '...' : `${kpis.otif}%`}
                subtitle="entregas no prazo"
                icon={CheckCircle}
              />
              <KPICard
                title="Lead Time"
                value={isLoading ? '...' : `${kpis.leadTimeMedio}h`}
                subtitle="media real"
                icon={Clock}
              />
              <KPICard
                title="Custo/KM"
                value={isLoading ? '...' : kpis.custoPorKm.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                subtitle="pagamentos / km"
                icon={DollarSign}
              />
              <KPICard
                title="Taxa Insucesso"
                value={isLoading ? '...' : `${kpis.taxaInsucesso}%`}
                subtitle="sobre total"
                icon={XCircle}
              />
              <KPICard
                title="Entregas Hoje"
                value={isLoading ? '...' : kpis.entregasDia}
                subtitle="cadastradas hoje"
                icon={Package}
              />
              <KPICard
                title="KM Rodados"
                value={isLoading ? '...' : kpis.kmDia.toLocaleString('pt-BR')}
                subtitle="rotas de hoje"
                icon={Route}
              />
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
              <div className="lg:col-span-2 space-y-6">
                <DeliveryChart data={deliveryTrend} />
                <div className="grid gap-6 md:grid-cols-2">
                  <StatusChart data={statusDistribution} />
                  <AlertsPanel occurrences={occurrences} />
                </div>
              </div>

              <div className="space-y-6">
                <FleetMap drivers={drivers} />
                <DeliveryList deliveries={deliveries} />
              </div>
            </div>
          </main>
        </div>
      </div>
    </AuthGuard>
  );
}
