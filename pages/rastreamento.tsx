import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import { Sidebar } from '@/components/sidebar';
import { Header } from '@/components/header';
import { TrackingSearch } from '@/components/tracking-search';
import { TrackingMap } from '@/components/tracking-map';
import { TrackingTimeline } from '@/components/tracking-timeline';
import { supabase } from '@/lib/supabase';
import type { TrackingDelivery, TrackingEvent } from '@/lib/tracking';

export default function RastreamentoPage() {
  const router = useRouter();
  const [deliveries, setDeliveries] = useState<TrackingDelivery[]>([]);
  const [events, setEvents] = useState<TrackingEvent[]>([]);
  const [selectedDeliveryId, setSelectedDeliveryId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState('');

  const selectedDelivery = useMemo(
    () => deliveries.find((delivery) => delivery.id === selectedDeliveryId) ?? null,
    [deliveries, selectedDeliveryId],
  );

  const selectedEvents = useMemo(
    () => events.filter((event) => event.entrega_id === selectedDeliveryId),
    [events, selectedDeliveryId],
  );

  async function loadTrackingData() {
    if (!supabase) {
      setMessage('Configure o Supabase para carregar rastreamentos reais.');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    const [deliveriesResult, eventsResult] = await Promise.all([
      supabase
        .from('entregas')
        .select(`
          id,
          codigo_rastreio,
          pedido_id,
          rota_id,
          remetente_nome,
          remetente_logradouro,
          remetente_numero,
          remetente_bairro,
          remetente_cidade,
          remetente_uf,
          destinatario_nome,
          destinatario_logradouro,
          destinatario_numero,
          destinatario_bairro,
          destinatario_cidade,
          destinatario_uf,
          destinatario_latitude,
          destinatario_longitude,
          status,
          prazo_entrega,
          data_coleta,
          data_entrega,
          created_at,
          rotas:rota_id (
            id,
            codigo,
            status,
            km_total,
            km_percorrido,
            tempo_estimado_min,
            motoristas:motorista_id (
              id,
              nome,
              telefone,
              latitude,
              longitude
            ),
            veiculos:veiculo_id (
              id,
              placa,
              modelo,
              latitude,
              longitude
            )
          )
        `)
        .order('created_at', { ascending: false }),
      supabase
        .from('entrega_eventos')
        .select('*')
        .order('created_at', { ascending: true }),
    ]);

    if (deliveriesResult.error || eventsResult.error) {
      setMessage(deliveriesResult.error?.message || eventsResult.error?.message || 'Erro ao carregar rastreamento.');
    } else {
      const normalizedDeliveries = ((deliveriesResult.data ?? []) as unknown as Array<
        TrackingDelivery & {
          rotas?: (TrackingDelivery['rotas'] & {
            motoristas?: TrackingDelivery['rotas'] extends infer R
              ? R extends { motoristas?: infer M }
                ? M | M[]
                : never
              : never
            veiculos?: TrackingDelivery['rotas'] extends infer R
              ? R extends { veiculos?: infer V }
                ? V | V[]
                : never
              : never
          }) | TrackingDelivery['rotas'][]
        }
      >).map((delivery) => {
        const route = Array.isArray(delivery.rotas) ? delivery.rotas[0] ?? null : delivery.rotas ?? null;

        return {
          ...delivery,
          rotas: route
            ? {
                ...route,
                motoristas: Array.isArray(route.motoristas) ? route.motoristas[0] ?? null : route.motoristas ?? null,
                veiculos: Array.isArray(route.veiculos) ? route.veiculos[0] ?? null : route.veiculos ?? null,
              }
            : null,
        };
      });

      setDeliveries(normalizedDeliveries);
      setEvents((eventsResult.data ?? []) as TrackingEvent[]);
      setMessage('');

      const urlCode = typeof router.query.codigo === 'string' ? router.query.codigo : '';
      const deliveryFromUrl = normalizedDeliveries.find((delivery) => delivery.codigo_rastreio === urlCode || delivery.pedido_id === urlCode);
      setSelectedDeliveryId((current) => deliveryFromUrl?.id ?? current ?? normalizedDeliveries[0]?.id ?? null);
    }

    setIsLoading(false);
  }

  useEffect(() => {
    if (!router.isReady) return;
    void loadTrackingData();
  }, [router.isReady, router.query.codigo]);

  function handleSelectDelivery(delivery: TrackingDelivery) {
    setSelectedDeliveryId(delivery.id);
    void router.replace(
      {
        pathname: router.pathname,
        query: { codigo: delivery.codigo_rastreio },
      },
      undefined,
      { shallow: true },
    );
  }

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />

      <div className="ml-64 flex-1">
        <Header />

        <main className="p-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-balance">Rastreamento</h1>
            <p className="text-muted-foreground">Acompanhe suas entregas em tempo real</p>
          </div>

          {message && (
            <div className="mb-4 rounded-lg border border-border bg-card px-4 py-3 text-sm text-muted-foreground">
              {message}
            </div>
          )}

          <TrackingSearch
            deliveries={deliveries}
            selectedDelivery={selectedDelivery}
            isLoading={isLoading}
            onSelectDelivery={handleSelectDelivery}
          />

          <div className="mt-6 grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <TrackingMap delivery={selectedDelivery} />
            </div>
            <div>
              <TrackingTimeline delivery={selectedDelivery} events={selectedEvents} />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
