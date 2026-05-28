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
import { Eye, MoreVertical, Trash2, Mail, Pencil } from 'lucide-react';
import { ClientsRow } from '@/lib/clients';

interface ClientsTableProps {
  clients: ClientsRow[];
  isLoading: boolean; // Movido para obrigatório para controlar o esqueleto na tela
  onEdit: (cliente: ClientsRow) => void;
  onDelete: (cliente: ClientsRow) => void;
  onTrack: (cliente: ClientsRow) => void;
}

export function ClientesTable({ clients, isLoading, onEdit, onDelete, onTrack }: ClientsTableProps) {
  return (
    <Card className="bg-card">
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Razão Social
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Nome Fantasia
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  CNPJ
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  E-mail
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Telefone
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Endereço
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Observações
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {/* Estado de Carregamento */}
              {isLoading && (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center text-sm text-muted-foreground animate-pulse">
                    Carregando clientes reais da base...
                  </td>
                </tr>
              )}

              {/* Lista mapeada diretamente das PROPS dinâmicas do pai */}
              {!isLoading && clients.map((client) => (
                <tr key={client.id} className="hover:bg-secondary/30 transition-colors">
                  <td className="px-4 py-4">
                    <span className="font-medium">{client.razao_social}</span>
                  </td>
                  <td className="px-4 py-4">
                    <span className="font-medium">{client.nome_fantasia || '—'}</span>
                  </td>
                  <td className="px-4 py-4">
                    <p className="font-medium text-sm">{client.cnpj}</p>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <span className="text-sm truncate max-w-[180px]">{client.email || '—'}</span>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-sm">
                    {client.telefone || '—'}
                  </td>
                  <td className="px-4 py-4 text-sm text-muted-foreground">
                    {client.logradouro ? `${client.logradouro}, ${client.numero} - ${client.bairro}` : '—'}
                  </td>
                  <td className="px-4 py-4 text-sm max-w-[200px] truncate">
                    {client.observacoes || '—'}
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-1">
                      {/* Rastrear / Visualizar */}
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onTrack(client)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      {/* Menu de Ações repassando diretamente para as funções do Pai */}
                      <RowActions onEdit={() => onEdit(client)} onDelete={() => onDelete(client)} />
                    </div>
                  </td>
                </tr>
              ))}

              {/* Lista Vazia */}
              {!isLoading && clients.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center text-sm text-muted-foreground">
                    Nenhum cliente encontrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Paginação Dinâmica básica baseada nos dados recebidos */}
        <div className="flex items-center justify-between border-t border-border px-4 py-3">
          <p className="text-sm text-muted-foreground">
            Exibindo {clients.length} resultado{clients.length === 1 ? '' : 's'}
          </p>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" disabled>
              Anterior
            </Button>
            <Button variant="outline" size="sm" disabled>
              Próximo
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function RowActions({ onEdit, onDelete }: { onEdit: () => void; onDelete: () => void }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <MoreVertical className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={onEdit}>
          <Pencil className="mr-2 h-4 w-4" />
          Editar
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onClick={onDelete}>
          <Trash2 className="mr-2 h-4 w-4" />
          Excluir
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}