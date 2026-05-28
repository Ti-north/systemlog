/**
 * =====================================================
 * LOGITRACK - DIAGRAMA DE FLUXO DE DADOS
 * =====================================================
 * 
 * 1. CRIACAO DO PEDIDO (OMS)
 *    Cliente/Embarcador -> Sistema
 *    - Cadastro de frete (origem, destino, volumes)
 *    - Upload de NF-e/CT-e (XML)
 *    - Calculo automatico de cubagem e peso
 *    - Estimativa de prazo e custo
 * 
 * 2. PLANEJAMENTO DE ROTA
 *    Sistema -> Roteirizador
 *    - Agrupamento de entregas por regiao
 *    - Otimizacao de sequencia (Google Maps API)
 *    - Atribuicao de veiculo e motorista
 *    - Geracao de manifesto de carga
 * 
 * 3. DESPACHO
 *    Base -> Motorista
 *    - Push notification com manifesto
 *    - Download de rota no app
 *    - Confirmacao de inicio de viagem
 *    - Status: COLETADO
 * 
 * 4. TRANSITO
 *    Motorista -> Sistema (tempo real)
 *    - Geolocalizacao continua
 *    - Registro de paradas (combustivel, descanso)
 *    - Chat com base operacional
 *    - Status: EM_TRANSITO
 * 
 * 5. ENTREGA
 *    Motorista -> Destinatario
 *    - Chegada no destino
 *    - Captura de assinatura digital
 *    - Foto do canhoto/comprovante
 *    - Status: ENTREGUE
 * 
 * 6. INSUCESSO (se aplicavel)
 *    Motorista -> Sistema
 *    - Motivo do insucesso (ausente, endereco errado, etc)
 *    - Foto comprobatoria
 *    - Agendamento de reentrega ou devolucao
 *    - Status: INSUCESSO | REENTREGA | DEVOLUCAO
 * 
 * 7. FINALIZACAO
 *    Sistema -> Cliente/Financeiro
 *    - Webhook de atualizacao de status
 *    - Liberacao para faturamento
 *    - Calculo de KPIs (OTIF, Lead Time)
 * 
 * =====================================================
 */

// =====================================================
// TIPOS E INTERFACES DO SISTEMA
// =====================================================

export type DeliveryStatus = 
  | 'PENDENTE'      // Aguardando coleta
  | 'COLETADO'      // Coletado, aguardando despacho
  | 'EM_TRANSITO'   // Em rota de entrega
  | 'ENTREGUE'      // Entrega concluida com sucesso
  | 'INSUCESSO'     // Tentativa de entrega falhou
  | 'REENTREGA'     // Agendado para nova tentativa
  | 'DEVOLUCAO';    // Em processo de devolucao ao remetente

export type VehicleType = 'MOTO' | 'FIORINO' | 'VAN' | 'TRUCK' | 'CARRETA';

export type OccurrenceType = 
  | 'ATRASO'
  | 'AVARIA'
  | 'EXTRAVIO'
  | 'ROUBO'
  | 'ACIDENTE'
  | 'MANUTENCAO'
  | 'OUTROS';

export type StopType = 
  | 'ABASTECIMENTO'
  | 'DESCANSO'
  | 'MANUTENCAO'
  | 'REFEICAO'
  | 'OUTROS';

// =====================================================
// CLIENTE (EMBARCADOR)
// =====================================================
export interface Client {
  id: string;
  cnpj: string;
  razao_social: string;
  nome_fantasia: string;
  email: string;
  telefone: string;
  endereco: Address;
  contato_principal: string;
  created_at: Date;
  updated_at: Date;
  ativo: boolean;
}

// =====================================================
// MOTORISTA
// =====================================================
export interface Driver {
  id: string;
  cpf: string;
  nome: string;
  cnh: string;
  cnh_validade: Date;
  telefone: string;
  email: string;
  foto_url?: string;
  veiculo_id?: string;
  status: 'DISPONIVEL' | 'EM_ROTA' | 'INDISPONIVEL';
  localizacao_atual?: GeoLocation;
  created_at: Date;
  updated_at: Date;
  ativo: boolean;
}

// =====================================================
// VEICULO
// =====================================================
export interface Vehicle {
  id: string;
  placa: string;
  tipo: VehicleType;
  modelo: string;
  ano: number;
  capacidade_kg: number;
  capacidade_m3: number;
  km_atual: number;
  consumo_medio: number; // km/l
  status: 'DISPONIVEL' | 'EM_USO' | 'MANUTENCAO';
  motorista_id?: string;
  localizacao_atual?: GeoLocation;
  created_at: Date;
  updated_at: Date;
  ativo: boolean;
}

// =====================================================
// ROTA
// =====================================================
export interface Route {
  id: string;
  codigo: string;
  data_prevista: Date;
  motorista_id: string;
  veiculo_id: string;
  entregas: Delivery[];
  status: 'PLANEJADA' | 'EM_ANDAMENTO' | 'FINALIZADA' | 'CANCELADA';
  km_total: number;
  km_percorrido: number;
  tempo_estimado_min: number;
  sequencia_otimizada: string[]; // IDs das entregas em ordem
  polyline?: string; // Google Maps encoded polyline
  created_at: Date;
  updated_at: Date;
  iniciada_em?: Date;
  finalizada_em?: Date;
}

// =====================================================
// ENTREGA
// =====================================================
export interface Delivery {
  id: string;
  codigo_rastreio: string;
  pedido_id: string;
  rota_id?: string;
  
  // Remetente
  remetente: {
    nome: string;
    documento: string;
    endereco: Address;
    contato: string;
  };
  
  // Destinatario
  destinatario: {
    nome: string;
    documento: string;
    endereco: Address;
    contato: string;
  };
  
  // Dados da carga
  volumes: number;
  peso_kg: number;
  cubagem_m3: number;
  valor_declarado: number;
  nota_fiscal?: string;
  
  // Status e datas
  status: DeliveryStatus;
  prazo_entrega: Date;
  data_coleta?: Date;
  data_entrega?: Date;
  
  // Comprovante
  assinatura_url?: string;
  foto_canhoto_url?: string;
  recebedor_nome?: string;
  recebedor_documento?: string;
  
  // Insucesso/Reentrega
  motivo_insucesso?: string;
  tentativas: number;
  
  // Historico
  historico: DeliveryEvent[];
  
  created_at: Date;
  updated_at: Date;
}

// =====================================================
// EVENTO DE ENTREGA (HISTORICO)
// =====================================================
export interface DeliveryEvent {
  id: string;
  entrega_id: string;
  status: DeliveryStatus;
  descricao: string;
  localizacao?: GeoLocation;
  usuario_id: string;
  created_at: Date;
}

// =====================================================
// OCORRENCIA
// =====================================================
export interface Occurrence {
  id: string;
  tipo: OccurrenceType;
  descricao: string;
  entrega_id?: string;
  rota_id?: string;
  veiculo_id?: string;
  motorista_id?: string;
  gravidade: 'BAIXA' | 'MEDIA' | 'ALTA' | 'CRITICA';
  status: 'ABERTA' | 'EM_ANALISE' | 'RESOLVIDA' | 'CANCELADA';
  fotos_url?: string[];
  created_at: Date;
  resolved_at?: Date;
  resolved_by?: string;
}

// =====================================================
// PARADA NAO PROGRAMADA
// =====================================================
export interface UnplannedStop {
  id: string;
  rota_id: string;
  motorista_id: string;
  tipo: StopType;
  descricao?: string;
  localizacao: GeoLocation;
  inicio: Date;
  fim?: Date;
  duracao_min?: number;
}

// =====================================================
// MENSAGEM (CHAT BASE-MOTORISTA)
// =====================================================
export interface Message {
  id: string;
  rota_id?: string;
  remetente_id: string;
  remetente_tipo: 'MOTORISTA' | 'BASE';
  conteudo: string;
  lida: boolean;
  created_at: Date;
}

// =====================================================
// TIPOS AUXILIARES
// =====================================================
export interface Address {
  logradouro: string;
  numero: string;
  complemento?: string;
  bairro: string;
  cidade: string;
  uf: string;
  cep: string;
  latitude?: number;
  longitude?: number;
}

export interface GeoLocation {
  latitude: number;
  longitude: number;
  timestamp: Date;
  accuracy?: number;
}

// =====================================================
// KPIs
// =====================================================
export interface KPIs {
  otif: number;           // % entregas no prazo e completas
  lead_time_medio: number; // horas
  custo_por_km: number;   // R$/km
  taxa_insucesso: number; // %
  entregas_dia: number;
  km_dia: number;
}

// =====================================================
// SQL SCHEMA - 5 PRINCIPAIS TABELAS
// =====================================================
/*
-- Tabela: clientes
CREATE TABLE clientes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cnpj VARCHAR(18) UNIQUE NOT NULL,
    razao_social VARCHAR(255) NOT NULL,
    nome_fantasia VARCHAR(255),
    email VARCHAR(255),
    telefone VARCHAR(20),
    logradouro VARCHAR(255),
    numero VARCHAR(20),
    complemento VARCHAR(100),
    bairro VARCHAR(100),
    cidade VARCHAR(100),
    uf CHAR(2),
    cep VARCHAR(9),
    contato_principal VARCHAR(255),
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Tabela: motoristas
CREATE TABLE motoristas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cpf VARCHAR(14) UNIQUE NOT NULL,
    nome VARCHAR(255) NOT NULL,
    cnh VARCHAR(20) NOT NULL,
    cnh_validade DATE,
    telefone VARCHAR(20),
    email VARCHAR(255),
    foto_url TEXT,
    veiculo_id UUID REFERENCES veiculos(id),
    status VARCHAR(20) DEFAULT 'DISPONIVEL',
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Tabela: veiculos
CREATE TABLE veiculos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    placa VARCHAR(10) UNIQUE NOT NULL,
    tipo VARCHAR(20) NOT NULL,
    modelo VARCHAR(100),
    ano INTEGER,
    capacidade_kg DECIMAL(10, 2),
    capacidade_m3 DECIMAL(10, 2),
    km_atual DECIMAL(12, 2) DEFAULT 0,
    consumo_medio DECIMAL(5, 2),
    status VARCHAR(20) DEFAULT 'DISPONIVEL',
    motorista_id UUID REFERENCES motoristas(id),
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Tabela: rotas
CREATE TABLE rotas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    codigo VARCHAR(50) UNIQUE NOT NULL,
    data_prevista DATE NOT NULL,
    motorista_id UUID REFERENCES motoristas(id),
    veiculo_id UUID REFERENCES veiculos(id),
    status VARCHAR(20) DEFAULT 'PLANEJADA',
    km_total DECIMAL(10, 2),
    km_percorrido DECIMAL(10, 2) DEFAULT 0,
    tempo_estimado_min INTEGER,
    sequencia_otimizada JSONB,
    polyline TEXT,
    iniciada_em TIMESTAMP,
    finalizada_em TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Tabela: entregas
CREATE TABLE entregas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    codigo_rastreio VARCHAR(50) UNIQUE NOT NULL,
    pedido_id VARCHAR(50),
    rota_id UUID REFERENCES rotas(id),
    
    -- Remetente
    remetente_nome VARCHAR(255),
    remetente_documento VARCHAR(20),
    remetente_logradouro VARCHAR(255),
    remetente_numero VARCHAR(20),
    remetente_bairro VARCHAR(100),
    remetente_cidade VARCHAR(100),
    remetente_uf CHAR(2),
    remetente_cep VARCHAR(9),
    remetente_contato VARCHAR(20),
    
    -- Destinatario
    destinatario_nome VARCHAR(255) NOT NULL,
    destinatario_documento VARCHAR(20),
    destinatario_logradouro VARCHAR(255) NOT NULL,
    destinatario_numero VARCHAR(20),
    destinatario_bairro VARCHAR(100),
    destinatario_cidade VARCHAR(100) NOT NULL,
    destinatario_uf CHAR(2) NOT NULL,
    destinatario_cep VARCHAR(9),
    destinatario_contato VARCHAR(20),
    destinatario_latitude DECIMAL(10, 8),
    destinatario_longitude DECIMAL(11, 8),
    
    -- Carga
    volumes INTEGER DEFAULT 1,
    peso_kg DECIMAL(10, 2),
    cubagem_m3 DECIMAL(10, 4),
    valor_declarado DECIMAL(12, 2),
    nota_fiscal VARCHAR(50),
    
    -- Status
    status VARCHAR(20) DEFAULT 'PENDENTE',
    prazo_entrega TIMESTAMP,
    data_coleta TIMESTAMP,
    data_entrega TIMESTAMP,
    
    -- Comprovante
    assinatura_url TEXT,
    foto_canhoto_url TEXT,
    recebedor_nome VARCHAR(255),
    recebedor_documento VARCHAR(20),
    
    -- Insucesso
    motivo_insucesso TEXT,
    tentativas INTEGER DEFAULT 0,
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Indices para performance
CREATE INDEX idx_entregas_status ON entregas(status);
CREATE INDEX idx_entregas_rota ON entregas(rota_id);
CREATE INDEX idx_entregas_prazo ON entregas(prazo_entrega);
CREATE INDEX idx_rotas_data ON rotas(data_prevista);
CREATE INDEX idx_rotas_motorista ON rotas(motorista_id);
*/
