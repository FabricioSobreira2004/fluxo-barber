"use server"; // este arquivo roda só no servidor, nunca é enviado pro navegador

import { redirect } from "next/navigation"; // usado pra mandar o usuário logado direto pro onboarding
import { headers } from "next/headers"; // usado pra descobrir o endereço do site (pro link de confirmação de email)
import { createClient } from "@/utils/supabase/server"; // cliente Supabase do lado servidor
import { mensagemErroAmigavel } from "@/utils/supabase/erros"; // tradutor de mensagens de erro técnicas

export interface EstadoCadastro { // formato do "estado" que o useActionState guarda e mostra na tela
  erro?: string; // mensagem de erro, se a última tentativa falhou
  sucesso?: string; // mensagem de sucesso (ex: "confira seu email"), quando a conta foi criada mas falta confirmar
  email?: string; // guardado só quando "sucesso" é preenchido: o botão "Reenviar" (abaixo) precisa saber pra qual email mandar de novo
}

export interface EstadoReenvio { // formato do estado do botão "Reenviar email de confirmação"
  erro?: string;
  sucesso?: string;
}

// descobre a URL base do site a partir do cabeçalho da requisição atual: funciona em qualquer ambiente
// (localhost, preview da Vercel, produção) sem precisar de uma variável de ambiente fixa pra isso;
// extraída pra reaproveitar entre "cadastrar" e "reenviarConfirmacao" (os 2 fluxos que mandam email de confirmação)
async function obterOrigemAtual(): Promise<string> {
  const cabecalhos = await headers(); // cabeçalhos HTTP da requisição atual, pra montar a URL do próprio site
  const host = cabecalhos.get("host") ?? "localhost:3000"; // endereço:porta que o navegador usou pra acessar o site
  const protocolo = host.startsWith("localhost") || host.startsWith("127.0.0.1") ? "http" : "https"; // localhost não tem https
  return cabecalhos.get("origin") ?? `${protocolo}://${host}`;
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

export async function reenviarConfirmacao(_estadoAnterior: EstadoReenvio, formData: FormData): Promise<EstadoReenvio> { // Server Action do botão "Reenviar email de confirmação"
  const email = String(formData.get("email") ?? "").trim(); // vem de um campo oculto, preenchido com o email guardado no estado do cadastro

  if (!email) { // só acontece se o campo oculto se perder por algum motivo (ex: JavaScript desabilitado numa troca de estado estranha)
    return { erro: "Não encontramos seu email nesta tela. Recarregue a página e cadastre-se de novo." };
  }

  const origem = await obterOrigemAtual(); // mesma URL base usada no cadastro original, pro link do novo email apontar pro lugar certo

  const supabase = await createClient(); // conexão com o Supabase usando os cookies desta visita
  const { error } = await supabase.auth.resend({ // pede pro Supabase mandar de novo o email de confirmação de cadastro
    type: "signup",
    email,
    options: { emailRedirectTo: `${origem}/auth/confirm?next=/onboarding` },
  });

  if (error) { // ex: "over_email_send_rate_limit" se o usuário clicar em "Reenviar" demais vezes seguidas
    return { erro: mensagemErroAmigavel(error) };
  }

  return { sucesso: "Email reenviado! Confira sua caixa de entrada (e também a pasta de spam)." };
}
