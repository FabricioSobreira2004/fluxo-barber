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
    .update({ ativo: novoValor }) // alterna o status sem apagar nada (apagar de verdade é uma ação separada, ver apagarBarbeiro)
    .eq("id", id);

  revalidatePath("/painel/barbeiros"); // atualiza a lista pra mostrar o novo status
}

export async function apagarBarbeiro(id: string, _estadoAnterior: EstadoBarbeiros, _formData: FormData): Promise<EstadoBarbeiros> { // chamado pelo botão "Apagar" (depois da confirmação no navegador)
  void _estadoAnterior; // os 2 últimos parâmetros existem só porque o useActionState (no BotaoApagar) sempre chama a função assim; não usamos os valores
  void _formData;

  const { supabase } = await obterBarbeariaAtual(); // garante que quem chamou está logado (a policy do banco cuida do resto)

  const { error } = await supabase.from("barbeiros").delete().eq("id", id);

  if (error) {
    if (error.code === "23503") { // violação de chave estrangeira: a tabela agendamentos NÃO tem cascade pra barbeiros, de propósito (preserva histórico)
      return {
        erro: "Não é possível apagar porque existem agendamentos ligados a ele. Use Desativar para tirá-lo da agenda mantendo o histórico.",
      };
    }
    return { erro: "Não foi possível apagar o barbeiro. Tente novamente." };
  }

  revalidatePath("/painel/barbeiros"); // faz a lista da página recarregar sem o barbeiro apagado
  return {};
}
