// ============================================================================
// periodo.test.ts
// Testes de resolverPeriodo() (datas de início/fim do período atual e do anterior,
// pros filtros Hoje, 7 dias, 30 dias, Este mês e Mês passado) e de
// separarLinhasPorPeriodo() (reproduz o bug da comparação "Este mês" vs. mês
// anterior INTEIRO, já corrigido). Roda com:
//   node --test app/painel/faturamento/periodo.test.ts
// Data fixa usada em todos os testes: "2026-10-06" (a mesma do bug relatado),
// pra nunca depender do dia em que o teste é executado.
// ============================================================================

import { test } from "node:test"; // test runner nativo do Node, sem precisar instalar nada
import assert from "node:assert/strict"; // comparações simples (assert.equal etc)
import { resolverPeriodo } from "./periodo.ts";
import { separarLinhasPorPeriodo } from "./agregacoes.ts";
import { type LinhaFaturamento } from "./tipos.ts";

const HOJE = "2026-10-06"; // mesma data em que o bug foi relatado (uma terça-feira, dia 6 do mês)

test("resolverPeriodo('hoje'): atual é o próprio dia, anterior é a mesma data da semana passada", () => {
  const { atual, anterior } = resolverPeriodo("hoje", HOJE);
  assert.deepEqual(atual, { inicio: "2026-10-06", fim: "2026-10-07" });
  assert.deepEqual(anterior, { inicio: "2026-09-29", fim: "2026-09-30" }); // 7 dias antes, não "ontem"
});

test("resolverPeriodo('7dias'): últimos 7 dias (incl. hoje) vs. os 7 dias imediatamente antes", () => {
  const { atual, anterior } = resolverPeriodo("7dias", HOJE);
  assert.deepEqual(atual, { inicio: "2026-09-30", fim: "2026-10-07" });
  assert.deepEqual(anterior, { inicio: "2026-09-23", fim: "2026-09-30" });
});

test("resolverPeriodo('30dias'): últimos 30 dias (incl. hoje) vs. os 30 dias imediatamente antes", () => {
  const { atual, anterior } = resolverPeriodo("30dias", HOJE);
  assert.deepEqual(atual, { inicio: "2026-09-07", fim: "2026-10-07" });
  assert.deepEqual(anterior, { inicio: "2026-08-08", fim: "2026-09-07" });
});

test("resolverPeriodo('mes'): mês inteiro (até o fim, p/ previsto) vs. SÓ os mesmos dias corridos do mês anterior", () => {
  const { atual, anterior } = resolverPeriodo("mes", HOJE);
  assert.deepEqual(atual, { inicio: "2026-10-01", fim: "2026-11-01" }); // mês inteiro de outubro
  // o bug relatado: isto tinha que ser só 01-06/09 (6 dias, mesma contagem de "hoje é dia 6"), nunca setembro inteiro
  assert.deepEqual(anterior, { inicio: "2026-09-01", fim: "2026-09-07" });
});

test("resolverPeriodo('mes'): no dia 1º do mês, o anterior também é só 1 dia do mês passado", () => {
  const { atual, anterior } = resolverPeriodo("mes", "2026-10-01");
  assert.deepEqual(atual, { inicio: "2026-10-01", fim: "2026-11-01" });
  assert.deepEqual(anterior, { inicio: "2026-09-01", fim: "2026-09-02" }); // só o dia 1º de setembro
});

test("resolverPeriodo('mes_passado'): mês passado inteiro vs. mês retrasado inteiro", () => {
  const { atual, anterior } = resolverPeriodo("mes_passado", HOJE);
  assert.deepEqual(atual, { inicio: "2026-09-01", fim: "2026-10-01" });
  assert.deepEqual(anterior, { inicio: "2026-08-01", fim: "2026-09-01" });
});

// ----------------------------------------------------------------------------
// separarLinhasPorPeriodo: reproduz o cenário exato do bug relatado — com o
// filtro "Este mês" em 06/10, linhas espalhadas por TODO o mês de setembro
// (não só 01-06) não podiam contaminar o período "anterior"
// ----------------------------------------------------------------------------

function linhaFalsa(inicio: string, preco_centavos = 1000): LinhaFaturamento { // helper só pra não repetir os campos que o teste não usa
  return { id: inicio, inicio, preco_centavos, status: "concluido", barbeiro_id: null, servico_id: null, barbeiro: null, servico: null };
}

test("separarLinhasPorPeriodo('mes', 06/10): só 01-06/09 entra no anterior, nunca o resto de setembro", () => {
  const periodo = resolverPeriodo("mes", HOJE);
  const linhas: LinhaFaturamento[] = [
    linhaFalsa("2026-09-01T12:00:00-03:00"), // dentro dos 6 dias esperados do "anterior"
    linhaFalsa("2026-09-06T12:00:00-03:00"), // último dia ainda dentro do "anterior"
    linhaFalsa("2026-09-07T12:00:00-03:00"), // já é o 7º dia: fora do "anterior" (e também fora do "atual")
    linhaFalsa("2026-09-20T12:00:00-03:00"), // bem no meio do mês passado: NUNCA deveria contar (era o bug)
    linhaFalsa("2026-09-30T12:00:00-03:00"), // fim de setembro: idem
    linhaFalsa("2026-10-03T12:00:00-03:00"), // dentro do mês atual
  ];

  const { atual, anterior } = separarLinhasPorPeriodo(linhas, periodo);

  assert.deepEqual(
    anterior.map((l) => l.id),
    ["2026-09-01T12:00:00-03:00", "2026-09-06T12:00:00-03:00"]
  );
  assert.deepEqual(atual.map((l) => l.id), ["2026-10-03T12:00:00-03:00"]);
});

test("separarLinhasPorPeriodo('7dias'): período anterior contíguo (sem buraco nem sobreposição) continua funcionando", () => {
  const periodo = resolverPeriodo("7dias", HOJE); // atual: 30/09-06/10, anterior: 23/09-29/09
  const linhas: LinhaFaturamento[] = [
    linhaFalsa("2026-09-23T08:00:00-03:00"), // primeiro dia do anterior
    linhaFalsa("2026-09-29T23:59:00-03:00"), // último instante ainda dentro do anterior
    linhaFalsa("2026-09-30T00:00:00-03:00"), // primeiro instante já do atual
  ];

  const { atual, anterior } = separarLinhasPorPeriodo(linhas, periodo);

  assert.equal(anterior.length, 2);
  assert.equal(atual.length, 1);
});
