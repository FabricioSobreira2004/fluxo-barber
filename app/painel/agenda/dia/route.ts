import { NextResponse, type NextRequest } from "next/server"; // tipos/utilitário pra responder uma requisição de API
import { obterBarbeariaAtual } from "@/utils/supabase/barbearia-atual"; // garante login e descobre a barbearia (mesma função usada em page.tsx)
import { limitesDoDia } from "@/utils/data"; // calcula o intervalo [00:00, 24:00) do dia pedido, em horário de Brasília
import { type AgendamentoComRelacionamentos } from "../tipos"; // mesmo formato de linha usado na página, pra não duplicar o tipo

// rota só de LEITURA, chamada pelo navegador (via fetch) quando o dono troca de dia ou de barbeiro na
// Agenda — devolve só os agendamentos daquele dia, em JSON, sem precisar re-renderizar a página inteira
// no servidor (card "Seu link", checklist e tour continuam os mesmos, só a lista de baixo muda)
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url); // lê "?data=AAAA-MM-DD" e "?barbeiro=id" da própria URL da requisição
  const data = searchParams.get("data");
  const barbeiroId = searchParams.get("barbeiro");

  if (!data) { // sem data não tem o que buscar — defesa simples contra uma chamada malformada
    return NextResponse.json({ erro: "Parâmetro 'data' é obrigatório." }, { status: 400 });
  }

  const { supabase, barbeariaId } = await obterBarbeariaAtual(); // mesma checagem de login/barbearia da página (RLS do banco cuida do resto)

  const { inicio, fim } = limitesDoDia(data); // intervalo do dia pedido, no fuso do Brasil

  let consulta = supabase // mesma consulta que page.tsx fazia antes, agora isolada aqui pra poder ser chamada sozinha
    .from("agendamentos")
    .select(
      "id, inicio, fim, preco_centavos, status, observacao, barbeiro:barbeiros(nome), cliente:clientes(nome, telefone), servico:servicos(nome)"
    )
    .eq("barbearia_id", barbeariaId)
    .gte("inicio", inicio)
    .lt("inicio", fim)
    .order("inicio");

  if (barbeiroId) { // mesmo filtro opcional de barbeiro que a página já tinha
    consulta = consulta.eq("barbeiro_id", barbeiroId);
  }

  const { data: agendamentosBrutos, error } = await consulta;

  if (error) {
    return NextResponse.json({ erro: "Não foi possível buscar os agendamentos." }, { status: 500 });
  }

  const agendamentos: AgendamentoComRelacionamentos[] = agendamentosBrutos ?? [];
  return NextResponse.json({ agendamentos }); // o navegador recebe só isto, nada do resto da página
}
