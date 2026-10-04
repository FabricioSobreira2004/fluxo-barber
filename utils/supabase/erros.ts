import { type AuthError } from "@supabase/supabase-js"; // tipo do erro devolvido pelo Supabase Auth (tem .code e .message)

// traduz os erros mais comuns do Supabase Auth pra mensagens amigáveis em português;
// usamos o "code" (estável) em vez do "message" (texto em inglês que pode mudar)
const MENSAGENS_POR_CODIGO: Record<string, string> = {
  invalid_credentials: "Email ou senha incorretos.",
  email_not_confirmed: "Você precisa confirmar seu email antes de entrar. Veja sua caixa de entrada.",
  user_already_exists: "Já existe uma conta com esse email. Tente entrar.",
  weak_password: "A senha é fraca demais. Use pelo menos 6 caracteres.",
  email_address_invalid: "Esse email não é aceito pelo Supabase (alguns domínios de teste são bloqueados). Tente outro email.",
  over_email_send_rate_limit: "Muitos emails solicitados em pouco tempo. Aguarde alguns minutos e tente de novo.",
  signup_disabled: "O cadastro de novas contas está desativado no momento.",
};

export function mensagemErroAmigavel(erro: Pick<AuthError, "code" | "message">): string { // usada pelas actions de login/cadastro
  if (erro.code && MENSAGENS_POR_CODIGO[erro.code]) { // primeiro tenta pelo código, que não muda entre versões
    return MENSAGENS_POR_CODIGO[erro.code];
  }
  return "Não foi possível completar a ação. Tente novamente em instantes."; // nenhum código conhecido: mensagem genérica
}
