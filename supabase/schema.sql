-- LogiTrack / SystemLog - Supabase schema
-- Run this file in Supabase SQL Editor for a new project.

create extension if not exists "pgcrypto";

-- =====================================================
-- ENUMS
-- =====================================================

do $$ begin
  create type public.user_role as enum ('operacional', 'financeiro', 'comercial', 'ti');
exception when duplicate_object then null;
end $$;

do $$ begin
  alter type public.user_role add value if not exists 'ti';
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create type public.delivery_status as enum (
    'PENDENTE',
    'COLETADO',
    'EM_TRANSITO',
    'ENTREGUE',
    'INSUCESSO',
    'REENTREGA',
    'DEVOLUCAO'
  );
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.vehicle_type as enum ('MOTO', 'FIORINO', 'VAN', 'TRUCK', 'CARRETA');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.driver_status as enum ('DISPONIVEL', 'EM_ROTA', 'INDISPONIVEL');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.vehicle_status as enum ('DISPONIVEL', 'EM_USO', 'MANUTENCAO');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.route_status as enum ('PLANEJADA', 'EM_ANDAMENTO', 'FINALIZADA', 'CANCELADA');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.occurrence_type as enum (
    'ATRASO',
    'AVARIA',
    'EXTRAVIO',
    'ROUBO',
    'ACIDENTE',
    'MANUTENCAO',
    'OUTROS'
  );
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.occurrence_severity as enum ('BAIXA', 'MEDIA', 'ALTA', 'CRITICA');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.occurrence_status as enum ('ABERTA', 'EM_ANALISE', 'RESOLVIDA', 'CANCELADA');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.stop_type as enum ('ABASTECIMENTO', 'DESCANSO', 'MANUTENCAO', 'REFEICAO', 'OUTROS');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.message_sender_type as enum ('MOTORISTA', 'BASE');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.quote_status as enum ('RASCUNHO', 'ENVIADA', 'EM_NEGOCIACAO', 'APROVADA', 'RECUSADA', 'CANCELADA');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.proposal_status as enum ('RASCUNHO', 'ENVIADA', 'VISUALIZADA', 'APROVADA', 'RECUSADA', 'EXPIRADA');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.payment_status as enum ('A_FATURAR', 'FATURADO', 'PAGO', 'VENCIDO', 'CANCELADO');
exception when duplicate_object then null;
end $$;

-- =====================================================
-- HELPERS
-- =====================================================

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- =====================================================
-- AUTH / PERFIS
-- =====================================================

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  nome text not null,
  email text not null,
  role public.user_role not null default 'operacional',
  ativo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, nome, email, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'nome', split_part(new.email, '@', 1)),
    new.email,
    coalesce((new.raw_user_meta_data ->> 'role')::public.user_role, 'operacional')
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.current_user_role()
returns public.user_role
language sql
stable
security definer
set search_path = public
as $$
  select role
  from public.profiles
  where id = auth.uid()
$$;

create or replace function public.is_role(allowed_roles public.user_role[])
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(public.current_user_role() = any(allowed_roles), false)
$$;

create or replace function public.has_role(allowed_roles text[])
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(public.current_user_role()::text = any(allowed_roles), false)
$$;

-- =====================================================
-- COMERCIAL
-- =====================================================

create table if not exists public.clientes (
  id uuid primary key default gen_random_uuid(),
  cnpj varchar(18) unique not null,
  razao_social text not null,
  nome_fantasia text,
  email text,
  telefone varchar(20),
  logradouro text,
  numero varchar(20),
  complemento text,
  bairro text,
  cidade text,
  uf char(2),
  cep varchar(9),
  contato_principal text,
  observacoes text,
  ativo boolean not null default true,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.contatos_cliente (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid not null references public.clientes(id) on delete cascade,
  nome text not null,
  cargo text,
  email text,
  telefone varchar(20),
  principal boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.cotacoes (
  id uuid primary key default gen_random_uuid(),
  codigo text unique not null,
  cliente_id uuid references public.clientes(id),
  origem jsonb not null default '{}'::jsonb,
  destino jsonb not null default '{}'::jsonb,
  volumes integer not null default 1,
  peso_kg numeric(10, 2) not null default 0,
  cubagem_m3 numeric(10, 4) not null default 0,
  distancia_km numeric(10, 2),
  prazo_dias integer,
  custo_estimado numeric(12, 2),
  preco_venda numeric(12, 2),
  margem_percentual numeric(6, 2),
  status public.quote_status not null default 'RASCUNHO',
  validade date,
  observacoes text,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.propostas (
  id uuid primary key default gen_random_uuid(),
  codigo text unique not null,
  cotacao_id uuid references public.cotacoes(id) on delete set null,
  cliente_id uuid references public.clientes(id),
  titulo text not null,
  descricao text,
  valor_total numeric(12, 2) not null default 0,
  status public.proposal_status not null default 'RASCUNHO',
  enviada_em timestamptz,
  visualizada_em timestamptz,
  aprovada_em timestamptz,
  expira_em timestamptz,
  arquivo_url text,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- =====================================================
-- OPERACIONAL
-- =====================================================

create table if not exists public.motoristas (
  id uuid primary key default gen_random_uuid(),
  cpf varchar(14) unique not null,
  nome text not null,
  cnh varchar(20) not null,
  cnh_validade date,
  telefone varchar(20),
  email text,
  foto_url text,
  status public.driver_status not null default 'DISPONIVEL',
  latitude numeric(10, 8),
  longitude numeric(11, 8),
  localizacao_at timestamptz,
  ativo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.veiculos (
  id uuid primary key default gen_random_uuid(),
  placa varchar(10) unique not null,
  tipo public.vehicle_type not null,
  modelo text,
  ano integer,
  capacidade_kg numeric(10, 2),
  capacidade_m3 numeric(10, 2),
  km_atual numeric(12, 2) not null default 0,
  consumo_medio numeric(5, 2),
  status public.vehicle_status not null default 'DISPONIVEL',
  motorista_id uuid references public.motoristas(id) on delete set null,
  latitude numeric(10, 8),
  longitude numeric(11, 8),
  localizacao_at timestamptz,
  ativo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.motoristas
  add column if not exists veiculo_id uuid references public.veiculos(id) on delete set null;

create table if not exists public.rotas (
  id uuid primary key default gen_random_uuid(),
  codigo text unique not null,
  data_prevista date not null,
  motorista_id uuid references public.motoristas(id) on delete set null,
  veiculo_id uuid references public.veiculos(id) on delete set null,
  status public.route_status not null default 'PLANEJADA',
  km_total numeric(10, 2),
  km_percorrido numeric(10, 2) not null default 0,
  tempo_estimado_min integer,
  sequencia_otimizada jsonb not null default '[]'::jsonb,
  polyline text,
  iniciada_em timestamptz,
  finalizada_em timestamptz,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.entregas (
  id uuid primary key default gen_random_uuid(),
  codigo_rastreio text unique not null,
  pedido_id text,
  cliente_id uuid references public.clientes(id) on delete set null,
  rota_id uuid references public.rotas(id) on delete set null,

  remetente_nome text,
  remetente_documento varchar(20),
  remetente_logradouro text,
  remetente_numero varchar(20),
  remetente_complemento text,
  remetente_bairro text,
  remetente_cidade text,
  remetente_uf char(2),
  remetente_cep varchar(9),
  remetente_contato varchar(20),

  destinatario_nome text not null,
  destinatario_documento varchar(20),
  destinatario_logradouro text not null,
  destinatario_numero varchar(20),
  destinatario_complemento text,
  destinatario_bairro text,
  destinatario_cidade text not null,
  destinatario_uf char(2) not null,
  destinatario_cep varchar(9),
  destinatario_contato varchar(20),
  destinatario_latitude numeric(10, 8),
  destinatario_longitude numeric(11, 8),

  volumes integer not null default 1,
  peso_kg numeric(10, 2),
  cubagem_m3 numeric(10, 4),
  valor_declarado numeric(12, 2),
  nota_fiscal text,

  status public.delivery_status not null default 'PENDENTE',
  prazo_entrega timestamptz,
  data_coleta timestamptz,
  data_entrega timestamptz,

  assinatura_url text,
  foto_canhoto_url text,
  recebedor_nome text,
  recebedor_documento varchar(20),
  motivo_insucesso text,
  tentativas integer not null default 0,

  faturavel boolean not null default false,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.entrega_eventos (
  id uuid primary key default gen_random_uuid(),
  entrega_id uuid not null references public.entregas(id) on delete cascade,
  status public.delivery_status not null,
  descricao text not null,
  latitude numeric(10, 8),
  longitude numeric(11, 8),
  usuario_id uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.ocorrencias (
  id uuid primary key default gen_random_uuid(),
  tipo public.occurrence_type not null,
  descricao text not null,
  entrega_id uuid references public.entregas(id) on delete set null,
  rota_id uuid references public.rotas(id) on delete set null,
  veiculo_id uuid references public.veiculos(id) on delete set null,
  motorista_id uuid references public.motoristas(id) on delete set null,
  gravidade public.occurrence_severity not null default 'BAIXA',
  status public.occurrence_status not null default 'ABERTA',
  fotos_url text[] not null default '{}',
  resolved_at timestamptz,
  resolved_by uuid references public.profiles(id) on delete set null,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.paradas_nao_programadas (
  id uuid primary key default gen_random_uuid(),
  rota_id uuid not null references public.rotas(id) on delete cascade,
  motorista_id uuid references public.motoristas(id) on delete set null,
  tipo public.stop_type not null,
  descricao text,
  latitude numeric(10, 8) not null,
  longitude numeric(11, 8) not null,
  inicio timestamptz not null default now(),
  fim timestamptz,
  duracao_min integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.mensagens (
  id uuid primary key default gen_random_uuid(),
  rota_id uuid references public.rotas(id) on delete set null,
  remetente_id uuid,
  remetente_tipo public.message_sender_type not null,
  conteudo text not null,
  lida boolean not null default false,
  created_at timestamptz not null default now()
);

-- =====================================================
-- FINANCEIRO
-- =====================================================

create table if not exists public.pagamentos (
  id uuid primary key default gen_random_uuid(),
  codigo text unique not null,
  cliente_id uuid references public.clientes(id) on delete set null,
  entrega_id uuid references public.entregas(id) on delete set null,
  proposta_id uuid references public.propostas(id) on delete set null,
  descricao text,
  valor numeric(12, 2) not null default 0,
  status public.payment_status not null default 'A_FATURAR',
  data_emissao date,
  data_vencimento date,
  data_pagamento date,
  nota_fiscal text,
  boleto_url text,
  comprovante_url text,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- =====================================================
-- UPDATED_AT TRIGGERS
-- =====================================================

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'profiles',
    'clientes',
    'contatos_cliente',
    'cotacoes',
    'propostas',
    'motoristas',
    'veiculos',
    'rotas',
    'entregas',
    'ocorrencias',
    'paradas_nao_programadas',
    'pagamentos'
  ]
  loop
    execute format('drop trigger if exists set_%I_updated_at on public.%I', table_name, table_name);
    execute format(
      'create trigger set_%I_updated_at before update on public.%I for each row execute function public.set_updated_at()',
      table_name,
      table_name
    );
  end loop;
end $$;

-- =====================================================
-- INDEXES
-- =====================================================

create index if not exists idx_profiles_role on public.profiles(role);
create index if not exists idx_clientes_cnpj on public.clientes(cnpj);
create index if not exists idx_clientes_ativo on public.clientes(ativo);
create index if not exists idx_cotacoes_cliente on public.cotacoes(cliente_id);
create index if not exists idx_cotacoes_status on public.cotacoes(status);
create index if not exists idx_propostas_cliente on public.propostas(cliente_id);
create index if not exists idx_propostas_status on public.propostas(status);
create index if not exists idx_motoristas_status on public.motoristas(status);
create index if not exists idx_veiculos_status on public.veiculos(status);
create index if not exists idx_rotas_data on public.rotas(data_prevista);
create index if not exists idx_rotas_motorista on public.rotas(motorista_id);
create index if not exists idx_rotas_status on public.rotas(status);
create index if not exists idx_entregas_cliente on public.entregas(cliente_id);
create index if not exists idx_entregas_rota on public.entregas(rota_id);
create index if not exists idx_entregas_status on public.entregas(status);
create index if not exists idx_entregas_prazo on public.entregas(prazo_entrega);
create index if not exists idx_entrega_eventos_entrega on public.entrega_eventos(entrega_id);
create index if not exists idx_ocorrencias_status on public.ocorrencias(status);
create index if not exists idx_mensagens_rota on public.mensagens(rota_id);
create index if not exists idx_pagamentos_cliente on public.pagamentos(cliente_id);
create index if not exists idx_pagamentos_status on public.pagamentos(status);
create index if not exists idx_pagamentos_vencimento on public.pagamentos(data_vencimento);

-- =====================================================
-- RLS
-- =====================================================

alter table public.profiles enable row level security;
alter table public.clientes enable row level security;
alter table public.contatos_cliente enable row level security;
alter table public.cotacoes enable row level security;
alter table public.propostas enable row level security;
alter table public.motoristas enable row level security;
alter table public.veiculos enable row level security;
alter table public.rotas enable row level security;
alter table public.entregas enable row level security;
alter table public.entrega_eventos enable row level security;
alter table public.ocorrencias enable row level security;
alter table public.paradas_nao_programadas enable row level security;
alter table public.mensagens enable row level security;
alter table public.pagamentos enable row level security;

drop policy if exists "profiles_select_own_or_business" on public.profiles;
drop policy if exists "profiles_update_own" on public.profiles;
drop policy if exists "commercial_select_clientes" on public.clientes;
drop policy if exists "commercial_write_clientes" on public.clientes;
drop policy if exists "commercial_select_contatos" on public.contatos_cliente;
drop policy if exists "commercial_write_contatos" on public.contatos_cliente;
drop policy if exists "commercial_select_cotacoes" on public.cotacoes;
drop policy if exists "commercial_write_cotacoes" on public.cotacoes;
drop policy if exists "commercial_select_propostas" on public.propostas;
drop policy if exists "commercial_write_propostas" on public.propostas;
drop policy if exists "operational_select_motoristas" on public.motoristas;
drop policy if exists "operational_write_motoristas" on public.motoristas;
drop policy if exists "operational_select_veiculos" on public.veiculos;
drop policy if exists "operational_write_veiculos" on public.veiculos;
drop policy if exists "operational_select_rotas" on public.rotas;
drop policy if exists "operational_write_rotas" on public.rotas;
drop policy if exists "operational_financial_select_entregas" on public.entregas;
drop policy if exists "operational_write_entregas" on public.entregas;
drop policy if exists "operational_select_entrega_eventos" on public.entrega_eventos;
drop policy if exists "operational_write_entrega_eventos" on public.entrega_eventos;
drop policy if exists "operational_select_ocorrencias" on public.ocorrencias;
drop policy if exists "operational_write_ocorrencias" on public.ocorrencias;
drop policy if exists "operational_select_paradas" on public.paradas_nao_programadas;
drop policy if exists "operational_write_paradas" on public.paradas_nao_programadas;
drop policy if exists "operational_select_mensagens" on public.mensagens;
drop policy if exists "operational_write_mensagens" on public.mensagens;
drop policy if exists "financial_select_pagamentos" on public.pagamentos;
drop policy if exists "financial_write_pagamentos" on public.pagamentos;

create policy "profiles_select_own_or_business"
on public.profiles for select
to authenticated
using (id = auth.uid() or public.has_role(array['operacional', 'financeiro', 'comercial', 'ti']));

create policy "profiles_update_own"
on public.profiles for update
to authenticated
using (id = auth.uid())
with check (id = auth.uid());

-- Comercial: clientes, contatos, cotacoes e propostas.
create policy "commercial_select_clientes"
on public.clientes for select
to authenticated
using (public.has_role(array['comercial', 'financeiro', 'operacional', 'ti']));

create policy "commercial_write_clientes"
on public.clientes for all
to authenticated
using (public.has_role(array['comercial', 'ti']))
with check (public.has_role(array['comercial', 'ti']));

create policy "commercial_select_contatos"
on public.contatos_cliente for select
to authenticated
using (public.has_role(array['comercial', 'financeiro', 'ti']));

create policy "commercial_write_contatos"
on public.contatos_cliente for all
to authenticated
using (public.has_role(array['comercial', 'ti']))
with check (public.has_role(array['comercial', 'ti']));

create policy "commercial_select_cotacoes"
on public.cotacoes for select
to authenticated
using (public.has_role(array['comercial', 'ti']));

create policy "commercial_write_cotacoes"
on public.cotacoes for all
to authenticated
using (public.has_role(array['comercial', 'ti']))
with check (public.has_role(array['comercial', 'ti']));

create policy "commercial_select_propostas"
on public.propostas for select
to authenticated
using (public.has_role(array['comercial', 'financeiro', 'ti']));

create policy "commercial_write_propostas"
on public.propostas for all
to authenticated
using (public.has_role(array['comercial', 'ti']))
with check (public.has_role(array['comercial', 'ti']));

-- Operacional: frota, motoristas, rotas, entregas, ocorrencias e mensagens.
create policy "operational_select_motoristas"
on public.motoristas for select
to authenticated
using (public.has_role(array['operacional', 'ti']));

create policy "operational_write_motoristas"
on public.motoristas for all
to authenticated
using (public.has_role(array['operacional', 'ti']))
with check (public.has_role(array['operacional', 'ti']));

create policy "operational_select_veiculos"
on public.veiculos for select
to authenticated
using (public.has_role(array['operacional', 'ti']));

create policy "operational_write_veiculos"
on public.veiculos for all
to authenticated
using (public.has_role(array['operacional', 'ti']))
with check (public.has_role(array['operacional', 'ti']));

create policy "operational_select_rotas"
on public.rotas for select
to authenticated
using (public.has_role(array['operacional', 'ti']));

create policy "operational_write_rotas"
on public.rotas for all
to authenticated
using (public.has_role(array['operacional', 'ti']))
with check (public.has_role(array['operacional', 'ti']));

create policy "operational_financial_select_entregas"
on public.entregas for select
to authenticated
using (public.has_role(array['operacional', 'financeiro', 'ti']));

create policy "operational_write_entregas"
on public.entregas for all
to authenticated
using (public.has_role(array['operacional', 'ti']))
with check (public.has_role(array['operacional', 'ti']));

create policy "operational_select_entrega_eventos"
on public.entrega_eventos for select
to authenticated
using (public.has_role(array['operacional', 'financeiro', 'ti']));

create policy "operational_write_entrega_eventos"
on public.entrega_eventos for all
to authenticated
using (public.has_role(array['operacional', 'ti']))
with check (public.has_role(array['operacional', 'ti']));

create policy "operational_select_ocorrencias"
on public.ocorrencias for select
to authenticated
using (public.has_role(array['operacional', 'ti']));

create policy "operational_write_ocorrencias"
on public.ocorrencias for all
to authenticated
using (public.has_role(array['operacional', 'ti']))
with check (public.has_role(array['operacional', 'ti']));

create policy "operational_select_paradas"
on public.paradas_nao_programadas for select
to authenticated
using (public.has_role(array['operacional', 'ti']));

create policy "operational_write_paradas"
on public.paradas_nao_programadas for all
to authenticated
using (public.has_role(array['operacional', 'ti']))
with check (public.has_role(array['operacional', 'ti']));

create policy "operational_select_mensagens"
on public.mensagens for select
to authenticated
using (public.has_role(array['operacional', 'ti']));

create policy "operational_write_mensagens"
on public.mensagens for all
to authenticated
using (public.has_role(array['operacional', 'ti']))
with check (public.has_role(array['operacional', 'ti']));

-- Financeiro: pagamentos e leitura de dados comerciais/entregas necessarios para faturar.
create policy "financial_select_pagamentos"
on public.pagamentos for select
to authenticated
using (public.has_role(array['financeiro', 'ti']));

create policy "financial_write_pagamentos"
on public.pagamentos for all
to authenticated
using (public.has_role(array['financeiro', 'ti']))
with check (public.has_role(array['financeiro', 'ti']));

-- =====================================================
-- STORAGE BUCKETS
-- =====================================================

insert into storage.buckets (id, name, public)
values
  ('comprovantes', 'comprovantes', false),
  ('propostas', 'propostas', false),
  ('motoristas', 'motoristas', false)
on conflict (id) do nothing;
