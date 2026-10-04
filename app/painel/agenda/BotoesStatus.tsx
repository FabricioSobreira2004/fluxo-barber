import { mudarStatusAgendamento } from "./actions"; // Server Action usada em cada botão
import { type StatusAgendamento } from "@/utils/status-agendamento"; // os status possíveis de um agendamento

// quais transições fazem sentido a partir de cada status; concluído/cancelado/faltou são estados finais (sem botão)
const TRANSICOES: Partial<Record<StatusAgendamento, { rotulo: string; novoStatus: StatusAgendamento }[]>> = {
  agendado: [
    { rotulo: "Confirmar", novoStatus: "confirmado" },
    { rotulo: "Cancelar", novoStatus: "cancelado" },
  ],
  confirmado: [
    { rotulo: "Concluir", novoStatus: "concluido" },
    { rotulo: "Faltou", novoStatus: "faltou" },
    { rotulo: "Cancelar", novoStatus: "cancelado" },
  ],
};

export function BotoesStatus({ id, status }: { id: string; status: StatusAgendamento }) { // sem "use client": é só um conjunto de <form>s simples
  const opcoes = TRANSICOES[status] ?? []; // status final (sem opções) vira lista vazia

  if (opcoes.length === 0) {
    return null; // nada a fazer nesse agendamento
  }

  return (
    <div className="flex flex-wrap gap-3">
      {opcoes.map((opcao) => (
        // cada botão é um form próprio, com a Server Action já "pré-preenchida" via bind (id + novo status)
        <form key={opcao.novoStatus} action={mudarStatusAgendamento.bind(null, id, opcao.novoStatus)}>
          <button type="submit" className="text-xs text-dourado hover:underline">
            {opcao.rotulo}
          </button>
        </form>
      ))}
    </div>
  );
}
