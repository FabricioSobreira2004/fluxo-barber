"use server"; // este arquivo roda só no servidor, nunca é enviado pro navegador

import { revalidatePath } from "next/cache"; // avisa o Next.js que a lista de barbeiros precisa ser buscada de novo
import { obterBarbeariaAtual } from "@/utils/supabase/barbearia-atual"; // descobre a barbearia do usuário logado

export interface EstadoBarbeiros { // formato do "estado" que o useActionState guarda e mostra na tela
  erro?: string; // mensagem de erro, se a última tentativa falhou
}

export async function criarBarbeiro(_estadoAnterior: EstadoBarbeiros, formData: FormData): Promise<EstadoBarbeiros> { // Server Action do formulário "novo barbeiro"
  const nome = String(formData.get("nome") ?? "").trim(); // nome digitado

  if (!nome) { // validação simples antes de gastar uma chamada de rede
    return { erro: "Digite o nome do barbeiro." };
  }

  const { supabase, barbeariaId } = await obterBarbeariaAtual(); // garante login e descobre em qual barbearia cadastrar
  const { error } = await supabase.from("barbeiros").insert({ barbearia_id: barbeariaId, nome }); // cria o barbeiro já ativo (padrão da tabela)

  if (error) {
    return { erro: "Não foi possível cadastrar o barbeiro. Tente novamente." };
  }

  revalidatePath("/painel/barbeiros"); // faz a lista da página recarregar com o novo barbeiro
  return {};
}

export async function alternarAtivoBarbeiro(id: string, novoValor: boolean) { // chamado direto pelo botão "Ativar/Desativar"; o form não tem campos, então o FormData que o React envia junto é ignorado
  const { supabase } = await obterBarbeariaAtual(); // garante que quem chamou está logado (a policy do banco cuida do resto)

  await supabase
    .from("barbeiros")
    .update({ ativo: novoValor }) // nunca apagamos um barbeiro (ele pode ter histórico de agendamentos); só desativamos
    .eq("id", id);

  revalidatePath("/painel/barbeiros"); // atualiza a lista pra mostrar o novo status
}
