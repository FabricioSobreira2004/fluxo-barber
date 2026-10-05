import { type createClient } from "@/utils/supabase/server"; // só usado aqui pra pegar o tipo do cliente, não pra criar um novo

// os 3 requisitos, e SÓ eles, pra página pública (/b/[slug]) conseguir oferecer agendamento:
// pelo menos 1 barbeiro ativo, pelo menos 1 serviço ativo, e pelo menos 1 horário de trabalho
// cadastrado pra um barbeiro ativo. "Copiar o link" e "receber o 1º agendamento" NÃO entram
// aqui -- são passos seguintes, não pré-requisitos (ver components/painel/ChecklistPrimeirosPassos.tsx)
export interface ItemProntidao {
  chave: "barbeiro" | "servico" | "horario";
  rotulo: string; // minúsculo, pensado pra encaixar numa frase tipo "Falta: cadastrar um serviço"
  href: string; // tela do painel onde esse item se resolve
}

export interface StatusProntidao {
  temBarbeiroAtivo: boolean;
  temServicoAtivo: boolean;
  temHorarioParaBarbeiroAtivo: boolean;
  pronta: boolean; // true só quando os 3 acima são true -- é o que decide se o link já funciona
  itensFaltando: ItemProntidao[]; // só os que faltam, sempre nesta ordem (barbeiro -> serviço -> horário)
}

const ITENS_PRONTIDAO: Record<ItemProntidao["chave"], ItemProntidao> = { // texto e destino de cada um dos 3 requisitos
  barbeiro: { chave: "barbeiro", rotulo: "cadastrar um barbeiro", href: "/painel/barbeiros" },
  servico: { chave: "servico", rotulo: "cadastrar um serviço", href: "/painel/servicos" },
  horario: { chave: "horario", rotulo: "definir os horários", href: "/painel/horarios" },
};

// FUNÇÃO ÚNICA E CENTRAL: usada em todo lugar do painel que precisa saber se o link público já
// funciona (card "Seu link", aviso antes de compartilhar, checklist, tour). A página pública em
// si (sem login) usa a função equivalente em SQL, "barbearia_esta_pronta" (migration 005) --
// a REGRA é a mesma dos dois lados, só a forma de consultar muda (aqui, com login; lá, sem)
export async function barbeariaProntaParaAgendamentos(
  supabase: Awaited<ReturnType<typeof createClient>>,
  barbeariaId: string
): Promise<StatusProntidao> {
  const [{ count: totalBarbeirosAtivos }, { count: totalServicosAtivos }, { count: totalHorariosValidos }] = await Promise.all([
    supabase.from("barbeiros").select("id", { count: "exact", head: true }).eq("barbearia_id", barbeariaId).eq("ativo", true),
    supabase.from("servicos").select("id", { count: "exact", head: true }).eq("barbearia_id", barbeariaId).eq("ativo", true),
    // "barbeiros!inner(id)" + "eq('barbeiros.ativo', true)": só conta horário de um barbeiro que
    // está ativo AGORA -- um horário de um barbeiro desativado não ajuda a página pública em nada
    supabase
      .from("horarios_trabalho")
      .select("id, barbeiros!inner(id)", { count: "exact", head: true })
      .eq("barbearia_id", barbeariaId)
      .eq("barbeiros.ativo", true),
  ]);

  const temBarbeiroAtivo = (totalBarbeirosAtivos ?? 0) > 0;
  const temServicoAtivo = (totalServicosAtivos ?? 0) > 0;
  const temHorarioParaBarbeiroAtivo = (totalHorariosValidos ?? 0) > 0;

  const itensFaltando: ItemProntidao[] = []; // sempre na mesma ordem: barbeiro, depois serviço, depois horário
  if (!temBarbeiroAtivo) itensFaltando.push(ITENS_PRONTIDAO.barbeiro);
  if (!temServicoAtivo) itensFaltando.push(ITENS_PRONTIDAO.servico);
  if (!temHorarioParaBarbeiroAtivo) itensFaltando.push(ITENS_PRONTIDAO.horario);

  return {
    temBarbeiroAtivo,
    temServicoAtivo,
    temHorarioParaBarbeiroAtivo,
    pronta: itensFaltando.length === 0,
    itensFaltando,
  };
}
