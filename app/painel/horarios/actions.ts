"use server"; // este arquivo roda só no servidor, nunca é enviado pro navegador

import { revalidatePath } from "next/cache"; // avisa o Next.js que a grade de horários precisa ser buscada de novo
import { obterBarbeariaAtual } from "@/utils/supabase/barbearia-atual"; // descobre a barbearia do usuário logado

export interface EstadoHorarios { // formato do "estado" que o useActionState guarda e mostra na tela
  erro?: string; // mensagem de erro, se a última tentativa falhou
}

export async function adicionarIntervalo( // Server Action do mini-formulário de cada dia da semana
  barbeiroId: string, // pré-preenchido via .bind no componente que usa este action
  diaSemana: number, // idem: 0 (domingo) a 6 (sábado)
  _estadoAnterior: EstadoHorarios,
  formData: FormData
): Promise<EstadoHorarios> {
  const inicio = String(formData.get("inicio") ?? ""); // horário de início, ex: "08:00"
  const fim = String(formData.get("fim") ?? ""); // horário de fim, ex: "12:00"

  if (!inicio || !fim) { // validações simples antes de gastar uma chamada de rede
    return { erro: "Preencha o início e o fim do intervalo." };
  }
  if (inicio >= fim) { // comparação de texto funciona aqui porque o formato "HH:MM" sempre tem 2 dígitos em cada parte
    return { erro: "O início precisa ser antes do fim." };
  }

  const { supabase, barbeariaId } = await obterBarbeariaAtual(); // garante login e descobre em qual barbearia cadastrar
  const { error } = await supabase.from("horarios_trabalho").insert({
    barbearia_id: barbeariaId,
    barbeiro_id: barbeiroId,
    dia_semana: diaSemana,
    inicio,
    fim,
  });

  if (error) {
    return { erro: "Não foi possível salvar esse intervalo. Tente novamente." };
  }

  revalidatePath("/painel/horarios"); // faz a grade da página recarregar com o novo intervalo
  return {};
}

export async function removerIntervalo(id: string) { // chamado direto pelo botão "Remover" de cada intervalo
  const { supabase } = await obterBarbeariaAtual(); // garante que quem chamou está logado (a policy do banco cuida do resto)

  await supabase.from("horarios_trabalho").delete().eq("id", id); // intervalo de horário não tem histórico pra preservar, então apaga de verdade

  revalidatePath("/painel/horarios"); // atualiza a grade pra remover o intervalo da tela
}
