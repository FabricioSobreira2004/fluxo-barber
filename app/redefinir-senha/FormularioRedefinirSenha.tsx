"use client"; // precisa do hook useActionState (só existe no navegador), por isso vira Client Component

import { useActionState } from "react"; // liga um <form> a uma Server Action e guarda o resultado/erro entre tentativas
import Link from "next/link"; // link pra ir pra tela de login depois de trocar a senha
import { Label } from "@/components/ui/Label"; // legenda dos campos
import { Input } from "@/components/ui/Input"; // campo de texto estilizado
import { Button } from "@/components/ui/Button"; // botão estilizado
import { FormMessage } from "@/components/ui/FormMessage"; // caixa de mensagem de erro/sucesso
import { redefinirSenha, type EstadoRedefinirSenha } from "./actions"; // Server Action e o formato do estado dela

const ESTADO_INICIAL: EstadoRedefinirSenha = {}; // nenhuma mensagem antes do primeiro envio

export function FormularioRedefinirSenha() {
  const [estado, acao, pendente] = useActionState(redefinirSenha, ESTADO_INICIAL); // conecta o form à Server Action

  if (estado.sucesso) { // senha trocada: não faz sentido mostrar o formulário de novo
    return (
      <div className="flex flex-col gap-4">
        <FormMessage tipo="sucesso">Senha alterada com sucesso!</FormMessage>
        <Link href="/login" className="text-center text-sm text-dourado hover:text-dourado-claro">
          Ir para a tela de entrar
        </Link>
      </div>
    );
  }

  return (
    <form action={acao} className="flex flex-col gap-4"> {/* ao enviar, o React chama a Server Action automaticamente */}
      <div>
        <Label htmlFor="senha">Nova senha</Label>
        <Input id="senha" name="senha" type="password" autoComplete="new-password" required minLength={6} />
      </div>

      <div>
        <Label htmlFor="confirmarSenha">Confirmar nova senha</Label>
        <Input id="confirmarSenha" name="confirmarSenha" type="password" autoComplete="new-password" required minLength={6} />
      </div>

      <FormMessage tipo="erro">{estado.erro}</FormMessage> {/* só aparece quando "estado.erro" tem algum texto */}

      <Button type="submit" disabled={pendente} className="w-full"> {/* desabilita o botão enquanto a Server Action está rodando */}
        {pendente ? "Salvando..." : "Salvar nova senha"}
      </Button>
    </form>
  );
}
