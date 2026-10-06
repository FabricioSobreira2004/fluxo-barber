"use client"; // precisa do GSAP (barras "crescendo" ao entrar na tela) e de um ref

import { useRef } from "react"; // referência pro contêiner, escopo da animação
import { useGSAP } from "@gsap/react"; // hook oficial do GSAP pra React: limpa a animação sozinho ao desmontar
import gsap from "gsap"; // motor de animação
import { centavosParaReais } from "@/utils/dinheiro"; // formata centavos pra "25,90"
import { type PontoGraficoDia } from "./tipos"; // formato de 1 barra (dia + total)

export function GraficoFaturamentoPorDia({ pontos }: { pontos: PontoGraficoDia[] }) {
  const containerRef = useRef<HTMLDivElement>(null); // escopo da animação: só as barras DENTRO deste contêiner

  const maiorValor = Math.max(1, ...pontos.map((ponto) => ponto.totalCentavos)); // "1" (nunca 0) evita divisão por zero quando o período inteiro está vazio

  useGSAP(
    () => {
      const mm = gsap.matchMedia(); // respeita "prefers-reduced-motion": sem essa preferência, as barras aparecem direto no tamanho final (CSS puro)
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        // a ALTURA de cada barra já vem certa via CSS (style="height: X%", definido no JSX, funciona sem JavaScript);
        // o GSAP só anima um "scaleY" por cima (barato: é só transform, não recalcula layout) saindo de 0 até o
        // tamanho atual (1), ancorado na base — dá a impressão de "a barra crescendo do zero", sem animar "height"
        gsap.from(gsap.utils.toArray(".fat-barra", containerRef.current), {
          scaleY: 0,
          transformOrigin: "bottom",
          duration: 0.6,
          ease: "power2.out",
          stagger: 0.02, // cada barra começa um pouquinho depois da anterior, dá a sensação de "preenchendo da esquerda pra direita"
        });
      });
      return () => mm.revert();
    },
    { scope: containerRef, dependencies: [pontos] } // refaz a animação sempre que o período muda e os pontos são outros
  );

  return (
    <div className="overflow-x-auto"> {/* períodos longos (ex: "Este mês", até 31 barras) rolam na horizontal em telas estreitas, em vez de espremer tudo */}
      <div ref={containerRef} className="flex h-48 min-w-fit items-end gap-1.5 pb-6">
        {pontos.map((ponto) => {
          const temFaturamento = ponto.totalCentavos > 0;
          // porcentagem da altura total (48 = h-48); mínimo de 4% quando há valor (pra sempre dar pra ver/passar o mouse)
          // e uma "lasca" de 2% quando é zero, só pra marcar a posição do dia na régua, sem parecer uma barra de verdade
          const alturaPercentual = temFaturamento ? Math.max(4, (ponto.totalCentavos / maiorValor) * 100) : 2;
          const dia = ponto.dia.slice(8, 10); // "2026-10-04" -> "04"

          return (
            <div key={ponto.dia} className="group relative flex h-full w-5 shrink-0 flex-col items-center justify-end">
              {/* tooltip: some por padrão, aparece no hover/foco — valor completo + a data inteira (o rótulo embaixo só mostra o dia) */}
              <div
                role="tooltip"
                className="pointer-events-none absolute bottom-full mb-1 hidden whitespace-nowrap rounded-md border border-borda bg-superficie px-2 py-1 text-xs text-texto shadow-lg group-hover:block group-focus-within:block"
              >
                R$ {centavosParaReais(ponto.totalCentavos)} — {formatarDataCurta(ponto.dia)}
              </div>

              <div
                tabIndex={0} // alcançável por teclado, pra quem usa só teclado também conseguir ver o tooltip (group-focus-within acima)
                aria-label={`${formatarDataCurta(ponto.dia)}: R$ ${centavosParaReais(ponto.totalCentavos)}`}
                className={`fat-barra w-full rounded-t ${temFaturamento ? "bg-dourado" : "bg-borda"}`}
                style={{ height: `${alturaPercentual}%` }}
              />
              <span className="mt-1 text-[10px] lining-nums tabular-nums text-texto-secundario">{dia}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function formatarDataCurta(dataISO: string): string { // "2026-10-04" -> "04/10"
  return `${dataISO.slice(8, 10)}/${dataISO.slice(5, 7)}`;
}
