import { Check, CheckCheck, UserX, X, type LucideIcon } from "lucide-react"; // ícones de cada ação possível
import { mudarStatusAgendamento } from "./actions"; // Server Action usada em cada botão
import { type StatusAgendamento } from "@/utils/status-agendamento"; // os status possíveis de um agendamento

interface Transicao { // uma ação possível a partir do status atual
  rotulo: string; // texto do botão
  novoStatus: StatusAgendamento; // pra qual status essa ação muda
  Icone: LucideIcon; // ícone mostrado no botão
  classes: string; // cor do botão, combinando com o status de destino
}

// quais transições fazem sentido a partir de cada status; concluído/cancelado/faltou são estados finais (sem botão)
const TRANSICOES: Partial<Record<StatusAgendamento, Transicao[]>> = {
  agendado: [
    { rotulo: "Confirmar", novoStatus: "confirmado", Icone: Check, classes: "border-sucesso text-sucesso hover:bg-sucesso/10" },
    { rotulo: "Cancelar", novoStatus: "cancelado", Icone: X, classes: "border-erro text-erro hover:bg-erro/10" },
  ],
  confirmado: [
    { rotulo: "Concluir", novoStatus: "concluido", Icone: CheckCheck, classes: "border-dourado text-dourado hover:bg-dourado/10" },
    { rotulo: "Faltou", novoStatus: "faltou", Icone: UserX, classes: "border-aviso text-aviso hover:bg-aviso/10" },
    { rotulo: "Cancelar", novoStatus: "cancelado", Icone: X, classes: "border-erro text-erro hover:bg-erro/10" },
  ],
};

export function BotoesStatus({ id, status }: { id: string; status: StatusAgendamento }) { // sem "use client": é só um conjunto de <form>s simples
  const opcoes = TRANSICOES[status] ?? []; // status final (sem opções) vira lista vazia

  if (opcoes.length === 0) {
    return null; // nada a fazer nesse agendamento
  }

  return (
    <div className="flex flex-wrap gap-2">
      {opcoes.map((opcao) => (
        // cada botão é um form próprio, com a Server Action já "pré-preenchida" via bind (id + novo status)
        <form key={opcao.novoStatus} action={mudarStatusAgendamento.bind(null, id, opcao.novoStatus)}>
          <button
            type="submit"
            className={`flex items-center gap-1.5 rounded-md border px-2 py-1 text-xs font-medium transition-colors ${opcao.classes}`}
          >
            <opcao.Icone className="h-3 w-3" aria-hidden /> {/* ícone decorativo; o rótulo ao lado já identifica a ação */}
            {opcao.rotulo}
          </button>
        </form>
      ))}
    </div>
  );
}
