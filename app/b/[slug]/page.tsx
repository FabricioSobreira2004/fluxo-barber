import { notFound } from "next/navigation"; // mostra a página 404 padrão do Next.js quando o slug não existe
import { createClient } from "@/utils/supabase/server"; // cliente Supabase do lado servidor
import { Logo } from "@/components/ui/Logo"; // marca "Fluxo Barber" no topo
import { Card } from "@/components/ui/Card"; // bloco de superfície padrão
import { FormularioAgendamentoPublico } from "./FormularioAgendamentoPublico"; // formulário (Client Component) de agendamento

export default async function PaginaBarbeariaPublica(props: PageProps<"/b/[slug]">) { // página pública, sem exigir login
  const { slug } = await props.params; // params é uma Promise no Next.js 16, por isso o await
  const supabase = await createClient(); // conexão com o Supabase (funciona mesmo sem usuário logado)

  const { data: linhasBarbearia } = await supabase.rpc("buscar_barbearia_publica", { p_slug: slug }); // função pública (ver migration 002)
  const barbearia = linhasBarbearia?.[0]; // a função devolve uma tabela (lista), mesmo tendo no máximo 1 linha

  if (!barbearia) { // slug que não existe: mostra 404 em vez de uma página quebrada
    notFound();
  }

  const [{ data: barbeiros }, { data: servicos }] = await Promise.all([ // busca barbeiros e serviços em paralelo, pra carregar mais rápido
    supabase.rpc("listar_barbeiros_publicos", { p_barbearia_id: barbearia.id }),
    supabase.rpc("listar_servicos_publicos", { p_barbearia_id: barbearia.id }),
  ]);

  const agendamentoDisponivel = !!barbeiros?.length && !!servicos?.length; // só faz sentido oferecer agendamento se houver pelo menos 1 de cada

  return (
    <main className="flex min-h-screen flex-col items-center gap-8 px-6 py-12">
      <Logo />

      <div className="w-full max-w-md">
        <h1 className="mb-1 font-display text-2xl font-semibold text-texto">{barbearia.nome}</h1>
        {barbearia.endereco && <p className="mb-6 text-sm text-texto-secundario">{barbearia.endereco}</p>}

        <Card>
          {agendamentoDisponivel ? (
            <FormularioAgendamentoPublico barbeariaId={barbearia.id} barbeiros={barbeiros!} servicos={servicos!} />
          ) : (
            <p className="text-sm text-texto-secundario">
              Essa barbearia ainda não está com agendamento online disponível.
            </p>
          )}
        </Card>
      </div>
    </main>
  );
}
