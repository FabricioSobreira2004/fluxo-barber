import { type LabelHTMLAttributes } from "react"; // tipo com todos os atributos que um <label> comum aceita

export function Label({ className = "", ...resto }: LabelHTMLAttributes<HTMLLabelElement>) { // legenda padrão para campos de formulário
  return (
    <label
      className={`mb-1 block text-sm text-texto-secundario ${className}`} // texto pequeno e discreto, acima do campo
      {...resto} // repassa htmlFor, etc.
    />
  );
}
