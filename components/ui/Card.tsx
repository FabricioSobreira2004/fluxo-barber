import { type HTMLAttributes } from "react"; // tipo com todos os atributos que uma <div> comum aceita

export function Card({ className = "", ...resto }: HTMLAttributes<HTMLDivElement>) { // bloco de "superfície" usado para agrupar conteúdo (formulários, listas, etc.)
  return (
    <div
      className={ // fundo um pouco mais claro que o body, com borda sutil e sombra leve, pra criar profundidade
        `rounded-xl border border-borda bg-superficie p-6 shadow-lg shadow-black/30 ${className}`
      }
      {...resto} // repassa children, onClick e qualquer outro atributo de div recebido por quem usa o Card
    />
  );
}
