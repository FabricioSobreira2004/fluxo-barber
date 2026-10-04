"use client"; // precisa do hook useActionState (só existe no navegador), por isso vira Client Component

import { useActionState } from "react"; // liga um <form> a uma Server Action e guarda o resultado/erro entre tentativas
import Link from "next/link"; // link pra ir pra tela de login
import { Label } from "@/components/ui/Label"; // legenda dos campos do formulário
import { Input } from "@/components/ui/Input"; // campo de texto estilizado
import { Button } from "@/components/ui/Button"; // botão estilizado
import { FormMessage } from "@/components/ui/FormMessage"; // caixa de mensagem de erro/sucesso
import { cadastrar, type EstadoCadastro } from "./actions"; // Server Action de cadastro e o formato do estado dela

const ESTADO_INICIAL: EstadoCadastro = {}; // nenhuma mensagem antes do primeiro envio

export function FormularioCadastro() {
  const [estado, acao, pendente] = useActionState(cadastrar, ESTADO_INICIAL); // conecta o form à Server Action "cadastrar"

  if (estado.sucesso) { // conta criada, falta confirmar o email: não faz sentido mostrar o formulário de novo
    return (
      <div className="flex flex-col gap-4">
        <FormMessage tipo="sucesso">{estado.sucesso}</FormMessage>
        <Link href="/login" className="text-center text-sm text-dourado hover:text-dourado-claro">
          Ir para a tela de entrar
        </Link>
      </div>
    );
  }

  return (
    <form action={acao} className="flex flex-col gap-4"> {/* ao enviar, o React chama a Server Action automaticamente */}
      <div>
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" autoComplete="email" required />
      </div>

      <div>
        <Label htmlFor="senha">Senha</Label>
        <Input id="senha" name="senha" type="password" autoComplete="new-password" required minLength={6} />
      </div>

      <div>
        <Label htmlFor="confirmarSenha">Confirmar senha</Label>
        <Input id="confirmarSenha" name="confirmarSenha" type="password" autoComplete="new-password" required minLength={6} />
      </div>

      <FormMessage tipo="erro">{estado.erro}</FormMessage> {/* só aparece quando "estado.erro" tem algum texto */}

      <Button type="submit" disabled={pendente} className="w-full"> {/* desabilita o botão enquanto a Server Action está rodando */}
        {pendente ? "Criando conta..." : "Criar conta"}
      </Button>

      <p className="text-center text-sm text-texto-secundario">
        Já tem conta?{" "}
        <Link href="/login" className="text-dourado hover:text-dourado-claro">
          Entrar
        </Link>
      </p>
    </form>
  );
}
