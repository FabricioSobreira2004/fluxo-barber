"use client"; // usa refs e o hook useGSAP, que só funcionam no navegador (não existem durante a renderização no servidor)

import Link from "next/link"; // navegação entre páginas sem recarregar tudo
import { useRef } from "react"; // guarda a referência aos elementos que o GSAP vai animar
import { useGSAP } from "@gsap/react"; // hook oficial do GSAP pra React: já limpa a animação sozinho ao desmontar
import gsap from "gsap"; // motor de animação
import { classesBotao } from "@/components/ui/Button"; // reaproveita o estilo de botão nos links de CTA
import { Destaque } from "@/components/ui/Destaque"; // trecho de texto em dourado, usado nas palavras-chave do subtítulo
import { IndicadorRolar } from "./IndicadorRolar"; // seta discreta avisando que tem mais conteúdo abaixo

gsap.registerPlugin(useGSAP); // registra o hook antes de usar (exigido pelo GSAP)

// palavras do título, uma por uma — pra cada uma virar um <span> animável
// (não usei o plugin SplitText aqui porque o texto é fixo e curto: separar na mão é mais simples e mais leve)
const PALAVRAS_TITULO = ["Agendamento", "simples", "para", "barbearias"];
const TITULO_COMPLETO = "Agendamento simples para barbearias"; // frase inteira, usada só no aria-label (pra leitor de tela)

export function Hero() { // bloco de destaque (hero) da landing page: título, subtítulo e botões, com animação de entrada
  const secaoRef = useRef<HTMLElement>(null); // raiz da seção: limita onde o GSAP procura elementos (escopo)
  const subtituloRef = useRef<HTMLParagraphElement>(null); // só existe um parágrafo de subtítulo, por isso uma ref direta já basta

  useGSAP(
    () => {
      const mm = gsap.matchMedia(); // controlador que liga/desliga blocos de animação conforme media queries

      mm.add("(prefers-reduced-motion: no-preference)", () => {
        // esta função só roda se o usuário NÃO pediu movimento reduzido no sistema operacional;
        // se pediu, a timeline nunca é criada e os elementos aparecem direto no estado final (estático)
        const tl = gsap.timeline({ defaults: { ease: "power2.out" } });

        tl.from(".palavra-titulo", { // palavra por palavra, de baixo pra cima (total ≈0,8s)
          autoAlpha: 0,
          y: 40,
          duration: 0.6,
          stagger: 0.07,
          clearProps: "all", // ao terminar, remove o style inline que o GSAP aplicou (opacity/transform) e devolve o controle pro CSS — garante y:0/opacity:1 de verdade, sem resíduo
        })
          .addLabel("tituloPronto") // marca o momento em que a última palavra termina de entrar
          .from(subtituloRef.current, { autoAlpha: 0, y: 22, duration: 0.7, clearProps: "all" }, "tituloPronto+=0.1") // subtítulo entra logo depois do título
          .from(".botao-cta", { autoAlpha: 0, y: 16, duration: 0.7, stagger: 0.12, clearProps: "all" }, "-=0.3") // os 2 botões entram em seguida, um após o outro
          .from(".destaque-subtitulo", { // palavras em destaque do subtítulo: um leve realce, depois que o texto já está visível
            // só "autoAlpha" aqui — nada de "scale"/"y": o <Destaque> é "inline" de propósito (pra pontuação colada
            // nunca quebrar de linha sozinha, ver components/ui/Destaque.tsx), e "transform" não tem efeito em
            // elemento "inline" comum. Um realce por opacidade (bem apagado -> cor cheia) já chama bastante atenção.
            autoAlpha: 0.35,
            duration: 0.45,
            stagger: 0.1,
            clearProps: "all",
          }, "-=0.15");
      });

      return () => mm.revert(); // desfaz a animação e para de escutar a media query quando o componente sai da tela
    },
    { scope: secaoRef } // seletores (".palavra-titulo", ".botao-cta" etc.) só são buscados dentro desta seção
  );

  return (
    <section
      ref={secaoRef}
      // espaço vertical bem mais enxuto que antes (era "pt-16 md:pt-24 pb-8 md:pb-10"): com o hero mais
      // compacto, o início da seção de benefícios já aparece sem rolar em notebooks/desktops comuns.
      // "relative": é a referência de posição da seta de "role para baixo" (absoluta), no fim da seção
      className="relative flex flex-1 flex-col items-center gap-5 px-6 pt-10 pb-6 text-center md:pt-14 md:pb-8"
    >
      {/* "aria-label" na frase inteira: é isso que o leitor de tela anuncia. O conteúdo visual abaixo
          (palavras separadas em <span>, pra animar uma por uma) fica com "aria-hidden", senão o leitor
          de tela tentaria ler cada <span> separado, sem os espaços que existem só visualmente via "gap" */}
      <h1
        aria-label={TITULO_COMPLETO}
        className="font-display text-4xl font-bold leading-tight text-balance text-texto md:text-6xl"
      >
        <span aria-hidden className="inline-flex flex-wrap items-center justify-center gap-x-[0.28em]">
          {PALAVRAS_TITULO.map((palavra, indice) => ( // cada palavra do título vira seu próprio <span>, pra poder animar uma por uma
            // a última palavra ("barbearias") é a palavra-chave: só ela fica dourada, bem simples e estática —
            // chegamos a testar um brilho passando por cima dela, mas o efeito ficava com um retângulo visível
            // atrás da palavra (o recorte do "overflow-hidden" não acompanhava bem a inclinação do brilho), então
            // tiramos: dourado limpo, alinhado com as outras palavras, já chama bastante atenção sozinho
            <span
              key={palavra}
              className={`palavra-titulo ${indice === PALAVRAS_TITULO.length - 1 ? "text-dourado" : ""}`}
            >
              {palavra}
            </span>
          ))}
        </span>
      </h1>
      {/* "text-balance": evita sobrar 1 palavra sozinha na última linha. Texto curto de propósito
          (no máximo 2 linhas em telas de desktop) e com os gatilhos de venda em dourado */}
      <p ref={subtituloRef} className="max-w-3xl text-lg text-balance text-texto/90 md:text-xl">
        <Destaque className="destaque-subtitulo">Automatize sua agenda</Destaque> e leve sua
        barbearia a outro nível: seus clientes{" "}
        <Destaque className="destaque-subtitulo">agendam sozinhos</Destaque>,{" "}
        <Destaque className="destaque-subtitulo">24 horas por dia</Destaque>, e você foca no que{" "}
        <Destaque className="destaque-subtitulo">gera lucro</Destaque>.
      </p>
      <div className="flex flex-col gap-3 sm:flex-row"> {/* botões empilhados no celular, lado a lado no desktop */}
        <Link href="/cadastro" className={`botao-cta ${classesBotao("primario")} px-6 py-3 text-base`}>
          Criar conta gratuita
        </Link>
        <Link href="/login" className={`botao-cta ${classesBotao("secundario")} px-6 py-3 text-base`}>
          Já tenho conta
        </Link>
      </div>
      <IndicadorRolar /> {/* seta discreta, só pra avisar que tem mais conteúdo logo abaixo */}
    </section>
  );
}
