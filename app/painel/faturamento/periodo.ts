// lógica (pura, sem banco) de "qual período o dono está vendo" e "qual é o período ANTERIOR equivalente,
// pra comparar" — separado do page.tsx só pra poder ler/testar essa regra isoladamente
import { somarDias, primeiroDiaDoMes, somarMeses, diferencaDias } from "@/utils/data";

export type PeriodoChave = "hoje" | "7dias" | "mes" | "mes_passado" | "personalizado"; // as 5 opções do filtro

export const OPCOES_PERIODO: { chave: PeriodoChave; rotulo: string }[] = [ // usado pra desenhar os "chips" do filtro, nesta ordem
  { chave: "hoje", rotulo: "Hoje" },
  { chave: "7dias", rotulo: "7 dias" },
  { chave: "mes", rotulo: "Este mês" },
  { chave: "mes_passado", rotulo: "Mês passado" },
  { chave: "personalizado", rotulo: "Personalizado" },
];

export interface IntervaloPeriodo { // [inicio, fim) — "inicio" incluído, "fim" NÃO incluído, mesmo padrão de limitesDoDia
  inicio: string; // "AAAA-MM-DD"
  fim: string; // "AAAA-MM-DD"
}

export interface PeriodoResolvido {
  atual: IntervaloPeriodo; // o que o dono escolheu ver
  anterior: IntervaloPeriodo; // o período imediatamente anterior, com a MESMA duração — base da comparação dos cards
}

// "hoje" (parâmetro) é sempre passado de fora (em vez de calculado aqui com `new Date()`) pra manter esta
// função pura e fácil de testar — quem chama decide o que é "agora" (ver utils/data.ts -> hojeISO())
export function resolverPeriodo(chave: PeriodoChave, hoje: string, dePersonalizado?: string, atePersonalizado?: string): PeriodoResolvido {
  switch (chave) {
    case "hoje": {
      return { atual: { inicio: hoje, fim: somarDias(hoje, 1) }, anterior: { inicio: somarDias(hoje, -1), fim: hoje } };
    }

    case "7dias": { // "últimos 7 dias", incluindo hoje — e os 7 dias imediatamente antes desses, pra comparar
      return {
        atual: { inicio: somarDias(hoje, -6), fim: somarDias(hoje, 1) },
        anterior: { inicio: somarDias(hoje, -13), fim: somarDias(hoje, -6) },
      };
    }

    case "mes": { // mês inteiro (passado + futuro dele), pra "Previsto" já contar o que falta do mês também
      const inicioMesAtual = primeiroDiaDoMes(hoje);
      const inicioProximoMes = somarMeses(inicioMesAtual, 1);
      const inicioMesAnterior = somarMeses(inicioMesAtual, -1);
      return { atual: { inicio: inicioMesAtual, fim: inicioProximoMes }, anterior: { inicio: inicioMesAnterior, fim: inicioMesAtual } };
    }

    case "mes_passado": {
      const inicioMesAtual = primeiroDiaDoMes(hoje);
      const inicioMesPassado = somarMeses(inicioMesAtual, -1);
      const inicioMesRetrasado = somarMeses(inicioMesAtual, -2);
      return { atual: { inicio: inicioMesPassado, fim: inicioMesAtual }, anterior: { inicio: inicioMesRetrasado, fim: inicioMesPassado } };
    }

    case "personalizado": { // "de"/"ate" vêm de 2 <input type="date">, os dois INCLUSIVOS — por isso o "+1 dia" no fim
      const inicio = dePersonalizado || hoje;
      const fim = somarDias(atePersonalizado || hoje, 1);
      const duracaoDias = Math.max(1, diferencaDias(inicio, fim)); // nunca menos que 1 dia, mesmo se "de" vier depois de "ate" por engano
      return { atual: { inicio, fim }, anterior: { inicio: somarDias(inicio, -duracaoDias), fim: inicio } };
    }
  }
}
