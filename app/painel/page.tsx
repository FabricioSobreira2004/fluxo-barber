import { createClient } from "@/utils/supabase/server"; // cliente Supabase do lado servidor
import { BotaoSair } from "@/components/BotaoSair"; // botão de logout

export default async function PaginaPainel() { // TODO (etapa 9+): layout do painel e conteúdo real (agenda, barbeiros, etc.)
  const supabase = await createClient(); // conexão com o Supabase usando os cookies desta visita
  const { data } = await supabase.auth.getUser(); // o proxy já garante que existe usuário logado aqui; isso só confirma pra tela

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
      <p className="text-texto-secundario">
        Painel em construção. Logado como <span className="text-texto">{data.user?.email}</span>.
      </p>
      <BotaoSair />
    </main>
  );
}
