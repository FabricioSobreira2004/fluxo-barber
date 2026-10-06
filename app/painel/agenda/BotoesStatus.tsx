"use client"; // precisa de useState (pra desabilitar o botão clicado) e chamar a Server Action direto, sem um <form>

import { useEffect, useState } from "react"; // guarda qual transição está em andamento e se o horário de início já chegou
import { CheckCheck, UserX, X, type LucideIcon } from "lucide-react"; // ícones de cada ação possível
import { mudarStatusAgendamento } from "./actions"; // Server Action usada em cada botão (chamada direto, sem <form>, pra poder reagir ao resultado)
import { formatarHora } from "@/utils/data"; // usado na dica do botão desabilitado ("disponível a partir das 14:00")
import { type StatusAgendamento } from "@/utils/status-agendamento"; // os status possíveis de um agendamento

interface Transicao { // uma ação possível a partir do status atual
  rotulo: string; // texto do botão
  novoStatus: StatusAgendamento; // pra qual status essa ação muda
  Icone: LucideIcon; // ícone mostrado no botão
  classes: string; // cor do botão, combinando com o status de destino
  esperaInicio: boolean; // true pra "Concluir"/"Faltou": só habilita a partir do horário de início do agendamento
}

// "agendado" e "confirmado" têm as MESMAS ações: na prática a barbearia não confirma manualmente (o
// agendamento do cliente já vale como horário reservado) — por isso não existe mais botão "Confirmar".
// "confirmado" continua existindo no banco só pro futuro lembrete por WhatsApp (ver status-agendamento.ts)
const TRANSICOES_RESERVADO: Transicao[] = [
  { rotulo: "Concluir", novoStatus: "concluido", Icone: CheckCheck, classes: "border-dourado text-dourado hover:bg-dourado/10", esperaInicio: true },
  { rotulo: "Faltou", novoStatus: "faltou", Icone: UserX, classes: "border-aviso text-aviso hover:bg-aviso/10", esperaInicio: true },
  { rotulo: "Cancelar", novoStatus: "cancelado", Icone: X, classes: "border-erro text-erro hover:bg-erro/10", esperaInicio: false }, // cancelar não precisa esperar: pode cancelar um horário futuro a qualquer momento
];

// quais transições fazem sentido a partir de cada status; concluído/cancelado/faltou são estados finais (sem botão)
const TRANSICOES: Partial<Record<StatusAgendamento, Transicao[]>> = {
  agendado: TRANSICOES_RESERVADO,
  confirmado: TRANSICOES_RESERVADO,
};

interface PropriedadesBotoesStatus {
  id: string;
  status: StatusAgendamento;
  inicio: string; // horário de início do agendamento: define a partir de quando "Concluir"/"Faltou" habilitam
  // avisa o componente pai (AgendaInterativa) qual o novo status, pra ele atualizar a lista em memória
  // sem precisar buscar tudo de novo no servidor — essencial agora que a lista não vem mais só do
  // servidor a cada clique (ver o motivo completo no comentário de AgendaInterativa.tsx)
  onStatusAlterado?: (novoStatus: StatusAgendamento) => void;
}

export function BotoesStatus({ id, status, inicio, onStatusAlterado }: PropriedadesBotoesStatus) {
  const [enviando, setEnviando] = useState<StatusAgendamento | null>(null); // qual botão está "no ar" agora (ou nenhum)

  // "Date.now()" é impuro (não pode ser chamado direto no corpo do componente, durante o render) — por
  // isso vira estado, calculado num efeito; evita marcar "Concluído"/"Faltou" num horário que ainda nem
  // começou, por engano. Um "setTimeout" pro próprio instante de início libera os botões sozinho,
  // sem precisar recarregar a página nem ficar reconferindo a cada segundo.
  // Fica ANTES do "if (opcoes.length === 0) return" de propósito: hooks não podem vir depois de um
  // retorno condicional (regra do React) — por isso roda sempre, mesmo quando o componente nem renderiza nada
  const [jaComecou, setJaComecou] = useState(false);
  useEffect(() => {
    const inicioMs = new Date(inicio).getTime();
    const atualizar = () => setJaComecou(Date.now() >= inicioMs);
    atualizar();
    const faltam = inicioMs - Date.now();
    if (faltam <= 0) return; // já começou: não precisa de nenhum timer
    const timer = setTimeout(atualizar, faltam);
    return () => clearTimeout(timer);
  }, [inicio]);

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
      {opcoes.map((opcao) => {
        const bloqueadoPeloHorario = opcao.esperaInicio && !jaComecou; // só "Concluir"/"Faltou" podem cair aqui
        const desabilitado = enviando !== null || bloqueadoPeloHorario;

        return (
          <button
            key={opcao.novoStatus}
            type="button" // não é mais um <form>: o clique chama a Server Action direto, em JavaScript
            disabled={desabilitado}
            onClick={() => aoClicar(opcao.novoStatus)}
            // "title": dica nativa do navegador (aparece no hover/foco) explicando POR QUE o botão está desabilitado
            title={bloqueadoPeloHorario ? `Disponível a partir das ${formatarHora(inicio)}` : undefined}
            className={`flex items-center gap-1.5 rounded-md border px-2 py-1 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${opcao.classes}`}
          >
            <opcao.Icone className="h-3 w-3" aria-hidden /> {/* ícone decorativo; o rótulo ao lado já identifica a ação */}
            {opcao.rotulo}
          </button>
        );
      })}
    </div>
  );
}
