import { type Metadata } from "next"; // tipo da metadata desta página
import { obterBarbeariaAtual } from "@/utils/supabase/barbearia-atual"; // descobre a barbearia do usuário logado
import { obterOrigemSite } from "@/utils/origem-site"; // domínio atual do site, pra montar a URL pública completa
import { hojeISO, limitesDoDia } from "@/utils/data"; // utilitários de data/hora no fuso do Brasil
import { AgendaInterativa } from "./AgendaInterativa"; // navegação de dia/barbeiro + lista + formulário, tudo em memória no cliente (ver o motivo no próprio arquivo)
import { type AgendamentoComRelacionamentos } from "./tipos"; // formato da linha vinda do banco, com os relacionamentos
import { LinkBarbearia } from "@/components/painel/LinkBarbearia"; // card "Seu link", com copiar/WhatsApp/abrir
import { ChecklistPrimeirosPassos, type ItemChecklist } from "@/components/painel/ChecklistPrimeirosPassos"; // card de progresso dos primeiros passos
import { Tour } from "@/components/painel/Tour"; // tutorial guiado (só aparece automaticamente no 1º acesso)
import { barbeariaProntaParaAgendamentos } from "@/utils/supabase/prontidao"; // função única que decide se o link já funciona (barbeiro + serviço + horário)

export const metadata: Metadata = { title: "Agenda | Fluxo Barber" }; // título específico desta página do painel

export default async function PaginaAgenda(props: PageProps<"/painel/agenda">) {
  const { supabase, barbeariaId, user } = await obterBarbeariaAtual(); // garante login e descobre em qual barbearia buscar
  const parametros = await props.searchParams; // searchParams é uma Promise no Next.js 16, por isso o await

  const dataBruta = parametros.data; // dia sendo visualizado, vindo da URL (?data=AAAA-MM-DD)
  const dataSelecionada = typeof dataBruta === "string" ? dataBruta : hojeISO(); // sem data na URL: mostra o dia de hoje

  const barbeiroBruto = parametros.barbeiro; // filtro de barbeiro, vindo da URL (?barbeiro=id)
  const barbeiroFiltroId = typeof barbeiroBruto === "string" && barbeiroBruto !== "todos" ? barbeiroBruto : undefined;

  const { data: barbeiros } = await supabase // barbeiros ativos, pro filtro e pro formulário de novo agendamento
    .from("barbeiros")
    .select("id, nome")
    .eq("barbearia_id", barbeariaId)
    .eq("ativo", true)
    .order("nome");

  const { data: servicos } = await supabase // serviços ativos, pro formulário de novo agendamento
    .from("servicos")
    .select("id, nome")
    .eq("barbearia_id", barbeariaId)
    .eq("ativo", true)
    .order("nome");

  const { data: clientes } = await supabase // clientes já cadastrados, só pra sugerir no campo de telefone
    .from("clientes")
    .select("nome, telefone")
    .eq("barbearia_id", barbeariaId)
    .order("nome");

  const { inicio, fim } = limitesDoDia(dataSelecionada); // intervalo [00:00, 24:00) do dia selecionado, em horário de Brasília

  let consultaAgendamentos = supabase // monta a consulta aos poucos, porque o filtro de barbeiro é opcional
    .from("agendamentos")
    .select(
      "id, inicio, fim, preco_centavos, status, observacao, barbeiro:barbeiros(nome), cliente:clientes(nome, telefone), servico:servicos(nome)"
    )
    .eq("barbearia_id", barbeariaId)
    .gte("inicio", inicio)
    .lt("inicio", fim)
    .order("inicio"); // ordem cronológica, do primeiro ao último atendimento do dia

  if (barbeiroFiltroId) { // só filtra por barbeiro se um estiver selecionado (senão mostra todos)
    consultaAgendamentos = consultaAgendamentos.eq("barbeiro_id", barbeiroFiltroId);
  }

  // tudo que é só pro card "Seu link", pro checklist e pro tour guiado — buscado em paralelo com o
  // que a agenda já buscava, pra não somar um monte de "ida e volta" ao banco em sequência
  const [{ data: barbearia }, origemSite, status, { count: totalAgendamentosHistorico }] = await Promise.all([
    supabase.from("barbearias").select("nome, slug").eq("id", barbeariaId).single(),
    obterOrigemSite(),
    barbeariaProntaParaAgendamentos(supabase, barbeariaId), // os 3 requisitos do link (barbeiro/serviço/horário ativos), numa função só
    supabase.from("agendamentos").select("id", { count: "exact", head: true }).eq("barbearia_id", barbeariaId), // em QUALQUER dia, não só no dia selecionado na tela
  ]);

  const { data: agendamentosBrutos } = await consultaAgendamentos;
  // com os tipos gerados do banco (Database em utils/supabase/database.types.ts), o Supabase já sabe, pelas
  // chaves estrangeiras, que cada relacionamento aqui é um objeto único — não precisa mais de "as unknown as"
  const agendamentos: AgendamentoComRelacionamentos[] = agendamentosBrutos ?? [];

  const linkJaCompartilhado = Boolean(user.user_metadata?.link_compartilhado); // true depois que o usuário clicou em Copiar ou WhatsApp pelo menos uma vez
  // grupo 1: os 3 requisitos pro link funcionar — "feito" vem DIRETO do "status" (a mesma função
  // central usada no card "Seu link"), nunca recalculado separado, pra nunca desalinhar os dois
  const itensObrigatorios: ItemChecklist[] = [
    { chave: "barbeiro", rotulo: "Cadastrar pelo menos 1 barbeiro", feito: status.temBarbeiroAtivo, href: "/painel/barbeiros" },
    { chave: "servico", rotulo: "Cadastrar pelo menos 1 serviço", feito: status.temServicoAtivo, href: "/painel/servicos" },
    { chave: "horario", rotulo: "Definir os horários de trabalho", feito: status.temHorarioParaBarbeiroAtivo, href: "/painel/horarios" },
  ];
  // grupo 2: passos seguintes, que NÃO bloqueiam o link — só ajudam a tirar o maior proveito dele
  const itensProximos: ItemChecklist[] = [
    { chave: "link", rotulo: "Copiar ou compartilhar seu link", feito: linkJaCompartilhado, href: "#link-barbearia" },
    { chave: "agendamento", rotulo: "Receber o primeiro agendamento", feito: (totalAgendamentosHistorico ?? 0) > 0 }, // sem "href": não é algo que se resolve com um clique
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* o tour só aparece de verdade quando "tour_visto" ainda não está marcado no usuário —
          essa é a ÚNICA tela do painel que o monta, porque é a 1ª que aparece depois do onboarding */}
      <Tour exibirAutomaticamente={!user.user_metadata?.tour_visto} nomeBarbearia={barbearia?.nome ?? ""} statusLink={status} />

      <h1 className="font-display text-2xl font-semibold text-texto">Agenda</h1>

      {barbearia && ( // defesa simples: sem barbearia (não deveria acontecer aqui), não tem link pra montar
        <div id="link-barbearia">
          <LinkBarbearia slug={barbearia.slug} nomeBarbearia={barbearia.nome} origemSite={origemSite} status={status} />
        </div>
      )}

      <ChecklistPrimeirosPassos
        itensObrigatorios={itensObrigatorios}
        itensProximos={itensProximos}
        escondidoInicialmente={Boolean(user.user_metadata?.checklist_escondido)}
      />

      {/* navegação de dia/barbeiro + lista + formulário: tudo isolado num Client Component (AgendaInterativa),
          que troca de dia em memória (useTransition + cache + prefetch) em vez de recarregar a página inteira —
          ver o comentário completo no topo de AgendaInterativa.tsx */}
      <AgendaInterativa
        barbeiros={barbeiros ?? []}
        servicos={servicos ?? []}
        clientes={clientes ?? []}
        dataInicial={dataSelecionada}
        barbeiroInicialId={barbeiroFiltroId}
        agendamentosIniciais={agendamentos}
      />
    </div>
  );
}
