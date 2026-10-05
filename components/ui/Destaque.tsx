import { type ReactNode } from "react"; // tipo genérico de "qualquer coisa que o React sabe renderizar"

interface PropriedadesDestaque { // o que o componente Destaque recebe
  children: ReactNode; // o trecho de texto a destacar (ex: "agendam sozinhos")
  className?: string; // classe extra opcional, usada pra marcar um grupo específico de destaques (ex: só os do subtítulo do hero) e animá-los à parte
}

// trecho de texto em dourado e semi-negrito, usado pra chamar atenção pra palavras-chave
// dentro de frases maiores (subtítulo do hero, descrição dos cards de benefício etc.)
//
// IMPORTANTE: fica como "inline" normal (o padrão de um <strong>), NUNCA "inline-block".
// Um "inline-block" vira uma caixa "atômica" pro navegador — e o navegador pode quebrar a
// linha logo depois dessa caixa mesmo sem espaço nenhum no texto, o que fazia a pontuação
// colada em seguida (ex: a vírgula de "...a qualquer hora<Destaque/>, sem...") "escapar" pra
// linha seguinte sozinha. Sendo "inline" puro, o destaque flui com o resto do texto como
// qualquer palavra normal, e a pontuação colada nunca mais se separa dele.
export function Destaque({ children, className = "" }: PropriedadesDestaque) {
  return <strong className={`font-semibold text-dourado ${className}`}>{children}</strong>;
}
