import { type EmailOtpType } from "@supabase/supabase-js"; // tipo do "type" que vem no link de confirmação (signup, recovery...)
import { type NextRequest } from "next/server"; // tipo da requisição recebida
import { redirect } from "next/navigation"; // usado pra mandar o usuário pra outra página depois de confirmar
import { createClient } from "@/utils/supabase/server"; // cliente Supabase do lado servidor

export async function GET(request: NextRequest) { // chamado quando o usuário clica no link do email de confirmação
  const { searchParams } = new URL(request.url); // lê os parâmetros que o Supabase colocou no link
  const tokenHash = searchParams.get("token_hash"); // identifica essa tentativa de confirmação
  const tipo = searchParams.get("type") as EmailOtpType | null; // tipo de verificação (ex: "signup")
  const proximaRota = searchParams.get("next") ?? "/onboarding"; // pra onde mandar o usuário depois de confirmar

  if (tokenHash && tipo) { // só tenta confirmar se os dois parâmetros estiverem presentes
    const supabase = await createClient(); // conexão com o Supabase usando os cookies desta visita

    const { error } = await supabase.auth.verifyOtp({ type: tipo, token_hash: tokenHash }); // confirma o email e já cria a sessão de login

    if (!error) {
      redirect(proximaRota); // confirmado com sucesso: segue pro onboarding já logado
    }
  }

  redirect("/login?erro=link_invalido"); // link ausente, incompleto ou expirado: volta pro login com um aviso
}
