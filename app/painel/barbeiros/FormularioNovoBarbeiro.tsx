"use client"; // precisa do hook useActionState (só existe no navegador), por isso vira Client Component

import { useActionState } from "react"; // liga um <form> a uma Server Action e guarda o resultado/erro entre tentativas
import { Label } from "@/components/ui/Label"; // legenda do campo
import { Input } from "@/components/ui/Input"; // campo de texto estilizado
import { Button } from "@/components/ui/Button"; // botão estilizado
import { FormMessage } from "@/components/ui/FormMessage"; // caixa de mensagem de erro
import { criarBarbeiro, type EstadoBarbeiros } from "./actions"; // Server Action e o formato do estado dela

const ESTADO_INICIAL: EstadoBarbeiros = {}; // nenhum erro antes do primeiro envio

export function FormularioNovoBarbeiro() {
  const [estado, acao, pendente] = useActionState(criarBarbeiro, ESTADO_INICIAL); // conecta o form à Server Action "criarBarbeiro"

  return (
    <form action={acao} className="flex flex-col gap-3 sm:flex-row sm:items-end"> {/* lado a lado no desktop, empilhado no celular */}
      <div className="flex-1">
        <Label htmlFor="nome">Novo barbeiro</Label>
        <Input id="nome" name="nome" placeholder="Nome do barbeiro" required />
      </div>
      <Button type="submit" disabled={pendente}> {/* desabilita o botão enquanto a Server Action está rodando */}
        {pendente ? "Adicionando..." : "Adicionar"}
      </Button>
      <FormMessage tipo="erro">{estado.erro}</FormMessage> {/* só aparece quando "estado.erro" tem algum texto */}
    </form>
  );
}
