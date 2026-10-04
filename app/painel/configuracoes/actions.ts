"use server"; // este arquivo roda só no servidor, nunca é enviado pro navegador

import { revalidatePath } from "next/cache"; // avisa o Next.js que essas páginas precisam buscar dados de novo
import { createClient } from "@/utils/supabase/server"; // cliente Supabase do lado servidor

export interface EstadoConfiguracoes { // formato do "estado" que o useActionState guarda e mostra na tela
  erro?: string; // mensagem de erro, se a última tentativa falhou
  sucesso?: string; // mensagem de confirmação, quando salva com sucesso
}

export async function atualizarBarbearia(_estadoAnterior: EstadoConfiguracoes, formData: FormData): Promise<EstadoConfiguracoes> { // Server Action do formulário de configurações
  const id = String(formData.get("id") ?? ""); // id da barbearia sendo editada (viaja escondido no form)
  const nome = String(formData.get("nome") ?? "").trim(); // nome digitado
  const telefone = String(formData.get("telefone") ?? "").trim(); // telefone digitado (pode ficar vazio)
  const endereco = String(formData.get("endereco") ?? "").trim(); // endereço digitado (pode ficar vazio)

  if (!nome) { // validação simples antes de gastar uma chamada de rede
    return { erro: "O nome não pode ficar vazio." };
  }

  const supabase = await createClient(); // conexão com o Supabase usando os cookies desta visita; a policy de "update" garante que só um membro dessa barbearia consegue alterar
  const { error } = await supabase
    .from("barbearias")
    .update({ nome, telefone: telefone || null, endereco: endereco || null }) // campo vazio vira null, em vez de string vazia
    .eq("id", id);

  if (error) {
    return { erro: "Não foi possível salvar as alterações. Tente novamente." };
  }

  revalidatePath("/painel/configuracoes"); // garante que a próxima visita a essa página mostre os dados atualizados
  revalidatePath("/painel"); // o nome da barbearia aparece no cabeçalho de todo o painel

  return { sucesso: "Alterações salvas!" };
}
