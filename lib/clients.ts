export interface ClientsRow {
  id: string
  cnpj: string
  razao_social: string
  nome_fantasia: string
  email: string
  telefone: string
  logradouro: string
  numero: string | null
  bairro: string
  complemento: string | null
  cidade: string
  uf: string
  cep: string
  contato_principal: string
  observacoes: string
  ativo: string
  create_at: string
}

export type ClientsFormData = {
  cnpj: string
  razao_social: string
  nome_fantasia: string
  email: string
  telefone: string
  logradouro: string
  numero: string
  bairro: string
  complemento: string 
  cidade: string
  uf: string
  cep: string
  contato_principal: string
  observacoes: string
  ativo: string
}

export const emptyClientsForm: ClientsFormData = {
   cnpj: '',
  razao_social: '',
  nome_fantasia: '',
  email: '',
  telefone: '',
  logradouro: '',
  numero: '',
  bairro: '',
  complemento: '',
  cidade: '',
  uf: '',
  cep: '',
  contato_principal: '',
  observacoes: '',
  ativo: '',
}
