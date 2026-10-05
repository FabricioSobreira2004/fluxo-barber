"use client"; // usa useGSAP e ScrollTrigger, que só existem no navegador

import { useRef } from "react"; // guarda a referência à seção (escopo da animação e gatilho do ScrollTrigger)
import { useGSAP } from "@gsap/react"; // hook oficial do GSAP pra React: já limpa a animação sozinho ao desmontar
import gsap from "gsap"; // motor de animação
import { ScrollTrigger } from "gsap/ScrollTrigger"; // plugin que dispara a animação quando a seção entra na tela

gsap.registerPlugin(useGSAP, ScrollTrigger); // registra os plugins antes de usá-los

// lista dos 3 passos mostrados na seção "Como funciona"; textos curtos, só o essencial do fluxo
const passos = [
  { numero: 1, texto: "Cadastre sua barbearia, seus barbeiros e os serviços que você oferece." },
  { numero: 2, texto: "Compartilhe o link da sua barbearia com os seus clientes." },
  { numero: 3, texto: "Os clientes agendam sozinhos, e você acompanha tudo no painel." },
];

export function ComoFunciona() { // seção "Como funciona": explica o fluxo em 3 passos, animados ao rolar até eles
  const secaoRef = useRef<HTMLElement>(null); // raiz da seção: escopo da animação e "trigger" do ScrollTrigger

  useGSAP(
    () => {
      const mm = gsap.matchMedia(); // controlador que liga/desliga a animação conforme a preferência de movimento

      mm.add("(prefers-reduced-motion: no-preference)", () => {
        // só anima se o usuário NÃO pediu movimento reduzido; senão os números e a linha aparecem direto, parados
        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: secaoRef.current,
            start: "top 75%", // dispara quando a seção chega perto do meio da tela, rolando pra baixo
            once: true, // anima só na primeira vez; não refaz se o usuário rolar pra cima e descer de novo
          },
        });

        tl.from(".passo-numero", { // os 3 números aparecem em sequência, com uma leve "molejada" de aparição
          autoAlpha: 0,
          scale: 0.4,
          duration: 0.5,
          stagger: 0.35,
          ease: "back.out(2)",
        }).fromTo(
          ".linha-como-funciona", // a linha dourada "se desenha" da esquerda pra direita
          { scaleX: 0 },
          { scaleX: 1, duration: 1.05, ease: "none" },
          0 // começa junto com o primeiro número, pra dar a sensação de que a linha vai avançando enquanto os números surgem
        );
      });

      return () => mm.revert(); // desfaz a animação, o ScrollTrigger e o listener de media query ao desmontar
    },
    { scope: secaoRef } // ".passo-numero" e ".linha-como-funciona" só são buscados dentro desta seção
  );

  return (
    <section ref={secaoRef} className="px-6 py-16 md:px-12">
      <h2 className="mb-12 text-center font-display text-3xl font-bold text-texto md:text-4xl">
        Como funciona
      </h2>
      <div className="relative mx-auto grid max-w-4xl grid-cols-1 gap-10 md:grid-cols-3 md:gap-6">
        {/* linha dourada ligando os 3 passos: só no desktop, porque no celular os passos já ficam
            empilhados um embaixo do outro, bem claros sem precisar de linha nenhuma.
            "origin-left": a escala (scaleX) cresce a partir da esquerda, parecendo um traço sendo desenhado */}
        <div
          className="linha-como-funciona absolute inset-x-0 top-6 hidden h-px origin-left bg-dourado/25 md:block"
          aria-hidden
        />

        {passos.map(({ numero, texto }) => (
          <div key={numero} className="relative flex flex-col items-center gap-4 text-center">
            {/* "relative z-10": fica por cima da linha dourada, que passa atrás do círculo */}
            <span className="passo-numero relative z-10 flex h-12 w-12 items-center justify-center rounded-full bg-dourado font-display text-lg font-bold text-fundo">
              {numero}
            </span>
            <p className="max-w-xs text-sm text-texto/80">{texto}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
