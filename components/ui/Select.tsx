import { type SelectHTMLAttributes } from "react"; // tipo com todos os atributos que um <select> comum aceita

export function Select({ className = "", ...resto }: SelectHTMLAttributes<HTMLSelectElement>) { // menu de opções padrão do sistema
  return (
    <select
      className={ // mesmo visual do Input, pra manter os campos de formulário consistentes
        `w-full rounded-lg border border-borda bg-superficie px-3 py-2 text-texto outline-none transition-colors focus:border-dourado ${className}`
      }
      {...resto} // repassa value, onChange, children (as <option>) etc.
    />
  );
}
