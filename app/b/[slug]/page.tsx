import { cache } from "react"; // evita repetir a mesma consulta ao banco entre generateMetadata() e a página, nesta mesma requisição
import { notFound } from "next/navigation"; // mostra a página 404 padrão do Next.js quando o slug não existe
import { type Metadata } from "next"; // tipo da metadata desta página
import { MessageCircle } from "lucide-react"; // ícone do botão "Falar com a barbearia"
import { createClient } from "@/utils/supabase/server"; // cliente Supabase do lado servidor
import { Logo } from "@/components/ui/Logo"; // marca "Fluxo Barber" no topo
import { Card } from "@/components/ui/Card"; // bloco de superfície padrão
import { Footer } from "@/components/Footer"; // rodapé com copyright, links legais e assinatura
import { classesBotao } from "@/components/ui/Button"; // estilo de botão aplicado ao link do WhatsApp
import { linkWhatsapp } from "@/utils/telefone"; // monta o link "wa.me" a partir do telefone já normalizado no banco
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
  // busca tudo em paralelo, pra carregar mais rápido: a lista de barbeiros/serviços (pro
  // formulário) e se a barbearia já está pronta (função pública, nova — migration 005; devolve só
  // um booleano, sem expor nenhum dado a mais pra decidir isso)
  const [{ data: barbeiros }, { data: servicos }, { data: pronta }] = await Promise.all([
    supabase.rpc("listar_barbeiros_publicos", { p_barbearia_id: barbearia.id }),
    supabase.rpc("listar_servicos_publicos", { p_barbearia_id: barbearia.id }),
    supabase.rpc("barbearia_esta_pronta", { p_slug: slug }),
  ]);

  const agendamentoDisponivel = !!pronta && !!barbeiros?.length && !!servicos?.length; // "pronta" já cobre os 3 requisitos, mas sem barbeiro/serviço devolvidos também não tem formulário pra montar

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
            // mensagem acolhedora, no mesmo visual do resto do site — em vez de soar como um erro,
            // soa como "ainda estamos chegando", que é a verdade (o dono só não terminou de configurar)
            <div className="flex flex-col items-center gap-4 text-center">
              <p className="text-sm text-texto-secundario">
                {barbearia.nome} está finalizando a agenda online. Volte em breve!
              </p>
              {barbearia.telefone && ( // só aparece se a barbearia tiver telefone cadastrado — sem telefone, fica só a mensagem acima
                <a
                  href={linkWhatsapp(barbearia.telefone)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`${classesBotao("secundario")} gap-2`}
                >
                  <MessageCircle className="h-4 w-4" aria-hidden /> Falar com a barbearia
                </a>
              )}
            </div>
          )}
        </Card>
      </div>

      <Footer /> {/* "mt-auto" não é necessário aqui: o <main> não usa justify-center, então o rodapé já fica depois do conteúdo */}
    </main>
  );
}
