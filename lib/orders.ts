import type { DeliveryStatus } from '@/lib/types'

export interface OrderRow {
  id: string
  codigo_rastreio: string
  pedido_id: string | null
  remetente_nome: string | null
  remetente_documento: string | null
  remetente_logradouro: string | null
  remetente_numero: string | null
  remetente_complemento: string | null
  remetente_bairro: string | null
  remetente_cidade: string | null
  remetente_uf: string | null
  remetente_cep: string | null
  remetente_contato: string | null
  destinatario_nome: string
  destinatario_documento: string | null
  destinatario_logradouro: string
  destinatario_numero: string | null
  destinatario_complemento: string | null
  destinatario_bairro: string | null
  destinatario_cidade: string
  destinatario_uf: string
  destinatario_cep: string | null
  destinatario_contato: string | null
  volumes: number
  peso_kg: number | null
  cubagem_m3: number | null
  valor_declarado: number | null
  nota_fiscal: string | null
  status: DeliveryStatus
  prazo_entrega: string | null
  created_at: string
}

export type OrderFormData = {
  codigo_rastreio: string
  pedido_id: string
  remetente_nome: string
  remetente_documento: string
  remetente_logradouro: string
  remetente_numero: string
  remetente_complemento: string
  remetente_bairro: string
  remetente_cidade: string
  remetente_uf: string
  remetente_cep: string
  remetente_contato: string
  destinatario_nome: string
  destinatario_documento: string
  destinatario_logradouro: string
  destinatario_numero: string
  destinatario_complemento: string
  destinatario_bairro: string
  destinatario_cidade: string
  destinatario_uf: string
  destinatario_cep: string
  destinatario_contato: string
  volumes: string
  peso_kg: string
  cubagem_m3: string
  valor_declarado: string
  nota_fiscal: string
  prazo_entrega: string
}

export const emptyOrderForm: OrderFormData = {
  codigo_rastreio: '',
  pedido_id: '',
  remetente_nome: '',
  remetente_documento: '',
  remetente_logradouro: '',
  remetente_numero: '',
  remetente_complemento: '',
  remetente_bairro: '',
  remetente_cidade: '',
  remetente_uf: '',
  remetente_cep: '',
  remetente_contato: '',
  destinatario_nome: '',
  destinatario_documento: '',
  destinatario_logradouro: '',
  destinatario_numero: '',
  destinatario_complemento: '',
  destinatario_bairro: '',
  destinatario_cidade: '',
  destinatario_uf: '',
  destinatario_cep: '',
  destinatario_contato: '',
  volumes: '1',
  peso_kg: '',
  cubagem_m3: '',
  valor_declarado: '',
  nota_fiscal: '',
  prazo_entrega: '',
}

export function createTrackingCode() {
  const date = new Date()
  const stamp = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`
  const suffix = Math.floor(1000 + Math.random() * 9000)

  return `NTSVN${stamp}${suffix}`
}

export function toNumberOrNull(value: string) {
  if (!value.trim()) {
    return null
  }

  const parsed = Number(value.replace(',', '.'))

  return Number.isFinite(parsed) ? parsed : null
}
