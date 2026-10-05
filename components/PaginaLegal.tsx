import Link from "next/link"; // link pra voltar pra home clicando no logo
import { type ReactNode } from "react"; // tipo genérico de "qualquer coisa que o React sabe renderizar"
import { Logo } from "@/components/ui/Logo"; // marca "Fluxo Barber"
import { Footer } from "@/components/Footer"; // rodapé com copyright, links legais e assinatura

interface PropriedadesPaginaLegal { // o que /termos e /privacidade passam pra esse layout compartilhado
  titulo: string; // ex: "Termos de Uso"
  atualizadoEm: string; // data por extenso, mostrada no topo (ex: "4 de outubro de 2026")
  children: ReactNode; // o texto da página em si
}

export function PaginaLegal({ titulo, atualizadoEm, children }: PropriedadesPaginaLegal) { // layout compartilhado das 2 páginas legais
  return (
    <main className="flex min-h-screen flex-col items-center px-6 py-12">
      <div className="w-full max-w-2xl">
        <Link href="/" className="mb-8 inline-block"> {/* clicar no logo leva de volta pra landing page */}
          <Logo />
        </Link>

        <h1 className="mb-1 font-display text-3xl font-semibold text-texto">{titulo}</h1>
        <p className="mb-8 text-sm text-texto-secundario">Última atualização: {atualizadoEm}</p>

        {/* "prose" não está disponível (sem plugin de tipografia do Tailwind instalado), por isso os espaçamentos
            entre título/parágrafo são definidos aqui, à mão, com classes utilitárias comuns */}
        <div className="flex flex-col gap-4 text-sm leading-relaxed text-texto-secundario [&_h2]:mt-4 [&_h2]:font-display [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-texto [&_strong]:text-texto [&_a]:text-dourado [&_a]:hover:text-dourado-claro">
          {children}
        </div>
      </div>

      <Footer />
    </main>
  );
}
