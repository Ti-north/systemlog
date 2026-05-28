import { useEffect, useMemo, useState } from 'react';
import { Sidebar } from '@/components/sidebar';
import { Header } from '@/components/header';
import { ChatList } from '@/components/chat-list';
import { ChatWindow } from '@/components/chat-window';
import { supabase } from '@/lib/supabase';
import type { ChatMessage, ChatRoute } from '@/lib/messages';

export default function MensagensPage() {
  const [routes, setRoutes] = useState<ChatRoute[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [message, setMessage] = useState('');

  const selectedRoute = useMemo(
    () => routes.find((route) => route.id === selectedRouteId) ?? null,
    [routes, selectedRouteId],
  );

  const selectedMessages = useMemo(
    () => messages.filter((item) => item.rota_id === selectedRouteId).sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()),
    [messages, selectedRouteId],
  );

  async function loadData() {
    if (!supabase) {
      setMessage('Configure o Supabase para carregar mensagens reais.');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    const [routesResult, messagesResult] = await Promise.all([
      supabase
        .from('rotas')
        .select('id, codigo, status, motorista_id, veiculo_id, motoristas(id, nome, telefone, email, status, latitude, longitude), veiculos(id, placa, modelo)')
        .order('created_at', { ascending: false }),
      supabase.from('mensagens').select('*').order('created_at', { ascending: false }),
    ]);

    if (routesResult.error || messagesResult.error) {
      setMessage(routesResult.error?.message || messagesResult.error?.message || 'Erro ao carregar mensagens.');
    } else {
      const nextRoutes = ((routesResult.data ?? []) as unknown as Array<ChatRoute & {
        motoristas?: ChatRoute['motoristas'] | ChatRoute['motoristas'][];
        veiculos?: ChatRoute['veiculos'] | ChatRoute['veiculos'][];
      }>).map((route) => ({
        ...route,
        motoristas: Array.isArray(route.motoristas) ? route.motoristas[0] ?? null : route.motoristas ?? null,
        veiculos: Array.isArray(route.veiculos) ? route.veiculos[0] ?? null : route.veiculos ?? null,
      }));
      setRoutes(nextRoutes);
      setMessages((messagesResult.data ?? []) as ChatMessage[]);
      setSelectedRouteId((current) => current ?? nextRoutes[0]?.id ?? null);
      setMessage('');
    }

    setIsLoading(false);
  }

  useEffect(() => {
    void loadData();
  }, []);

  useEffect(() => {
    if (!supabase) return;
    const client = supabase;

    const channel = client
      .channel('mensagens-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'mensagens',
        },
        () => {
          void loadData();
        },
      )
      .subscribe();

    return () => {
      void client.removeChannel(channel);
    };
  }, []);

  async function handleSelectRoute(routeId: string) {
    setSelectedRouteId(routeId);

    if (!supabase) return;

    await supabase
      .from('mensagens')
      .update({ lida: true })
      .eq('rota_id', routeId)
      .eq('remetente_tipo', 'MOTORISTA');

    setMessages((current) =>
      current.map((item) =>
        item.rota_id === routeId && item.remetente_tipo === 'MOTORISTA'
          ? { ...item, lida: true }
          : item,
      ),
    );
  }

  async function handleSendMessage(content: string) {
    if (!supabase || !selectedRouteId) {
      setMessage('Selecione uma rota antes de enviar mensagem.');
      return;
    }

    setIsSending(true);

    const { data: userData } = await supabase.auth.getUser();
    const { error } = await supabase.from('mensagens').insert({
      rota_id: selectedRouteId,
      remetente_id: userData.user?.id ?? null,
      remetente_tipo: 'BASE',
      conteudo: content,
      lida: true,
    });

    if (error) {
      setMessage(`Erro ao enviar mensagem: ${error.message}`);
    } else {
      await loadData();
    }

    setIsSending(false);
  }

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />

      <div className="ml-64 flex-1">
        <Header />

        <main className="flex h-[calc(100vh-4rem)]">
          <div className="w-80 border-r border-border">
            <ChatList
              routes={routes}
              messages={messages}
              selectedRouteId={selectedRouteId}
              isLoading={isLoading}
              onSelectRoute={handleSelectRoute}
            />
          </div>

          <div className="flex flex-1 flex-col">
            {message && (
              <div className="border-b border-border bg-card px-4 py-2 text-sm text-muted-foreground">
                {message}
              </div>
            )}
            <ChatWindow
              route={selectedRoute}
              messages={selectedMessages}
              isSending={isSending}
              onSendMessage={handleSendMessage}
            />
          </div>
        </main>
      </div>
    </div>
  );
}
