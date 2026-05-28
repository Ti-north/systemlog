import { ChangeEvent, FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { Sidebar } from '@/components/sidebar';
import { Header } from '@/components/header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Plus } from 'lucide-react';
import { Users } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ClientesTable } from '@/components/clients-table';
import { supabase } from '@/lib/supabase';
import { emptyClientsForm, type ClientsRow, type ClientsFormData } from '@/lib/clients';
import { id } from 'date-fns/locale';

export default function ClientesPage() {

  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [clients, setClients] = useState<ClientsRow[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState<ClientsFormData>(emptyClientsForm);
  const [editingClientsId, setEditingClientsId] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  async function loadClientes() {
    if (!supabase) {
      setMessage('Configure o Supabase para carregar clientes reais.');
      setIsLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('clientes')
      .select('*')
      .order('id', { ascending: false });

    if (error) {
      setMessage(`Erro ao carregar clientes: ${error.message}`);
    } else {
      setClients((data ?? []) as ClientsRow[]);
      setMessage('');
    }

    setIsLoading(false);
  }
  useEffect(() => {
    void loadClientes();
  }, []);
  function openNewClientsDialog(prefill?: Partial<ClientsFormData>) {
    setEditingClientsId(null);
    setFormData({
      ...emptyClientsForm,
      ...prefill,
    });
    setIsDialogOpen(true);
  }

  function openEditClientDialog(client: ClientsRow) {
    setEditingClientsId(client.id);
     setFormData({
      cnpj: client.cnpj,
      razao_social: client.razao_social,
      nome_fantasia: client.nome_fantasia ?? '',
      email: client.email,
      telefone: client.telefone,
      logradouro: client.logradouro,
      numero: client.numero ?? '',
      bairro: client.bairro,
      complemento: client.complemento ?? '',
      cidade: client.cidade,
      uf: client.uf,
      cep: client.cep,
      contato_principal: client.contato_principal,
      observacoes: client.observacoes,
      ativo: client.ativo,
    });
    setIsDialogOpen(true);
  }

  function updateField(field: keyof ClientsFormData, value: string) {
    setFormData((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!supabase) {
      setMessage('Configure o Supabase antes de salvar clientes.');
      return;
    }

    setIsSaving(true);
    setMessage('');

    const { data: userData } = await supabase.auth.getUser();

    const payload = {
      cnpj: formData.cnpj,
      razao_social: formData.razao_social,
      nome_fantasia: formData.nome_fantasia,
      email: formData.email,
      telefone: formData.telefone,
      logradouro: formData.logradouro,
      numero: formData.numero || null,
      bairro: formData.bairro,
      complemento: formData.complemento,
      cidade: formData.cidade,
      uf: formData.uf,
      cep: formData.cep,
      contato_principal: formData.contato_principal,
      observacoes: formData.observacoes,
    };

    const { error } = editingClientsId
      ? await supabase.from('clientes').update(payload).eq('id', editingClientsId)
      : await supabase.from('clientes').insert(payload);

    if (error) {
      setMessage(`Erro ao salvar cliente: ${error.message}`);
    } else {
      setMessage(editingClientsId ? 'Cliente atualizado com sucesso.' : 'Cliente cadastrado com sucesso.');
      setIsDialogOpen(false);
      setEditingClientsId(null);
      await loadClientes();
    }

    setIsSaving(false);
  }

  return (

    <div className="flex min-h-screen bg-background">
      <Sidebar />

      <div className="ml-64 flex-1">
        <Header />

        <main className="p-6">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-balance">Clientes</h1>
              <p className="text-muted-foreground">Cadastro</p>
            </div>
            <Button className="gap-2" onClick={() => openNewClientsDialog()}>
              <Plus className="h-4 w-4" />
              Novo Cliente
            </Button>
          </div>
          <ClientesTable
            clients={clients} // Aqui usamos o estado 'clients' que você carregou do Supabase
            isLoading={isLoading}
            onEdit={openEditClientDialog}
            onTrack={(client) => console.log('Rastrear:', client)} // Adapte para sua lógica de rastreio
            onDelete={async (client) => {
              // Exemplo rápido de deletar, adapte como preferir
              if (confirm('Deseja excluir este cliente?')) {
                if (!supabase) return;
                await supabase.from('clientes').delete().eq('id', client.id);
                loadClientes();
              }
            }}
          />

        </main>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle>{editingClientsId ? 'Editar' : 'Novo Cliente'}</DialogTitle>
            <DialogDescription>
              Dados do cliente.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-6">
            <section className="grid gap-4 md:grid-cols-3">
              <Field label="CNPJ" value={formData.cnpj} onChange={(value) => updateField('cnpj', value)} required maxLength={14} />
              <Field label="Razão Social" value={formData.razao_social} onChange={(value) => updateField('razao_social', value)} />
              <Field label="Nome Fantasia" value={formData.nome_fantasia} onChange={(value) => updateField('nome_fantasia', value)} />
              <Field label="E-mail" type="email" value={formData.email} onChange={(value) => updateField('email', value)} required />
              <Field label="Telefone" type="tel" value={formData.telefone} onChange={(value) => updateField('telefone', value)} maxLength={11} />
              <Field label="Logradouro" value={formData.logradouro} onChange={(value) => updateField('logradouro', value)} />
              <Field label="Numero" type="number" value={formData.numero} onChange={(value) => updateField('numero', value)} />
              <Field label="Bairro" value={formData.bairro} onChange={(value) => updateField('bairro', value)} />
              <Field label="CEP" value={formData.cep} onChange={(value) => updateField('cep', value)} maxLength={8}/>
              <Field label="UF" value={formData.uf} onChange={(value) => updateField('uf', value)} maxLength={2}/>
              <Field label="Observações" type="text-area" value={formData.observacoes} onChange={(value) => updateField('observacoes', value)} />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={isSaving}>
                  {isSaving ? 'Salvando...' : editingClientsId ? 'Salvar alteracoes' : 'Salvar cliente'}
                </Button>
              </DialogFooter>
            </section>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
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
