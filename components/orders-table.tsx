'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { StatusBadge } from '@/components/status-badge';
import { Edit, Eye, MoreVertical, MapPin, Package, Calendar, DollarSign, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { OrderRow } from '@/lib/orders';

interface OrdersTableProps {
  orders: OrderRow[];
  isLoading?: boolean;
  onEdit?: (order: OrderRow) => void;
  onDelete?: (order: OrderRow) => void;
  onTrack?: (order: OrderRow) => void;
}

export function OrdersTable({
  orders,
  isLoading = false,
  onEdit = () => undefined,
  onDelete = () => undefined,
  onTrack = () => undefined,
}: OrdersTableProps) {
  return (
    <Card className="bg-card">
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Codigo
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Destinatario
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Destino
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Volumes
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Prazo
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Valor
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Acoes
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {orders.map((delivery) => (
                <tr key={delivery.id} className="hover:bg-secondary/30 transition-colors">
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2">
                      <Package className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{delivery.codigo_rastreio}</span>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div>
                      <p className="font-medium">{delivery.destinatario_nome}</p>
                      <p className="text-sm text-muted-foreground">{delivery.destinatario_contato || 'Sem contato'}</p>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm">{delivery.destinatario_bairro || 'Sem bairro'}</p>
                        <p className="text-xs text-muted-foreground">
                          {delivery.destinatario_cidade}, {delivery.destinatario_uf}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="text-sm">
                      <p>{delivery.volumes} vol.</p>
                      <p className="text-muted-foreground">{delivery.peso_kg ?? 0}kg</p>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">
                        {delivery.prazo_entrega
                          ? format(new Date(delivery.prazo_entrega), "dd/MM HH:mm", { locale: ptBR })
                          : 'Sem prazo'}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-1">
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">
                        {(delivery.valor_declarado ?? 0).toLocaleString('pt-BR', {
                          style: 'currency',
                          currency: 'BRL',
                        })}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <StatusBadge status={delivery.status} size="sm" />
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onTrack(delivery)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-44">
                          <DropdownMenuItem onClick={() => onTrack(delivery)}>
                            <Eye className="h-4 w-4" />
                            Ver rastreio
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onEdit(delivery)}>
                            <Edit className="h-4 w-4" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem variant="destructive" onClick={() => onDelete(delivery)}>
                            <Trash2 className="h-4 w-4" />
                            Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </td>
                </tr>
              ))}
              {!isLoading && orders.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center text-sm text-muted-foreground">
                    Nenhum pedido encontrado.
                  </td>
                </tr>
              )}
              {isLoading && (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center text-sm text-muted-foreground">
                    Carregando entregas...
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        <div className="flex items-center justify-between border-t border-border px-4 py-3">
          <p className="text-sm text-muted-foreground">
            Exibindo {orders.length} resultado{orders.length === 1 ? '' : 's'}
          </p>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" disabled>
              Anterior
            </Button>
            <Button variant="outline" size="sm" disabled>
              Proximo
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
