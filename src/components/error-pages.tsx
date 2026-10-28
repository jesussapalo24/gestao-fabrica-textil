import {
  Link,
  useRouter,
  type ErrorComponentProps,
} from '@tanstack/react-router'
import { Button } from '@/components/ui/button'

export function NotFoundPage() {
  return (
    <main className="grid min-h-svh place-items-center px-6 py-16">
      <div className="max-w-md space-y-6 text-center">
        <p className="text-sm font-medium text-muted-foreground">404</p>
        <h1 className="text-3xl font-semibold tracking-tight">
          Página não encontrada
        </h1>
        <p className="text-muted-foreground">
          Esta página não existe. Verifique o endereço ou regresse ao painel principal.
        </p>
        <Button asChild>
          <Link to="/">Voltar ao painel</Link>
        </Button>
      </div>
    </main>
  )
}

export function RouteErrorPage({ reset }: ErrorComponentProps) {
  const router = useRouter()

  return (
    <main className="grid min-h-svh place-items-center px-6 py-16">
      <div className="max-w-md space-y-6 text-center">
        <h1 className="text-3xl font-semibold tracking-tight">
          Não foi possível carregar esta página
        </h1>
        <p role="alert" className="text-muted-foreground">
          Tente novamente ou regresse ao painel principal.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <Button
            onClick={() => {
              void router.invalidate()
              reset()
            }}
          >
            Tentar novamente
          </Button>
          <Button variant="outline" asChild>
            <a href="/">Voltar ao painel</a>
          </Button>
        </div>
      </div>
    </main>
  )
}
