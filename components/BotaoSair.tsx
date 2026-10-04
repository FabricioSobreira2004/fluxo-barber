import { LogOut } from "lucide-react"; // ícone do botão
import { redirect } from "next/navigation"; // leva de volta pra landing page depois de sair
import { createClient } from "@/utils/supabase/server"; // cliente Supabase do lado servidor

async function sair() { // Server Action: roda no servidor quando o formulário abaixo é enviado
  "use server"; // obrigatório: diz ao Next.js que essa função executa no servidor, nunca no navegador

  const supabase = await createClient(); // conexão com o Supabase usando os cookies da visita atual
  await supabase.auth.signOut(); // encerra a sessão (apaga os cookies de login)
  redirect("/"); // manda o usuário de volta pra landing page
}

export function BotaoSair() { // botão reutilizável de logout, usado no cabeçalho do painel
  return (
    <form action={sair}>
      <button
        type="submit"
        className="flex items-center gap-2 text-sm text-texto-secundario transition-colors hover:text-erro" // fica vermelho no hover, pra sinalizar "ação de sair"
      >
        <LogOut className="h-4 w-4" aria-hidden /> {/* ícone decorativo; o texto "Sair" já explica a ação */}
        Sair
      </button>
    </form>
  );
}
