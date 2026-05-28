export type QuoteStatus = 'RASCUNHO' | 'ENVIADA' | 'EM_NEGOCIACAO' | 'APROVADA' | 'RECUSADA' | 'CANCELADA'
export type ProposalStatus = 'RASCUNHO' | 'ENVIADA' | 'VISUALIZADA' | 'APROVADA' | 'RECUSADA' | 'EXPIRADA'

export interface ClientOption {
  id: string
  razao_social: string
  nome_fantasia: string | null
}

export interface QuoteRow {
  id: string
  codigo: string
  cliente_id: string | null
  clientes?: ClientOption | null
  origem: Record<string, string>
  destino: Record<string, string>
  volumes: number
  peso_kg: number
  cubagem_m3: number
  distancia_km: number | null
  prazo_dias: number | null
  custo_estimado: number | null
  preco_venda: number | null
  margem_percentual: number | null
  status: QuoteStatus
  validade: string | null
  observacoes: string | null
  created_at: string
}

export interface ProposalRow {
  id: string
  codigo: string
  cotacao_id: string | null
  cliente_id: string | null
  clientes?: ClientOption | null
  titulo: string
  descricao: string | null
  valor_total: number
  status: ProposalStatus
  enviada_em: string | null
  expira_em: string | null
  arquivo_url: string | null
  created_at: string
}

export interface QuoteFormData {
  codigo: string
  cliente_id: string
  origem_cidade: string
  origem_uf: string
  destino_cidade: string
  destino_uf: string
  volumes: string
  peso_kg: string
  cubagem_m3: string
  distancia_km: string
  prazo_dias: string
  custo_estimado: string
  preco_venda: string
  status: QuoteStatus
  validade: string
  observacoes: string
}

export interface ProposalFormData {
  codigo: string
  cliente_id: string
  cotacao_id: string
  titulo: string
  descricao: string
  valor_total: string
  status: ProposalStatus
  expira_em: string
  arquivo_url: string
}

export const quoteStatusLabels: Record<QuoteStatus, string> = {
  RASCUNHO: 'Rascunho',
  ENVIADA: 'Enviada',
  EM_NEGOCIACAO: 'Em negociacao',
  APROVADA: 'Aprovada',
  RECUSADA: 'Recusada',
  CANCELADA: 'Cancelada',
}

export const proposalStatusLabels: Record<ProposalStatus, string> = {
  RASCUNHO: 'Rascunho',
  ENVIADA: 'Enviada',
  VISUALIZADA: 'Visualizada',
  APROVADA: 'Aprovada',
  RECUSADA: 'Recusada',
  EXPIRADA: 'Expirada',
}

export const emptyQuoteForm: QuoteFormData = {
  codigo: '',
  cliente_id: '',
  origem_cidade: '',
  origem_uf: '',
  destino_cidade: '',
  destino_uf: '',
  volumes: '1',
  peso_kg: '',
  cubagem_m3: '',
  distancia_km: '',
  prazo_dias: '',
  custo_estimado: '',
  preco_venda: '',
  status: 'RASCUNHO',
  validade: '',
  observacoes: '',
}

export const emptyProposalForm: ProposalFormData = {
  codigo: '',
  cliente_id: '',
  cotacao_id: '',
  titulo: '',
  descricao: '',
  valor_total: '',
  status: 'RASCUNHO',
  expira_em: '',
  arquivo_url: '',
}

export function createCode(prefix: string) {
  const date = new Date()
  const stamp = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`
  const suffix = Math.floor(1000 + Math.random() * 9000)

  return `${prefix}-${stamp}-${suffix}`
}

export function toNumberOrNull(value: string) {
  if (!value.trim()) return null
  const parsed = Number(value.replace(',', '.'))
  return Number.isFinite(parsed) ? parsed : null
}

export function toIntegerOrNull(value: string) {
  if (!value.trim()) return null
  const parsed = Number.parseInt(value, 10)
  return Number.isFinite(parsed) ? parsed : null
}
