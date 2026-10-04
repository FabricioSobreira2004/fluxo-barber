"use server"; // este arquivo roda só no servidor, nunca é enviado pro navegador

import { redirect } from "next/navigation"; // usado pra mandar o usuário pra outra página após o login
import { createClient } from "@/utils/supabase/server"; // cliente Supabase do lado servidor
import { mensagemErroAmigavel } from "@/utils/supabase/erros"; // tradutor de mensagens de erro técnicas

export interface EstadoLogin { // formato do "estado" que o useActionState guarda e mostra na tela
  erro?: string; // mensagem de erro, se a última tentativa falhou
}

export async function entrar(_estadoAnterior: EstadoLogin, formData: FormData): Promise<EstadoLogin> { // Server Action chamada pelo formulário de login
  const email = String(formData.get("email") ?? "").trim(); // email digitado, sem espaços nas pontas
  const senha = String(formData.get("senha") ?? ""); // senha digitada
  const redirecionarPara = String(formData.get("redirecionar") ?? "") || "/onboarding"; // pra onde ir depois de logar (padrão: onboarding)

  if (!email || !senha) { // validação simples antes de gastar uma chamada de rede
    return { erro: "Preencha email e senha." };
  }

  const supabase = await createClient(); // conexão com o Supabase usando os cookies desta visita
  const { error } = await supabase.auth.signInWithPassword({ email, password: senha }); // tenta autenticar com email e senha

  if (error) { // login falhou (senha errada, email não confirmado, etc.)
    return { erro: mensagemErroAmigavel(error) }; // mostra uma mensagem amigável em vez do erro técnico em inglês
  }

  redirect(redirecionarPara); // sucesso: manda pro destino (onboarding decide se vai pro painel ou pede pra criar a barbearia)
}
