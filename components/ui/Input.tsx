import { type InputHTMLAttributes } from "react"; // tipo com todos os atributos que um <input> comum aceita

export function Input({ className = "", ...resto }: InputHTMLAttributes<HTMLInputElement>) { // campo de texto padrão do sistema
  return (
    <input
      className={ // fundo escuro (superfície), borda sutil, e borda dourada quando o campo está focado
        `w-full rounded-lg border border-borda bg-superficie px-3 py-2 text-texto placeholder:text-texto-secundario outline-none transition-colors focus:border-dourado ${className}`
      }
      {...resto} // repassa type, value, onChange, name, required etc. vindos de quem usar o componente
    />
  );
}
