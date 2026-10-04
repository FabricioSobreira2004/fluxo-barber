import { redirect } from "next/navigation"; // usado pra tirar da área do painel quem não está logado ou não tem barbearia
import { createClient } from "@/utils/supabase/server"; // cliente Supabase do lado servidor
import { PainelShell } from "@/components/painel/PainelShell"; // menu lateral/inferior + cabeçalho
import { BotaoSair } from "@/components/BotaoSair"; // botão de logout (Server Component, por isso vem como prop)

export default async function PainelLayout({ children }: LayoutProps<"/painel">) { // envolve todas as páginas dentro de /painel
  const supabase = await createClient(); // conexão com o Supabase usando os cookies desta visita
  const { data: { user } } = await supabase.auth.getUser(); // o proxy já garante login; isso só confirma pro TypeScript

  if (!user) { // defesa extra: sem usuário, não tem como montar o painel
    redirect("/login");
  }

  const { data: membro } = await supabase // descobre a qual barbearia esse usuário pertence
    .from("membros")
    .select("barbearia_id")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();

  if (!membro) { // ainda não criou/entrou em nenhuma barbearia: manda pro onboarding
    redirect("/onboarding");
  }

  const { data: barbearia } = await supabase // busca o nome, só pra mostrar no topo do painel
    .from("barbearias")
    .select("nome")
    .eq("id", membro.barbearia_id)
    .single();

  return (
    <PainelShell nomeBarbearia={barbearia?.nome ?? ""} botaoSair={<BotaoSair />}>
      {children}
    </PainelShell>
  );
}
