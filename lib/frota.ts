export type VehicleStatus = 'DISPONIVEL' | 'EM_USO' | 'MANUTENCAO'
export type VehicleTypeValue = 'MOTO' | 'FIORINO' | 'VAN' | 'TRUCK' | 'CARRETA'

export interface FrotaDriver {
  id: string
  nome: string
}

export interface FrotaRow {
  id: string
  placa: string
  tipo: VehicleTypeValue
  modelo: string | null
  ano: number | null
  capacidade_kg: number | null
  capacidade_m3: number | null
  km_atual: number | null
  consumo_medio: number | null
  status: VehicleStatus
  motorista_id: string | null
  motoristas?: FrotaDriver | null
  latitude: number | null
  longitude: number | null
  localizacao_at: string | null
  ativo: boolean
  created_at: string
}

export type FrotaFormData = {
  placa: string
  tipo: VehicleTypeValue | ''
  modelo: string
  ano: string
  capacidade_kg: string
  capacidade_m3: string
  km_atual: string
  consumo_medio: string
  status: VehicleStatus | ''
  motorista_id: string
  latitude: string
  longitude: string
}

export const emptyFrotaForm: FrotaFormData = {
  placa: '',
  tipo: '',
  modelo: '',
  ano: '',
  capacidade_kg: '',
  capacidade_m3: '',
  km_atual: '',
  consumo_medio: '',
  status: 'DISPONIVEL',
  motorista_id: '',
  latitude: '',
  longitude: '',
}

export const vehicleStatusLabels: Record<VehicleStatus, string> = {
  DISPONIVEL: 'Disponivel',
  EM_USO: 'Em uso',
  MANUTENCAO: 'Manutencao',
}

export const vehicleTypeLabels: Record<VehicleTypeValue, string> = {
  MOTO: 'Moto',
  FIORINO: 'Fiorino',
  VAN: 'Van',
  TRUCK: 'Truck',
  CARRETA: 'Carreta',
}

export function toNumberOrNull(value: string) {
  if (!value.trim()) {
    return null
  }

  const parsed = Number(value.replace(',', '.'))

  return Number.isFinite(parsed) ? parsed : null
}

export function toIntegerOrNull(value: string) {
  if (!value.trim()) {
    return null
  }

  const parsed = Number.parseInt(value, 10)

  return Number.isFinite(parsed) ? parsed : null
}
