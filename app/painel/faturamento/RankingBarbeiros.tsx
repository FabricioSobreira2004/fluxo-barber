import { Users } from "lucide-react"; // ícone do estado vazio
import { Card } from "@/components/ui/Card"; // bloco de superfície padrão
import { EstadoVazio } from "@/components/ui/EstadoVazio"; // mensagem amigável quando não há nenhum atendimento concluído no período
import { centavosParaReais } from "@/utils/dinheiro"; // formata centavos pra "25,90"
import { type LinhaRankingBarbeiro } from "./tipos"; // formato de 1 linha do ranking (já ordenado por faturamento, do maior pro menor)

// sem "use client": é só uma lista com barras proporcionais em CSS puro (largura em %), não precisa de nenhum JavaScript
export function RankingBarbeiros({ ranking }: { ranking: LinhaRankingBarbeiro[] }) {
  if (ranking.length === 0) {
    return (
      <Card>
        <h2 className="mb-4 font-display text-lg font-semibold text-texto">Por barbeiro</h2>
        <EstadoVazio Icone={Users} titulo="Nenhum atendimento concluído" descricao="Ninguém concluiu um atendimento neste período ainda." />
      </Card>
    );
  }

  const maiorFaturamento = ranking[0].faturamentoCentavos; // lista já vem ordenada do maior pro menor (ver agregacoes.ts)

  return (
    <Card>
      <h2 className="mb-4 font-display text-lg font-semibold text-texto">Por barbeiro</h2>
      <div className="flex flex-col gap-4">
        {ranking.map((linha) => (
          <div key={linha.barbeiroId}>
            <div className="mb-1 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
              <span className="font-medium text-texto">{linha.nome}</span>
              <span className="text-sm lining-nums tabular-nums text-dourado">R$ {centavosParaReais(linha.faturamentoCentavos)}</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-borda"> {/* trilho cinza, de fundo */}
              <div
                className="h-full rounded-full bg-dourado"
                style={{ width: `${(linha.faturamentoCentavos / maiorFaturamento) * 100}%` }} // comprimento proporcional ao maior faturamento da lista
              />
            </div>
            <p className="mt-1 text-xs text-texto-secundario">
              {linha.atendimentos} atendimento{linha.atendimentos === 1 ? "" : "s"} · ticket médio R$ {centavosParaReais(linha.ticketMedioCentavos)}
            </p>
          </div>
        ))}
      </div>
    </Card>
  );
}
