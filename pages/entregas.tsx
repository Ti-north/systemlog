'use client';

import { ChangeEvent, FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { Sidebar } from '@/components/sidebar';
import { Header } from '@/components/header';
import { OrdersTable } from '@/components/orders-table';
import { OrdersStats } from '@/components/orders-stats';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { createTrackingCode, emptyOrderForm, toNumberOrNull, type OrderFormData, type OrderRow } from '@/lib/orders';
import { supabase } from '@/lib/supabase';
import type { DeliveryStatus } from '@/lib/types';
import { Plus, Upload, Filter } from 'lucide-react';

const statusFilters: Array<{ label: string; value: 'TODOS' | DeliveryStatus }> = [
  { label: 'Todos', value: 'TODOS' },
  { label: 'Pendentes', value: 'PENDENTE' },
  { label: 'Em Transito', value: 'EM_TRANSITO' },
  { label: 'Entregues', value: 'ENTREGUE' },
  { label: 'Insucesso', value: 'INSUCESSO' },
];

function getTagText(parent: Element | Document, tagName: string) {
  return parent.getElementsByTagName(tagName)[0]?.textContent?.trim() ?? '';
}

function parseNfeXml(xmlText: string): Partial<OrderFormData> {
  const documentXml = new DOMParser().parseFromString(xmlText, 'text/xml');
  const parserError = documentXml.getElementsByTagName('parsererror')[0];

  if (parserError) {
    throw new Error('Arquivo XML invalido.');
  }

  const infNFe = documentXml.getElementsByTagName('infNFe')[0];
  const emit = documentXml.getElementsByTagName('emit')[0];
  const dest = documentXml.getElementsByTagName('dest')[0];
  const enderEmit = documentXml.getElementsByTagName('enderEmit')[0];
  const enderDest = documentXml.getElementsByTagName('enderDest')[0];
  const total = documentXml.getElementsByTagName('ICMSTot')[0];
  const transportVolume = documentXml.getElementsByTagName('vol')[0];
  const nNF = getTagText(documentXml, 'nNF');
  const chave = infNFe?.getAttribute('Id')?.replace('NFe', '') ?? '';

  return {
    codigo_rastreio: createTrackingCode(),
    pedido_id: nNF ? `NF-${nNF}` : '',
    nota_fiscal: chave || nNF,
    remetente_nome: getTagText(emit, 'xNome'),
    remetente_documento: getTagText(emit, 'CNPJ') || getTagText(emit, 'CPF'),
    remetente_logradouro: getTagText(enderEmit, 'xLgr'),
    remetente_numero: getTagText(enderEmit, 'nro'),
    remetente_complemento: getTagText(enderEmit, 'xCpl'),
    remetente_bairro: getTagText(enderEmit, 'xBairro'),
    remetente_cidade: getTagText(enderEmit, 'xMun'),
    remetente_uf: getTagText(enderEmit, 'UF'),
    remetente_cep: getTagText(enderEmit, 'CEP'),
    remetente_contato: getTagText(enderEmit, 'fone'),
    destinatario_nome: getTagText(dest, 'xNome'),
    destinatario_documento: getTagText(dest, 'CNPJ') || getTagText(dest, 'CPF'),
    destinatario_logradouro: getTagText(enderDest, 'xLgr'),
    destinatario_numero: getTagText(enderDest, 'nro'),
    destinatario_complemento: getTagText(enderDest, 'xCpl'),
    destinatario_bairro: getTagText(enderDest, 'xBairro'),
    destinatario_cidade: getTagText(enderDest, 'xMun'),
    destinatario_uf: getTagText(enderDest, 'UF'),
    destinatario_cep: getTagText(enderDest, 'CEP'),
    destinatario_contato: getTagText(enderDest, 'fone'),
    volumes: getTagText(transportVolume, 'qVol') || '1',
    peso_kg: getTagText(transportVolume, 'pesoB') || getTagText(transportVolume, 'pesoL'),
    valor_declarado: getTagText(total, 'vNF'),
  };
}

export default function PedidosPage() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [formData, setFormData] = useState<OrderFormData>(emptyOrderForm);
  const [statusFilter, setStatusFilter] = useState<'TODOS' | DeliveryStatus>('TODOS');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [message, setMessage] = useState('');

  const filteredOrders = useMemo(() => {
    if (statusFilter === 'TODOS') {
      return orders;
    }

    return orders.filter((order) => order.status === statusFilter);
  }, [orders, statusFilter]);

  async function loadOrders() {
    if (!supabase) {
      setMessage('Configure o Supabase para carregar pedidos reais.');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    const { data, error } = await supabase
      .from('entregas')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      setMessage(`Erro ao carregar pedidos: ${error.message}`);
    } else {
      setOrders((data ?? []) as OrderRow[]);
      setMessage('');
    }

    setIsLoading(false);
  }

  useEffect(() => {
    void loadOrders();
  }, []);

  function openNewOrderDialog(prefill?: Partial<OrderFormData>) {
    setFormData({
      ...emptyOrderForm,
      codigo_rastreio: createTrackingCode(),
      ...prefill,
    });
    setIsDialogOpen(true);
  }

  function updateField(field: keyof OrderFormData, value: string) {
    setFormData((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!supabase) {
      setMessage('Configure o Supabase antes de salvar pedidos.');
      return;
    }

    setIsSaving(true);
    setMessage('');

    const { data: userData } = await supabase.auth.getUser();

    const payload = {
      codigo_rastreio: formData.codigo_rastreio || createTrackingCode(),
      pedido_id: formData.pedido_id || null,
      remetente_nome: formData.remetente_nome || null,
      remetente_documento: formData.remetente_documento || null,
      remetente_logradouro: formData.remetente_logradouro || null,
      remetente_numero: formData.remetente_numero || null,
      remetente_complemento: formData.remetente_complemento || null,
      remetente_bairro: formData.remetente_bairro || null,
      remetente_cidade: formData.remetente_cidade || null,
      remetente_uf: formData.remetente_uf || null,
      remetente_cep: formData.remetente_cep || null,
      remetente_contato: formData.remetente_contato || null,
      destinatario_nome: formData.destinatario_nome,
      destinatario_documento: formData.destinatario_documento || null,
      destinatario_logradouro: formData.destinatario_logradouro,
      destinatario_numero: formData.destinatario_numero || null,
      destinatario_complemento: formData.destinatario_complemento || null,
      destinatario_bairro: formData.destinatario_bairro || null,
      destinatario_cidade: formData.destinatario_cidade,
      destinatario_uf: formData.destinatario_uf,
      destinatario_cep: formData.destinatario_cep || null,
      destinatario_contato: formData.destinatario_contato || null,
      volumes: Number(formData.volumes || 1),
      peso_kg: toNumberOrNull(formData.peso_kg),
      cubagem_m3: toNumberOrNull(formData.cubagem_m3),
      valor_declarado: toNumberOrNull(formData.valor_declarado),
      nota_fiscal: formData.nota_fiscal || null,
      prazo_entrega: formData.prazo_entrega ? new Date(formData.prazo_entrega).toISOString() : null,
      status: 'PENDENTE' as DeliveryStatus,
      created_by: userData.user?.id ?? null,
    };

    const { error } = await supabase.from('entregas').insert(payload);

    if (error) {
      setMessage(`Erro ao salvar pedido: ${error.message}`);
    } else {
      setMessage('Pedido cadastrado com sucesso.');
      setIsDialogOpen(false);
      await loadOrders();
    }

    setIsSaving(false);
  }

  async function handleNfeImport(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';

    if (!file) {
      return;
    }

    try {
      const xmlText = await file.text();
      const parsedData = parseNfeXml(xmlText);
      openNewOrderDialog(parsedData);
      setMessage('NF-e importada. Confira os dados antes de salvar o pedido.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Nao foi possivel importar a NF-e.');
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
              <h1 className="text-2xl font-bold text-balance">Gestao de Pedidos</h1>
              <p className="text-muted-foreground">
                Cadastre, gerencie e acompanhe todos os fretes
              </p>
            </div>
            <div className="flex items-center gap-3">
              <input
                ref={fileInputRef}
                type="file"
                accept=".xml,text/xml,application/xml"
                className="hidden"
                onChange={handleNfeImport}
              />
              <Button variant="outline" className="gap-2" onClick={() => fileInputRef.current?.click()}>
                <Upload className="h-4 w-4" />
                Importar NF-e
              </Button>
              <Button className="gap-2" onClick={() => openNewOrderDialog()}>
                <Plus className="h-4 w-4" />
                Novo Pedido
              </Button>
            </div>
          </div>

          {message && (
            <div className="mb-4 rounded-lg border border-border bg-card px-4 py-3 text-sm text-muted-foreground">
              {message}
            </div>
          )}

          <OrdersStats orders={orders} />

          <div className="mt-6">
            <div className="mb-4 flex items-center gap-3">
              <Button variant="outline" size="sm" className="gap-2">
                <Filter className="h-4 w-4" />
                Filtros
              </Button>
              <div className="flex gap-2">
                {statusFilters.map((filter) => (
                  <Button
                    key={filter.value}
                    variant="ghost"
                    size="sm"
                    className={statusFilter === filter.value ? 'text-primary' : ''}
                    onClick={() => setStatusFilter(filter.value)}
                  >
                    {filter.label}
                  </Button>
                ))}
              </div>
            </div>
            <OrdersTable orders={filteredOrders} isLoading={isLoading} />
          </div>
        </main>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle>Novo pedido</DialogTitle>
            <DialogDescription>
              Cadastre manualmente ou revise os dados importados da NF-e antes de salvar.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-6">
            <section className="grid gap-4 md:grid-cols-3">
              <Field label="Codigo rastreio" value={formData.codigo_rastreio} onChange={(value) => updateField('codigo_rastreio', value)} required />
              <Field label="Pedido" value={formData.pedido_id} onChange={(value) => updateField('pedido_id', value)} />
              <Field label="Nota fiscal" value={formData.nota_fiscal} onChange={(value) => updateField('nota_fiscal', value)} />
            </section>

            <FormSection title="Remetente">
              <Field label="Nome" value={formData.remetente_nome} onChange={(value) => updateField('remetente_nome', value)} />
              <Field label="Documento" value={formData.remetente_documento} onChange={(value) => updateField('remetente_documento', value)} />
              <Field label="Contato" value={formData.remetente_contato} onChange={(value) => updateField('remetente_contato', value)} />
              <Field label="Logradouro" value={formData.remetente_logradouro} onChange={(value) => updateField('remetente_logradouro', value)} />
              <Field label="Numero" value={formData.remetente_numero} onChange={(value) => updateField('remetente_numero', value)} />
              <Field label="Complemento" value={formData.remetente_complemento} onChange={(value) => updateField('remetente_complemento', value)} />
              <Field label="Bairro" value={formData.remetente_bairro} onChange={(value) => updateField('remetente_bairro', value)} />
              <Field label="Cidade" value={formData.remetente_cidade} onChange={(value) => updateField('remetente_cidade', value)} />
              <Field label="UF" value={formData.remetente_uf} onChange={(value) => updateField('remetente_uf', value.toUpperCase().slice(0, 2))} />
              <Field label="CEP" value={formData.remetente_cep} onChange={(value) => updateField('remetente_cep', value)} />
            </FormSection>

            <FormSection title="Destinatario">
              <Field label="Nome" value={formData.destinatario_nome} onChange={(value) => updateField('destinatario_nome', value)} required />
              <Field label="Documento" value={formData.destinatario_documento} onChange={(value) => updateField('destinatario_documento', value)} />
              <Field label="Contato" value={formData.destinatario_contato} onChange={(value) => updateField('destinatario_contato', value)} />
              <Field label="Logradouro" value={formData.destinatario_logradouro} onChange={(value) => updateField('destinatario_logradouro', value)} required />
              <Field label="Numero" value={formData.destinatario_numero} onChange={(value) => updateField('destinatario_numero', value)} />
              <Field label="Complemento" value={formData.destinatario_complemento} onChange={(value) => updateField('destinatario_complemento', value)} />
              <Field label="Bairro" value={formData.destinatario_bairro} onChange={(value) => updateField('destinatario_bairro', value)} />
              <Field label="Cidade" value={formData.destinatario_cidade} onChange={(value) => updateField('destinatario_cidade', value)} required />
              <Field label="UF" value={formData.destinatario_uf} onChange={(value) => updateField('destinatario_uf', value.toUpperCase().slice(0, 2))} required />
              <Field label="CEP" value={formData.destinatario_cep} onChange={(value) => updateField('destinatario_cep', value)} />
            </FormSection>

            <FormSection title="Carga e prazo">
              <Field label="Volumes" type="number" min="1" value={formData.volumes} onChange={(value) => updateField('volumes', value)} required />
              <Field label="Peso kg" type="number" step="0.01" value={formData.peso_kg} onChange={(value) => updateField('peso_kg', value)} />
              <Field label="Cubagem m3" type="number" step="0.0001" value={formData.cubagem_m3} onChange={(value) => updateField('cubagem_m3', value)} />
              <Field label="Valor declarado" type="number" step="0.01" value={formData.valor_declarado} onChange={(value) => updateField('valor_declarado', value)} />
              <Field label="Prazo entrega" type="datetime-local" value={formData.prazo_entrega} onChange={(value) => updateField('prazo_entrega', value)} />
            </FormSection>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving ? 'Salvando...' : 'Salvar pedido'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function FormSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h3 className="mb-3 text-sm font-semibold text-muted-foreground">{title}</h3>
      <div className="grid gap-4 md:grid-cols-3">{children}</div>
    </section>
  );
}

function Field({
  label,
  value,
  onChange,
  type = 'text',
  required = false,
  ...inputProps
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  required?: boolean;
} & Omit<React.ComponentProps<typeof Input>, 'value' | 'onChange' | 'type' | 'required'>) {
  return (
    <label className="space-y-2 text-sm font-medium">
      <span>{label}</span>
      <Input
        {...inputProps}
        type={type}
        value={value}
        required={required}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}
