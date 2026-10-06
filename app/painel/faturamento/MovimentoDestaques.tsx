import { CalendarDays, Clock } from "lucide-react"; // ícones dos 2 cards
import { Card } from "@/components/ui/Card"; // bloco de superfície padrão
import { type MovimentoDestaque } from "./tipos";

// "dia_semana" do banco: 0 = domingo ... 6 = sábado (mesmo padrão de horarios_trabalho.dia_semana)
const NOMES_DIA_SEMANA = ["Domingo", "Segunda-feira", "Terça-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira", "Sábado"];

interface PropriedadesMovimentoDestaques {
  movimento: MovimentoDestaque;
  // true quando o período escolhido é de 1 dia só (ver page.tsx): nesse caso "dia da semana mais
  // movimentado" não faz sentido (o período JÁ é só 1 dia), então esse card nem aparece
  somenteHorario?: boolean;
}

// sem "use client": só exibe os números já calculados no servidor (ver agregacoes.ts -> calcularMovimento)
export function MovimentoDestaques({ movimento, somenteHorario = false }: PropriedadesMovimentoDestaques) {
  return (
    <div className={`grid grid-cols-1 gap-4 ${somenteHorario ? "" : "sm:grid-cols-2"}`}>
      {!somenteHorario && (
        <Card className="flex items-center gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-dourado/10 text-dourado">
            <CalendarDays className="h-5 w-5" aria-hidden />
          </div>
          <div>
            <p className="text-sm text-texto-secundario">Dia da semana mais movimentado</p>
            <p className="font-display text-lg font-semibold text-texto">
              {movimento.diaSemanaMaisMovimentado ? NOMES_DIA_SEMANA[movimento.diaSemanaMaisMovimentado.diaSemana] : "—"}
            </p>
          </div>
        </Card>
      )}

      <Card className="flex items-center gap-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-dourado/10 text-dourado">
          <Clock className="h-5 w-5" aria-hidden />
        </div>
        <div>
          <p className="text-sm text-texto-secundario">Horário mais movimentado</p>
          {/* "font-sans lining-nums tabular-nums" (não "font-display"): é um número ("09h"), não um título —
              a Playfair deixava o algarismo com aparência "antiga" (oldstyle, de altura diferente) */}
          <p className="font-sans text-lg font-semibold lining-nums tabular-nums text-texto">
            {movimento.horaMaisMovimentada ? `${String(movimento.horaMaisMovimentada.hora).padStart(2, "0")}h` : "—"}
          </p>
        </div>
      </Card>
    </div>
  );
}
