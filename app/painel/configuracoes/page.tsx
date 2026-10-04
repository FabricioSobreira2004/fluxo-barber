import { redirect } from "next/navigation"; // usado nas defesas extras abaixo
import { createClient } from "@/utils/supabase/server"; // cliente Supabase do lado servidor
import { FormularioConfiguracoes } from "./FormularioConfiguracoes"; // formulário (Client Component) desta página

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

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-display text-2xl font-semibold text-texto">Configurações</h1>
      <FormularioConfiguracoes barbearia={barbearia} />
    </div>
  );
}
