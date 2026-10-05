import { type Metadata } from "next"; // tipo da metadata desta página
import { obterBarbeariaAtual } from "@/utils/supabase/barbearia-atual"; // descobre a barbearia (e o usuário) recém-criados no onboarding
import { obterOrigemSite } from "@/utils/origem-site"; // domínio atual do site, pra montar a URL pública completa no passo final
import { sugerirNomeUsuario } from "@/utils/nome-usuario"; // sugestão de nome pro atalho "Eu mesmo atendo"
import { AssistenteConfiguracaoRapida } from "./AssistenteConfiguracaoRapida"; // o assistente em si (Client Component)

export const metadata: Metadata = { title: "Configuração rápida | Fluxo Barber" }; // título específico desta página

export default async function PaginaConfiguracaoRapida() {
  const { supabase, barbeariaId, user } = await obterBarbeariaAtual(); // garante login e descobre em qual barbearia configurar

  const { data: barbearia } = await supabase // nome e slug, pro passo final (link + mensagem "Pronto!")
    .from("barbearias")
    .select("nome, slug")
    .eq("id", barbeariaId)
    .single();

  const origemSite = await obterOrigemSite(); // domínio atual (localhost ou o site publicado), pra montar a URL completa do link público

  return (
    <AssistenteConfiguracaoRapida
      nomeBarbearia={barbearia?.nome ?? ""}
      slug={barbearia?.slug ?? ""}
      origemSite={origemSite}
      nomeSugerido={sugerirNomeUsuario(user.email)}
    />
  );
}
