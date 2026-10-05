import { type ReactNode } from "react"; // tipo genérico de "qualquer coisa que o React sabe renderizar"

interface PropriedadesDestaque { // o que o componente Destaque recebe
  children: ReactNode; // o trecho de texto a destacar (ex: "agendam sozinhos")
  className?: string; // classe extra opcional, usada pra marcar um grupo específico de destaques (ex: só os do subtítulo do hero) e animá-los à parte
}

// trecho de texto em dourado e semi-negrito, usado pra chamar atenção pra palavras-chave
// dentro de frases maiores (subtítulo do hero, descrição dos cards de benefício etc.)
// "inline-block": continua fluindo junto com o resto do parágrafo, mas passa a aceitar
// transform (scale) — é o que permite o GSAP dar o "pop" de realce no subtítulo do hero.
export function Destaque({ children, className = "" }: PropriedadesDestaque) {
  return <strong className={`inline-block font-semibold text-dourado ${className}`}>{children}</strong>;
}
