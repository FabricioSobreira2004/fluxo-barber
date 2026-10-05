"use client"; // precisa rodar no navegador pra animar as listras com GSAP (só quando "animado" for true)

import { useId, useRef, type SVGProps } from "react"; // useId gera um sufixo único por instância, pra não duplicar ids de <pattern> na página
import { useGSAP } from "@gsap/react"; // hook oficial do GSAP pra React: já limpa a animação sozinho ao desmontar
import gsap from "gsap"; // motor de animação

gsap.registerPlugin(useGSAP); // registra o hook antes de usar (exigido pelo GSAP)

// as duas paletas de listras disponíveis; as tampas (topo/base) são SEMPRE douradas nas duas, por pedido do usuário
const PALETAS = {
  classica: { corA: "#DC2626", corB: "#2563EB" }, // vermelho e azul, poste de barbeiro tradicional
  tema: { corA: "#E0C068", corB: "#0B0B0B" }, // dourado-claro e preto, combinando com a identidade visual da marca
} as const;

// TROQUE AQUI pra usar a variante "tema" (dourado/branco/preto) como padrão no site inteiro
const VARIANTE_PADRAO: keyof typeof PALETAS = "classica";

interface PropriedadesPosteBarbeiro extends SVGProps<SVGSVGElement> { // aceita tudo que um <svg> normal aceita (className, etc.)
  variante?: keyof typeof PALETAS; // "classica" (vermelho/branco/azul) ou "tema" (dourado/branco/preto); padrão: VARIANTE_PADRAO
  animado?: boolean; // true só na landing page: faz as listras girarem devagar, como um poste de barbearia de verdade
}

export function PosteBarbeiro({ variante = VARIANTE_PADRAO, animado = false, ...resto }: PropriedadesPosteBarbeiro) {
  const idPattern = `poste-listras-${useId()}`; // id único por instância, pra duas logos na mesma página não brigarem pelo mesmo <pattern>
  const { corA, corB } = PALETAS[variante]; // as duas cores "vivas" das listras (a 3ª, branca, é fixa)
  const dourado = "#C9A227"; // cor das tampas, sempre a mesma nas duas variantes
  const listrasRef = useRef<SVGPatternElement>(null); // referência ao <pattern>: é ele que o GSAP desloca pra criar o giro

  useGSAP(() => {
    if (!animado) return; // nas outras páginas (painel, login, etc.) o poste fica parado, sem nenhum custo de animação
    const mm = gsap.matchMedia(); // controlador que respeita o "prefers-reduced-motion" do sistema operacional

    mm.add("(prefers-reduced-motion: no-preference)", () => {
      // desloca o padrão exatamente 1 "tile" (16px): como ele se repete a cada 16px, a volta ao início é invisível,
      // e o efeito é uma listra girando sem parar, de forma contínua e suave
      gsap.to(listrasRef.current, {
        attr: { x: 16, y: 16 },
        duration: 3,
        ease: "none", // velocidade constante, igual a um poste de barbeiro de verdade (sem acelerar/desacelerar)
        repeat: -1, // repete pra sempre
      });
    });

    return () => mm.revert(); // para a animação e remove o listener de media query ao desmontar
  }, [animado]);

  return (
    <svg viewBox="0 0 40 100" fill="none" xmlns="http://www.w3.org/2000/svg" {...resto}>
      <defs>
        {/* listras retas de 16x16, repetidas infinitamente e giradas 45°: assim elas aparecem diagonais no cilindro,
            sem eu precisar desenhar cada paralelogramo na mão */}
        <pattern
          ref={listrasRef}
          id={idPattern}
          width="16"
          height="16"
          patternUnits="userSpaceOnUse"
          patternTransform="rotate(45)"
        >
          <rect width="16" height="16" fill="#F5F5F5" /> {/* fundo branco da listra do meio */}
          <rect width="16" height="5.33" fill={corA} /> {/* 1ª faixa (vermelho ou dourado-claro) */}
          <rect y="10.66" width="16" height="5.34" fill={corB} /> {/* 3ª faixa (azul ou preto) */}
        </pattern>
      </defs>

      <circle cx="20" cy="6" r="4" fill={dourado} /> {/* bolinha decorativa no topo, clássica do poste de barbeiro */}
      <rect x="9" y="10" width="22" height="11" rx="5.5" fill={dourado} /> {/* tampa superior */}
      <rect // cilindro giratório: o preenchimento é o pattern de listras, cortado automaticamente pelo formato arredondado deste retângulo
        x="11"
        y="19"
        width="18"
        height="64"
        rx="9"
        fill={`url(#${idPattern})`}
        stroke={dourado}
        strokeWidth="0.75"
      />
      <rect x="9" y="81" width="22" height="11" rx="5.5" fill={dourado} /> {/* tampa inferior */}
      <rect x="15" y="90" width="10" height="5" rx="2" fill={dourado} /> {/* pequena base de apoio */}
    </svg>
  );
}
