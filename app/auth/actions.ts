"use server"; // este arquivo roda só no servidor, nunca é enviado pro navegador

import { headers } from "next/headers"; // usado pra descobrir o endereço do site (pro link de confirmação de email)
import { createClient } from "@/utils/supabase/server"; // cliente Supabase do lado servidor
import { mensagemErroAmigavel } from "@/utils/supabase/erros"; // tradutor de mensagens de erro técnicas

// este arquivo existe separado de app/cadastro/actions.ts e app/login/actions.ts porque as 2 telas agora
// precisam reenviar o email de confirmação: o cadastro (se o email não chegar) e o login (se a pessoa
// tentar entrar antes de confirmar) -- em vez de duplicar a mesma Server Action nos 2 lugares, as 2 telas
// importam daqui.

export interface EstadoReenvio { // formato do estado do botão "Reenviar email de confirmação", usado em /cadastro e /login
  erro?: string;
  sucesso?: string;
}

// descobre a URL base do site a partir do cabeçalho da requisição atual: funciona em qualquer ambiente
// (localhost, preview da Vercel, produção) sem precisar de uma variável de ambiente fixa pra isso;
// usada por "cadastrar" (app/cadastro/actions.ts) e por "reenviarConfirmacao" (abaixo) -- os 2 fluxos que
// mandam email de confirmação de cadastro e por isso precisam montar o mesmo tipo de link
export async function obterOrigemAtual(): Promise<string> {
  const cabecalhos = await headers(); // cabeçalhos HTTP da requisição atual, pra montar a URL do próprio site
  const host = cabecalhos.get("host") ?? "localhost:3000"; // endereço:porta que o navegador usou pra acessar o site
  const protocolo = host.startsWith("localhost") || host.startsWith("127.0.0.1") ? "http" : "https"; // localhost não tem https
  return cabecalhos.get("origin") ?? `${protocolo}://${host}`;
}

export async function reenviarConfirmacao(_estadoAnterior: EstadoReenvio, formData: FormData): Promise<EstadoReenvio> { // Server Action do botão "Reenviar email de confirmação"
  const email = String(formData.get("email") ?? "").trim(); // vem de um campo oculto, preenchido com o email já conhecido pela tela (cadastro ou login)

  if (!email) { // só acontece se o campo oculto se perder por algum motivo (ex: JavaScript desabilitado numa troca de estado estranha)
    return { erro: "Não encontramos seu email nesta tela. Recarregue a página e tente de novo." };
  }

  const origem = await obterOrigemAtual(); // mesma URL base usada no cadastro original, pro link do novo email apontar pro lugar certo

  const supabase = await createClient(); // conexão com o Supabase usando os cookies desta visita
  const { error } = await supabase.auth.resend({ // pede pro Supabase mandar de novo o email de confirmação de cadastro
    type: "signup",
    email,
    options: { emailRedirectTo: `${origem}/auth/confirm?next=/onboarding` },
  });

  if (error) { // ex: "over_email_send_rate_limit" se a pessoa clicar em "Reenviar" demais vezes seguidas
    return { erro: mensagemErroAmigavel(error) };
  }

  return { sucesso: "Email reenviado! Confira sua caixa de entrada (e também a pasta de spam)." };
}
