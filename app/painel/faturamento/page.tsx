import { type Metadata } from "next"; // tipo da metadata desta página
import { Wallet, CalendarClock, CheckCircle2, Receipt, UserX } from "lucide-react"; // 1 ícone por card de destaque
import { obterBarbeariaAtual } from "@/utils/supabase/barbearia-atual"; // descobre a barbearia do usuário logado
import { hojeISO, inicioDoDiaBrasil, somarDias, diferencaDias } from "@/utils/data"; // data de hoje, conversões de data e cálculo de duração do período
import { Card } from "@/components/ui/Card"; // bloco de superfície padrão
import { resolverPeriodo, OPCOES_PERIODO, type PeriodoChave } from "./periodo"; // período escolhido + o equivalente anterior, pra comparar
import {
  calcularResumo,
  calcularVariacaoPercentual,
  calcularFaturamentoPorDia,
  calcularFaturamentoPorHora,
  calcularRankingBarbeiros,
  calcularRankingServicos,
  calcularMovimento,
} from "./agregacoes";
import { type LinhaFaturamento } from "./tipos";
import { SeletorPeriodo } from "./SeletorPeriodo";
import { CardsResumo, type DadosCardResumo } from "./CardsResumo";
import { GraficoFaturamentoPorDia } from "./GraficoFaturamentoPorDia";
import { GraficoFaturamentoPorHora } from "./GraficoFaturamentoPorHora";
import { RankingBarbeiros } from "./RankingBarbeiros";
import { RankingServicos } from "./RankingServicos";
import { MovimentoDestaques } from "./MovimentoDestaques";

export const metadata: Metadata = { title: "Faturamento | Fluxo Barber" }; // título específico desta página do painel

const CHAVES_PERIODO_VALIDAS = OPCOES_PERIODO.map((opcao) => opcao.chave); // só pra validar o "?periodo=" vindo da URL

// "30dias" é o padrão ao abrir a página (sem "?periodo=" na URL, ou com um valor estranho nela) — dá
// uma visão de 1 mês corrido de cara, em vez de só o dia de hoje (que costuma estar quase vazio)
function comoPeriodoChave(valor: unknown): PeriodoChave {
  return typeof valor === "string" && (CHAVES_PERIODO_VALIDAS as string[]).includes(valor) ? (valor as PeriodoChave) : "30dias";
}

export default async function PaginaFaturamento(props: PageProps<"/painel/faturamento">) {
  const { supabase, barbeariaId } = await obterBarbeariaAtual(); // garante login e descobre em qual barbearia buscar
  const parametros = await props.searchParams; // searchParams é uma Promise no Next.js 16, por isso o await

  const periodoChave = comoPeriodoChave(parametros.periodo);
  const de = typeof parametros.de === "string" ? parametros.de : undefined; // só usados quando periodoChave === "personalizado"
  const ate = typeof parametros.ate === "string" ? parametros.ate : undefined;

  const hoje = hojeISO();
  const periodo = resolverPeriodo(periodoChave, hoje, de, ate); // { atual, anterior }, já com a mesma duração nos dois
  const periodoDeUmDia = diferencaDias(periodo.atual.inicio, periodo.atual.fim) === 1; // "Hoje" ou "Personalizado" com De === Até

  // 1 consulta só, cobrindo os 2 períodos de uma vez (do início do período ANTERIOR até o fim do período ATUAL) —
  // mais barato que 2 idas e voltas separadas ao banco; a separação entre "linhas de cada período" é feita abaixo, em memória
  const { data: linhasBrutas } = await supabase
    .from("agendamentos")
    .select("id, inicio, preco_centavos, status, barbeiro_id, servico_id, barbeiro:barbeiros(nome), servico:servicos(nome)")
    .eq("barbearia_id", barbeariaId)
    .gte("inicio", inicioDoDiaBrasil(periodo.anterior.inicio))
    .lt("inicio", inicioDoDiaBrasil(periodo.atual.fim))
    .order("inicio");

  const linhas: LinhaFaturamento[] = linhasBrutas ?? [];

  // separa as linhas entre "período atual" e "período anterior" comparando INSTANTES de verdade (new Date().getTime()),
  // nunca comparando os textos das datas diretamente — strings ISO com fusos horários diferentes não ordenam certo por texto
  const limiteAtualMs = new Date(inicioDoDiaBrasil(periodo.atual.inicio)).getTime();
  const linhasAtual = linhas.filter((linha) => new Date(linha.inicio).getTime() >= limiteAtualMs);
  const linhasAnterior = linhas.filter((linha) => new Date(linha.inicio).getTime() < limiteAtualMs);

  const resumoAtual = calcularResumo(linhasAtual);
  const resumoAnterior = calcularResumo(linhasAnterior);

  const cards: DadosCardResumo[] = [
    {
      chave: "realizado",
      titulo: "Faturamento realizado",
      icone: <Wallet className="h-4 w-4" aria-hidden />,
      valor: resumoAtual.faturamentoRealizadoCentavos,
      unidade: "centavos",
      variacaoPercentual: calcularVariacaoPercentual(resumoAtual.faturamentoRealizadoCentavos, resumoAnterior.faturamentoRealizadoCentavos),
      maiorEhMelhor: true,
    },
    {
      chave: "previsto",
      titulo: "Previsto",
      icone: <CalendarClock className="h-4 w-4" aria-hidden />,
      valor: resumoAtual.previstoCentavos,
      unidade: "centavos",
      variacaoPercentual: calcularVariacaoPercentual(resumoAtual.previstoCentavos, resumoAnterior.previstoCentavos),
      maiorEhMelhor: true,
    },
    {
      chave: "concluidos",
      titulo: "Atendimentos concluídos",
      icone: <CheckCircle2 className="h-4 w-4" aria-hidden />,
      valor: resumoAtual.atendimentosConcluidos,
      unidade: "quantidade",
      variacaoPercentual: calcularVariacaoPercentual(resumoAtual.atendimentosConcluidos, resumoAnterior.atendimentosConcluidos),
      maiorEhMelhor: true,
    },
    {
      chave: "ticket-medio",
      titulo: "Ticket médio",
      icone: <Receipt className="h-4 w-4" aria-hidden />,
      valor: resumoAtual.ticketMedioCentavos,
      unidade: "centavos",
      variacaoPercentual: calcularVariacaoPercentual(resumoAtual.ticketMedioCentavos, resumoAnterior.ticketMedioCentavos),
      maiorEhMelhor: true,
    },
    {
      chave: "taxa-faltas",
      titulo: "Taxa de faltas e cancelamentos",
      icone: <UserX className="h-4 w-4" aria-hidden />,
      valor: (resumoAtual.taxaFaltasCancelamentos ?? 0) * 100,
      indisponivel: resumoAtual.taxaFaltasCancelamentos === null,
      unidade: "percentual",
      // compara as 2 FRAÇÕES direto (ex: 0.1 vs 0.08) — multiplicar as duas por 100 não mudaria a variação percentual entre elas
      variacaoPercentual:
        resumoAtual.taxaFaltasCancelamentos === null || resumoAnterior.taxaFaltasCancelamentos === null
          ? null
          : calcularVariacaoPercentual(resumoAtual.taxaFaltasCancelamentos, resumoAnterior.taxaFaltasCancelamentos),
      maiorEhMelhor: false, // único card em que SUBIR é a notícia ruim (mais faltas/cancelamentos)
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-display text-2xl font-semibold text-texto">Faturamento</h1>

      <SeletorPeriodo periodoAtual={periodoChave} de={de} ate={ate} />

      <CardsResumo cards={cards} />

      <Card>
        {periodoDeUmDia ? ( // 1 dia só: "por dia" teria 1 barra inútil — troca pra "por horário"
          <>
            <h2 className="mb-4 font-display text-lg font-semibold text-texto">Faturamento por horário</h2>
            <GraficoFaturamentoPorHora pontos={calcularFaturamentoPorHora(linhasAtual)} />
          </>
        ) : (
          <>
            <h2 className="mb-4 font-display text-lg font-semibold text-texto">Faturamento por dia</h2>
            {/* nunca mostra dias futuros vazios (ex: em "Este mês", o resto do mês que ainda não chegou) —
                por isso o gráfico vai só até HOJE, mesmo quando o período (periodo.atual) continua no futuro
                (ele continua assim de propósito, pra "Previsto" contar os agendamentos futuros do mês) */}
            <GraficoFaturamentoPorDia
              pontos={calcularFaturamentoPorDia(linhasAtual, {
                inicio: periodo.atual.inicio,
                fim: periodo.atual.fim < somarDias(hoje, 1) ? periodo.atual.fim : somarDias(hoje, 1),
              })}
            />
          </>
        )}
      </Card>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <RankingBarbeiros ranking={calcularRankingBarbeiros(linhasAtual)} />
        <RankingServicos ranking={calcularRankingServicos(linhasAtual)} />
      </div>

      <MovimentoDestaques movimento={calcularMovimento(linhasAtual)} somenteHorario={periodoDeUmDia} />
    </div>
  );
}
