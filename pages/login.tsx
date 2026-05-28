import { FormEvent, useState } from 'react'
import { useRouter } from 'next/router'
import { Lock, Mail, Truck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { roleDefaultPath, roleLabels, signInWithEmailAndPassword, type UserRole } from '@/lib/auth'
import { isSupabaseConfigured } from '@/lib/supabase'

const roles: UserRole[] = ['operacional', 'financeiro', 'comercial', 'ti']

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setErrorMessage('')
    setIsLoading(true)

    try {
      const user = await signInWithEmailAndPassword(email, password)
      await router.push(roleDefaultPath[user.role])
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Nao foi possivel acessar o sistema.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className="grid min-h-screen bg-background lg:grid-cols-[1.1fr_0.9fr]">
      <section className="flex min-h-screen flex-col justify-between border-r border-border bg-card px-10 py-8">
        <div className="flex items-center gap-3">
          {/* <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
            <Truck className="h-5 w-5 text-primary-foreground" />
          </div> */}
          <div>
            <p className="text-lg font-semibold leading-tight">North Seven</p>
            {/* <p className="text-sm text-muted-foreground">Controle logistico integrado</p> */}
          </div>
        </div>

        <div className="max-w-2xl">
          <p className="mb-4 text-sm font-medium text-primary">Sistema de controle logístico</p>
          <h1 className="text-4xl font-bold leading-tight text-balance">
            Serviços logísticos completos para empresas que buscam excelência, segurança e pontualidade em suas operações.
          </h1>
          {/* <p className="mt-5 max-w-xl text-base leading-7 text-muted-foreground">
           Solicite ao seu gerente acesso.
          </p> */}
        </div>

        <div className="grid max-w-3xl gap-2 md:grid-cols-3">
         
            <div className="rounded-lg border border-border bg-background/40 p-4 text-left text-muted-foreground">
              <span className="text-sm font-semibold">Missão</span>
              <span className="mt-1 block text-xs">
                Oferecer soluções logísticas de excelência que superem as expectativas dos nossos clientes, garantindo segurança, pontualidade e eficiência em cada operação.
              </span>
            </div>
            <div className="rounded-lg border border-border bg-background/40 p-4 text-left text-muted-foreground">
              <span className="text-sm font-semibold">Visão</span>
              <span className="mt-1 block text-xs">
                Ser reconhecida como a principal referência em logística no Brasil, destacando-se pela inovação, qualidade e compromisso com os clientes.
              </span>
            </div>
            <div className="rounded-lg border border-border bg-background/40 p-4 text-left text-muted-foreground">
              <span className="text-sm font-semibold">Valores</span>
              <span className="mt-1 block text-xs">
                Integridade, compromisso com a excelência, respeito às pessoas e ao meio ambiente, inovação contínua e responsabilidade social.
              </span>
            </div>
   
        </div>
      </section>

      <section className="flex items-center justify-center px-6 py-10">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-2xl">Acessar sistema</CardTitle>
            <CardDescription>
              Entre com o e-mail corporativo e senha cadastrados.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              {!isSupabaseConfigured && (
                <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
                  Erro no controle de acesso ao banco de dados.
                </div>
              )}

              {errorMessage && (
                <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
                  {errorMessage}
                </div>
              )}

              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="email">
                  E-mail
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    className="pl-9"
                    placeholder="nome@north7even.com.br"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="password">
                  Senha
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    className="pl-9"
                    required
                  />
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={isLoading || !isSupabaseConfigured}>
                {isLoading ? 'Validando acesso...' : 'Entrar'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </section>
    </main>
  )
}
