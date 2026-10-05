"use client"; // usa refs e o hook useGSAP, que só funcionam no navegador (não existem durante a renderização no servidor)

import Link from "next/link"; // navegação entre páginas sem recarregar tudo
import { useRef } from "react"; // guarda a referência aos elementos que o GSAP vai animar
import { useGSAP } from "@gsap/react"; // hook oficial do GSAP pra React: já limpa a animação sozinho ao desmontar
import gsap from "gsap"; // motor de animação
import { classesBotao } from "@/components/ui/Button"; // reaproveita o estilo de botão nos links de CTA
import { Destaque } from "@/components/ui/Destaque"; // trecho de texto em dourado, usado nas palavras-chave do subtítulo

gsap.registerPlugin(useGSAP); // registra o hook antes de usar (exigido pelo GSAP)

// palavras do título antes da palavra em destaque, uma por uma — pra cada uma virar um <span> animável
// (não usei o plugin SplitText aqui porque o texto é fixo e curto: separar na mão é mais simples e mais leve)
const PALAVRAS_TITULO = ["Agendamento", "simples", "para"];
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
          .fromTo( // brilho dourado passando uma vez só por cima da palavra "barbearias"
            ".brilho-titulo",
            { xPercent: -150 }, // começa fora da palavra, à esquerda
            { xPercent: 150, duration: 0.9, ease: "power1.inOut" }, // atravessa e sai do outro lado; "overflow-hidden" no span pai corta o que passa da borda
            // (sem clearProps aqui: o estado final — fora da área visível, à direita — é o estado que queremos manter.
            // Limpar o style faria o brilho voltar pro centro da palavra e ficar visível pra sempre, o que seria um bug.)
            "tituloPronto"
          )
          .from(subtituloRef.current, { autoAlpha: 0, y: 22, duration: 0.7, clearProps: "all" }, "tituloPronto+=0.1") // subtítulo entra logo depois do título
          .from(".botao-cta", { autoAlpha: 0, y: 16, duration: 0.7, stagger: 0.12, clearProps: "all" }, "-=0.3") // os 2 botões entram em seguida, um após o outro
          .from(".destaque-subtitulo", { // palavras em destaque do subtítulo: um "pop" sutil, depois que o texto já está visível
            autoAlpha: 0.4, // não starta 100% invisível — o texto já apareceu junto com o resto do parágrafo, isso é só um realce
            scale: 0.85,
            duration: 0.4,
            stagger: 0.1,
            ease: "back.out(1.8)", // dá uma leve "molejada" no final, chamando atenção sem exagerar
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
      // "pb" bem menor que o "pt": antes o espaço entre os botões e os cards de benefício ficava grande demais
      className="flex flex-1 flex-col items-center gap-6 px-6 pt-16 pb-8 text-center md:pt-24 md:pb-10" // seção de destaque (hero)
    >
      {/* "aria-label" na frase inteira: é isso que o leitor de tela anuncia. O conteúdo visual abaixo
          (palavras separadas em <span>, pra animar uma por uma) fica com "aria-hidden", senão o leitor
          de tela tentaria ler cada <span> separado, sem os espaços que existem só visualmente via "gap" */}
      <h1
        aria-label={TITULO_COMPLETO}
        className="font-display text-4xl font-bold leading-tight text-balance text-texto md:text-6xl"
      >
        <span aria-hidden className="inline-flex flex-wrap items-center justify-center gap-x-[0.28em]">
          {PALAVRAS_TITULO.map((palavra) => ( // cada palavra do título vira seu próprio <span>, pra poder animar uma por uma
            <span key={palavra} className="palavra-titulo">
              {palavra}
            </span>
          ))}
          {/* palavra em destaque: "relative overflow-hidden" recorta o brilho que passa por cima dela.
              Fica como item do mesmo flex "items-center" dos outros — assim ela se alinha pela MESMA
              régua que as outras palavras, em vez de depender do alinhamento por "baseline" do texto
              (que o "overflow-hidden" bagunça: ele faz o navegador alinhar pela base da caixa, não do
              texto, e foi isso que deixava "barbearias" mais alta que o resto do título). */}
          <span className="palavra-titulo relative overflow-hidden text-dourado">
            barbearias
            <span
              className="brilho-titulo pointer-events-none absolute inset-0 -translate-x-[150%] -skew-x-12 bg-gradient-to-r from-transparent via-white/80 to-transparent" // faixa clara e inclinada, que o GSAP desliza por cima da palavra; "-translate-x-[150%]" é a posição de DESCANSO (fora da tela), via CSS puro — garante que, se o JavaScript não rodar (ou com movimento reduzido, que nunca cria a animação), o brilho nunca apareça parado em cima do texto
              aria-hidden // puramente decorativo, não tem texto nenhum
            />
          </span>
        </span>
      </h1>
      <p ref={subtituloRef} className="max-w-2xl text-lg text-balance text-texto/90 md:text-xl"> {/* "text-texto/90": branco suave, mais legível que o cinza de antes; "text-balance": evita sobrar 1 palavra sozinha na última linha */}
        Chega de perder tempo no WhatsApp marcando horário. Com o Fluxo Barber, seus clientes{" "}
        <Destaque className="destaque-subtitulo">agendam sozinhos</Destaque> pelo link da sua
        barbearia, <Destaque className="destaque-subtitulo">24 horas por dia</Destaque>, e você
        acompanha tudo num painel simples, <Destaque className="destaque-subtitulo">sem horário duplicado</Destaque>.
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
