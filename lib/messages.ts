export type MessageSenderType = 'MOTORISTA' | 'BASE'

export interface ChatDriver {
  id: string
  nome: string
  telefone: string | null
  email: string | null
  status: string
  latitude: number | null
  longitude: number | null
}

export interface ChatVehicle {
  id: string
  placa: string
  modelo: string | null
}

export interface ChatRoute {
  id: string
  codigo: string
  status: string
  motorista_id: string | null
  veiculo_id: string | null
  motoristas?: ChatDriver | null
  veiculos?: ChatVehicle | null
}

export interface ChatMessage {
  id: string
  rota_id: string | null
  remetente_id: string | null
  remetente_tipo: MessageSenderType
  conteudo: string
  lida: boolean
  created_at: string
}

export function getRouteTitle(route: ChatRoute) {
  return route.motoristas?.nome || route.codigo
}

export function getRouteSubtitle(route: ChatRoute) {
  const vehicle = route.veiculos ? `${route.veiculos.placa} - ${route.veiculos.modelo || 'Sem modelo'}` : 'Sem veiculo'
  return `${route.codigo} - ${vehicle}`
}
