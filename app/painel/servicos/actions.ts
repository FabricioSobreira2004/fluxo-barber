"use server"; // este arquivo roda só no servidor, nunca é enviado pro navegador

import { revalidatePath } from "next/cache"; // avisa o Next.js que a lista de serviços precisa ser buscada de novo
import { obterBarbeariaAtual } from "@/utils/supabase/barbearia-atual"; // descobre a barbearia do usuário logado
import { reaisParaCentavos } from "@/utils/dinheiro"; // converte o preço digitado (reais) pro formato do banco (centavos)

export interface EstadoServicos { // formato do "estado" que o useActionState guarda e mostra na tela
  erro?: string; // mensagem de erro, se a última tentativa falhou
}

export async function criarServico(_estadoAnterior: EstadoServicos, formData: FormData): Promise<EstadoServicos> { // Server Action do formulário "novo serviço"
  const nome = String(formData.get("nome") ?? "").trim(); // nome digitado
  const duracaoTexto = String(formData.get("duracao") ?? "").trim(); // duração digitada (em minutos, como texto)
  const precoTexto = String(formData.get("preco") ?? "").trim(); // preço digitado (em reais, como texto)

  if (!nome) { // validações simples antes de gastar uma chamada de rede
    return { erro: "Digite o nome do serviço." };
  }

  const duracaoMin = Number(duracaoTexto); // converte o texto da duração pra número
  if (!Number.isInteger(duracaoMin) || duracaoMin <= 0) { // precisa ser um número inteiro positivo (bate com o "check" do banco)
    return { erro: "A duração precisa ser um número de minutos maior que zero." };
  }

  const precoCentavos = reaisParaCentavos(precoTexto); // converte "25,90" em 2590; null se o texto não for um preço válido
  if (precoCentavos === null) {
    return { erro: "Digite um preço válido (ex: 25,90)." };
  }

  const { supabase, barbeariaId } = await obterBarbeariaAtual(); // garante login e descobre em qual barbearia cadastrar
  const { error } = await supabase.from("servicos").insert({ // cria o serviço já ativo (padrão da tabela)
    barbearia_id: barbeariaId,
    nome,
    duracao_min: duracaoMin,
    preco_centavos: precoCentavos,
  });

  if (error) {
    return { erro: "Não foi possível cadastrar o serviço. Tente novamente." };
  }

  revalidatePath("/painel/servicos"); // faz a lista da página recarregar com o novo serviço
  return {};
}

export async function alternarAtivoServico(id: string, novoValor: boolean) { // chamado direto pelo botão "Ativar/Desativar" de cada linha
  const { supabase } = await obterBarbeariaAtual(); // garante que quem chamou está logado (a policy do banco cuida do resto)

  await supabase
    .from("servicos")
    .update({ ativo: novoValor }) // nunca apagamos um serviço (ele pode estar referenciado em agendamentos antigos); só desativamos
    .eq("id", id);

  revalidatePath("/painel/servicos"); // atualiza a lista pra mostrar o novo status
}
