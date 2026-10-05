import Link from "next/link"; // navegação entre páginas do Next.js sem recarregar tudo
import { Logo } from "@/components/ui/Logo"; // marca "Fluxo Barber" no topo
import { classesBotao } from "@/components/ui/Button"; // reaproveita o estilo de botão em links (Criar conta/Entrar)
import { Footer } from "@/components/Footer"; // rodapé com copyright, links legais e assinatura
import { Hero } from "@/components/landing/Hero"; // título, subtítulo e botões de CTA, com animação de entrada
import { Beneficios } from "@/components/landing/Beneficios"; // grade de 4 cards, com animação ao rolar a tela
import { ComoFunciona } from "@/components/landing/ComoFunciona"; // seção "Como funciona", em 3 passos
import { ChamadaFinal } from "@/components/landing/ChamadaFinal"; // chamada final pra criar conta, antes do rodapé

export default function Home() { // landing page pública: primeira tela que um visitante vê
  return (
    // "overflow-x-hidden" só aqui na landing page (não no body inteiro): é uma rede de segurança contra
    // qualquer animação (deslize, escala) que arredonde mal e empurre 1px pra fora da tela, causando
    // rolagem horizontal. Não afeta o scroll vertical nem o ScrollTrigger, que só olham pro eixo Y.
    <main className="flex min-h-screen flex-col overflow-x-hidden">
      <header className="flex items-center justify-between gap-2 px-4 py-5 sm:px-6 md:px-12"> {/* topo com logo e ações de conta */}
        <Logo className="text-lg sm:text-2xl" animado /> {/* menor no celular; "animado" liga o giro das listras só aqui */}
        <nav className="flex items-center gap-2 sm:gap-3">
          <Link href="/login" className={classesBotao("secundario")}>Entrar</Link> {/* quem já tem conta */}
          <Link href="/cadastro" className={classesBotao("primario")}>Criar conta</Link> {/* quem é novo */}
        </nav>
      </header>

      <Hero /> {/* bloco de destaque (hero): anima a entrada do título, subtítulo e botões */}
      <Beneficios /> {/* grade de benefícios: anima cada card conforme entra na tela ao rolar */}
      <ComoFunciona /> {/* explica o fluxo em 3 passos, pra quem nunca usou */}
      <ChamadaFinal /> {/* último empurrão pra criar conta, antes do rodapé */}

      <Footer />
    </main>
  );
}
