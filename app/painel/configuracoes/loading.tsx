import { Card } from "@/components/ui/Card"; // mesmo bloco de superfície usado na página de verdade
import { Skeleton } from "@/components/ui/Skeleton"; // bloco "piscando" que representa conteúdo ainda carregando

// o Next.js mostra este arquivo automaticamente enquanto app/painel/configuracoes/page.tsx busca os dados no Supabase
export default function CarregandoConfiguracoes() {
  return (
    <div className="flex flex-col gap-6">
      <Skeleton className="h-8 w-48" /> {/* no lugar do título "Configurações" */}

      <Card className="flex max-w-xl flex-col gap-4">
        <Skeleton className="h-4 w-40" /> {/* no lugar do link da página pública */}
        <Skeleton className="h-10 w-full" /> {/* no lugar do campo "Nome da barbearia" */}
        <Skeleton className="h-10 w-full" /> {/* no lugar do campo "Telefone" */}
        <Skeleton className="h-10 w-full" /> {/* no lugar do campo "Endereço" */}
        <Skeleton className="h-10 w-32" /> {/* no lugar do botão "Salvar" */}
      </Card>
    </div>
  );
}
