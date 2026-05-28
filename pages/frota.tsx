import { FormEvent, useEffect, useState } from 'react';
import { Sidebar } from '@/components/sidebar';
import { Header } from '@/components/header';
import { FleetStats } from '@/components/fleet-stats';
import { FleetGrid } from '@/components/fleet-grid';
import { Plus, Filter } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import {
  emptyFrotaForm,
  toIntegerOrNull,
  toNumberOrNull,
  vehicleStatusLabels,
  vehicleTypeLabels,
  type FrotaFormData,
  type FrotaRow,
  type VehicleStatus,
} from '@/lib/frota';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface DriverOption {
  id: string;
  nome: string;
}

type StatusFiltro = 'TODOS' | VehicleStatus;

export default function FrotaPage() {
  const [frota, setFrota] = useState<FrotaRow[]>([]);
  const [drivers, setDrivers] = useState<DriverOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [formData, setFormData] = useState<FrotaFormData>(emptyFrotaForm);
  const [filtroAtivo, setFiltroAtivo] = useState<StatusFiltro>('TODOS');

  async function loadFrota() {
    if (!supabase) {
      setMessage('Configure o Supabase para carregar a frota real.');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    const [{ data: motoristas, error: driversError }, { data: veiculos, error: vehiclesError }] = await Promise.all([
      supabase.from('motoristas').select('id, nome').order('nome', { ascending: true }),
      supabase.from('veiculos').select(`*,motorista:motorista_id (id,nome)`) // Aqui dizemos: "Use especificamente a coluna motorista_id para o relacionamento"
        .order('created_at', { ascending: false })
    ]);

    if (driversError) {
      setMessage(`Erro ao carregar motoristas: ${driversError.message}`);
    } else {
      setDrivers((motoristas ?? []) as DriverOption[]);
    }

    if (vehiclesError) {
      setMessage(`Erro ao carregar frota: ${vehiclesError.message}`);
    } else {
      setFrota((veiculos ?? []) as FrotaRow[]);
      if (!driversError) {
        setMessage('');
      }
    }

    setIsLoading(false);
  }

  useEffect(() => {
    void loadFrota();
  }, []);

  function openNewFrotaDialog(prefill?: Partial<FrotaFormData>) {
    setFormData({
      ...emptyFrotaForm,
      ...prefill,
    });
    setIsDialogOpen(true);
  }

  function updateField(field: keyof FrotaFormData, value: string) {
    setFormData((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!supabase) {
      setMessage('Configure o Supabase antes de salvar veiculos.');
      return;
    }

    setIsSaving(true);
    setMessage('');

    const payload = {
      placa: formData.placa.trim().toUpperCase(),
      tipo: formData.tipo,
      modelo: formData.modelo.trim() || null,
      ano: toIntegerOrNull(formData.ano),
      capacidade_kg: toNumberOrNull(formData.capacidade_kg),
      capacidade_m3: toNumberOrNull(formData.capacidade_m3),
      km_atual: toNumberOrNull(formData.km_atual) ?? 0,
      consumo_medio: toNumberOrNull(formData.consumo_medio),
      status: formData.status || 'DISPONIVEL',
      motorista_id: formData.motorista_id || null,
      latitude: toNumberOrNull(formData.latitude),
      longitude: toNumberOrNull(formData.longitude),
      localizacao_at: formData.latitude && formData.longitude ? new Date().toISOString() : null,
      ativo: true,
    };

    const { error } = await supabase.from('veiculos').insert(payload);

    if (error) {
      setMessage(`Erro ao salvar veiculo: ${error.message}`);
    } else {
      setMessage('Veiculo cadastrado com sucesso.');
      setIsDialogOpen(false);
      await loadFrota();
    }

    setIsSaving(false);
  }

  const frotaFiltrada = frota.filter((veiculo) => {
    if (filtroAtivo === 'TODOS') {
      return true;
    }

    return veiculo.status === filtroAtivo;
  });

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />

      <div className="ml-64 flex-1">
        <Header />

        <main className="p-6">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-balance">Gestao de Frota</h1>
              <p className="text-muted-foreground">Monitore e gerencie todos os veiculos</p>
            </div>
            <Button className="gap-2" onClick={() => openNewFrotaDialog()}>
              <Plus className="h-4 w-4" />
              Novo Veiculo
            </Button>
          </div>

          {message && (
            <div className="mb-4 rounded-lg border border-border bg-card px-4 py-3 text-sm text-muted-foreground">
              {message}
            </div>
          )}

          <FleetStats veiculos={frota} isLoading={isLoading} />

          <div className="mt-6 mb-4 flex items-center gap-3">
            <Button variant="outline" size="sm" className="gap-2" disabled>
              <Filter className="h-4 w-4" />
              Filtros
            </Button>
            <div className="flex gap-2">
              <FilterButton active={filtroAtivo === 'TODOS'} onClick={() => setFiltroAtivo('TODOS')}>
                Todos
              </FilterButton>
              <FilterButton active={filtroAtivo === 'EM_USO'} onClick={() => setFiltroAtivo('EM_USO')}>
                Em uso
              </FilterButton>
              <FilterButton active={filtroAtivo === 'DISPONIVEL'} onClick={() => setFiltroAtivo('DISPONIVEL')}>
                Disponiveis
              </FilterButton>
              <FilterButton active={filtroAtivo === 'MANUTENCAO'} onClick={() => setFiltroAtivo('MANUTENCAO')}>
                Manutencao
              </FilterButton>
            </div>
          </div>

          <FleetGrid veiculos={frotaFiltrada} isLoading={isLoading} />
        </main>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle>Novo veiculo</DialogTitle>
            <DialogDescription>Cadastre veiculos usando os mesmos valores esperados pelo banco.</DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-6">
            <section className="grid gap-4 md:grid-cols-3">
              <Field label="Placa" value={formData.placa} onChange={(value) => updateField('placa', value.toUpperCase())} required maxLength={8} />
              <SelectField label="Tipo" value={formData.tipo} onChange={(value) => updateField('tipo', value)} required>
                <option value="" disabled>Selecione o tipo...</option>
                {Object.entries(vehicleTypeLabels).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </SelectField>
              <Field label="Modelo" value={formData.modelo} onChange={(value) => updateField('modelo', value)} />
              <Field label="Ano" type="number" min="1990" value={formData.ano} onChange={(value) => updateField('ano', value)} />
            </section>

            <section className="grid gap-4 md:grid-cols-2">
              <Field label="Capacidade kg" type="number" step="0.01" value={formData.capacidade_kg} onChange={(value) => updateField('capacidade_kg', value)} />
              <Field label="Capacidade m3" type="number" step="0.01" value={formData.capacidade_m3} onChange={(value) => updateField('capacidade_m3', value)} />
              <Field label="KM atual" type="number" step="0.01" value={formData.km_atual} onChange={(value) => updateField('km_atual', value)} />
              <Field label="Consumo medio" type="number" step="0.01" value={formData.consumo_medio} onChange={(value) => updateField('consumo_medio', value)} />
            </section>

            <section className="grid gap-4 md:grid-cols-2">
              <SelectField label="Status" value={formData.status} onChange={(value) => updateField('status', value)} required>
                {Object.entries(vehicleStatusLabels).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </SelectField>

              <SelectField label="Motorista" value={formData.motorista_id} onChange={(value) => updateField('motorista_id', value)}>
                <option value="">Sem motorista</option>
                {drivers.map((driver) => (
                  <option key={driver.id} value={driver.id}>{driver.nome}</option>
                ))}
              </SelectField>
            </section>

            <section className="grid gap-4 md:grid-cols-2">
              <Field label="Latitude" type="number" step="0.00000001" value={formData.latitude} onChange={(value) => updateField('latitude', value)} />
              <Field label="Longitude" type="number" step="0.00000001" value={formData.longitude} onChange={(value) => updateField('longitude', value)} />
            </section>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving ? 'Salvando...' : 'Salvar veiculo'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function FilterButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <Button variant={active ? 'secondary' : 'ghost'} size="sm" onClick={onClick}>
      {children}
    </Button>
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
    <label className="flex w-full flex-col space-y-2 text-sm font-medium">
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
    <label className="flex w-full flex-col space-y-2 text-sm font-medium">
      <span>{label}</span>
      <select
        value={value}
        required={required}
        onChange={(event) => onChange(event.target.value)}
        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {children}
      </select>
    </label>
  );
}
