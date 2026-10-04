import { createServerClient } from "@supabase/ssr"; // cria a conexão com o Supabase usando os cookies da requisição, igual ao server.ts
import { NextResponse, type NextRequest } from "next/server"; // tipos e classe usados para ler a requisição e montar a resposta do proxy

export async function updateSession(request: NextRequest) { // função chamada pelo proxy.ts em toda requisição, para manter o login vivo
  let supabaseResponse = NextResponse.next({ request }); // resposta "padrão": deixa a requisição seguir sem travar nada

  const supabase = createServerClient(                  // conexão com o Supabase feita só para ler/renovar a sessão
    process.env.NEXT_PUBLIC_SUPABASE_URL!,               // endereço do projeto, lido do .env.local
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,   // chave pública, também do .env.local
    {
      cookies: {                                        // ensina o Supabase a ler/gravar cookies dentro do proxy
        getAll() {                                       // quando o Supabase quiser LER os cookies...
          return request.cookies.getAll();                // ...devolve os cookies que chegaram na requisição
        },
        setAll(cookiesToSet) {                           // quando o Supabase quiser GRAVAR cookies (token renovado)...
          cookiesToSet.forEach(({ name, value }) =>        // primeiro atualiza os cookies na própria requisição...
            request.cookies.set(name, value)               // ...para que Server Components lidos depois já vejam o valor novo
          );
          supabaseResponse = NextResponse.next({ request }); // recria a resposta com a requisição já atualizada
          cookiesToSet.forEach(({ name, value, options }) => // agora grava os mesmos cookies na RESPOSTA...
            supabaseResponse.cookies.set(name, value, options) // ...para que o navegador do usuário também os receba
          );
        },
      },
    }
  );

  await supabase.auth.getUser(); // força checar/renovar o login agora; se não chamar isso, a sessão pode expirar sem avisar

  return supabaseResponse; // devolve a resposta (com os cookies de sessão já atualizados, se foi o caso)
}
