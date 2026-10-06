import { CalendarDays, Clock } from "lucide-react"; // ícones dos 2 cards
import { Card } from "@/components/ui/Card"; // bloco de superfície padrão
import { type MovimentoDestaque } from "./tipos";

// "dia_semana" do banco: 0 = domingo ... 6 = sábado (mesmo padrão de horarios_trabalho.dia_semana)
const NOMES_DIA_SEMANA = ["Domingo", "Segunda-feira", "Terça-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira", "Sábado"];

// sem "use client": só exibe os 2 números já calculados no servidor (ver agregacoes.ts -> calcularMovimento)
export function MovimentoDestaques({ movimento }: { movimento: MovimentoDestaque }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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

      <Card className="flex items-center gap-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-dourado/10 text-dourado">
          <Clock className="h-5 w-5" aria-hidden />
        </div>
        <div>
          <p className="text-sm text-texto-secundario">Horário mais movimentado</p>
          <p className="font-display text-lg font-semibold text-texto">
            {movimento.horaMaisMovimentada ? `${String(movimento.horaMaisMovimentada.hora).padStart(2, "0")}h` : "—"}
          </p>
        </div>
      </Card>
    </div>
  );
}
