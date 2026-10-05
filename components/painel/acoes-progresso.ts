"use server"; // este arquivo roda só no servidor, nunca é enviado pro navegador

import { redirect } from "next/navigation"; // usada só em "reiniciarTour", pra levar de volta pra Agenda
import { createClient } from "@/utils/supabase/server"; // cliente Supabase do lado servidor
import { atualizarMetadadosUsuario } from "@/utils/supabase/metadados-usuario"; // grava campos no user_metadata sem apagar os demais

// chamada quando o tutorial termina (ou é pulado): nunca mais aparece sozinho, a não ser que o
// usuário peça "Ver tutorial novamente" em Configurações (ver "reiniciarTour" abaixo)
export async function marcarTourVisto(): Promise<void> {
  const supabase = await createClient();
  await atualizarMetadadosUsuario(supabase, { tour_visto: true });
}

// botão "Ver tutorial novamente", em Configurações: zera a flag e manda pra Agenda, que é onde o
// tutorial roda — a própria Agenda vai ver "tour_visto: false" e mostrar o tutorial de novo
export async function reiniciarTour(): Promise<void> {
  const supabase = await createClient();
  await atualizarMetadadosUsuario(supabase, { tour_visto: false });
  redirect("/painel/agenda");
}

// chamada quando o usuário clica em "Copiar link" ou "Compartilhar no WhatsApp" no card "Seu
// link" — marca o item do checklist "Copiar ou compartilhar seu link" como feito
export async function marcarLinkCompartilhado(): Promise<void> {
  const supabase = await createClient();
  await atualizarMetadadosUsuario(supabase, { link_compartilhado: true });
}

// botão "Esconder" do checklist de primeiros passos, depois que tudo já foi concluído
export async function esconderChecklist(): Promise<void> {
  const supabase = await createClient();
  await atualizarMetadadosUsuario(supabase, { checklist_escondido: true });
}
