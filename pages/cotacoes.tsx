import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Calculator, FilePlus2, MoreVertical, Pencil, Trash2, TrendingUp, Eye, Edit, } from 'lucide-react';
import { Header } from '@/components/header';
import { Sidebar } from '@/components/sidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { supabase } from '@/lib/supabase';
import {
  createCode,
  emptyQuoteForm,
  quoteStatusLabels,
  toIntegerOrNull,
  toNumberOrNull,
  type ClientOption,
  type QuoteFormData,
  type QuoteRow,
  type QuoteStatus,
} from '@/lib/commercial';

export default function CotacoesPage() {
  const [quotes, setQuotes] = useState<QuoteRow[]>([]);
  const [clients, setClients] = useState<ClientOption[]>([]);
  const [formData, setFormData] = useState<QuoteFormData>(emptyQuoteForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState('');

  const stats = useMemo(() => {
    const approved = quotes.filter((quote) => quote.status === 'APROVADA');
    const averageTicket = approved.length
      ? approved.reduce((sum, quote) => sum + (quote.preco_venda ?? 0), 0) / approved.length
      : 0;

    return {
      abertas: quotes.filter((quote) => !['APROVADA', 'RECUSADA', 'CANCELADA'].includes(quote.status)).length,
      conversao: quotes.length ? Math.round((approved.length / quotes.length) * 100) : 0,
      ticketMedio: averageTicket,
    };
  }, [quotes]);

  async function loadData() {
    if (!supabase) {
      setMessage('Configure o Supabase para carregar cotacoes reais.');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    const [{ data: quoteData, error: quoteError }, { data: clientData, error: clientError }] = await Promise.all([
      supabase.from('cotacoes').select('*, clientes(id, razao_social, nome_fantasia)').order('created_at', { ascending: false }),
      supabase.from('clientes').select('id, razao_social, nome_fantasia').order('razao_social', { ascending: true }),
    ]);

    if (quoteError || clientError) {
      setMessage(quoteError?.message || clientError?.message || 'Erro ao carregar dados.');
    } else {
      setQuotes((quoteData ?? []) as QuoteRow[]);
      setClients((clientData ?? []) as ClientOption[]);
      setMessage('');
    }

    setIsLoading(false);
  }

  useEffect(() => {
    void loadData();
  }, []);

  function openNewDialog() {
    setEditingId(null);
    setFormData({ ...emptyQuoteForm, codigo: createCode('COT') });
    setIsDialogOpen(true);
  }

  function openEditDialog(quote: QuoteRow) {
    setEditingId(quote.id);
    setFormData({
      codigo: quote.codigo,
      cliente_id: quote.cliente_id ?? '',
      origem_cidade: quote.origem?.cidade ?? '',
      origem_uf: quote.origem?.uf ?? '',
      destino_cidade: quote.destino?.cidade ?? '',
      destino_uf: quote.destino?.uf ?? '',
      volumes: String(quote.volumes),
      peso_kg: String(quote.peso_kg),
      cubagem_m3: String(quote.cubagem_m3),
      distancia_km: quote.distancia_km ? String(quote.distancia_km) : '',
      prazo_dias: quote.prazo_dias ? String(quote.prazo_dias) : '',
      custo_estimado: quote.custo_estimado ? String(quote.custo_estimado) : '',
      preco_venda: quote.preco_venda ? String(quote.preco_venda) : '',
      status: quote.status,
      validade: quote.validade ?? '',
      observacoes: quote.observacoes ?? '',
    });
    setIsDialogOpen(true);
  }

  function updateField(field: keyof QuoteFormData, value: string) {
    setFormData((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supabase) return;

    setIsSaving(true);

    const custo = toNumberOrNull(formData.custo_estimado);
    const preco = toNumberOrNull(formData.preco_venda);
    const margem = custo && preco ? ((preco - custo) / custo) * 100 : null;

    const payload = {
      codigo: formData.codigo || createCode('COT'),
      cliente_id: formData.cliente_id || null,
      origem: { cidade: formData.origem_cidade, uf: formData.origem_uf },
      destino: { cidade: formData.destino_cidade, uf: formData.destino_uf },
      volumes: toIntegerOrNull(formData.volumes) ?? 1,
      peso_kg: toNumberOrNull(formData.peso_kg) ?? 0,
      cubagem_m3: toNumberOrNull(formData.cubagem_m3) ?? 0,
      distancia_km: toNumberOrNull(formData.distancia_km),
      prazo_dias: toIntegerOrNull(formData.prazo_dias),
      custo_estimado: custo,
      preco_venda: preco,
      margem_percentual: margem,
      status: formData.status,
      validade: formData.validade || null,
      observacoes: formData.observacoes || null,
    };

    const { error } = editingId
      ? await supabase.from('cotacoes').update(payload).eq('id', editingId)
      : await supabase.from('cotacoes').insert(payload);

    if (error) {
      setMessage(`Erro ao salvar cotacao: ${error.message}`);
    } else {
      setMessage(editingId ? 'Cotacao atualizada com sucesso.' : 'Cotacao criada com sucesso.');
      setIsDialogOpen(false);
      await loadData();
    }

    setIsSaving(false);
  }

  async function handleDelete(quote: QuoteRow) {
    if (!supabase) return;
    if (!window.confirm(`Excluir cotacao ${quote.codigo}?`)) return;

    const { error } = await supabase.from('cotacoes').delete().eq('id', quote.id);

    if (error) setMessage(`Erro ao excluir cotacao: ${error.message}`);
    else {
      setMessage('Cotacao excluida com sucesso.');
      await loadData();
    }
  }

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <div className="ml-64 flex-1">
        <Header />
        <main className="p-6">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-balance">Cotacoes</h1>
              <p className="text-muted-foreground">Simule fretes, margens e prazos antes de enviar propostas</p>
            </div>
            <Button className="gap-2" onClick={openNewDialog}>
              <FilePlus2 className="h-4 w-4" />
              Nova cotacao
            </Button>
          </div>

          {message && <div className="mb-4 rounded-lg border border-border bg-card px-4 py-3 text-sm text-muted-foreground">{message}</div>}

          <div className="grid gap-4 md:grid-cols-3">
            <Stat title="Cotacoes abertas" value={isLoading ? '...' : stats.abertas} icon={Calculator} detail="Em andamento" />
            <Stat title="Taxa de conversao" value={isLoading ? '...' : `${stats.conversao}%`} icon={TrendingUp} detail="Base aprovada / total" />
            <Stat title="Ticket medio" value={stats.ticketMedio.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} detail="Por cotacao aprovada" />
          </div>

          <Card className="mt-6">
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
                    {quotes.map((cotacoes) => (
                      <tr key={cotacoes.id} className="hover:bg-secondary/30 transition-colors">
                        <td className="px-4 py-4">
                          <div>
                            <p className="font-medium">{cotacoes.codigo}</p>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-2">
                            <div>
                              <p className="text-sm">{cotacoes.clientes?.nome_fantasia}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="text-sm">
                            <p>{cotacoes.destino.cidade} - {cotacoes.destino.uf}</p>
                            {/* <p className="text-muted-foreground">{cotacoes.volumes ?? 0}kg</p> */}
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-2">
                            <span className="text-sm">
                              {cotacoes.volumes}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-2">
                            <span className="text-sm">
                              {cotacoes.prazo_dias}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-1">
                            <span className="text-sm">
                              {(cotacoes.custo_estimado ?? 0).toLocaleString('pt-BR', {
                                style: 'currency',
                                currency: 'BRL',
                              })}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-2">
                            <span className="text-sm">
                              {cotacoes.status}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-1">
                            {/* <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onTrack(cotacoes)}>
                              <Eye className="h-4 w-4" />
                            </Button> */}
                            <RowActions onEdit={() => openEditDialog(cotacoes)} onDelete={() => handleDelete(cotacoes)} />
                          </div>
                        </td>
                      </tr>
                    ))}
                    {!isLoading && clients.length === 0 && (
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

            </CardContent>
          </Card>
        </main>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Editar cotacao' : 'Nova cotacao'}</DialogTitle>
            <DialogDescription>Informe origem, destino, carga e valores comerciais.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-6">
            <section className="grid gap-4 md:grid-cols-3">
              <Field label="Codigo" value={formData.codigo} onChange={(value) => updateField('codigo', value)} required />
              <SelectField label="Cliente" value={formData.cliente_id} onChange={(value) => updateField('cliente_id', value)}>
                <option value="">Sem cliente</option>
                {clients.map((client) => <option key={client.id} value={client.id}>{client.nome_fantasia || client.razao_social}</option>)}
              </SelectField>
              <SelectField label="Status" value={formData.status} onChange={(value) => updateField('status', value)} required>
                {Object.entries(quoteStatusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </SelectField>
              <Field label="Origem cidade" value={formData.origem_cidade} onChange={(value) => updateField('origem_cidade', value)} />
              <Field label="Origem UF" value={formData.origem_uf} onChange={(value) => updateField('origem_uf', value.toUpperCase().slice(0, 2))} />
              <Field label="Destino cidade" value={formData.destino_cidade} onChange={(value) => updateField('destino_cidade', value)} />
              <Field label="Destino UF" value={formData.destino_uf} onChange={(value) => updateField('destino_uf', value.toUpperCase().slice(0, 2))} />
              <Field label="Volumes" type="number" value={formData.volumes} onChange={(value) => updateField('volumes', value)} />
              <Field label="Peso kg" type="number" step="0.01" value={formData.peso_kg} onChange={(value) => updateField('peso_kg', value)} />
              <Field label="Cubagem m3" type="number" step="0.0001" value={formData.cubagem_m3} onChange={(value) => updateField('cubagem_m3', value)} />
              <Field label="Distancia km" type="number" step="0.01" value={formData.distancia_km} onChange={(value) => updateField('distancia_km', value)} />
              <Field label="Prazo dias" type="number" value={formData.prazo_dias} onChange={(value) => updateField('prazo_dias', value)} />
              <Field label="Custo estimado" type="number" step="0.01" value={formData.custo_estimado} onChange={(value) => updateField('custo_estimado', value)} />
              <Field label="Preco venda" type="number" step="0.01" value={formData.preco_venda} onChange={(value) => updateField('preco_venda', value)} />
              <Field label="Validade" type="date" value={formData.validade} onChange={(value) => updateField('validade', value)} />
            </section>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={isSaving}>{isSaving ? 'Salvando...' : 'Salvar cotacao'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Stat({ title, value, detail, icon: Icon }: { title: string; value: string | number; detail: string; icon?: React.ComponentType<{ className?: string }> }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground">{detail}</p>
      </CardContent>
    </Card>
  );
}

function RowActions({ onEdit, onDelete }: { onEdit: () => void; onDelete: () => void }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreVertical className="h-4 w-4" /></Button></DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={onEdit}><Pencil className="h-4 w-4" />Editar</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onClick={onDelete}><Trash2 className="h-4 w-4" />Excluir</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function Field({ label, value, onChange, type = 'text', required = false, step }: { label: string; value: string; onChange: (value: string) => void; type?: string; required?: boolean; step?: string }) {
  return <label className="space-y-2 text-sm font-medium"><span>{label}</span><Input type={type} step={step} value={value} required={required} onChange={(event) => onChange(event.target.value)} /></label>;
}

function SelectField({ label, value, onChange, children, required = false }: { label: string; value: string; onChange: (value: string) => void; children: React.ReactNode; required?: boolean }) {
  return <label className="space-y-2 text-sm font-medium"><span>{label}</span><select value={value} required={required} onChange={(event) => onChange(event.target.value)} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">{children}</select></label>;
}
