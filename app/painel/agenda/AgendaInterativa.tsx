"use client"; // precisa de useState/useTransition/fetch (só existem no navegador) pra trocar de dia sem recarregar a página inteira

import { useEffect, useRef, useState, useTransition } from "react"; // hooks de estado, referência mutável e transição (loading sem travar a UI)
import { ChevronLeft, ChevronRight, CalendarX } from "lucide-react"; // setas de navegação e ícone do estado vazio
import { Card } from "@/components/ui/Card"; // bloco de superfície padrão
import { Skeleton } from "@/components/ui/Skeleton"; // bloco "piscando", usado no lugar dos cards enquanto um dia novo (fora do cache) está carregando
import { EstadoVazio } from "@/components/ui/EstadoVazio"; // mensagem amigável quando não há nada nesse dia
import { somarDias, formatarDataLonga, hojeISO } from "@/utils/data"; // utilitários de data, puros (seguros pra rodar no navegador também)
import { FormularioNovoAgendamento } from "./FormularioNovoAgendamento"; // formulário de criação (já era Client Component)
import { CardAgendamento } from "./CardAgendamento"; // card visual de cada agendamento da lista
import { type AgendamentoComRelacionamentos } from "./tipos"; // formato da linha vinda do banco, com os relacionamentos
import { type StatusAgendamento } from "@/utils/status-agendamento"; // os 5 status possíveis de um agendamento
import { type Tabelas } from "@/utils/supabase/database.types"; // tipos gerados do banco (ver PENDENCIAS.md)

type Barbeiro = Pick<Tabelas<"barbeiros">, "id" | "nome">;
type Servico = Pick<Tabelas<"servicos">, "id" | "nome">;
type Cliente = Pick<Tabelas<"clientes">, "nome" | "telefone">;

interface PropriedadesAgendaInterativa {
  barbeiros: Barbeiro[];
  servicos: Servico[];
  clientes: Cliente[];
  dataInicial: string; // dia que o servidor já buscou e renderizou no 1º carregamento da página
  barbeiroInicialId?: string; // filtro de barbeiro que o servidor já aplicou no 1º carregamento
  agendamentosIniciais: AgendamentoComRelacionamentos[]; // lista pronta, pra não haver nenhum "flash" de carregamento na 1ª vez
}

// chave única de cache por combinação (dia + barbeiro) — "todos" no lugar de "undefined" só pra virar uma string estável
function chave(data: string, barbeiroId: string | undefined): string {
  return `${data}|${barbeiroId ?? "todos"}`;
}

// busca só os agendamentos de UM dia na rota de API dedicada (app/painel/agenda/dia/route.ts) — bem mais
// leve que recarregar a página inteira (card do link, checklist e tour nunca mudam ao trocar de dia)
async function buscarAgendamentosDoDia(data: string, barbeiroId: string | undefined): Promise<AgendamentoComRelacionamentos[]> {
  const parametros = new URLSearchParams({ data });
  if (barbeiroId) {
    parametros.set("barbeiro", barbeiroId);
  }

  try {
    const resposta = await fetch(`/painel/agenda/dia?${parametros.toString()}`);
    if (!resposta.ok) {
      return []; // erro do servidor: melhor mostrar "nenhum agendamento" do que travar a tela com uma exceção
    }
    const corpo = await resposta.json();
    return corpo.agendamentos ?? [];
  } catch {
    return []; // sem conexão: mesma ideia, falha "silenciosa" em vez de quebrar a tela
  }
}

export function AgendaInterativa({
  barbeiros,
  servicos,
  clientes,
  dataInicial,
  barbeiroInicialId,
  agendamentosIniciais,
}: PropriedadesAgendaInterativa) {
  const [data, setData] = useState(dataInicial); // dia sendo exibido agora (estado do CLIENTE, não mais só da URL)
  const [barbeiroId, setBarbeiroId] = useState(barbeiroInicialId); // filtro de barbeiro sendo exibido agora
  const [agendamentos, setAgendamentos] = useState(agendamentosIniciais); // lista exibida agora
  const [isPending, startTransition] = useTransition(); // true enquanto uma busca por um dia NUNCA visto está em andamento

  // Map mutável (não precisa re-renderizar quando muda) com os dias/barbeiros já buscados nesta sessão —
  // trocar pra um dia já visto fica instantâneo, sem nenhuma chamada de rede nem skeleton
  const cacheRef = useRef<Map<string, AgendamentoComRelacionamentos[]>>(new Map());

  useEffect(() => {
    // o dia inicial já veio pronto do servidor (1º carregamento da página): guarda no cache sem buscar de novo
    cacheRef.current.set(chave(dataInicial, barbeiroInicialId), agendamentosIniciais);
    // aquece o cache do dia anterior e do seguinte desde já, pra o 1º clique nas setas já sair instantâneo
    prefetchSilencioso(somarDias(dataInicial, -1), barbeiroInicialId);
    prefetchSilencioso(somarDias(dataInicial, 1), barbeiroInicialId);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- só deve rodar 1x, no 1º carregamento desta instância do componente
  }, []);

  useEffect(() => {
    // sincroniza o estado quando o usuário usa o botão "voltar"/"avançar" do navegador (a URL muda sozinha,
    // sem passar pela função "irPara" abaixo, então é só aqui que percebemos a troca e atualizamos a tela)
    function aoNavegarPeloHistorico() {
      const parametros = new URLSearchParams(window.location.search);
      irPara(parametros.get("data") ?? hojeISO(), parametros.get("barbeiro") ?? undefined, { atualizarUrl: false });
    }

    window.addEventListener("popstate", aoNavegarPeloHistorico);
    return () => window.removeEventListener("popstate", aoNavegarPeloHistorico);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- registra o listener 1x só; "irPara" não depende de nenhum estado do render (só dos parâmetros recebidos)
  }, []);

  function prefetchSilencioso(dataAlvo: string, barbeiroAlvoId: string | undefined) {
    const chaveAlvo = chave(dataAlvo, barbeiroAlvoId);
    if (cacheRef.current.has(chaveAlvo)) {
      return; // já em cache: não gasta uma chamada de rede de novo
    }
    buscarAgendamentosDoDia(dataAlvo, barbeiroAlvoId).then((lista) => {
      cacheRef.current.set(chaveAlvo, lista); // só guarda no cache; não atualiza a tela (é o dia VIZINHO, não o atual)
    });
  }

  function irPara(novaData: string, novoBarbeiroId: string | undefined, opcoes: { atualizarUrl?: boolean } = {}) {
    const atualizarUrl = opcoes.atualizarUrl ?? true;
    const chaveAlvo = chave(novaData, novoBarbeiroId);

    if (atualizarUrl) { // mantém a URL compartilhável e o F5 funcionando, sem pedir ao Next pra re-renderizar a página no servidor
      const parametros = new URLSearchParams({ data: novaData });
      if (novoBarbeiroId) parametros.set("barbeiro", novoBarbeiroId);
      window.history.pushState(null, "", `/painel/agenda?${parametros.toString()}`);
    }

    setData(novaData);
    setBarbeiroId(novoBarbeiroId);

    const doCache = cacheRef.current.get(chaveAlvo);
    if (doCache) {
      setAgendamentos(doCache); // dia já visitado nesta sessão: troca instantânea, sem nenhum carregamento visível
    } else {
      startTransition(async () => { // dia novo: busca de verdade, mostrando o skeleton leve até a resposta chegar
        const lista = await buscarAgendamentosDoDia(novaData, novoBarbeiroId);
        cacheRef.current.set(chaveAlvo, lista);
        setAgendamentos(lista);
      });
    }

    // aquece o cache dos NOVOS vizinhos (do dia que acabamos de abrir), pro próximo clique também ser instantâneo
    prefetchSilencioso(somarDias(novaData, -1), novoBarbeiroId);
    prefetchSilencioso(somarDias(novaData, 1), novoBarbeiroId);
  }

  function aoStatusAlterado(id: string, novoStatus: StatusAgendamento) { // chamado pelo CardAgendamento depois que o banco já confirmou a mudança
    setAgendamentos((atual) => {
      const atualizado = atual.map((item) => (item.id === id ? { ...item, status: novoStatus } : item));
      cacheRef.current.set(chave(data, barbeiroId), atualizado); // mantém o cache deste dia em sincronia com o que está na tela
      return atualizado;
    });
  }

  async function aoCriarComSucesso() { // chamado pelo formulário depois que um agendamento novo é criado com sucesso
    const lista = await buscarAgendamentosDoDia(data, barbeiroId); // busca de novo de propósito (ignora o cache: o agendamento é novo)
    cacheRef.current.set(chave(data, barbeiroId), lista);
    setAgendamentos(lista);
  }

  const diaAnterior = somarDias(data, -1);
  const diaSeguinte = somarDias(data, 1);

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3"> {/* navegação de dia + filtro de barbeiro */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => irPara(diaAnterior, barbeiroId)}
            className="rounded-lg border border-borda p-2 text-texto-secundario transition-colors hover:text-texto"
            aria-label="Dia anterior"
          >
            <ChevronLeft className="h-4 w-4" aria-hidden />
          </button>
          {/* sem "capitalize" aqui: essa classe deixaria TODA palavra maiúscula; formatarDataLonga já devolve só a 1ª letra maiúscula */}
          <span className="text-sm text-texto">{formatarDataLonga(data)}</span>
          <button
            type="button"
            onClick={() => irPara(diaSeguinte, barbeiroId)}
            className="rounded-lg border border-borda p-2 text-texto-secundario transition-colors hover:text-texto"
            aria-label="Próximo dia"
          >
            <ChevronRight className="h-4 w-4" aria-hidden />
          </button>
        </div>

        <div className="flex flex-wrap gap-2"> {/* "chips" de filtro: Todos + um por barbeiro ativo */}
          <button
            type="button"
            onClick={() => irPara(data, undefined)}
            className={ // destaque dourado quando nenhum barbeiro específico está selecionado
              `rounded-full border px-3 py-1 text-sm transition-colors ${
                !barbeiroId ? "border-dourado bg-dourado/10 text-dourado" : "border-borda text-texto-secundario hover:text-texto"
              }`
            }
          >
            Todos
          </button>
          {barbeiros.map((barbeiro) => (
            <button
              key={barbeiro.id}
              type="button"
              onClick={() => irPara(data, barbeiro.id)}
              className={ // destaque dourado no barbeiro selecionado
                `rounded-full border px-3 py-1 text-sm transition-colors ${
                  barbeiroId === barbeiro.id
                    ? "border-dourado bg-dourado/10 text-dourado"
                    : "border-borda text-texto-secundario hover:text-texto"
                }`
              }
            >
              {barbeiro.nome}
            </button>
          ))}
        </div>
      </div>

      <div data-tour="lista-agenda" className="flex flex-col gap-3"> {/* lista dos agendamentos do dia, em ordem cronológica */}
        {isPending ? ( // dia nunca visto, ainda buscando: skeleton leve no lugar dos cards (em vez de travar a tela)
          [1, 2, 3].map((item) => (
            <Card key={item} className="flex items-center gap-4 p-4">
              <Skeleton className="h-10 w-16" />
              <div className="flex flex-1 flex-col gap-2">
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-4 w-56" />
              </div>
            </Card>
          ))
        ) : (
          <>
            {agendamentos.map((agendamento) => (
              <CardAgendamento
                key={agendamento.id}
                agendamento={agendamento}
                onStatusAlterado={(novoStatus) => aoStatusAlterado(agendamento.id, novoStatus)}
              />
            ))}

            {agendamentos.length === 0 && ( // mensagem amigável quando não há nada marcado nesse dia
              <EstadoVazio
                Icone={CalendarX}
                titulo="Nenhum agendamento nesse dia"
                descricao="Use o formulário abaixo pra criar o primeiro agendamento, ou escolha outro dia."
              />
            )}
          </>
        )}
      </div>

      <Card>
        <h2 className="mb-4 font-display text-lg font-semibold text-texto">Novo agendamento</h2>
        <FormularioNovoAgendamento
          // força o formulário a "nascer de novo" (campos limpos) sempre que o dia ou o barbeiro mudam —
          // antes disso acontecia sozinho (a página inteira recarregava); agora precisa ser pedido explicitamente
          key={chave(data, barbeiroId)}
          barbeiros={barbeiros}
          servicos={servicos}
          clientes={clientes}
          dataSelecionada={data}
          barbeiroPreSelecionado={barbeiroId}
          aoCriarComSucesso={aoCriarComSucesso}
        />
      </Card>
    </>
  );
}
