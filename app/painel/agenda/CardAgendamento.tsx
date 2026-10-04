import { Phone, Scissors, StickyNote, User } from "lucide-react"; // ícones usados nas linhas de informação do card
import { Badge } from "@/components/ui/Badge"; // etiqueta colorida de status
import { centavosParaReais } from "@/utils/dinheiro"; // formata o preço (guardado em centavos) pra exibição
import { duracaoEmMinutos, formatarHora } from "@/utils/data"; // calcula/formata horário e duração
import { formatarTelefone, linkWhatsapp } from "@/utils/telefone"; // formata o telefone e monta o link do WhatsApp
import { CONFIG_STATUS, type StatusAgendamento } from "@/utils/status-agendamento"; // cor/rótulo/faixa de cada status
import { type AgendamentoComRelacionamentos } from "./tipos"; // formato da linha vinda do banco, com os relacionamentos
import { BotoesStatus } from "./BotoesStatus"; // botões de mudar status

export function CardAgendamento({ agendamento }: { agendamento: AgendamentoComRelacionamentos }) {
  const status = agendamento.status as StatusAgendamento; // o banco garante (via enum) que só vem um desses 5 valores
  const configStatus = CONFIG_STATUS[status];
  const cancelado = status === "cancelado"; // usado pra reduzir a opacidade do card inteiro

  const nomeCliente = agendamento.cliente?.nome ?? "Cliente"; // texto de reserva, caso o relacionamento venha vazio por algum motivo
  const inicialCliente = nomeCliente.charAt(0).toUpperCase(); // primeira letra do nome, pro avatar circular
  const telefoneBruto = agendamento.cliente?.telefone ?? ""; // telefone "cru", como está no banco (só dígitos ou formatado)

  const duracao = duracaoEmMinutos(agendamento.inicio, agendamento.fim); // calculado a partir do próprio início/fim, sempre correto

  return (
    <div // o card inteiro: borda que destaca em dourado no hover, e fica "apagado" se o agendamento foi cancelado
      className={`flex overflow-hidden rounded-xl border border-borda bg-superficie transition-colors hover:border-dourado ${cancelado ? "opacity-60" : ""}`}
    >
      <div className={`w-1.5 shrink-0 ${configStatus.corFaixa}`} aria-hidden /> {/* faixa lateral fina, na cor do status */}

      <div className="flex flex-1 flex-col gap-4 p-4 sm:flex-row"> {/* empilhado no celular, 3 colunas no desktop */}
        <div className="flex shrink-0 flex-row items-baseline gap-3 sm:w-28 sm:flex-col sm:items-start sm:gap-0.5"> {/* coluna de horário */}
          <span className="text-xl font-bold tabular-nums text-dourado">{formatarHora(agendamento.inicio)}</span> {/* início: grande e dourado */}
          <span className="text-sm font-bold tabular-nums text-texto-secundario">{formatarHora(agendamento.fim)}</span> {/* fim: menor */}
          <span className="text-xs tabular-nums text-texto-secundario">{duracao} min</span>
        </div>

        <div className="flex flex-1 flex-col gap-3"> {/* dados do cliente/serviço/barbeiro + ações */}
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="flex items-center gap-3">
              <div // avatar circular com a inicial do nome do cliente
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-dourado-escuro text-sm font-bold text-texto"
                aria-hidden
              >
                {inicialCliente}
              </div>
              <div>
                <p className="font-semibold text-texto">{nomeCliente}</p>
                {telefoneBruto && ( // só mostra o link se houver telefone cadastrado
                  <a
                    href={linkWhatsapp(telefoneBruto)}
                    target="_blank" // abre o WhatsApp em outra aba, sem sair da agenda
                    rel="noreferrer"
                    className="flex items-center gap-1 text-xs text-texto-secundario transition-colors hover:text-dourado"
                  >
                    <Phone className="h-3 w-3" aria-hidden /> {/* ícone decorativo; o texto já diz que é um telefone */}
                    <span className="tabular-nums">{formatarTelefone(telefoneBruto)}</span>
                  </a>
                )}
              </div>
            </div>

            <Badge variante={configStatus.variante}>{configStatus.rotulo}</Badge>
          </div>

          <div className="flex flex-col gap-1 text-sm text-texto-secundario"> {/* serviço, barbeiro e observação */}
            <span className="flex items-center gap-2">
              <Scissors className="h-3.5 w-3.5 shrink-0" aria-hidden /> {agendamento.servico?.nome}
            </span>
            <span className="flex items-center gap-2">
              <User className="h-3.5 w-3.5 shrink-0" aria-hidden /> {agendamento.barbeiro?.nome}
            </span>
            {agendamento.observacao && ( // só aparece quando existe alguma observação
              <span className="flex items-center gap-2 italic">
                <StickyNote className="h-3.5 w-3.5 shrink-0" aria-hidden /> {agendamento.observacao}
              </span>
            )}
          </div>

          <BotoesStatus id={agendamento.id} status={status} /> {/* some sozinho quando o status é final (sem ação possível) */}
        </div>

        <div className="shrink-0 text-right sm:text-right"> {/* preço, sempre bem visível à direita */}
          <span className="text-lg font-bold tabular-nums text-dourado">R$ {centavosParaReais(agendamento.preco_centavos)}</span>
        </div>
      </div>
    </div>
  );
}
