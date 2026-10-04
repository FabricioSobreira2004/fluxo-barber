import { type ReactNode } from "react"; // tipo genérico de "qualquer coisa que o React sabe renderizar"

export type TipoFormMessage = "erro" | "sucesso"; // os dois tipos de aviso usados nos formulários

interface PropriedadesFormMessage { // o que o componente FormMessage recebe
  tipo?: TipoFormMessage; // se é uma mensagem de erro ou de sucesso (padrão: erro, o caso mais comum em formulário)
  children?: ReactNode; // o texto da mensagem; se vier vazio, não mostramos nada
}

export function FormMessage({ tipo = "erro", children }: PropriedadesFormMessage) { // mensagem de feedback para o usuário após uma ação
  if (!children) return null; // sem mensagem pra mostrar: não ocupa espaço na tela

  const classes = // cor de fundo/texto/borda de acordo com o tipo da mensagem
    tipo === "erro"
      ? "border-erro/40 bg-erro/10 text-erro"
      : "border-sucesso/40 bg-sucesso/10 text-sucesso";

  return <p className={`rounded-lg border px-3 py-2 text-sm ${classes}`}>{children}</p>; // caixa de destaque com a mensagem
}
