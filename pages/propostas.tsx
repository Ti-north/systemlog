import { FormEvent, useEffect, useState } from 'react';
import { MoreVertical, Pencil, Send, SquarePen, Trash2 } from 'lucide-react';
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
  emptyProposalForm,
  proposalStatusLabels,
  toNumberOrNull,
  type ClientOption,
  type ProposalFormData,
  type ProposalRow,
  type ProposalStatus,
  type QuoteRow,
} from '@/lib/commercial';

const columns: ProposalStatus[] = ['RASCUNHO', 'ENVIADA', 'APROVADA'];

export default function PropostasPage() {
  const [proposals, setProposals] = useState<ProposalRow[]>([]);
  const [clients, setClients] = useState<ClientOption[]>([]);
  const [quotes, setQuotes] = useState<QuoteRow[]>([]);
  const [formData, setFormData] = useState<ProposalFormData>(emptyProposalForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState('');

  async function loadData() {
    if (!supabase) {
      setMessage('Configure o Supabase para carregar propostas reais.');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    const [{ data: proposalData, error: proposalError }, { data: clientData, error: clientError }, { data: quoteData, error: quoteError }] = await Promise.all([
      supabase.from('propostas').select('*, clientes(id, razao_social, nome_fantasia)').order('created_at', { ascending: false }),
      supabase.from('clientes').select('id, razao_social, nome_fantasia').order('razao_social', { ascending: true }),
      supabase.from('cotacoes').select('*, clientes(id, razao_social, nome_fantasia)').order('created_at', { ascending: false }),
    ]);

    if (proposalError || clientError || quoteError) {
      setMessage(proposalError?.message || clientError?.message || quoteError?.message || 'Erro ao carregar dados.');
    } else {
      setProposals((proposalData ?? []) as ProposalRow[]);
      setClients((clientData ?? []) as ClientOption[]);
      setQuotes((quoteData ?? []) as QuoteRow[]);
      setMessage('');
    }

    setIsLoading(false);
  }

  useEffect(() => {
    void loadData();
  }, []);

  function openNewDialog() {
    setEditingId(null);
    setFormData({ ...emptyProposalForm, codigo: createCode('PROP') });
    setIsDialogOpen(true);
  }

  function openEditDialog(proposal: ProposalRow) {
    setEditingId(proposal.id);
    setFormData({
      codigo: proposal.codigo,
      cliente_id: proposal.cliente_id ?? '',
      cotacao_id: proposal.cotacao_id ?? '',
      titulo: proposal.titulo,
      descricao: proposal.descricao ?? '',
      valor_total: String(proposal.valor_total),
      status: proposal.status,
      expira_em: proposal.expira_em ? proposal.expira_em.slice(0, 10) : '',
      arquivo_url: proposal.arquivo_url ?? '',
    });
    setIsDialogOpen(true);
  }

  function updateField(field: keyof ProposalFormData, value: string) {
    setFormData((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supabase) return;

    setIsSaving(true);

    const payload = {
      codigo: formData.codigo || createCode('PROP'),
      cliente_id: formData.cliente_id || null,
      cotacao_id: formData.cotacao_id || null,
      titulo: formData.titulo,
      descricao: formData.descricao || null,
      valor_total: toNumberOrNull(formData.valor_total) ?? 0,
      status: formData.status,
      enviada_em: formData.status === 'ENVIADA' ? new Date().toISOString() : null,
      expira_em: formData.expira_em ? new Date(formData.expira_em).toISOString() : null,
      arquivo_url: formData.arquivo_url || null,
    };

    const { error } = editingId
      ? await supabase.from('propostas').update(payload).eq('id', editingId)
      : await supabase.from('propostas').insert(payload);

    if (error) {
      setMessage(`Erro ao salvar proposta: ${error.message}`);
    } else {
      setMessage(editingId ? 'Proposta atualizada com sucesso.' : 'Proposta criada com sucesso.');
      setIsDialogOpen(false);
      await loadData();
    }

    setIsSaving(false);
  }

  async function handleDelete(proposal: ProposalRow) {
    if (!supabase) return;
    if (!window.confirm(`Excluir proposta ${proposal.codigo}?`)) return;

    const { error } = await supabase.from('propostas').delete().eq('id', proposal.id);

    if (error) setMessage(`Erro ao excluir proposta: ${error.message}`);
    else {
      setMessage('Proposta excluida com sucesso.');
      await loadData();
    }
  }

  function handleQuoteChange(quoteId: string) {
    updateField('cotacao_id', quoteId);
    const quote = quotes.find((item) => item.id === quoteId);

    if (!quote) return;

    setFormData((current) => ({
      ...current,
      cotacao_id: quoteId,
      cliente_id: quote.cliente_id ?? current.cliente_id,
      titulo: current.titulo || `Proposta ${quote.codigo}`,
      valor_total: current.valor_total || String(quote.preco_venda ?? ''),
    }));
  }

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <div className="ml-64 flex-1">
        <Header />
        <main className="p-6">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-balance">Propostas</h1>
              <p className="text-muted-foreground">Envio, acompanhamento e historico das negociacoes</p>
            </div>
            <Button className="gap-2" onClick={openNewDialog}>
              <SquarePen className="h-4 w-4" />
              Montar proposta
            </Button>
          </div>

          {message && <div className="mb-4 rounded-lg border border-border bg-card px-4 py-3 text-sm text-muted-foreground">{message}</div>}

          <div className="grid gap-4 lg:grid-cols-3">
            {columns.map((status) => (
              <Card key={status}>
                <CardHeader>
                  <CardTitle>{proposalStatusLabels[status]}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {proposals.filter((proposal) => proposal.status === status).map((proposal) => (
                    <div key={proposal.id} className="rounded-lg border border-border p-4">
                      <div className="flex items-center justify-between">
                        <p className="font-medium">{proposal.codigo}</p>
                        <RowActions onEdit={() => openEditDialog(proposal)} onDelete={() => handleDelete(proposal)} />
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">{proposal.titulo}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{proposal.clientes?.nome_fantasia || proposal.clientes?.razao_social || 'Sem cliente'}</p>
                      <p className="mt-3 text-sm font-medium">{proposal.valor_total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                    </div>
                  ))}
                  {!isLoading && proposals.filter((proposal) => proposal.status === status).length === 0 && (
                    <p className="text-sm text-muted-foreground">Sem propostas.</p>
                  )}
                  {isLoading && <p className="text-sm text-muted-foreground">Carregando...</p>}
                </CardContent>
              </Card>
            ))}
          </div>
        </main>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Editar proposta' : 'Montar proposta'}</DialogTitle>
            <DialogDescription>Vincule uma cotacao ou informe os dados comerciais diretamente.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-6">
            <section className="grid gap-4 md:grid-cols-2">
              <Field label="Codigo" value={formData.codigo} onChange={(value) => updateField('codigo', value)} required />
              <SelectField label="Status" value={formData.status} onChange={(value) => updateField('status', value)} required>
                {Object.entries(proposalStatusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </SelectField>
              <SelectField label="Cotacao" value={formData.cotacao_id} onChange={handleQuoteChange}>
                <option value="">Sem cotacao</option>
                {quotes.map((quote) => <option key={quote.id} value={quote.id}>{quote.codigo}</option>)}
              </SelectField>
              <SelectField label="Cliente" value={formData.cliente_id} onChange={(value) => updateField('cliente_id', value)}>
                <option value="">Sem cliente</option>
                {clients.map((client) => <option key={client.id} value={client.id}>{client.nome_fantasia || client.razao_social}</option>)}
              </SelectField>
              <Field label="Titulo" value={formData.titulo} onChange={(value) => updateField('titulo', value)} required />
              <Field label="Valor total" type="number" step="0.01" value={formData.valor_total} onChange={(value) => updateField('valor_total', value)} />
              <Field label="Expira em" type="date" value={formData.expira_em} onChange={(value) => updateField('expira_em', value)} />
              <Field label="Arquivo URL" value={formData.arquivo_url} onChange={(value) => updateField('arquivo_url', value)} />
            </section>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={isSaving}>{isSaving ? 'Salvando...' : 'Salvar proposta'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function RowActions({ onEdit, onDelete }: { onEdit: () => void; onDelete: () => void }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8"><MoreVertical className="h-4 w-4" /></Button></DropdownMenuTrigger>
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
