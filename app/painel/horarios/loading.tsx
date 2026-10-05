import { Card } from "@/components/ui/Card"; // mesmo bloco de superfície usado na página de verdade
import { Skeleton } from "@/components/ui/Skeleton"; // bloco "piscando" que representa conteúdo ainda carregando

// o Next.js mostra este arquivo automaticamente enquanto app/painel/horarios/page.tsx busca os dados no Supabase
export default function CarregandoHorarios() {
  return (
    <div className="flex flex-col gap-6">
      <Skeleton className="h-8 w-56" /> {/* no lugar do título "Horários de trabalho" */}

      <div className="flex flex-wrap gap-2">
        {[1, 2, 3].map((item) => ( // "chips" de barbeiro fantasma, já que não sabemos quantos existem antes de carregar
          <Skeleton key={item} className="h-7 w-24 rounded-full" />
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2"> {/* mesma grade de 7 dias da página real, só com conteúdo "piscando" */}
        {[0, 1, 2, 3, 4, 5, 6].map((dia) => (
          <Card key={dia} className="flex flex-col gap-3">
            <Skeleton className="h-5 w-24" /> {/* no lugar do nome do dia */}
            <Skeleton className="h-9 w-full" /> {/* no lugar do intervalo/formulário */}
          </Card>
        ))}
      </div>
    </div>
  );
}
