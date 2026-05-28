'use client';

import { useMemo, useState } from 'react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { getRouteSubtitle, getRouteTitle, type ChatMessage, type ChatRoute } from '@/lib/messages';
import { Search, Truck, User } from 'lucide-react';
import { format } from 'date-fns';

interface ChatListProps {
  routes: ChatRoute[];
  messages: ChatMessage[];
  selectedRouteId: string | null;
  isLoading: boolean;
  onSelectRoute: (routeId: string) => void;
}

export function ChatList({ routes, messages, selectedRouteId, isLoading, onSelectRoute }: ChatListProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredRoutes = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    if (!query) {
      return routes;
    }

    return routes.filter((route) => {
      const title = getRouteTitle(route).toLowerCase();
      const subtitle = getRouteSubtitle(route).toLowerCase();
      return title.includes(query) || subtitle.includes(query);
    });
  }, [routes, searchQuery]);

  const activeRoutes = routes.filter((route) => route.status === 'EM_ANDAMENTO');

  function getLastMessage(routeId: string) {
    return messages.find((message) => message.rota_id === routeId);
  }

  function getUnreadCount(routeId: string) {
    return messages.filter((message) => message.rota_id === routeId && !message.lida && message.remetente_tipo === 'MOTORISTA').length;
  }

  return (
    <div className="flex h-full flex-col bg-card">
      <div className="border-b border-border p-4">
        <h2 className="mb-3 text-lg font-semibold">Mensagens</h2>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Buscar motorista ou rota..."
            className="pl-9"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
          />
        </div>
      </div>

      <div className="border-b border-border p-4">
        <p className="mb-2 text-xs font-medium text-muted-foreground">EM ROTA ({activeRoutes.length})</p>
        <div className="flex gap-3 overflow-x-auto pb-2">
          {activeRoutes.map((route) => (
            <button key={route.id} onClick={() => onSelectRoute(route.id)} className="flex flex-col items-center gap-1">
              <div className="relative">
                <div
                  className={cn(
                    'flex h-12 w-12 items-center justify-center rounded-full',
                    selectedRouteId === route.id ? 'bg-primary/20 ring-2 ring-primary' : 'bg-secondary',
                  )}
                >
                  <User className="h-5 w-5 text-primary" />
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-card bg-success" />
              </div>
              <span className="w-14 truncate text-center text-xs">{getRouteTitle(route).split(' ')[0]}</span>
            </button>
          ))}
          {!isLoading && activeRoutes.length === 0 && <p className="text-sm text-muted-foreground">Nenhuma rota ativa.</p>}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {isLoading && <p className="p-4 text-sm text-muted-foreground">Carregando conversas...</p>}

        {!isLoading && filteredRoutes.length === 0 && (
          <p className="p-4 text-sm text-muted-foreground">Nenhuma conversa encontrada.</p>
        )}

        {filteredRoutes.map((route) => {
          const lastMessage = getLastMessage(route.id);
          const unreadCount = getUnreadCount(route.id);
          const isOnline = route.status === 'EM_ANDAMENTO';

          return (
            <button
              key={route.id}
              onClick={() => onSelectRoute(route.id)}
              className={cn(
                'flex w-full items-center gap-3 px-4 py-3 transition-colors hover:bg-secondary/50',
                selectedRouteId === route.id && 'bg-secondary',
              )}
            >
              <div className="relative">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                  <User className="h-5 w-5 text-primary" />
                </div>
                {isOnline && <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-card bg-success" />}
              </div>
              <div className="min-w-0 flex-1 text-left">
                <div className="flex items-center justify-between">
                  <p className="truncate font-medium">{getRouteTitle(route)}</p>
                  <span className="text-xs text-muted-foreground">
                    {lastMessage ? format(new Date(lastMessage.created_at), 'HH:mm') : '--:--'}
                  </span>
                </div>
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Truck className="h-3 w-3" />
                  <span className="truncate">{lastMessage?.conteudo || getRouteSubtitle(route)}</span>
                </div>
              </div>
              {unreadCount > 0 && (
                <div className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-medium text-primary-foreground">
                  {unreadCount}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
