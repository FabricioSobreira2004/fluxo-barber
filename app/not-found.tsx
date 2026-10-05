import Link from "next/link"; // link estilizado de botão, pra voltar ao início
import { Logo } from "@/components/ui/Logo"; // marca "Fluxo Barber" no topo
import { classesBotao } from "@/components/ui/Button"; // reaproveita o estilo de botão primário no link

// o Next.js usa este arquivo automaticamente sempre que "notFound()" é chamado (ex: slug de barbearia
// inexistente em app/b/[slug]/page.tsx) ou quando a URL acessada não bate com nenhuma rota do site
export default function PaginaNaoEncontrada() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 px-6 py-12 text-center">
      <Logo />
      {/* "404" bem grande em dourado: é o primeiro número no raio de visão, chama atenção antes do texto */}
      <p className="font-display text-7xl font-bold text-dourado">404</p>
      <h1 className="font-display text-2xl font-semibold text-texto">Página não encontrada</h1>
      <p className="max-w-sm text-sm text-texto-secundario">
        O endereço que você tentou acessar não existe, ou pode ter sido removido.
      </p>
      <Link href="/" className={`${classesBotao("primario")} px-6 py-3 text-base`}>
        Voltar ao início
      </Link>
    </main>
  );
}
