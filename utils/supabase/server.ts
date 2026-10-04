import { createServerClient } from "@supabase/ssr";  // função da biblioteca que cria a conexão com o Supabase rodando no servidor
import { cookies } from "next/headers";              // função do Next.js que lê e grava os cookies do navegador de quem acessou

export async function createClient() {               // função que o resto do site vai chamar sempre que precisar falar com o banco
  const cookieStore = await cookies();                // pega os cookies da visita atual (é neles que fica guardado o login)

  return createServerClient(                          // cria e devolve a conexão pronta
    process.env.NEXT_PUBLIC_SUPABASE_URL!,            // endereço do projeto, lido do .env.local; o "!" garante ao TypeScript que essa variável existe
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!, // chave pública, também lida do .env.local
    {
      cookies: {                                      // ensina o Supabase a ler e gravar a sessão nos cookies
        getAll() {                                    // quando o Supabase quiser LER os cookies...
          return cookieStore.getAll();                // ...entrega todos os cookies da visita
        },
        setAll(cookiesToSet) {                        // quando o Supabase quiser GRAVAR cookies (ex: renovar o login)...
          try {                                       // tenta gravar...
            cookiesToSet.forEach(({ name, value, options }) => // ...passando por cada cookie que precisa salvar
              cookieStore.set(name, value, options)   // grava o cookie com nome, valor e configurações
            );
          } catch {                                   // se der erro (acontece em páginas que só leem e não podem gravar cookies)...
            // ...ignora com segurança; a renovação do login vai ser feita em outro arquivo que criaremos depois
          }
        },
      },
    }
  );
}