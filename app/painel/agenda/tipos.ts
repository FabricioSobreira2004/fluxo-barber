export interface AgendamentoComRelacionamentos { // formato real de cada linha devolvida pela consulta com relacionamentos (ver page.tsx)
  id: string;
  inicio: string;
  fim: string;
  preco_centavos: number;
  status: string;
  observacao: string | null;
  // o Postgres liga agendamentos -> barbeiros/clientes/servicos por uma chave estrangeira "pra um só" registro
  // (ex: um agendamento tem UM barbeiro), então o Supabase devolve cada um como OBJETO único, não como lista;
  // sem os tipos gerados do banco (não fizemos esse passo), o TypeScript não sabe disso e por isso declaramos aqui na mão
  barbeiro: { nome: string } | null;
  cliente: { nome: string; telefone: string } | null;
  servico: { nome: string } | null;
}
