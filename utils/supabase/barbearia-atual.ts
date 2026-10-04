import { redirect } from "next/navigation"; // usado se, por algum motivo, não houver usuário/barbearia válidos
import { createClient } from "@/utils/supabase/server"; // cliente Supabase do lado servidor

// usado por várias páginas do painel (barbeiros, serviços, horários, agenda) pra descobrir
// rapidamente a qual barbearia o usuário logado pertence, sem repetir essa consulta em cada uma
export async function obterBarbeariaAtual() {
  const supabase = await createClient(); // conexão com o Supabase usando os cookies desta visita
  const { data: { user } } = await supabase.auth.getUser(); // o layout do painel já garante login; isso só confirma pro TypeScript

  if (!user) { // defesa extra: sem usuário, não tem como continuar
    redirect("/login");
  }

  const { data: membro } = await supabase // descobre a qual barbearia esse usuário pertence
    .from("membros")
    .select("barbearia_id")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();

  if (!membro) { // defesa extra: o layout do painel já teria redirecionado antes
    redirect("/onboarding");
  }

  return { supabase, barbeariaId: membro.barbearia_id, userId: user.id }; // devolve tudo que as páginas do painel costumam precisar
}
