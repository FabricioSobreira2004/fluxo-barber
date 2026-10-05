"use client"; // error.tsx PRECISA ser Client Component -- é assim que o Next.js exige esse arquivo

import { useEffect } from "react"; // usado só pra registrar o erro no console do navegador
import Link from "next/link"; // navegação sem recarregar a página inteira
import { Logo } from "@/components/ui/Logo"; // marca "Fluxo Barber" no topo
import { Button, classesBotao } from "@/components/ui/Button"; // botão estilizado + o mesmo estilo aplicado a um link

// o Next.js renderiza este arquivo automaticamente quando algum erro não tratado acontece
// durante a renderização de uma página (ex: uma chamada ao Supabase que falhou de um jeito inesperado)
export default function PaginaDeErro({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { // registra o erro no console assim que a tela de erro aparece, pra ajudar a debugar depois
    console.error(error);
  }, [error]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 px-6 py-12 text-center">
      <Logo />
      <h1 className="font-display text-2xl font-semibold text-texto">Algo deu errado</h1>
      <p className="max-w-sm text-sm text-texto-secundario">
        Não conseguimos carregar esta página. Tente novamente em alguns instantes.
      </p>
      <div className="flex flex-col gap-3 sm:flex-row">
        <Button onClick={() => reset()} className="px-6 py-3 text-base"> {/* "reset" tenta renderizar a página de novo, sem recarregar tudo */}
          Tentar de novo
        </Button>
        <Link href="/" className={`${classesBotao("secundario")} px-6 py-3 text-base`}>
          Voltar ao início
        </Link>
      </div>
    </main>
  );
}
