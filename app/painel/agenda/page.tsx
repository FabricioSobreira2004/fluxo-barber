import Link from "next/link"; // navegação entre dias e barbeiros, via querystring
import { ChevronLeft, ChevronRight } from "lucide-react"; // setas de navegação entre dias
import { obterBarbeariaAtual } from "@/utils/supabase/barbearia-atual"; // descobre a barbearia do usuário logado
import { Card } from "@/components/ui/Card"; // bloco de superfície padrão
import { hojeISO, somarDias, limitesDoDia, formatarDataLonga } from "@/utils/data"; // utilitários de data/hora no fuso do Brasil
import { FormularioNovoAgendamento } from "./FormularioNovoAgendamento"; // formulário (Client Component) de criação
import { CardAgendamento } from "./CardAgendamento"; // card visual de cada agendamento da lista
import { type AgendamentoComRelacionamentos } from "./tipos"; // formato da linha vinda do banco, com os relacionamentos

export default async function PaginaAgenda(props: PageProps<"/painel/agenda">) {
  const { supabase, barbeariaId } = await obterBarbeariaAtual(); // garante login e descobre em qual barbearia buscar
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

  const { data: agendamentosBrutos } = await consultaAgendamentos;
  // reafirma pro TypeScript o formato real (objeto único em cada relacionamento, não lista) — ver comentário na interface acima
  const agendamentos = (agendamentosBrutos ?? []) as unknown as AgendamentoComRelacionamentos[];

  const diaAnterior = somarDias(dataSelecionada, -1); // pra onde a seta "<" deve levar
  const diaSeguinte = somarDias(dataSelecionada, 1); // pra onde a seta ">" deve levar
  const sufixoBarbeiro = barbeiroFiltroId ? `&barbeiro=${barbeiroFiltroId}` : ""; // preserva o filtro ao trocar de dia

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-display text-2xl font-semibold text-texto">Agenda</h1>

      <div className="flex flex-wrap items-center justify-between gap-3"> {/* navegação de dia + filtro de barbeiro */}
        <div className="flex items-center gap-2">
          <Link
            href={`/painel/agenda?data=${diaAnterior}${sufixoBarbeiro}`}
            className="rounded-lg border border-borda p-2 text-texto-secundario transition-colors hover:text-texto"
            aria-label="Dia anterior"
          >
            <ChevronLeft className="h-4 w-4" aria-hidden />
          </Link>
          {/* sem "capitalize" aqui: essa classe deixaria TODA palavra maiúscula; formatarDataLonga já devolve só a 1ª letra maiúscula */}
          <span className="text-sm text-texto">{formatarDataLonga(dataSelecionada)}</span>
          <Link
            href={`/painel/agenda?data=${diaSeguinte}${sufixoBarbeiro}`}
            className="rounded-lg border border-borda p-2 text-texto-secundario transition-colors hover:text-texto"
            aria-label="Próximo dia"
          >
            <ChevronRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>

        <div className="flex flex-wrap gap-2"> {/* "chips" de filtro: Todos + um por barbeiro ativo */}
          <Link
            href={`/painel/agenda?data=${dataSelecionada}`}
            className={ // destaque dourado quando nenhum barbeiro específico está selecionado
              `rounded-full border px-3 py-1 text-sm transition-colors ${
                !barbeiroFiltroId ? "border-dourado bg-dourado/10 text-dourado" : "border-borda text-texto-secundario hover:text-texto"
              }`
            }
          >
            Todos
          </Link>
          {(barbeiros ?? []).map((barbeiro) => (
            <Link
              key={barbeiro.id}
              href={`/painel/agenda?data=${dataSelecionada}&barbeiro=${barbeiro.id}`}
              className={ // destaque dourado no barbeiro selecionado
                `rounded-full border px-3 py-1 text-sm transition-colors ${
                  barbeiroFiltroId === barbeiro.id
                    ? "border-dourado bg-dourado/10 text-dourado"
                    : "border-borda text-texto-secundario hover:text-texto"
                }`
              }
            >
              {barbeiro.nome}
            </Link>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-3"> {/* lista dos agendamentos do dia, em ordem cronológica */}
        {agendamentos.map((agendamento) => (
          <CardAgendamento key={agendamento.id} agendamento={agendamento} />
        ))}

        {agendamentos.length === 0 && ( // mensagem amigável quando não há nada marcado nesse dia
          <p className="text-sm text-texto-secundario">Nenhum agendamento nesse dia.</p>
        )}
      </div>

      <Card>
        <h2 className="mb-4 font-display text-lg font-semibold text-texto">Novo agendamento</h2>
        <FormularioNovoAgendamento
          barbeiros={barbeiros ?? []}
          servicos={servicos ?? []}
          clientes={clientes ?? []}
          dataSelecionada={dataSelecionada}
          barbeiroPreSelecionado={barbeiroFiltroId}
        />
      </Card>
    </div>
  );
}
