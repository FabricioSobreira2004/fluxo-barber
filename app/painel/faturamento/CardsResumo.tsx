"use client"; // precisa do GSAP (contagem animada) e de um ref, que só existem no navegador

import { useRef, type ReactNode } from "react"; // referência pro contêiner (escopo da animação) e tipo de "ícone já pronto"
import { useGSAP } from "@gsap/react"; // hook oficial do GSAP pra React: limpa a animação sozinho ao desmontar
import gsap from "gsap"; // motor de animação
import { ArrowUpRight, ArrowDownRight, Minus } from "lucide-react"; // setas de variação (sobe/desce) e "sem variação"
import { Card } from "@/components/ui/Card"; // bloco de superfície padrão
import { centavosParaReais } from "@/utils/dinheiro"; // formata centavos pra "25,90" (mesma função usada no resto do site)

export type UnidadeCard = "centavos" | "quantidade" | "percentual"; // os 3 jeitos de formatar o valor de um card

export interface DadosCardResumo {
  chave: string; // "key" da lista, e também liga o valor final ao elemento certo (ver data-chave abaixo)
  titulo: string;
  icone: ReactNode; // ícone já renderizado NO SERVIDOR (um componente do lucide-react não pode atravessar pra o cliente como prop)
  valor: number; // número final: centavos (inteiro), quantidade (inteiro) ou percentual (ex: 8.3 = "8,3%")
  indisponivel?: boolean; // true só pra "taxa de faltas/cancelamentos" quando não há nenhum atendimento finalizado no período
  unidade: UnidadeCard;
  variacaoPercentual: number | null; // null = sem período anterior comparável (mostra "—")
  maiorEhMelhor: boolean; // false só na "taxa de faltas/cancelamentos": nesse card, SUBIR é a notícia ruim (fica vermelho)
}

function formatarValor(valor: number, unidade: UnidadeCard): string { // mesma formatação usada tanto no valor final estático quanto durante a contagem
  if (unidade === "centavos") return `R$ ${centavosParaReais(Math.round(valor))}`;
  if (unidade === "percentual") return `${valor.toFixed(1).replace(".", ",")}%`;
  return Math.round(valor).toLocaleString("pt-BR"); // "quantidade": número inteiro, com separador de milhar em pt-BR
}

export function CardsResumo({ cards }: { cards: DadosCardResumo[] }) {
  const containerRef = useRef<HTMLDivElement>(null); // escopo da animação: só os elementos ".fat-valor" DENTRO deste contêiner

  useGSAP(
    () => {
      const mm = gsap.matchMedia(); // respeita "prefers-reduced-motion": sem essa preferência, a contagem nem é criada
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const elementos = gsap.utils.toArray<HTMLElement>(".fat-valor", containerRef.current); // 1 <span> por card (os "indisponível" não têm essa classe)
        elementos.forEach((elemento) => {
          const valorFinal = Number(elemento.dataset.valorFinal); // veio do "data-valor-final" no JSX, sempre um número válido
          const unidade = elemento.dataset.unidade as UnidadeCard;
          const objeto = { valor: 0 }; // objeto "de mentira" só pra o GSAP ter uma propriedade numérica pra tweenar

          gsap.to(objeto, {
            valor: valorFinal,
            duration: 1.2,
            ease: "power2.out",
            onUpdate: () => { elemento.textContent = formatarValor(objeto.valor, unidade); }, // a cada frame, reformata o número atual da contagem
            onComplete: () => { elemento.textContent = formatarValor(valorFinal, unidade); }, // garante o texto final EXATO (sem sobra de ponto flutuante)
          });
        });
      });
      return () => mm.revert();
    },
    { scope: containerRef, dependencies: [cards] } // refaz a contagem sempre que o período muda e os números finais são outros
  );

  return (
    <div ref={containerRef} className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5"> {/* 1 coluna no celular, 5 no desktop */}
      {cards.map((card) => (
        <Card key={card.chave} className="flex flex-col gap-2">
          <div className="flex items-center gap-2 text-texto-secundario">
            {card.icone}
            <span className="text-sm">{card.titulo}</span>
          </div>

          {card.indisponivel ? ( // só a "taxa" pode cair aqui: sem nenhum atendimento finalizado, não há taxa pra mostrar
            <span className="font-display text-2xl font-semibold text-texto-secundario">—</span>
          ) : (
            // o texto já nasce com o valor FINAL certo (funciona sem JavaScript também); o GSAP acima só reseta pra 0 e conta de novo,
            // quando o navegador permite animação — ver o comentário completo no useGSAP acima
            <span
              className="fat-valor font-display text-2xl font-semibold text-texto"
              data-valor-final={card.valor}
              data-unidade={card.unidade}
            >
              {formatarValor(card.valor, card.unidade)}
            </span>
          )}

          <IndicadorVariacao variacaoPercentual={card.variacaoPercentual} maiorEhMelhor={card.maiorEhMelhor} />
        </Card>
      ))}
    </div>
  );
}

function IndicadorVariacao({ variacaoPercentual, maiorEhMelhor }: { variacaoPercentual: number | null; maiorEhMelhor: boolean }) {
  if (variacaoPercentual === null) { // sem período anterior pra comparar (ex: 1º mês de uso, ou período anterior zerado)
    return <span className="text-xs text-texto-secundario">Sem período anterior pra comparar</span>;
  }

  if (Math.abs(variacaoPercentual) < 0.05) { // variação "zero" de verdade (arredonda pra 0,0%): neutro, sem seta
    return (
      <span className="flex items-center gap-1 text-xs text-texto-secundario">
        <Minus className="h-3 w-3" aria-hidden /> Igual ao período anterior
      </span>
    );
  }

  const subiu = variacaoPercentual > 0;
  const ehBoaNoticia = subiu === maiorEhMelhor; // só a taxa de faltas/cancelamentos tem maiorEhMelhor=false (subir é ruim)
  const Icone = subiu ? ArrowUpRight : ArrowDownRight;

  return (
    <span className={`flex items-center gap-1 text-xs font-medium ${ehBoaNoticia ? "text-sucesso" : "text-erro"}`}>
      <Icone className="h-3 w-3" aria-hidden />
      {Math.abs(variacaoPercentual).toFixed(1).replace(".", ",")}% vs. período anterior
    </span>
  );
}
