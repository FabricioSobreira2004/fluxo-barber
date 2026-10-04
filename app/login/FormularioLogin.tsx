"use client"; // precisa do hook useActionState (só existe no navegador), por isso vira Client Component

import { useActionState } from "react"; // liga um <form> a uma Server Action e guarda o resultado/erro entre tentativas
import Link from "next/link"; // link pra ir pra tela de cadastro
import { Label } from "@/components/ui/Label"; // legenda dos campos do formulário
import { Input } from "@/components/ui/Input"; // campo de texto estilizado
import { Button } from "@/components/ui/Button"; // botão estilizado
import { FormMessage } from "@/components/ui/FormMessage"; // caixa de mensagem de erro/sucesso
import { entrar } from "./actions"; // Server Action de login

interface PropriedadesFormularioLogin { // o que a página de login passa pra esse componente
  redirecionarPara: string; // pra onde ir depois de logar (vem de ?redirecionar=... na URL)
  erroInicial?: string; // erro vindo de outra página (ex: link de confirmação de email inválido)
}

export function FormularioLogin({ redirecionarPara, erroInicial }: PropriedadesFormularioLogin) {
  const [estado, acao, pendente] = useActionState(entrar, { erro: erroInicial }); // já começa com o erro, se vier algum

  return (
    <form action={acao} className="flex flex-col gap-4"> {/* ao enviar, o React chama a Server Action automaticamente */}
      <input type="hidden" name="redirecionar" value={redirecionarPara} /> {/* viaja junto no FormData, sem o usuário precisar ver */}

      <div>
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" autoComplete="email" required /> {/* "required" dá uma validação básica no navegador */}
      </div>

      <div>
        <Label htmlFor="senha">Senha</Label>
        <Input id="senha" name="senha" type="password" autoComplete="current-password" required />
      </div>

      <FormMessage tipo="erro">{estado.erro}</FormMessage> {/* só aparece quando "estado.erro" tem algum texto */}

      <Button type="submit" disabled={pendente} className="w-full"> {/* desabilita o botão enquanto a Server Action está rodando */}
        {pendente ? "Entrando..." : "Entrar"}
      </Button>

      <p className="text-center text-sm text-texto-secundario">
        Não tem conta?{" "}
        <Link href="/cadastro" className="text-dourado hover:text-dourado-claro">
          Criar conta
        </Link>
      </p>
    </form>
  );
}
