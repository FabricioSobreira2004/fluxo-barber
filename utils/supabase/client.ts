import { createBrowserClient } from "@supabase/ssr"; // função da biblioteca que cria a conexão com o Supabase rodando no navegador
import { type Database } from "@/utils/supabase/database.types"; // tipos gerados do banco (ver PENDENCIAS.md); ensina o cliente a tipar .from()/.rpc() automaticamente

export function createClient() {                      // função que os componentes "client" (interativos) vão chamar para falar com o banco
  return createBrowserClient<Database>(                // "<Database>" é o que faz .from("tabela").select(...) já vir tipado
    process.env.NEXT_PUBLIC_SUPABASE_URL!,             // endereço do projeto, lido do .env.local; o "!" garante ao TypeScript que essa variável existe
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!  // chave pública, também lida do .env.local (nunca a secret key aqui)
  );
}
