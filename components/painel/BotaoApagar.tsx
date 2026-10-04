"use client"; // precisa confirmar com o usuário (window.confirm) e guardar o erro, por isso vira Client Component

import { useActionState, type FormEvent } from "react"; // hook que liga o form a uma Server Action e guarda o resultado
import { FormMessage } from "@/components/ui/FormMessage"; // caixa de mensagem de erro

interface EstadoApagar { // formato do "estado" devolvido pela Server Action de apagar
  erro?: string; // mensagem de erro, ex: quando existem agendamentos ligados ao registro
}

interface PropriedadesBotaoApagar { // o que a página passa pra esse botão
  acao: (estadoAnterior: EstadoApagar, formData: FormData) => Promise<EstadoApagar>; // Server Action de apagar, já com o id "pré-preenchido" via bind
  mensagemConfirmacao: string; // texto mostrado na caixa de confirmação do navegador
}

export function BotaoApagar({ acao, mensagemConfirmacao }: PropriedadesBotaoApagar) { // botão "Apagar" reutilizado em Barbeiros e Serviços
  const [estado, acaoForm, pendente] = useActionState(acao, {}); // conecta o form à Server Action e guarda o erro (se houver)

  function aoSubmeter(evento: FormEvent<HTMLFormElement>) { // roda antes do form ser de fato enviado
    if (!window.confirm(mensagemConfirmacao)) { // pede confirmação; se o usuário clicar em "Cancelar"...
      evento.preventDefault(); // ...cancela o envio, nada é apagado
    }
  }

  return (
    <div className="flex flex-col items-end gap-1"> {/* alinhado à direita, pra ficar ao lado do botão de ativar/desativar */}
      <form action={acaoForm} onSubmit={aoSubmeter}>
        <button
          type="submit"
          disabled={pendente} // desabilita enquanto a Server Action está rodando
          className="text-sm text-erro transition-colors hover:underline disabled:opacity-50"
        >
          {pendente ? "Apagando..." : "Apagar"}
        </button>
      </form>
      {estado.erro && <FormMessage tipo="erro">{estado.erro}</FormMessage>} {/* só aparece se a Server Action recusou apagar */}
    </div>
  );
}
