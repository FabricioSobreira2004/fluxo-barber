"use client"; // precisa de useState (pra desabilitar o botão clicado) e chamar a Server Action direto, sem um <form>

import { useState } from "react"; // guarda qual transição está em andamento, pra desabilitar os botões durante a chamada
import { Check, CheckCheck, UserX, X, type LucideIcon } from "lucide-react"; // ícones de cada ação possível
import { mudarStatusAgendamento } from "./actions"; // Server Action usada em cada botão (chamada direto, sem <form>, pra poder reagir ao resultado)
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

interface PropriedadesBotoesStatus {
  id: string;
  status: StatusAgendamento;
  // avisa o componente pai (AgendaInterativa) qual o novo status, pra ele atualizar a lista em memória
  // sem precisar buscar tudo de novo no servidor — essencial agora que a lista não vem mais só do
  // servidor a cada clique (ver o motivo completo no comentário de AgendaInterativa.tsx)
  onStatusAlterado?: (novoStatus: StatusAgendamento) => void;
}

export function BotoesStatus({ id, status, onStatusAlterado }: PropriedadesBotoesStatus) {
  const [enviando, setEnviando] = useState<StatusAgendamento | null>(null); // qual botão está "no ar" agora (ou nenhum)
  const opcoes = TRANSICOES[status] ?? []; // status final (sem opções) vira lista vazia

  if (opcoes.length === 0) {
    return null; // nada a fazer nesse agendamento
  }

  async function aoClicar(novoStatus: StatusAgendamento) { // chama a Server Action direto (ela pode ser chamada como função normal)
    setEnviando(novoStatus); // desabilita os botões deste card até a resposta chegar, evitando duplo clique
    await mudarStatusAgendamento(id, novoStatus);
    setEnviando(null);
    onStatusAlterado?.(novoStatus); // avisa o pai só DEPOIS de confirmar que o banco já aceitou a mudança
  }

  return (
    <div className="flex flex-wrap gap-2">
      {opcoes.map((opcao) => (
        <button
          key={opcao.novoStatus}
          type="button" // não é mais um <form>: o clique chama a Server Action direto, em JavaScript
          disabled={enviando !== null} // trava TODOS os botões deste card enquanto qualquer um deles está em andamento
          onClick={() => aoClicar(opcao.novoStatus)}
          className={`flex items-center gap-1.5 rounded-md border px-2 py-1 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${opcao.classes}`}
        >
          <opcao.Icone className="h-3 w-3" aria-hidden /> {/* ícone decorativo; o rótulo ao lado já identifica a ação */}
          {opcao.rotulo}
        </button>
      ))}
    </div>
  );
}
