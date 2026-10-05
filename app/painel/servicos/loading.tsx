import { Card } from "@/components/ui/Card"; // mesmo bloco de superfície usado na página de verdade
import { Skeleton } from "@/components/ui/Skeleton"; // bloco "piscando" que representa conteúdo ainda carregando

// o Next.js mostra este arquivo automaticamente enquanto app/painel/servicos/page.tsx busca os dados no Supabase
export default function CarregandoServicos() {
  return (
    <div className="flex flex-col gap-6">
      <Skeleton className="h-8 w-40" /> {/* no lugar do título "Serviços" */}

      <Card className="max-w-md">
        <Skeleton className="h-10 w-full" /> {/* no lugar do formulário de novo serviço */}
      </Card>

      <div className="flex flex-col gap-3">
        {[1, 2, 3].map((item) => ( // 3 linhas "fantasma", já que não sabemos quantos serviços existem antes de carregar
          <Card key={item} className="flex items-center justify-between gap-4 p-4">
            <div className="flex flex-col gap-2">
              <Skeleton className="h-5 w-32" /> {/* no lugar do nome + badge */}
              <Skeleton className="h-4 w-20" /> {/* no lugar de "duração · preço" */}
            </div>
            <Skeleton className="h-5 w-20" /> {/* no lugar dos botões de ação */}
          </Card>
        ))}
      </div>
    </div>
  );
}
