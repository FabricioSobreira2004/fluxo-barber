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
      <div className="flex items-center gap-2">
        <Input type="time" name="inicio" required className="w-28" aria-label="Início" />
        <span className="text-sm text-texto-secundario">até</span>
        <Input type="time" name="fim" required className="w-28" aria-label="Fim" />
        <button
          type="submit"
          disabled={pendente} // desabilita enquanto a Server Action está rodando
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-dourado text-dourado transition-colors hover:bg-dourado/10 disabled:opacity-50"
          aria-label="Adicionar intervalo"
        >
          <Plus className="h-4 w-4" aria-hidden /> {/* ícone decorativo; aria-label no botão já explica a ação pra leitor de tela */}
        </button>
      </div>
      <FormMessage tipo="erro">{estado.erro}</FormMessage> {/* só aparece quando "estado.erro" tem algum texto */}
    </form>
  );
}
