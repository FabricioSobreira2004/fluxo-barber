import { cache } from "react"; // evita repetir a mesma consulta ao banco entre generateMetadata() e a página, nesta mesma requisição
import { notFound } from "next/navigation"; // mostra a página 404 padrão do Next.js quando o slug não existe
import { type Metadata } from "next"; // tipo da metadata desta página
import { createClient } from "@/utils/supabase/server"; // cliente Supabase do lado servidor
import { Logo } from "@/components/ui/Logo"; // marca "Fluxo Barber" no topo
import { Card } from "@/components/ui/Card"; // bloco de superfície padrão
import { Footer } from "@/components/Footer"; // rodapé com copyright, links legais e assinatura
import { FormularioAgendamentoPublico } from "./FormularioAgendamentoPublico"; // formulário (Client Component) de agendamento

const buscarBarbeariaPorSlug = cache(async (slug: string) => { // "cache()" faz o Next.js reaproveitar o resultado se chamado 2x com o mesmo slug na mesma requisição
  const supabase = await createClient(); // conexão com o Supabase (funciona mesmo sem usuário logado)
  const { data: linhasBarbearia } = await supabase.rpc("buscar_barbearia_publica", { p_slug: slug }); // função pública (ver migration 002)
  return linhasBarbearia?.[0]; // a função devolve uma tabela (lista), mesmo tendo no máximo 1 linha
});

export async function generateMetadata(props: PageProps<"/b/[slug]">): Promise<Metadata> { // título/descrição variam por barbearia, por isso são gerados em vez de fixos
  const { slug } = await props.params; // params é uma Promise no Next.js 16, por isso o await
  const barbearia = await buscarBarbeariaPorSlug(slug);

  if (!barbearia) { // slug que não existe: título genérico (a página em si mostra 404)
    return { title: "Barbearia não encontrada | Fluxo Barber" };
  }

  const descricao = `Agende seu horário na ${barbearia.nome} pela internet, em poucos cliques.`;
  return {
    title: `${barbearia.nome} | Fluxo Barber`, // aparece na aba do navegador e no link compartilhado
    description: descricao,
    openGraph: { title: barbearia.nome, description: descricao }, // título/descrição ao compartilhar esse link específico (a imagem continua a padrão do site)
  };
}

export default async function PaginaBarbeariaPublica(props: PageProps<"/b/[slug]">) { // página pública, sem exigir login
  const { slug } = await props.params; // params é uma Promise no Next.js 16, por isso o await
  const barbearia = await buscarBarbeariaPorSlug(slug); // reaproveita o resultado já buscado em generateMetadata(), sem repetir a consulta

  if (!barbearia) { // slug que não existe: mostra 404 em vez de uma página quebrada
    notFound();
  }

  const supabase = await createClient(); // conexão com o Supabase (funciona mesmo sem usuário logado)
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

      <Footer /> {/* "mt-auto" não é necessário aqui: o <main> não usa justify-center, então o rodapé já fica depois do conteúdo */}
    </main>
  );
}
