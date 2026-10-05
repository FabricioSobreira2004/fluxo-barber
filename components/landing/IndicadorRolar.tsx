"use client"; // usa useGSAP e um listener de scroll, que só existem no navegador

import { useRef } from "react"; // guarda a referência à seta, animada pelo GSAP
import { ChevronDown } from "lucide-react"; // ícone da seta "role para baixo"
import { useGSAP } from "@gsap/react"; // hook oficial do GSAP pra React: já limpa a animação sozinho ao desmontar
import gsap from "gsap"; // motor de animação

gsap.registerPlugin(useGSAP); // registra o hook antes de usar (exigido pelo GSAP)

export function IndicadorRolar() { // seta discreta no fim do hero, avisando que tem mais conteúdo logo abaixo
  const setaRef = useRef<HTMLDivElement>(null); // elemento animado: sobe e desce devagar, e some ao rolar

  useGSAP(() => {
    const mm = gsap.matchMedia(); // controlador que liga/desliga a animação conforme a preferência de movimento

    mm.add("(prefers-reduced-motion: no-preference)", () => {
      // flutua devagar, pra cima e pra baixo, pra sempre — chama atenção sem ser agressivo
      gsap.to(setaRef.current, {
        y: 7,
        duration: 0.9,
        ease: "sine.inOut",
        repeat: -1,
        yoyo: true, // vai e volta (em vez de "pular" de volta ao início a cada repetição)
      });
    });

    // some assim que o usuário começar a rolar — não precisa de media query aqui: isso não é
    // "movimento" animado, é só uma transição rápida de opacidade reagindo a uma ação do usuário
    function aoRolar() {
      const rolou = window.scrollY > 24; // um pouco de tolerância, pra não sumir com 1px de rolagem acidental
      gsap.to(setaRef.current, { autoAlpha: rolou ? 0 : 1, duration: 0.3, overwrite: "auto" });
    }

    window.addEventListener("scroll", aoRolar, { passive: true }); // "passive": avisa ao navegador que isso não bloqueia a rolagem
    return () => window.removeEventListener("scroll", aoRolar); // remove o listener ao desmontar (evita vazamento de memória)
  }, []); // sem dependências: configura uma única vez, ao montar

  return (
    <div
      ref={setaRef}
      aria-hidden // puramente decorativo; a rolagem continua acessível via teclado/scroll normalmente
      className="pointer-events-none absolute inset-x-0 bottom-2 flex justify-center text-dourado/70"
    >
      <ChevronDown className="h-6 w-6" />
    </div>
  );
}
