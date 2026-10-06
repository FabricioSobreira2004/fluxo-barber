"use client"; // precisa do GSAP (barras "crescendo" ao entrar na tela) e de um ref

import { useRef } from "react"; // referência pro contêiner, escopo da animação
import { useGSAP } from "@gsap/react"; // hook oficial do GSAP pra React: limpa a animação sozinho ao desmontar
import gsap from "gsap"; // motor de animação
import { centavosParaReais } from "@/utils/dinheiro"; // formata centavos pra "25,90"
import { type PontoGraficoHora } from "./tipos"; // formato de 1 barra (hora + total)

// mesmo gráfico de barras do "por dia" (GraficoFaturamentoPorDia.tsx), só que com 1 barra por HORA do
// dia (0h a 23h) em vez de 1 por dia — usado quando o período escolhido é de 1 dia só (ver page.tsx),
// onde um gráfico "por dia" teria 1 barra inútil
export function GraficoFaturamentoPorHora({ pontos }: { pontos: PontoGraficoHora[] }) {
  const containerRef = useRef<HTMLDivElement>(null); // escopo da animação: só as barras DENTRO deste contêiner

  const maiorValor = Math.max(1, ...pontos.map((ponto) => ponto.totalCentavos)); // "1" (nunca 0) evita divisão por zero quando o dia inteiro está vazio

  useGSAP(
    () => {
      const mm = gsap.matchMedia(); // respeita "prefers-reduced-motion": sem essa preferência, as barras aparecem direto no tamanho final (CSS puro)
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        // mesma técnica do gráfico por dia: anima só um "scaleY" por cima da altura (que já vem certa via
        // CSS), ancorado na base — dá a impressão de "a barra crescendo do zero", sem animar "height"
        gsap.from(gsap.utils.toArray(".fat-barra-hora", containerRef.current), {
          scaleY: 0,
          transformOrigin: "bottom",
          duration: 0.6,
          ease: "power2.out",
          stagger: 0.02,
        });
      });
      return () => mm.revert();
    },
    { scope: containerRef, dependencies: [pontos] } // refaz a animação sempre que o dia muda e os pontos são outros
  );

  return (
    <div className="overflow-x-auto"> {/* 24 barras rolam na horizontal em telas estreitas, em vez de espremer tudo */}
      <div ref={containerRef} className="flex h-48 min-w-fit items-end gap-1.5 pb-6">
        {pontos.map((ponto) => {
          const temFaturamento = ponto.totalCentavos > 0;
          // mesma régua de altura mínima do gráfico por dia: 4% com valor (sempre visível), 2% ("lasca") sem valor
          const alturaPercentual = temFaturamento ? Math.max(4, (ponto.totalCentavos / maiorValor) * 100) : 2;
          const rotuloHora = `${String(ponto.hora).padStart(2, "0")}h`;

          return (
            <div key={ponto.hora} className="group relative flex h-full w-5 shrink-0 flex-col items-center justify-end">
              {/* tooltip: some por padrão, aparece no hover/foco — mesmo padrão do gráfico por dia */}
              <div
                role="tooltip"
                className="pointer-events-none absolute bottom-full mb-1 hidden whitespace-nowrap rounded-md border border-borda bg-superficie px-2 py-1 text-xs text-texto shadow-lg group-hover:block group-focus-within:block"
              >
                R$ {centavosParaReais(ponto.totalCentavos)} — {rotuloHora}
              </div>

              <div
                tabIndex={0} // alcançável por teclado, pra quem usa só teclado também conseguir ver o tooltip (group-focus-within acima)
                aria-label={`${rotuloHora}: R$ ${centavosParaReais(ponto.totalCentavos)}`}
                className={`fat-barra-hora w-full rounded-t ${temFaturamento ? "bg-dourado" : "bg-borda"}`}
                style={{ height: `${alturaPercentual}%` }}
              />
              {/* "lining-nums tabular-nums": mesmo motivo do resto do site — algarismos alinhados e de largura fixa */}
              <span className="mt-1 text-[10px] font-sans lining-nums tabular-nums text-texto-secundario">{ponto.hora}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
