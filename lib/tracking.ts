import type { DeliveryStatus } from '@/lib/types'

export interface TrackingDriver {
  id: string
  nome: string
  telefone: string | null
  latitude: number | null
  longitude: number | null
}

export interface TrackingVehicle {
  id: string
  placa: string
  modelo: string | null
  latitude: number | null
  longitude: number | null
}

export interface TrackingRoute {
  id: string
  codigo: string
  status: string
  km_total: number | null
  km_percorrido: number | null
  tempo_estimado_min: number | null
  motoristas?: TrackingDriver | null
  veiculos?: TrackingVehicle | null
}

export interface TrackingDelivery {
  id: string
  codigo_rastreio: string
  pedido_id: string | null
  rota_id: string | null
  rotas?: TrackingRoute | null
  remetente_nome: string | null
  remetente_logradouro: string | null
  remetente_numero: string | null
  remetente_bairro: string | null
  remetente_cidade: string | null
  remetente_uf: string | null
  destinatario_nome: string
  destinatario_logradouro: string
  destinatario_numero: string | null
  destinatario_bairro: string | null
  destinatario_cidade: string
  destinatario_uf: string
  destinatario_latitude: number | null
  destinatario_longitude: number | null
  status: DeliveryStatus
  prazo_entrega: string | null
  data_coleta: string | null
  data_entrega: string | null
  created_at: string
}

export interface TrackingEvent {
  id: string
  entrega_id: string
  status: DeliveryStatus
  descricao: string
  latitude: number | null
  longitude: number | null
  usuario_id: string | null
  created_at: string
}

export function getAddressLine(delivery: TrackingDelivery, type: 'origin' | 'destination') {
  if (type === 'origin') {
    return [delivery.remetente_logradouro, delivery.remetente_numero, delivery.remetente_bairro, delivery.remetente_cidade, delivery.remetente_uf]
      .filter(Boolean)
      .join(', ')
  }

  return [delivery.destinatario_logradouro, delivery.destinatario_numero, delivery.destinatario_bairro, delivery.destinatario_cidade, delivery.destinatario_uf]
    .filter(Boolean)
    .join(', ')
}
