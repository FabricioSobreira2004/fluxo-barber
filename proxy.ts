import { type NextRequest } from "next/server"; // tipo da requisição que o Next.js passa para o proxy
import { updateSession } from "@/utils/supabase/proxy"; // função que sabe renovar a sessão do Supabase

export async function proxy(request: NextRequest) { // no Next.js 16 o arquivo/função chama-se "proxy" (antigo "middleware")
  return await updateSession(request); // deixa toda a lógica de renovação de sessão no arquivo utils/supabase/proxy.ts
}

export const config = {                              // configura em quais rotas o proxy roda
  matcher: [                                          // lista de padrões de caminho
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)", // roda em tudo, exceto arquivos estáticos/imagens
  ],
};
