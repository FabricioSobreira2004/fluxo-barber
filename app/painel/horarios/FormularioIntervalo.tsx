"use client"; // precisa do hook useActionState (só existe no navegador), por isso vira Client Component

import { useActionState } from "react"; // liga um <form> a uma Server Action e guarda o resultado/erro entre tentativas
import { Plus } from "lucide-react"; // ícone do botão de adicionar
import { Input } from "@/components/ui/Input"; // campo de hora estilizado
import { FormMessage } from "@/components/ui/FormMessage"; // caixa de mensagem de erro
import { adicionarIntervalo, type EstadoHorarios } from "./actions"; // Server Action e o formato do estado dela

const ESTADO_INICIAL: EstadoHorarios = {}; // nenhum erro antes do primeiro envio

interface PropriedadesFormularioIntervalo { // o que a página passa pra esse formulário, um por dia da semana
  barbeiroId: string; // de qual barbeiro é esse intervalo
  diaSemana: number; // de qual dia da semana (0 a 6) é esse intervalo
}

export function FormularioIntervalo({ barbeiroId, diaSemana }: PropriedadesFormularioIntervalo) {
  const acaoComDados = adicionarIntervalo.bind(null, barbeiroId, diaSemana); // já embute o barbeiro e o dia, só falta inicio/fim do form
  const [estado, acao, pendente] = useActionState(acaoComDados, ESTADO_INICIAL); // conecta o form à Server Action pré-preenchida

  return (
    <form action={acao} className="flex flex-col gap-2"> {/* ao enviar, o React chama a Server Action automaticamente */}
      {/* "flex-col" no celular: início/fim numa linha, botão embaixo em largura total (ver abaixo).
          A partir de "sm" (640px), volta a caber tudo numa linha só, como antes. */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="flex min-w-0 flex-1 items-center gap-2"> {/* "min-w-0": permite os campos encolherem de verdade, em vez de estourar a largura do card */}
          {/* "flex-1 min-w-0" em cada campo: os dois dividem o espaço disponível igualmente, e
              podem encolher abaixo da largura "natural" do campo de hora — sem isso (ex: "w-28"
              fixo de antes), a soma dos dois campos + botão não cabia em telas estreitas, e o
              botão era empurrado pra fora do card */}
          <Input type="time" name="inicio" required className="min-w-0 flex-1" aria-label="Início" />
          <span className="shrink-0 text-sm text-texto-secundario">até</span>
          <Input type="time" name="fim" required className="min-w-0 flex-1" aria-label="Fim" />
        </div>
        <button
          type="submit"
          disabled={pendente} // desabilita enquanto a Server Action está rodando
          // "w-full" no celular (ocupa a linha inteira, com o texto "Adicionar" visível) e volta a
          // ser um quadradinho só com o ícone ("sm:w-9", sem o texto) a partir de "sm", lado a lado
          // com os campos — o mesmo visual de antes em telas largas
          className="flex h-9 w-full shrink-0 items-center justify-center gap-1.5 rounded-lg border border-dourado px-3 text-sm text-dourado transition-colors hover:bg-dourado/10 disabled:opacity-50 sm:w-9 sm:px-0"
          aria-label="Adicionar intervalo"
        >
          <Plus className="h-4 w-4 shrink-0" aria-hidden /> {/* decorativo; o aria-label do botão já explica a ação pra leitor de tela */}
          <span className="sm:hidden">Adicionar</span> {/* só aparece junto do ícone quando o botão está em largura total (celular) */}
        </button>
      </div>
      <FormMessage tipo="erro">{estado.erro}</FormMessage> {/* só aparece quando "estado.erro" tem algum texto */}
    </form>
  );
}
