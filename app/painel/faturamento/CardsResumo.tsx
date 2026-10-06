"use client"; // precisa do GSAP (contagem animada) e de um ref, que só existem no navegador

import { useRef, type ReactNode } from "react"; // referência pro contêiner (escopo da animação) e tipo de "ícone já pronto"
import { useGSAP } from "@gsap/react"; // hook oficial do GSAP pra React: limpa a animação sozinho ao desmontar
import gsap from "gsap"; // motor de animação
import { ArrowUpRight, ArrowDownRight, Minus } from "lucide-react"; // setas de variação (sobe/desce) e "sem variação"
import { centavosParaReais } from "@/utils/dinheiro"; // formata centavos pra "25,90" (mesma função usada no resto do site)

export type UnidadeCard = "centavos" | "quantidade" | "percentual"; // os 3 jeitos de formatar o valor de um card

export interface DadosCardResumo {
  chave: string; // "key" da lista, e também usada pra achar o card "Faturamento realizado" (ver cardPrincipal abaixo)
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

  // "Faturamento realizado" é o card principal (maior, com mais destaque dourado); os outros 4 ficam
  // numa segunda fileira, mais discretos — "find" (não a posição 0) pra não quebrar se page.tsx
  // um dia mudar a ordem dos cards
  const cardPrincipal = cards.find((card) => card.chave === "realizado") ?? cards[0];
  const cardsSecundarios = cards.filter((card) => card.chave !== cardPrincipal.chave);

  return (
    <div ref={containerRef} className="flex flex-col gap-4">
      <CardPrincipal card={cardPrincipal} />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"> {/* 1 coluna no celular, 4 no desktop */}
        {cardsSecundarios.map((card) => (
          <CardSecundario key={card.chave} card={card} />
        ))}
      </div>
    </div>
  );
}

// o card "Faturamento realizado": mesma identidade dourada dos cards da landing (ver card-beneficio em
// Beneficios.tsx), só que mais forte — é o número que o dono mais quer ver de cara ao abrir a tela
function CardPrincipal({ card }: { card: DadosCardResumo }) {
  return (
    <div
      className={ // "motion-safe:" protege só a TRANSIÇÃO/animação (quem pediu menos movimento ainda vê a borda/brilho dourado, só sem o deslize)
        "group relative overflow-hidden rounded-2xl border border-dourado/40 bg-gradient-to-br from-dourado/10 via-superficie to-superficie p-6 shadow-lg shadow-black/30 motion-safe:transition-[transform,border-color,box-shadow] motion-safe:duration-300 motion-safe:hover:-translate-y-1 motion-safe:hover:border-dourado/70 motion-safe:hover:shadow-[0_0_40px_-12px_rgba(201,162,39,0.5)] sm:p-8"
      }
    >
      {/* brilho suave e fixo no canto (sem depender de animação), reforçando o acabamento "premium" */}
      <div className="pointer-events-none absolute -top-10 -right-10 h-40 w-40 rounded-full bg-dourado/10 blur-3xl" aria-hidden />

      <div className="relative flex items-center gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-dourado/15 text-dourado sm:h-12 sm:w-12">
          {card.icone}
        </div>
        <span className="text-sm font-medium text-texto-secundario sm:text-base">{card.titulo}</span>
      </div>

      <div className="relative mt-4 flex flex-col gap-1">
        {card.indisponivel ? ( // esse card nunca cai aqui na prática ("realizado" sempre tem unidade "centavos"), mas mantém o mesmo contrato dos outros
          <span className="font-sans text-3xl font-semibold text-texto-secundario sm:text-4xl">—</span>
        ) : (
          // "text-dourado" (em vez de "text-texto"): é o único valor em dourado da tela, reforçando que
          // este é O número principal; ver o comentário completo da contagem GSAP e do lining-nums/tabular-nums no CardSecundario abaixo
          <span
            className="fat-valor font-sans text-3xl font-bold lining-nums tabular-nums text-dourado sm:text-4xl"
            data-valor-final={card.valor}
            data-unidade={card.unidade}
          >
            {formatarValor(card.valor, card.unidade)}
          </span>
        )}
        <IndicadorVariacao variacaoPercentual={card.variacaoPercentual} maiorEhMelhor={card.maiorEhMelhor} />
      </div>
    </div>
  );
}

// os outros 4 cards: mesma identidade visual do principal, só mais discreta (borda e brilho mais fracos,
// sem o círculo do ícone maior nem o número em dourado) — pra não competir com o card principal
function CardSecundario({ card }: { card: DadosCardResumo }) {
  return (
    <div className="group relative flex flex-col gap-2 overflow-hidden rounded-xl border border-dourado/15 bg-superficie p-5 shadow-lg shadow-black/30 motion-safe:transition-[transform,border-color] motion-safe:duration-300 motion-safe:hover:-translate-y-0.5 motion-safe:hover:border-dourado/50">
      <div className="flex items-center gap-2">
        <span className="text-dourado">{card.icone}</span>
        <span className="text-sm text-texto-secundario">{card.titulo}</span>
      </div>

      {card.indisponivel ? ( // só a "taxa" pode cair aqui: sem nenhum atendimento finalizado, não há taxa pra mostrar
        <span className="font-sans text-2xl font-semibold text-texto-secundario">—</span>
      ) : (
        // o texto já nasce com o valor FINAL certo (funciona sem JavaScript também); o GSAP acima só reseta pra 0 e conta de novo,
        // quando o navegador permite animação — ver o comentário completo no useGSAP acima.
        // "font-sans" (não "font-display"): a Playfair tem algarismos "antigos" (oldstyle, alturas
        // variadas), que pareciam "pular" durante a contagem; "lining-nums tabular-nums" garante
        // algarismos alinhados e de largura fixa, pra não mudar de tamanho a cada frame da animação
        <span
          className="fat-valor font-sans text-2xl font-semibold lining-nums tabular-nums text-texto"
          data-valor-final={card.valor}
          data-unidade={card.unidade}
        >
          {formatarValor(card.valor, card.unidade)}
        </span>
      )}

      <IndicadorVariacao variacaoPercentual={card.variacaoPercentual} maiorEhMelhor={card.maiorEhMelhor} />
    </div>
  );
}

function IndicadorVariacao({ variacaoPercentual, maiorEhMelhor }: { variacaoPercentual: number | null; maiorEhMelhor: boolean }) {
  if (variacaoPercentual === null) { // sem NENHUM dado no período anterior pra comparar (ex: 1º mês de uso, ou período anterior zerado)
    return <span className="text-xs text-texto-secundario">Sem dados do período anterior</span>;
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
