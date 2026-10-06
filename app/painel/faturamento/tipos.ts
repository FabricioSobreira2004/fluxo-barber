import { type Tabelas } from "@/utils/supabase/database.types"; // tipos gerados do banco (ver PENDENCIAS.md)

// 1 linha da consulta que alimenta a tela inteira: só os campos usados em algum dos cálculos
// (ver agregacoes.ts), com os relacionamentos já resolvidos pelo Supabase a partir das chaves estrangeiras
export type LinhaFaturamento = Pick<
  Tabelas<"agendamentos">,
  "id" | "inicio" | "preco_centavos" | "status" | "barbeiro_id" | "servico_id"
> & {
  barbeiro: Pick<Tabelas<"barbeiros">, "nome"> | null; // "null" cobre o caso raro de o barbeiro ter sido apagado
  servico: Pick<Tabelas<"servicos">, "nome"> | null;
};

export interface ResumoPeriodo { // os 5 números dos cards de destaque, pra UM período (atual OU anterior)
  faturamentoRealizadoCentavos: number; // soma de preco_centavos só dos "concluido"
  previstoCentavos: number; // soma de preco_centavos dos "agendado"/"confirmado" (ainda vão acontecer)
  atendimentosConcluidos: number; // contagem dos "concluido"
  ticketMedioCentavos: number; // faturamentoRealizadoCentavos / atendimentosConcluidos (0 se não houve nenhum)
  taxaFaltasCancelamentos: number | null; // (faltou + cancelado) / (concluido + cancelado + faltou); null = sem nenhum atendimento finalizado no período
}

export interface PontoGraficoDia { // 1 barra do gráfico de faturamento por dia
  dia: string; // "AAAA-MM-DD"
  totalCentavos: number; // faturamento REALIZADO (só "concluido") naquele dia
}

export interface LinhaRankingBarbeiro {
  barbeiroId: string;
  nome: string;
  faturamentoCentavos: number;
  atendimentos: number;
  ticketMedioCentavos: number;
}

export interface LinhaRankingServico {
  servicoId: string;
  nome: string;
  quantidade: number;
  faturamentoCentavos: number;
}

export interface MovimentoDestaque { // "qual dia/horário tem mais movimento", calculado a partir da CONTAGEM de agendamentos (não do valor em R$)
  diaSemanaMaisMovimentado: { diaSemana: number; total: number } | null; // "null" só se o período não tiver nenhum agendamento
  horaMaisMovimentada: { hora: number; total: number } | null;
}
