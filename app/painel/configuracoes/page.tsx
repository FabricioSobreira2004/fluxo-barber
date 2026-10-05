import { redirect } from "next/navigation"; // usado nas defesas extras abaixo
import { type Metadata } from "next"; // tipo da metadata desta página
import { createClient } from "@/utils/supabase/server"; // cliente Supabase do lado servidor
import { obterOrigemSite } from "@/utils/origem-site"; // domínio atual do site, pra montar a URL pública completa
import { LinkBarbearia } from "@/components/painel/LinkBarbearia"; // card "Seu link", com copiar/WhatsApp/abrir
import { reiniciarTour } from "@/components/painel/acoes-progresso"; // Server Action do botão "Ver tutorial novamente"
import { FormularioConfiguracoes } from "./FormularioConfiguracoes"; // formulário (Client Component) desta página

export const metadata: Metadata = { title: "Configurações | Fluxo Barber" }; // título específico desta página do painel

export default async function PaginaConfiguracoes() {
  const supabase = await createClient(); // conexão com o Supabase usando os cookies desta visita
  const { data: { user } } = await supabase.auth.getUser(); // o layout do painel já garante login; isso só confirma pro TypeScript

  if (!user) { // defesa extra: sem usuário, não tem como buscar a barbearia
    redirect("/login");
  }

  const { data: membro } = await supabase // descobre a qual barbearia esse usuário pertence
    .from("membros")
    .select("barbearia_id")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();

  if (!membro) { // defesa extra: o layout já teria redirecionado antes, mas evita quebrar a página se chegar aqui
    redirect("/onboarding");
  }

  const { data: barbearia } = await supabase // busca os dados que o formulário vai exibir/editar
    .from("barbearias")
    .select("id, nome, slug, telefone, endereco")
    .eq("id", membro.barbearia_id)
    .single();

  if (!barbearia) { // caso extremo (linha removida entre as duas consultas acima)
    redirect("/onboarding");
  }

  const origemSite = await obterOrigemSite(); // domínio atual (localhost ou o site publicado), pra montar a URL completa do link público

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-display text-2xl font-semibold text-texto">Configurações</h1>

      <LinkBarbearia slug={barbearia.slug} nomeBarbearia={barbearia.nome} origemSite={origemSite} />

      <FormularioConfiguracoes barbearia={barbearia} />

      {/* sem useActionState aqui: essa Server Action só redireciona, não tem erro nenhum pra mostrar na tela */}
      <form action={reiniciarTour}>
        <button type="submit" className="text-sm text-dourado hover:text-dourado-claro">
          Ver tutorial novamente
        </button>
      </form>
    </div>
  );
}
