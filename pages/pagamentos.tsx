import { CreditCard, FileCheck2, ReceiptText, WalletCards } from 'lucide-react'
import { Header } from '@/components/header'
import { Sidebar } from '@/components/sidebar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

const financialCards = [
  { title: 'A faturar', value: 'R$ 42.850,00', detail: '18 entregas liberadas', icon: ReceiptText },
  { title: 'Pagamentos recebidos', value: 'R$ 128.400,00', detail: 'Mes atual', icon: WalletCards },
  { title: 'Pendencias', value: 'R$ 9.760,00', detail: '4 clientes em aberto', icon: CreditCard },
]

export default function PagamentosPage() {
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />

      <div className="ml-64 flex-1">
        <Header />

        <main className="p-6">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-balance">Pagamentos</h1>
              <p className="text-muted-foreground">Controle de faturamento, recebiveis e liberacoes financeiras</p>
            </div>
            <Button className="gap-2">
              <FileCheck2 className="h-4 w-4" />
              Gerar lote
            </Button>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {financialCards.map((item) => (
              <Card key={item.title}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">{item.title}</CardTitle>
                  <item.icon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{item.value}</div>
                  <p className="text-xs text-muted-foreground">{item.detail}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Entregas prontas para faturamento</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-hidden rounded-lg border border-border">
                <div className="grid grid-cols-4 bg-secondary px-4 py-3 text-sm font-medium text-muted-foreground">
                  <span>Documento</span>
                  <span>Cliente</span>
                  <span>Status</span>
                  <span className="text-right">Valor</span>
                </div>
                {['FAT-1029', 'FAT-1030', 'FAT-1031'].map((code, index) => (
                  <div key={code} className="grid grid-cols-4 border-t border-border px-4 py-3 text-sm">
                    <span>{code}</span>
                    <span>{['Tech Store LTDA', 'Fashion Shop', 'Pharma Express'][index]}</span>
                    <span className="text-success">Liberado</span>
                    <span className="text-right">R$ {['8.420,00', '12.980,00', '21.450,00'][index]}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  )
}
