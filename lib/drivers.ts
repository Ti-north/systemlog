export type DriverStatus = 'DISPONIVEL' | 'EM_ROTA' | 'INDISPONIVEL'

export interface DriverVehicle {
  id: string
  placa: string
  modelo: string | null
}

export interface DriverRow {
  id: string
  cpf: string
  nome: string
  cnh: string
  cnh_validade: string | null
  telefone: string | null
  email: string | null
  foto_url: string | null
  veiculo_id: string | null
  veiculos?: DriverVehicle | null
  status: DriverStatus
  latitude: number | null
  longitude: number | null
  localizacao_at: string | null
  ativo: boolean
  created_at: string
}

export interface DriverFormData {
  nome: string
  cpf: string
  cnh: string
  cnh_validade: string
  telefone: string
  email: string
  veiculo_id: string
  status: DriverStatus
}

export const emptyDriverForm: DriverFormData = {
  nome: '',
  cpf: '',
  cnh: '',
  cnh_validade: '',
  telefone: '',
  email: '',
  veiculo_id: '',
  status: 'DISPONIVEL',
}

export const driverStatusLabels: Record<DriverStatus, string> = {
  DISPONIVEL: 'Disponivel',
  EM_ROTA: 'Em rota',
  INDISPONIVEL: 'Indisponivel',
}
