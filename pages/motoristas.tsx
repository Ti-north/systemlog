import { FormEvent, useEffect, useState } from 'react';
import { Sidebar } from '@/components/sidebar';
import { Header } from '@/components/header';
import { DriversList } from '@/components/drivers-list';
import { DriverStats } from '@/components/driver-stats';
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
import { Plus } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { driverStatusLabels, emptyDriverForm, type DriverFormData, type DriverRow } from '@/lib/drivers';
import type { FrotaRow } from '@/lib/frota';

interface Item {
  id: string;
  nome: string;
}

export default function MotoristasPage() {
  const [drivers, setDrivers] = useState<DriverRow[]>([]);
  const [vehicles, setVehicles] = useState<Array<Pick<FrotaRow, 'id' | 'placa' | 'modelo'>>>([]);
  const [formData, setFormData] = useState<DriverFormData>(emptyDriverForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState('');

  async function loadData() {
    if (!supabase) {
      setMessage('Configure o Supabase para carregar motoristas reais.');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    // Promise.all executando as buscas corrigidas em paralelo
    const [driversResult, vehiclesResult] = await Promise.all([
      supabase
        .from('motoristas')
        .select(`
          id,
          nome,
          cpf,
          cnh,
          cnh_validade,
          telefone,
          email,
          foto_url,
          veiculo_id,
          status,
          latitude,
          longitude,
          localizacao_at,
          ativo,
          created_at,
          veiculos:veiculo_id (
            id,
            placa,
            modelo
          )
        `)
        .order('created_at', { ascending: false }),

      supabase
        .from('veiculos')
        .select(`
          id,
          placa,
          tipo,
          modelo,
          ano,
          capacidade_kg,
          capacidade_m3,
          km_atual,
          consumo_medio,
          status,
          motorista_id,
          latitude,
          longitude,
          localizacao_at,
          ativo,
          created_at
        `)
        .order('created_at', { ascending: false })
    ]);

    if (driversResult.error || vehiclesResult.error) {
      setMessage(driversResult.error?.message || vehiclesResult.error?.message || 'Erro ao carregar dados.');
    } else {
      const normalizedDrivers = ((driversResult.data ?? []) as unknown as Array<DriverRow & { veiculos?: DriverRow['veiculos'] | DriverRow['veiculos'][] }>).map((driver) => ({
        ...driver,
        veiculos: Array.isArray(driver.veiculos) ? driver.veiculos[0] ?? null : driver.veiculos ?? null,
      }));

      setDrivers(normalizedDrivers);
      setVehicles((vehiclesResult.data ?? []) as Array<Pick<FrotaRow, 'id' | 'placa' | 'modelo'>>);
      setMessage('');
    }

    setIsLoading(false);
  }

  useEffect(() => {
    void loadData();
  }, []);

  function openNewDialog() {
    setEditingId(null);
    setFormData(emptyDriverForm);
    setIsDialogOpen(true);
  }

  function openEditDialog(driver: DriverRow) {
    setEditingId(driver.id);
    setFormData({
      nome: driver.nome,
      cpf: driver.cpf,
      cnh: driver.cnh,
      cnh_validade: driver.cnh_validade ?? '',
      telefone: driver.telefone ?? '',
      email: driver.email ?? '',
      veiculo_id: driver.veiculo_id ?? '',
      status: driver.status,
    });
    setIsDialogOpen(true);
  }

  function updateField(field: keyof DriverFormData, value: string) {
    setFormData((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!supabase) return;

    setIsSaving(true);
    setMessage('');

    const payload = {
      nome: formData.nome.trim(),
      cpf: formData.cpf.trim(),
      cnh: formData.cnh.trim(),
      cnh_validade: formData.cnh_validade || null,
      telefone: formData.telefone || null,
      email: formData.email || null,
      veiculo_id: formData.veiculo_id || null,
      status: formData.status,
      ativo: true,
    };

    const { error } = editingId
      ? await supabase.from('motoristas').update(payload).eq('id', editingId)
      : await supabase.from('motoristas').insert(payload);

    if (error) {
      setMessage(`Erro ao salvar motorista: ${error.message}`);
    } else {
      setMessage(editingId ? 'Motorista atualizado com sucesso.' : 'Motorista cadastrado com sucesso.');
      setIsDialogOpen(false);
      await loadData();
    }

    setIsSaving(false);
  }

  async function handleDelete(driver: DriverRow) {
    if (!supabase) return;
    if (!window.confirm(`Excluir motorista ${driver.nome}?`)) return;

    const { error } = await supabase.from('motoristas').delete().eq('id', driver.id);

    if (error) {
      setMessage(`Erro ao excluir motorista: ${error.message}`);
    } else {
      setMessage('Motorista excluído com sucesso.');
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
              <h1 className="text-2xl font-bold text-balance">Motoristas</h1>
              <p className="text-muted-foreground">Gerencie sua equipe de entregadores</p>
            </div>
            <Button className="gap-2" onClick={openNewDialog}>
              <Plus className="h-4 w-4" />
              Novo Motorista
            </Button>
          </div>

          {message && <div className="mb-4 rounded-lg border border-border bg-card px-4 py-3 text-sm text-muted-foreground">{message}</div>}

          <DriverStats drivers={drivers} isLoading={isLoading} />

          <div className="mt-6">
            <DriversList drivers={drivers} isLoading={isLoading} onEdit={openEditDialog} onDelete={handleDelete} />
          </div>
        </main>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Editar motorista' : 'Novo motorista'}</DialogTitle>
            <DialogDescription>Cadastre os dados operacionais do motorista.</DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-6">
            <section className="grid gap-4 md:grid-cols-3">
              <Field label="Nome" value={formData.nome} onChange={(value) => updateField('nome', value)} required />
              <Field label="CPF" value={formData.cpf} onChange={(value) => updateField('cpf', value)} required />
              <Field label="CNH" value={formData.cnh} onChange={(value) => updateField('cnh', value)} required />
              <Field label="Validade CNH" type="date" value={formData.cnh_validade} onChange={(value) => updateField('cnh_validade', value)} />
              <Field label="Telefone" value={formData.telefone} onChange={(value) => updateField('telefone', value)} />
              <Field label="E-mail" type="email" value={formData.email} onChange={(value) => updateField('email', value)} />
            </section>

            <section className="grid gap-4 md:grid-cols-2">
              <SelectField label="Status" value={formData.status} onChange={(value) => updateField('status', value)} required>
                {Object.entries(driverStatusLabels).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </SelectField>
              <SelectField label="Veículo" value={formData.veiculo_id} onChange={(value) => updateField('veiculo_id', value)}>
                <option value="">Sem veículo</option>
                {vehicles.map((vehicle) => (
                  <option key={vehicle.id} value={vehicle.id}>{vehicle.placa} - {vehicle.modelo || 'Sem modelo'}</option>
                ))}
              </SelectField>
            </section>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={isSaving}>{isSaving ? 'Salvando...' : 'Salvar motorista'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = 'text',
  required = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  required?: boolean;
}) {
  return (
    <label className="flex flex-col space-y-2 text-sm font-medium w-full">
      <span>{label}</span>
      <Input type={type} value={value} required={required} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

function SelectField({
  label,
  value,
  onChange,
  children,
  required = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  children: React.ReactNode;
  required?: boolean;
}) {
  return (
    <label className="flex flex-col space-y-2 text-sm font-medium w-full">
      <span>{label}</span>
      <select
        value={value}
        required={required}
        onChange={(event) => onChange(event.target.value)}
        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {children}
      </select>
    </label>
  );
}
