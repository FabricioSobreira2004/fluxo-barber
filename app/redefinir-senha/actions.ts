"use server"; // este arquivo roda só no servidor, nunca é enviado pro navegador

import { createClient } from "@/utils/supabase/server"; // cliente Supabase do lado servidor

export interface EstadoRedefinirSenha { // formato do "estado" que o useActionState guarda e mostra na tela
  erro?: string; // mensagem de erro, se a última tentativa falhou
  sucesso?: boolean; // true quando a senha foi trocada com sucesso
}

export async function redefinirSenha(_estadoAnterior: EstadoRedefinirSenha, formData: FormData): Promise<EstadoRedefinirSenha> { // Server Action do formulário de nova senha
  const senha = String(formData.get("senha") ?? ""); // nova senha digitada
  const confirmarSenha = String(formData.get("confirmarSenha") ?? ""); // repetição da senha, pra conferir digitação

  if (!senha) { // validação simples antes de gastar uma chamada de rede
    return { erro: "Digite a nova senha." };
  }
  if (senha.length < 6) { // o Supabase já exige isso, mas validar antes evita uma chamada de rede desnecessária
    return { erro: "A senha precisa ter pelo menos 6 caracteres." };
  }
  if (senha !== confirmarSenha) { // erro de digitação é o motivo mais comum de falha aqui
    return { erro: "As senhas não coincidem." };
  }

  const supabase = await createClient(); // conexão com o Supabase usando os cookies desta visita
  // a sessão usada aqui é a sessão TEMPORÁRIA criada pela rota /auth/confirm, ao processar o link do
  // email de recuperação -- sem ela, o Supabase recusa a troca de senha (usuário "não autenticado")
  const { error } = await supabase.auth.updateUser({ password: senha });

  if (error) { // link expirado, ou a pessoa chegou nesta página sem passar pelo link do email
    return { erro: "Não foi possível redefinir a senha. Peça um novo link em \"Esqueci minha senha\" e tente de novo." };
  }

  return { sucesso: true }; // senha trocada: a tela mostra um link pra ir pro login
}
