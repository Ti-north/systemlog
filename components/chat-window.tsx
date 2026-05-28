'use client';

import { FormEvent, useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { getRouteSubtitle, getRouteTitle, type ChatMessage, type ChatRoute } from '@/lib/messages';
import { Image, MapPin, MoreVertical, Paperclip, Phone, Send, Truck, User } from 'lucide-react';
import { format } from 'date-fns';

interface ChatWindowProps {
  route: ChatRoute | null;
  messages: ChatMessage[];
  isSending: boolean;
  onSendMessage: (content: string) => Promise<void>;
}

export function ChatWindow({ route, messages, isSending, onSendMessage }: ChatWindowProps) {
  const [message, setMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, route?.id]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const content = message.trim();
    if (!content) return;

    await onSendMessage(content);
    setMessage('');
  }

  if (!route) {
    return (
      <div className="flex h-full items-center justify-center bg-background text-sm text-muted-foreground">
        Selecione uma conversa para visualizar as mensagens.
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col bg-background">
      <div className="flex items-center justify-between border-b border-border px-6 py-3">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              <User className="h-5 w-5 text-primary" />
            </div>
            {route.status === 'EM_ANDAMENTO' && <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-background bg-success" />}
          </div>
          <div>
            <p className="font-medium">{getRouteTitle(route)}</p>
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <Truck className="h-3 w-3" />
              {getRouteSubtitle(route)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon">
            <Phone className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon">
            <MapPin className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto p-6">
        <div className="flex items-center gap-4">
          <div className="flex-1 border-t border-border" />
          <span className="text-xs text-muted-foreground">Historico</span>
          <div className="flex-1 border-t border-border" />
        </div>

        {messages.length === 0 && (
          <p className="text-center text-sm text-muted-foreground">Nenhuma mensagem nessa rota ainda.</p>
        )}

        {messages.map((item) => {
          const isBase = item.remetente_tipo === 'BASE';

          return (
            <div key={item.id} className={`flex ${isBase ? 'justify-start' : 'justify-end'}`}>
              <div
                className={`max-w-[60%] rounded-lg px-4 py-2 ${
                  isBase ? 'bg-secondary text-secondary-foreground' : 'bg-primary text-primary-foreground'
                }`}
              >
                <p className="text-sm">{item.conteudo}</p>
                <p className={`mt-1 text-xs ${isBase ? 'text-muted-foreground' : 'opacity-70'}`}>
                  {format(new Date(item.created_at), 'dd/MM HH:mm')}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      <div className="border-t border-border px-6 py-2">
        <div className="flex gap-2 overflow-x-auto pb-2">
          {['Onde voce esta?', 'ETA?', 'Tudo certo?', 'Aguarde instrucoes'].map((quick) => (
            <Button key={quick} variant="outline" size="sm" className="whitespace-nowrap" onClick={() => setMessage(quick)}>
              {quick}
            </Button>
          ))}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="border-t border-border p-4">
        <div className="flex items-center gap-3">
          <Button type="button" variant="ghost" size="icon">
            <Paperclip className="h-4 w-4" />
          </Button>
          <Button type="button" variant="ghost" size="icon">
            <Image className="h-4 w-4" />
          </Button>
          <Input
            type="text"
            placeholder="Digite sua mensagem..."
            className="flex-1"
            value={message}
            onChange={(event) => setMessage(event.target.value)}
          />
          <Button size="icon" disabled={!message.trim() || isSending}>
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </form>
    </div>
  );
}
