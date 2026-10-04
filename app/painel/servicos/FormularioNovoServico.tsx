"use client"; // precisa do hook useActionState (só existe no navegador), por isso vira Client Component

import { useActionState } from "react"; // liga um <form> a uma Server Action e guarda o resultado/erro entre tentativas
import { Label } from "@/components/ui/Label"; // legenda dos campos
import { Input } from "@/components/ui/Input"; // campo de texto estilizado
import { Button } from "@/components/ui/Button"; // botão estilizado
import { FormMessage } from "@/components/ui/FormMessage"; // caixa de mensagem de erro
import { criarServico, type EstadoServicos } from "./actions"; // Server Action e o formato do estado dela

const ESTADO_INICIAL: EstadoServicos = {}; // nenhum erro antes do primeiro envio

export function FormularioNovoServico() {
  const [estado, acao, pendente] = useActionState(criarServico, ESTADO_INICIAL); // conecta o form à Server Action "criarServico"

  return (
    <form action={acao} className="flex flex-col gap-3"> {/* ao enviar, o React chama a Server Action automaticamente */}
      <div>
        <Label htmlFor="nome">Nome do serviço</Label>
        <Input id="nome" name="nome" placeholder="Corte de cabelo" required />
      </div>

      <div className="flex gap-3">
        <div className="flex-1">
          <Label htmlFor="duracao">Duração (minutos)</Label>
          <Input id="duracao" name="duracao" type="number" min={1} step={1} placeholder="30" required />
        </div>
        <div className="flex-1">
          <Label htmlFor="preco">Preço (R$)</Label>
          <Input id="preco" name="preco" inputMode="decimal" placeholder="25,90" required /> {/* texto (não "number") pra aceitar vírgula */}
        </div>
      </div>

      <FormMessage tipo="erro">{estado.erro}</FormMessage> {/* só aparece quando "estado.erro" tem algum texto */}

      <Button type="submit" disabled={pendente} className="w-full sm:w-auto"> {/* desabilita o botão enquanto a Server Action está rodando */}
        {pendente ? "Adicionando..." : "Adicionar serviço"}
      </Button>
    </form>
  );
}
