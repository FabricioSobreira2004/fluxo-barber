import { type EmailOtpType } from "@supabase/supabase-js"; // tipo do "type" que vem no link de confirmação (signup, recovery...)
import { type NextRequest } from "next/server"; // tipo da requisição recebida
import { redirect } from "next/navigation"; // usado pra mandar o usuário pra outra página depois de confirmar
import { createClient } from "@/utils/supabase/server"; // cliente Supabase do lado servidor

// Esta rota precisa entender DOIS formatos de link, porque hoje (plano gratuito, sem SMTP próprio)
// não dá pra customizar os templates de email do Supabase — eles saem com o template padrão:
//
// 1) "token_hash" + "type": formato que o template PERSONALIZADO (supabase/templates/*.html) monta na mão.
//    Só passa a ser usado de verdade quando ligarmos um SMTP próprio e colarmos esses templates no painel
//    (ver PENDENCIAS.md). Confirma chamando supabase.auth.verifyOtp().
//
// 2) "code": formato que sai do template PADRÃO do Supabase (o que está ativo hoje). O botão do email
//    aponta pro servidor deles (".../auth/v1/verify?token=...&type=...&redirect_to=..."), que confirma o
//    token sozinho e só DEPOIS redireciona o navegador pra cá, já com "?code=..." na URL (fluxo PKCE).
//    Essa troca final de "code" por sessão é feita aqui, chamando supabase.auth.exchangeCodeForSession().
export async function GET(request: NextRequest) { // chamado quando o usuário clica no link do email de confirmação
  const { searchParams } = new URL(request.url); // lê os parâmetros que o Supabase (ou nosso template) colocou no link
  const tokenHash = searchParams.get("token_hash"); // presente no formato "manual" (template personalizado)
  const tipo = searchParams.get("type") as EmailOtpType | null; // tipo de verificação (ex: "signup", "recovery")
  const code = searchParams.get("code"); // presente no formato "padrão" do Supabase (template não customizado)
  const proximaRota = searchParams.get("next") ?? "/onboarding"; // pra onde mandar o usuário depois de confirmar

  const supabase = await createClient(); // conexão com o Supabase usando os cookies desta visita

  if (tokenHash && tipo) { // formato 1: confirma passando o token_hash direto
    const { error } = await supabase.auth.verifyOtp({ type: tipo, token_hash: tokenHash });
    if (!error) {
      redirect(proximaRota); // confirmado com sucesso: segue pro destino (onboarding, redefinir senha, etc.) já logado
    }
  } else if (code) { // formato 2: troca o "code" que o Supabase já verificou do lado dele por uma sessão aqui
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      redirect(proximaRota); // mesma coisa: sessão criada, segue pro destino certo
    }
  }

  // link ausente, incompleto, já usado ou expirado: manda pra tela de "link inválido", com o motivo certo
  // ("/redefinir-senha" como destino final só acontece no fluxo de recuperação de senha; qualquer outro
  // destino, hoje, só pode ser o de confirmação de cadastro)
  const motivo = proximaRota.startsWith("/redefinir-senha") ? "recovery" : "signup";
  redirect(`/auth/link-invalido?motivo=${motivo}`);
}
