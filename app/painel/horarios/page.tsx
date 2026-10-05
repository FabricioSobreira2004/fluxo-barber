import Link from "next/link"; // navegação entre barbeiros (via querystring), sem perder a página
import { type Metadata } from "next"; // tipo da metadata desta página
import { obterBarbeariaAtual } from "@/utils/supabase/barbearia-atual"; // descobre a barbearia do usuário logado
import { Card } from "@/components/ui/Card"; // bloco de superfície padrão
import { FormularioIntervalo } from "./FormularioIntervalo"; // mini-formulário de adicionar intervalo (um por dia)
import { removerIntervalo } from "./actions"; // Server Action usada no botão "Remover"

export const metadata: Metadata = { title: "Horários | Fluxo Barber" }; // título específico desta página do painel

const DIAS_SEMANA = [ // nomes dos dias na mesma ordem do "dia_semana" do banco (0 = domingo)
  "Domingo", "Segunda-feira", "Terça-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira", "Sábado",
];

export default async function PaginaHorarios(props: PageProps<"/painel/horarios">) {
  const { supabase, barbeariaId } = await obterBarbeariaAtual(); // garante login e descobre em qual barbearia buscar
  const parametros = await props.searchParams; // searchParams é uma Promise no Next.js 16, por isso o await

  const { data: barbeiros } = await supabase // só barbeiros ativos aparecem aqui (não faz sentido definir horário de alguém desativado)
    .from("barbeiros")
    .select("id, nome")
    .eq("barbearia_id", barbeariaId)
    .eq("ativo", true)
    .order("nome");

  if (!barbeiros || barbeiros.length === 0) { // sem nenhum barbeiro ativo, não tem o que mostrar aqui ainda
    return (
      <div className="flex flex-col gap-6">
        <h1 className="font-display text-2xl font-semibold text-texto">Horários de trabalho</h1>
        <p className="text-sm text-texto-secundario">Cadastre um barbeiro primeiro, na aba Barbeiros.</p>
      </div>
    );
  }

  const barbeiroIdBruto = parametros.barbeiro; // pode ser string, array de strings ou undefined
  const barbeiroSelecionadoId = // usa o barbeiro da URL se for válido; senão, cai no primeiro da lista
    typeof barbeiroIdBruto === "string" && barbeiros.some((b) => b.id === barbeiroIdBruto)
      ? barbeiroIdBruto
      : barbeiros[0].id;

  const { data: horarios } = await supabase // todos os intervalos já cadastrados desse barbeiro, em todos os dias
    .from("horarios_trabalho")
    .select("id, dia_semana, inicio, fim")
    .eq("barbeiro_id", barbeiroSelecionadoId)
    .order("dia_semana")
    .order("inicio");

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-display text-2xl font-semibold text-texto">Horários de trabalho</h1>

      <div className="flex flex-wrap gap-2"> {/* seletor de barbeiro: um "chip" clicável por barbeiro ativo */}
        {barbeiros.map((barbeiro) => (
          <Link
            key={barbeiro.id}
            href={`/painel/horarios?barbeiro=${barbeiro.id}`}
            className={ // destaque dourado no barbeiro selecionado, cinza nos demais
              `rounded-full border px-3 py-1 text-sm transition-colors ${
                barbeiro.id === barbeiroSelecionadoId
                  ? "border-dourado bg-dourado/10 text-dourado"
                  : "border-borda text-texto-secundario hover:text-texto"
              }`
            }
          >
            {barbeiro.nome}
          </Link>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2"> {/* 1 coluna no celular, 2 no desktop */}
        {DIAS_SEMANA.map((nomeDia, diaSemana) => {
          const intervalosDoDia = (horarios ?? []).filter((h) => h.dia_semana === diaSemana); // só os intervalos desse dia específico

          return (
            <Card key={diaSemana} className="flex flex-col gap-3">
              <h2 className="font-display text-base font-semibold text-texto">{nomeDia}</h2>

              {intervalosDoDia.length === 0 && ( // mensagem amigável quando o barbeiro não trabalha nesse dia
                <p className="text-sm text-texto-secundario">Nenhum intervalo cadastrado.</p>
              )}

              {intervalosDoDia.map((intervalo) => ( // cada intervalo já cadastrado, com botão de remover
                <div
                  key={intervalo.id}
                  className="flex items-center justify-between rounded-lg border border-borda px-3 py-2 text-sm"
                >
                  {/* horário é número: tabular-nums alinha os dígitos, font-bold reforça a leitura */}
                  <span className="font-bold tabular-nums text-texto">
                    {intervalo.inicio.slice(0, 5)} às {intervalo.fim.slice(0, 5)} {/* "08:00:00" -> "08:00" */}
                  </span>
                  <form action={removerIntervalo.bind(null, intervalo.id)}>
                    <button type="submit" className="text-xs text-erro hover:underline">
                      Remover
                    </button>
                  </form>
                </div>
              ))}

              <FormularioIntervalo barbeiroId={barbeiroSelecionadoId} diaSemana={diaSemana} /> {/* permite adicionar mais de um intervalo no mesmo dia */}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
