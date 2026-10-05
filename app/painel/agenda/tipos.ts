import { type Tabelas } from "@/utils/supabase/database.types"; // tipos gerados do banco (ver PENDENCIAS.md)

// formato real de cada linha devolvida pela consulta com relacionamentos (ver page.tsx). Os campos "soltos" vêm
// de Tabelas<"agendamentos">; os 3 relacionamentos abaixo são declarados na mão porque o Postgres liga
// agendamentos -> barbeiros/clientes/servicos "pra um só" registro (ex: um agendamento tem UM barbeiro), e o
// select usa um alias (ex: "barbeiro:barbeiros(nome)") que o TypeScript não consegue inferir sozinho
export type AgendamentoComRelacionamentos = Pick<
  Tabelas<"agendamentos">, // reaproveita os tipos das colunas direto do banco, em vez de redigitar cada um
  "id" | "inicio" | "fim" | "preco_centavos" | "status" | "observacao"
> & {
  barbeiro: Pick<Tabelas<"barbeiros">, "nome"> | null; // "null" cobre o caso (raro) de o barbeiro ter sido apagado
  cliente: Pick<Tabelas<"clientes">, "nome" | "telefone"> | null;
  servico: Pick<Tabelas<"servicos">, "nome"> | null;
};
