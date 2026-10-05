import { redirect } from "next/navigation"; // usado pra pular o onboarding de quem já tem barbearia
import { type Metadata } from "next"; // tipo da metadata desta página
import { createClient } from "@/utils/supabase/server"; // cliente Supabase do lado servidor
import { AuthCard } from "@/components/AuthCard"; // layout compartilhado das telas de autenticação/onboarding
import { FormularioOnboarding } from "./FormularioOnboarding"; // formulário (Client Component) de criar barbearia

export const metadata: Metadata = { // título/descrição específicos desta página
  title: "Criar barbearia | Fluxo Barber",
  description: "Cadastre sua barbearia no Fluxo Barber e comece a usar a agenda online.",
};

export default async function PaginaOnboarding() {
  const supabase = await createClient(); // conexão com o Supabase usando os cookies desta visita
  const { data: { user } } = await supabase.auth.getUser(); // o proxy já garante login; isso só confirma pro TypeScript

  if (!user) { // defesa extra: se por algum motivo não houver usuário, manda pro login em vez de quebrar a página
    redirect("/login");
  }

  const { data: membro } = await supabase // verifica se esse usuário já é membro de alguma barbearia
    .from("membros")
    .select("barbearia_id")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle(); // devolve null (em vez de erro) quando não encontra nenhuma linha

  if (membro) { // já tem barbearia: não faz sentido passar pelo onboarding de novo
    redirect("/painel");
  }

  return (
    <AuthCard titulo="Crie sua barbearia">
      <FormularioOnboarding />
    </AuthCard>
  );
}
