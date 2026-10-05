"use client"; // usa refs e o hook useGSAP, que só funcionam no navegador (não existem durante a renderização no servidor)

import Link from "next/link"; // navegação entre páginas sem recarregar tudo
import { useRef } from "react"; // guarda a referência aos elementos que o GSAP vai animar
import { useGSAP } from "@gsap/react"; // hook oficial do GSAP pra React: já limpa a animação sozinho ao desmontar
import gsap from "gsap"; // motor de animação
import { classesBotao } from "@/components/ui/Button"; // reaproveita o estilo de botão nos links de CTA

gsap.registerPlugin(useGSAP); // registra o hook antes de usar (exigido pelo GSAP)

export function Hero() { // bloco de destaque (hero) da landing page: título, subtítulo e botões, com animação de entrada
  const secaoRef = useRef<HTMLElement>(null); // raiz da seção: limita onde o GSAP procura elementos (escopo)
  const tituloRef = useRef<HTMLHeadingElement>(null); // só existe um título, por isso uma ref direta já basta
  const subtituloRef = useRef<HTMLParagraphElement>(null); // idem, só existe um parágrafo de subtítulo

  useGSAP(
    () => {
      const mm = gsap.matchMedia(); // controlador que liga/desliga blocos de animação conforme media queries

      mm.add("(prefers-reduced-motion: no-preference)", () => {
        // esta função só roda se o usuário NÃO pediu movimento reduzido no sistema operacional;
        // se pediu, a timeline nunca é criada e os elementos aparecem direto no estado final (estático)
        const tl = gsap.timeline({ defaults: { ease: "power2.out", duration: 0.7 } }); // sequência: título -> subtítulo -> botões

        tl.from(tituloRef.current, { autoAlpha: 0, y: 28 }) // título: fade + leve deslize de baixo pra cima
          .from(subtituloRef.current, { autoAlpha: 0, y: 22 }, "-=0.45") // subtítulo começa antes do título terminar, pra ficar em sequência suave
          .from(".botao-cta", { autoAlpha: 0, y: 16, stagger: 0.12 }, "-=0.3"); // os 2 botões entram logo depois, um após o outro
      });

      return () => mm.revert(); // desfaz a animação e para de escutar a media query quando o componente sai da tela
    },
    { scope: secaoRef } // ".botao-cta" só é buscado dentro desta seção, nunca em outra parte da página
  );

  return (
    <section
      ref={secaoRef}
      className="flex flex-1 flex-col items-center gap-6 px-6 py-16 text-center md:py-24" // seção de destaque (hero)
    >
      <h1 ref={tituloRef} className="font-display text-4xl font-bold leading-tight text-texto md:text-6xl">
        Agendamento simples para <span className="text-dourado">barbearias</span> {/* palavra-chave em dourado */}
      </h1>
      <p ref={subtituloRef} className="max-w-2xl text-lg text-texto-secundario">
        O Fluxo Barber organiza a agenda da sua barbearia: clientes marcam horário online, sua
        equipe não tem mais conflito de horário, e você acompanha tudo em um painel simples.
      </p>
      <div className="flex flex-col gap-3 sm:flex-row"> {/* botões empilhados no celular, lado a lado no desktop */}
        <Link href="/cadastro" className={`botao-cta ${classesBotao("primario")} px-6 py-3 text-base`}>
          Criar conta gratuita
        </Link>
        <Link href="/login" className={`botao-cta ${classesBotao("secundario")} px-6 py-3 text-base`}>
          Já tenho conta
        </Link>
      </div>
    </section>
  );
}
