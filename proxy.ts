import { NextResponse, type NextRequest } from "next/server"; // classe/tipos usados para ler a requisição e redirecionar
import { updateSession } from "@/utils/supabase/proxy"; // função que renova a sessão e diz quem está logado

const ROTAS_PROTEGIDAS = ["/painel", "/onboarding"]; // prefixos de rota que só podem ser acessados logado

export async function proxy(request: NextRequest) { // no Next.js 16 o arquivo/função chama-se "proxy" (antigo "middleware")
  const { response, user } = await updateSession(request); // renova a sessão e descobre se há um usuário logado

  const caminho = request.nextUrl.pathname; // caminho da URL que está sendo acessado (ex: "/painel/agenda")
  const precisaLogin = ROTAS_PROTEGIDAS.some((rota) => caminho.startsWith(rota)); // true se o caminho começa com uma rota protegida

  if (precisaLogin && !user) {                                 // rota protegida, mas ninguém logado...
    const destino = new URL("/login", request.url);             // ...monta a URL de login...
    destino.searchParams.set("redirecionar", caminho);           // ...guardando pra onde voltar depois de entrar
    return NextResponse.redirect(destino);                       // ...e manda o visitante pra lá
  }

  return response; // rota liberada (ou usuário já logado): segue com a resposta normal
}

export const config = {                              // configura em quais rotas o proxy roda
  matcher: [                                          // lista de padrões de caminho
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)", // roda em tudo, exceto arquivos estáticos/imagens
  ],
};
