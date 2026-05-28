import type { DeliveryStatus, OccurrenceType } from '@/lib/types'

export interface DashboardDelivery {
  id: string
  codigo_rastreio: string
  destinatario_nome: string
  destinatario_cidade: string
  destinatario_uf: string
  status: DeliveryStatus
  prazo_entrega: string | null
  data_coleta: string | null
  data_entrega: string | null
  valor_declarado: number | null
  created_at: string
}

export interface DashboardRoute {
  id: string
  codigo: string
  data_prevista: string
  status: string
  km_total: number | null
  km_percorrido: number | null
}

export interface DashboardVehicle {
  id: string
  placa: string
  modelo: string | null
}

export interface DashboardDriver {
  id: string
  nome: string
  status: 'DISPONIVEL' | 'EM_ROTA' | 'INDISPONIVEL'
  veiculo_id: string | null
  veiculos?: DashboardVehicle | null
  latitude: number | null
  longitude: number | null
}

export interface DashboardOccurrence {
  id: string
  tipo: OccurrenceType
  descricao: string
  gravidade: 'BAIXA' | 'MEDIA' | 'ALTA' | 'CRITICA'
  status: 'ABERTA' | 'EM_ANALISE' | 'RESOLVIDA' | 'CANCELADA'
  created_at: string
}

export interface DashboardPayment {
  valor: number
  status: string
}

export interface DashboardKpis {
  otif: number
  leadTimeMedio: number
  custoPorKm: number
  taxaInsucesso: number
  entregasDia: number
  kmDia: number
}

export interface DeliveryTrendPoint {
  hora: string
  entregas: number
  insucesso: number
}

export interface StatusDistributionPoint {
  status: string
  quantidade: number
}

function isSameLocalDate(value: string | null | undefined, date = new Date()) {
  if (!value) return false
  const parsed = new Date(value)
  return parsed.toDateString() === date.toDateString()
}

export function calculateDashboardKpis(
  deliveries: DashboardDelivery[],
  routes: DashboardRoute[],
  payments: DashboardPayment[],
): DashboardKpis {
  const delivered = deliveries.filter((delivery) => delivery.status === 'ENTREGUE')
  const deliveredOnTime = delivered.filter((delivery) => {
    if (!delivery.data_entrega || !delivery.prazo_entrega) return false
    return new Date(delivery.data_entrega).getTime() <= new Date(delivery.prazo_entrega).getTime()
  })

  const leadTimes = delivered
    .filter((delivery) => delivery.data_coleta && delivery.data_entrega)
    .map((delivery) => (new Date(delivery.data_entrega as string).getTime() - new Date(delivery.data_coleta as string).getTime()) / 36e5)
    .filter((hours) => Number.isFinite(hours) && hours >= 0)

  const totalKm = routes.reduce((sum, route) => sum + (route.km_total ?? route.km_percorrido ?? 0), 0)
  const totalPaid = payments
    .filter((payment) => payment.status !== 'CANCELADO')
    .reduce((sum, payment) => sum + (payment.valor ?? 0), 0)

  return {
    otif: delivered.length ? Math.round((deliveredOnTime.length / delivered.length) * 1000) / 10 : 0,
    leadTimeMedio: leadTimes.length ? Math.round((leadTimes.reduce((sum, value) => sum + value, 0) / leadTimes.length) * 10) / 10 : 0,
    custoPorKm: totalKm ? Math.round((totalPaid / totalKm) * 100) / 100 : 0,
    taxaInsucesso: deliveries.length ? Math.round((deliveries.filter((delivery) => delivery.status === 'INSUCESSO').length / deliveries.length) * 1000) / 10 : 0,
    entregasDia: deliveries.filter((delivery) => isSameLocalDate(delivery.created_at)).length,
    kmDia: Math.round(routes.filter((route) => isSameLocalDate(route.data_prevista)).reduce((sum, route) => sum + (route.km_percorrido ?? 0), 0)),
  }
}

export function buildDeliveryTrend(deliveries: DashboardDelivery[]): DeliveryTrendPoint[] {
  const points = Array.from({ length: 13 }, (_, index) => {
    const hour = index + 6
    return { hora: `${String(hour).padStart(2, '0')}:00`, entregas: 0, insucesso: 0 }
  })

  deliveries.forEach((delivery) => {
    const date = new Date(delivery.data_entrega || delivery.created_at)
    const hour = date.getHours()
    const point = points.find((item) => item.hora === `${String(hour).padStart(2, '0')}:00`)
    if (!point) return
    if (delivery.status === 'INSUCESSO') point.insucesso += 1
    else point.entregas += 1
  })

  return points
}

export function buildStatusDistribution(deliveries: DashboardDelivery[]): StatusDistributionPoint[] {
  const labels: Record<DeliveryStatus, string> = {
    PENDENTE: 'Pendente',
    COLETADO: 'Coletado',
    EM_TRANSITO: 'Em Transito',
    ENTREGUE: 'Entregue',
    INSUCESSO: 'Insucesso',
    REENTREGA: 'Reentrega',
    DEVOLUCAO: 'Devolucao',
  }

  return Object.entries(labels)
    .map(([status, label]) => ({
      status: label,
      quantidade: deliveries.filter((delivery) => delivery.status === status).length,
    }))
    .filter((item) => item.quantidade > 0)
}
