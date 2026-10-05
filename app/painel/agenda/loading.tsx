import { Card } from "@/components/ui/Card"; // mesmo bloco de superfície usado na página de verdade
import { Skeleton } from "@/components/ui/Skeleton"; // bloco "piscando" que representa conteúdo ainda carregando

// o Next.js mostra este arquivo automaticamente enquanto app/painel/agenda/page.tsx busca os dados no Supabase
export default function CarregandoAgenda() {
  return (
    <div className="flex flex-col gap-6">
      <Skeleton className="h-8 w-28" /> {/* no lugar do título "Agenda" */}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Skeleton className="h-9 w-56" /> {/* no lugar da navegação entre dias */}
        <div className="flex gap-2">
          {[1, 2, 3].map((item) => <Skeleton key={item} className="h-7 w-20 rounded-full" />)} {/* "chips" de filtro por barbeiro */}
        </div>
      </div>

      <div className="flex flex-col gap-3">
        {[1, 2, 3].map((item) => ( // 3 cards de agendamento "fantasma", já que não sabemos quantos existem antes de carregar
          <Card key={item} className="flex items-center gap-4 p-4">
            <Skeleton className="h-10 w-16" /> {/* no lugar do horário */}
            <div className="flex flex-1 flex-col gap-2">
              <Skeleton className="h-5 w-40" /> {/* no lugar do nome do cliente */}
              <Skeleton className="h-4 w-56" /> {/* no lugar de serviço/barbeiro */}
            </div>
          </Card>
        ))}
      </div>

      <Card>
        <Skeleton className="mb-4 h-6 w-40" /> {/* no lugar do título "Novo agendamento" */}
        <Skeleton className="h-10 w-full" /> {/* no lugar do formulário */}
      </Card>
    </div>
  );
}
