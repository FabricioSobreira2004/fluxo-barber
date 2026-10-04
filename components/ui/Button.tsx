import { type ButtonHTMLAttributes } from "react"; // tipo com todos os atributos que um <button> comum aceita

export type VarianteBotao = "primario" | "secundario" | "perigo"; // os 3 estilos visuais de botão usados no sistema

// função separada (sem JSX) porque também precisamos desse estilo em links que parecem botão (ex: CTA da landing page)
export function classesBotao(variante: VarianteBotao = "primario"): string {
  const base = // estilo comum a qualquer variante: tamanho, espaçamento, cantos arredondados, transição suave
    "inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed";

  const porVariante: Record<VarianteBotao, string> = { // estilo específico de cada variante
    primario: "bg-dourado text-fundo hover:bg-dourado-claro", // ação principal: fundo dourado bem visível
    secundario: "border border-dourado text-dourado hover:bg-dourado/10", // ação secundária: só contorno, mais discreto
    perigo: "border border-erro text-erro hover:bg-erro/10", // ações destrutivas, ex: cancelar um agendamento
  };

  return `${base} ${porVariante[variante]}`; // combina o estilo comum com o da variante escolhida
}

interface PropriedadesBotao extends ButtonHTMLAttributes<HTMLButtonElement> { // aceita tudo de um <button> normal, mais o campo abaixo
  variante?: VarianteBotao; // qual estilo visual usar (padrão: primário)
}

export function Button({ variante = "primario", className = "", ...resto }: PropriedadesBotao) { // botão padrão do sistema
  return <button className={`${classesBotao(variante)} ${className}`} {...resto} />; // aplica o estilo da variante e repassa onClick/type/disabled etc.
}
