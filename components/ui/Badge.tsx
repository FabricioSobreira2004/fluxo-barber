import { type ReactNode } from "react"; // tipo genérico de "qualquer coisa que o React sabe renderizar"

export type VarianteBadge = "neutro" | "sucesso" | "erro" | "aviso"; // as cores de badge disponíveis no sistema

const CLASSES_POR_VARIANTE: Record<VarianteBadge, string> = { // mapa de cor por variante, centralizado aqui pra não espalhar strings soltas
  neutro: "bg-borda text-texto-secundario", // estado neutro (ex: "agendado"), sem chamar muita atenção
  sucesso: "bg-sucesso/15 text-sucesso", // estado positivo (ex: "concluído")
  erro: "bg-erro/15 text-erro", // estado negativo (ex: "cancelado")
  aviso: "bg-aviso/15 text-aviso", // estado de atenção (ex: "faltou")
};

interface PropriedadesBadge { // o que o componente Badge recebe
  variante?: VarianteBadge; // qual cor usar (padrão: neutro)
  children: ReactNode; // o texto/conteúdo exibido dentro do badge
}

export function Badge({ variante = "neutro", children }: PropriedadesBadge) { // etiqueta pequena usada pra mostrar status
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${CLASSES_POR_VARIANTE[variante]}`}>
      {children}
    </span>
  );
}
