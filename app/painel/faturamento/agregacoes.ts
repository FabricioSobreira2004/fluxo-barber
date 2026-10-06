// funções PURAS (sem banco, sem React) que transformam a lista de agendamentos de um período nos números
// que a tela de Faturamento mostra — separadas do page.tsx só pra ficarem fáceis de ler e de testar isoladas
import { dataLocalBrasil, horaLocalBrasil, diaDaSemana, somarDias } from "@/utils/data";
import {
  type LinhaFaturamento,
  type ResumoPeriodo,
  type PontoGraficoDia,
  type PontoGraficoHora,
  type LinhaRankingBarbeiro,
  type LinhaRankingServico,
  type MovimentoDestaque,
} from "./tipos";
import { type IntervaloPeriodo } from "./periodo";

export function calcularResumo(linhas: LinhaFaturamento[]): ResumoPeriodo {
  let faturamentoRealizadoCentavos = 0;
  let previstoCentavos = 0;
  let atendimentosConcluidos = 0;
  let totalFaltou = 0;
  let totalCancelado = 0;

  for (const linha of linhas) { // 1 passada só pelos dados, somando tudo de uma vez (nada aqui precisa de 2 voltas)
    if (linha.status === "concluido") {
      faturamentoRealizadoCentavos += linha.preco_centavos;
      atendimentosConcluidos += 1;
    } else if (linha.status === "agendado" || linha.status === "confirmado") {
      previstoCentavos += linha.preco_centavos;
    } else if (linha.status === "faltou") {
      totalFaltou += 1;
    } else if (linha.status === "cancelado") {
      totalCancelado += 1;
    }
  }

  // denominador = atendimentos FINALIZADOS no período (concluído + cancelado + faltou) — "agendado"/"confirmado"
  // ainda não têm um resultado definido, então não entram na taxa (senão um período bem no futuro, só com
  // agendamentos marcados, mostraria taxa 0% por "sorte", em vez de "ainda não dá pra saber")
  const totalFinalizados = atendimentosConcluidos + totalCancelado + totalFaltou;
  const taxaFaltasCancelamentos = totalFinalizados > 0 ? (totalFaltou + totalCancelado) / totalFinalizados : null;

  return {
    faturamentoRealizadoCentavos,
    previstoCentavos,
    atendimentosConcluidos,
    ticketMedioCentavos: atendimentosConcluidos > 0 ? Math.round(faturamentoRealizadoCentavos / atendimentosConcluidos) : 0,
    taxaFaltasCancelamentos,
  };
}

// variação percentual entre 2 números do mesmo tipo de métrica (ex: faturamento atual vs. anterior).
// "null" quando não dá pra calcular variação de verdade (0 -> 0, sem nenhuma mudança real) ou quando é um valor
// "novo" (0 -> N: tecnicamente seria "infinito por cento", então é melhor mostrar "novo" na tela do que um número sem sentido)
export function calcularVariacaoPercentual(atual: number, anterior: number): number | null {
  if (anterior === 0) {
    return null; // sem período anterior pra comparar (0->0, sem mudança real, ou 0->N, que seria "infinito por cento"); a tela decide o texto certo em cada caso
  }
  return ((atual - anterior) / anterior) * 100;
}

export function calcularFaturamentoPorDia(linhas: LinhaFaturamento[], periodo: IntervaloPeriodo): PontoGraficoDia[] {
  const porDia = new Map<string, number>(); // acumula primeiro num Map (mais rápido que procurar/empurrar num array a cada linha)

  for (const linha of linhas) {
    if (linha.status !== "concluido") continue; // o gráfico é de faturamento REALIZADO, não do previsto
    const dia = dataLocalBrasil(linha.inicio);
    porDia.set(dia, (porDia.get(dia) ?? 0) + linha.preco_centavos);
  }

  const pontos: PontoGraficoDia[] = [];
  for (let dia = periodo.inicio; dia < periodo.fim; dia = somarDias(dia, 1)) { // percorre TODO o período, dia a dia
    pontos.push({ dia, totalCentavos: porDia.get(dia) ?? 0 }); // 0 pros dias sem nenhum "concluido" — a barra aparece vazia, não falta o dia
  }
  return pontos;
}

// usado só quando o período escolhido é de 1 DIA: nesse caso, um gráfico "por dia" teria 1 barra só
// (inútil) — então a tela troca pra "por horário", com 1 barra por hora do dia (0h a 23h)
export function calcularFaturamentoPorHora(linhas: LinhaFaturamento[]): PontoGraficoHora[] {
  const porHora = new Map<number, number>();

  for (const linha of linhas) {
    if (linha.status !== "concluido") continue; // mesmo critério do gráfico por dia: só faturamento REALIZADO
    const hora = horaLocalBrasil(linha.inicio);
    porHora.set(hora, (porHora.get(hora) ?? 0) + linha.preco_centavos);
  }

  const pontos: PontoGraficoHora[] = [];
  for (let hora = 0; hora < 24; hora++) { // percorre o dia inteiro, hora a hora (0 pras horas sem nenhum "concluido")
    pontos.push({ hora, totalCentavos: porHora.get(hora) ?? 0 });
  }
  return pontos;
}

export function calcularRankingBarbeiros(linhas: LinhaFaturamento[]): LinhaRankingBarbeiro[] {
  const porBarbeiro = new Map<string, { nome: string; faturamentoCentavos: number; atendimentos: number }>();

  for (const linha of linhas) {
    if (linha.status !== "concluido" || !linha.barbeiro_id) continue; // ranking de faturamento: só o que já virou dinheiro de verdade
    const acumulado = porBarbeiro.get(linha.barbeiro_id) ?? { nome: linha.barbeiro?.nome ?? "—", faturamentoCentavos: 0, atendimentos: 0 };
    acumulado.faturamentoCentavos += linha.preco_centavos;
    acumulado.atendimentos += 1;
    porBarbeiro.set(linha.barbeiro_id, acumulado);
  }

  return [...porBarbeiro.entries()]
    .map(([barbeiroId, valores]) => ({
      barbeiroId,
      nome: valores.nome,
      faturamentoCentavos: valores.faturamentoCentavos,
      atendimentos: valores.atendimentos,
      ticketMedioCentavos: Math.round(valores.faturamentoCentavos / valores.atendimentos),
    }))
    .sort((a, b) => b.faturamentoCentavos - a.faturamentoCentavos); // do maior faturamento pro menor
}

export function calcularRankingServicos(linhas: LinhaFaturamento[]): LinhaRankingServico[] {
  const porServico = new Map<string, { nome: string; faturamentoCentavos: number; quantidade: number }>();

  for (const linha of linhas) {
    if (linha.status !== "concluido" || !linha.servico_id) continue;
    const acumulado = porServico.get(linha.servico_id) ?? { nome: linha.servico?.nome ?? "—", faturamentoCentavos: 0, quantidade: 0 };
    acumulado.faturamentoCentavos += linha.preco_centavos;
    acumulado.quantidade += 1;
    porServico.set(linha.servico_id, acumulado);
  }

  return [...porServico.entries()]
    .map(([servicoId, valores]) => ({ servicoId, nome: valores.nome, quantidade: valores.quantidade, faturamentoCentavos: valores.faturamentoCentavos }))
    .sort((a, b) => b.faturamentoCentavos - a.faturamentoCentavos);
}

export function calcularMovimento(linhas: LinhaFaturamento[]): MovimentoDestaque {
  const porDiaSemana = new Map<number, number>();
  const porHora = new Map<number, number>();

  for (const linha of linhas) {
    if (linha.status === "cancelado") continue; // cancelado não representa movimento real na barbearia (nunca aconteceu)
    const dia = diaDaSemana(dataLocalBrasil(linha.inicio));
    const hora = horaLocalBrasil(linha.inicio);
    porDiaSemana.set(dia, (porDiaSemana.get(dia) ?? 0) + 1);
    porHora.set(hora, (porHora.get(hora) ?? 0) + 1);
  }

  return {
    diaSemanaMaisMovimentado: encontrarMaior(porDiaSemana, (diaSemana, total) => ({ diaSemana, total })),
    horaMaisMovimentada: encontrarMaior(porHora, (hora, total) => ({ hora, total })),
  };
}

// pequeno utilitário interno: acha a chave com o maior valor acumulado num Map (usado pros 2 "mais movimentado" acima)
function encontrarMaior<T>(mapa: Map<number, number>, montar: (chave: number, total: number) => T): T | null {
  let melhor: { chave: number; total: number } | null = null;
  for (const [chave, total] of mapa) {
    if (!melhor || total > melhor.total) {
      melhor = { chave, total };
    }
  }
  return melhor ? montar(melhor.chave, melhor.total) : null;
}
