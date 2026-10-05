import { type createClient } from "@/utils/supabase/server"; // só usado aqui pra pegar o tipo do cliente, não pra criar um novo

// os "metadados" que o painel guarda no próprio usuário do Supabase Auth (Authentication → Users),
// sem precisar de nenhuma tabela nova no banco: tour_visto (viu o tutorial guiado) e
// link_compartilhado (já copiou ou compartilhou o link da barbearia pelo menos uma vez)
export interface MetadadosPainel {
  tour_visto?: boolean;
  link_compartilhado?: boolean;
  checklist_escondido?: boolean;
}

// atualiza os metadados do usuário logado, SEM apagar os campos que já existiam — o updateUser()
// do Supabase, na dúvida, sempre deve ser chamado com o objeto "data" completo (existe pelo menos
// um relato de que ele SUBSTITUI em vez de mesclar, dependendo da versão); por segurança, lemos o
// usuário de novo aqui dentro e mesclamos na mão, em vez de confiar numa mesclagem automática
export async function atualizarMetadadosUsuario(
  supabase: Awaited<ReturnType<typeof createClient>>,
  novosCampos: MetadadosPainel
): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser(); // estado mais atual dos metadados, direto do Supabase
  if (!user) return; // sem usuário logado, não há o que atualizar (não deveria acontecer nas telas do painel)

  await supabase.auth.updateUser({
    data: { ...user.user_metadata, ...novosCampos }, // mescla na mão: mantém tudo que já existia, só troca os campos novos
  });
}
