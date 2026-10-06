import Link from "next/link"; // os 4 períodos fixos são só navegação simples, sem precisar de JavaScript
import { Label } from "@/components/ui/Label"; // legenda dos campos "De"/"Até"
import { Input } from "@/components/ui/Input"; // campo de data estilizado
import { Button } from "@/components/ui/Button"; // botão "Aplicar"
import { OPCOES_PERIODO, type PeriodoChave } from "./periodo"; // as 5 opções e o tipo do período

interface PropriedadesSeletorPeriodo {
  periodoAtual: PeriodoChave;
  de?: string; // só usado quando periodoAtual === "personalizado", pra já vir preenchido
  ate?: string;
}

// sem "use client": os 4 períodos fixos são <Link> normais (muda "?periodo=..." na URL) e o "Personalizado"
// é um <form method="get"> comum — a página inteira já é Server Component, não precisa de nenhum estado no navegador aqui
export function SeletorPeriodo({ periodoAtual, de, ate }: PropriedadesSeletorPeriodo) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-2"> {/* "chips" de período, mesmo padrão visual do filtro de barbeiro da Agenda */}
        {OPCOES_PERIODO.map((opcao) => (
          <Link
            key={opcao.chave}
            href={`/painel/faturamento?periodo=${opcao.chave}`}
            className={ // destaque dourado no período selecionado agora
              `rounded-full border px-3 py-1 text-sm transition-colors ${
                periodoAtual === opcao.chave
                  ? "border-dourado bg-dourado/10 text-dourado"
                  : "border-borda text-texto-secundario hover:text-texto"
              }`
            }
          >
            {opcao.rotulo}
          </Link>
        ))}
      </div>

      {periodoAtual === "personalizado" && ( // só aparece depois que "Personalizado" já foi escolhido, pra não poluir a tela toda hora
        <form method="get" className="flex flex-wrap items-end gap-3 rounded-lg border border-borda bg-superficie p-3">
          <input type="hidden" name="periodo" value="personalizado" /> {/* mantém "personalizado" selecionado ao enviar o form */}
          <div>
            <Label htmlFor="de">De</Label>
            <Input id="de" name="de" type="date" defaultValue={de} required />
          </div>
          <div>
            <Label htmlFor="ate">Até</Label>
            <Input id="ate" name="ate" type="date" defaultValue={ate} required />
          </div>
          <Button type="submit">Aplicar</Button>
        </form>
      )}
    </div>
  );
}
