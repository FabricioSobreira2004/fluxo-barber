"use server"; // este arquivo roda só no servidor, nunca é enviado pro navegador

import { headers } from "next/headers"; // usado pra descobrir o endereço do site (pro link que vai no email)
import { createClient } from "@/utils/supabase/server"; // cliente Supabase do lado servidor

export interface EstadoEsqueciSenha { // formato do "estado" que o useActionState guarda e mostra na tela
  erro?: string; // mensagem de erro, se a última tentativa falhou
  sucesso?: string; // mensagem de sucesso, quando o email foi enviado (ou "faríamos de conta que foi", ver comentário abaixo)
}

export async function pedirRecuperacaoSenha(_estadoAnterior: EstadoEsqueciSenha, formData: FormData): Promise<EstadoEsqueciSenha> { // Server Action do formulário "esqueci minha senha"
  const email = String(formData.get("email") ?? "").trim(); // email digitado

  if (!email) { // validação simples antes de gastar uma chamada de rede
    return { erro: "Digite seu email." };
  }

  const cabecalhos = await headers(); // cabeçalhos HTTP da requisição atual, pra montar a URL do próprio site
  const host = cabecalhos.get("host") ?? "localhost:3000"; // endereço:porta que o navegador usou pra acessar o site
  const protocolo = host.startsWith("localhost") || host.startsWith("127.0.0.1") ? "http" : "https"; // localhost não tem https
  const origem = cabecalhos.get("origin") ?? `${protocolo}://${host}`; // URL base usada no link que vai dentro do email

  const supabase = await createClient(); // conexão com o Supabase usando os cookies desta visita
  await supabase.auth.resetPasswordForEmail(email, { // pede ao Supabase pra mandar o email de recuperação
    // reaproveita a mesma rota "/auth/confirm" usada na confirmação de cadastro: ela já sabe processar
    // o link do email e criar uma sessão temporária; "next" manda pra tela de definir a nova senha
    redirectTo: `${origem}/auth/confirm?next=/redefinir-senha`,
  });

  // sempre devolvemos a mesma mensagem de sucesso, mesmo que o email não exista cadastrado --
  // isso evita que alguém mal-intencionado descubra, por tentativa e erro, quais emails têm conta no sistema
  return {
    sucesso: "Se esse email tiver uma conta cadastrada, enviamos um link de recuperação. Confira sua caixa de entrada.",
  };
}
