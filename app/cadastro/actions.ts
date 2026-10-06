"use server"; // este arquivo roda só no servidor, nunca é enviado pro navegador

import { redirect } from "next/navigation"; // usado pra mandar o usuário logado direto pro onboarding
import { createClient } from "@/utils/supabase/server"; // cliente Supabase do lado servidor
import { mensagemErroAmigavel } from "@/utils/supabase/erros"; // tradutor de mensagens de erro técnicas
import { obterOrigemAtual } from "@/app/auth/actions"; // descobre a URL do site; compartilhada com o reenvio (usado também em /login)

export interface EstadoCadastro { // formato do "estado" que o useActionState guarda e mostra na tela
  erro?: string; // mensagem de erro, se a última tentativa falhou
  sucesso?: string; // mensagem de sucesso (ex: "confira seu email"), quando a conta foi criada mas falta confirmar
  email?: string; // guardado só quando "sucesso" é preenchido: o botão "Reenviar" (em app/auth/actions.ts) precisa saber pra qual email mandar de novo
}

export async function cadastrar(_estadoAnterior: EstadoCadastro, formData: FormData): Promise<EstadoCadastro> { // Server Action do formulário de cadastro
  const email = String(formData.get("email") ?? "").trim(); // email digitado, sem espaços nas pontas
  const senha = String(formData.get("senha") ?? ""); // senha digitada
  const confirmarSenha = String(formData.get("confirmarSenha") ?? ""); // repetição da senha, pra conferir digitação
  const aceiteTermos = formData.get("aceiteTermos") === "on"; // navegador manda "on" quando a checkbox está marcada; nada, quando não está

  if (!email || !senha) { // validações simples antes de gastar uma chamada de rede
    return { erro: "Preencha email e senha." };
  }
  if (!aceiteTermos) { // o "required" do navegador já impede isso quase sempre; checamos de novo aqui por segurança (chamada direta à action, sem passar pelo HTML)
    return { erro: "Você precisa aceitar os Termos de Uso e a Política de Privacidade." };
  }
  if (senha.length < 6) { // o Supabase já exige isso, mas validar antes evita uma chamada de rede desnecessária
    return { erro: "A senha precisa ter pelo menos 6 caracteres." };
  }
  if (senha !== confirmarSenha) { // erro de digitação é o motivo mais comum de falha no cadastro
    return { erro: "As senhas não coincidem." };
  }

  const origem = await obterOrigemAtual(); // URL base usada no link que vai pro email de confirmação

  const supabase = await createClient(); // conexão com o Supabase usando os cookies desta visita
  const { data, error } = await supabase.auth.signUp({ // cria a conta no Supabase Auth
    email,
    password: senha,
    options: {
      emailRedirectTo: `${origem}/auth/confirm?next=/onboarding`, // link que vai dentro do email de confirmação
    },
  });

  if (error) { // cadastro falhou (email inválido, já em uso em alguns casos, etc.)
    return { erro: mensagemErroAmigavel(error) };
  }

  if (data.user && data.user.identities && data.user.identities.length === 0) {
    // o Supabase não retorna erro quando o email já existe (pra não revelar isso a estranhos),
    // mas devolve um usuário "fantasma" sem identidades — é assim que detectamos esse caso aqui
    return { erro: "Já existe uma conta com esse email. Tente entrar." };
  }

  if (data.session) { // confirmação de email está desligada no projeto: a conta já nasce logada
    redirect("/onboarding");
  }

  return { // confirmação de email está ligada (padrão do Supabase): falta o usuário clicar no link
    email, // guardado pro botão "Reenviar" (não pedimos o email de novo pro usuário digitar)
    sucesso: "Conta criada! Enviamos um link de confirmação para o seu email. Clique nele e, depois, volte aqui para entrar.",
  };
}
