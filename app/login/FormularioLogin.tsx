"use client"; // precisa do hook useActionState (só existe no navegador), por isso vira Client Component

import { useActionState } from "react"; // liga um <form> a uma Server Action e guarda o resultado/erro entre tentativas
import Link from "next/link"; // link pra ir pra tela de cadastro
import { Label } from "@/components/ui/Label"; // legenda dos campos do formulário
import { Input } from "@/components/ui/Input"; // campo de texto estilizado
import { Button } from "@/components/ui/Button"; // botão estilizado
import { FormMessage } from "@/components/ui/FormMessage"; // caixa de mensagem de erro/sucesso
import { AlertaSpam } from "@/components/AlertaSpam"; // aviso em destaque pra conferir a caixa de spam (ver também em /cadastro)
import { reenviarConfirmacao, type EstadoReenvio } from "@/app/auth/actions"; // Server Action de reenvio, compartilhada com /cadastro
import { entrar } from "./actions"; // Server Action de login

interface PropriedadesFormularioLogin { // o que a página de login passa pra esse componente
  redirecionarPara: string; // pra onde ir depois de logar (vem de ?redirecionar=... na URL)
}

const ESTADO_INICIAL_REENVIO: EstadoReenvio = {}; // nenhuma mensagem antes do primeiro clique em "Reenviar"

export function FormularioLogin({ redirecionarPara }: PropriedadesFormularioLogin) {
  const [estado, acao, pendente] = useActionState(entrar, {}); // nenhuma mensagem antes do primeiro envio
  // 2º hook, sempre chamado (regra do React: hooks não podem ser condicionais) -- só é de fato usado quando
  // o login falha com "email não confirmado" (estado.emailNaoConfirmado), mais abaixo
  const [estadoReenvio, acaoReenvio, reenviando] = useActionState(reenviarConfirmacao, ESTADO_INICIAL_REENVIO);

  return (
    <div className="flex flex-col gap-4">
      {estado.emailNaoConfirmado && ( // caso especial: a senha está certa, só falta confirmar o email — merece mais destaque que um erro comum
        <div className="flex flex-col gap-3 rounded-lg border border-aviso/40 bg-aviso/5 p-3">
          <p className="text-sm font-medium text-texto">Você ainda não confirmou seu email.</p>
          <AlertaSpam email={estado.emailNaoConfirmado} />

          <form action={acaoReenvio} className="flex flex-col gap-2">
            <input type="hidden" name="email" value={estado.emailNaoConfirmado} /> {/* mesmo email que tentou logar, sem pedir de novo */}
            <FormMessage tipo={estadoReenvio.erro ? "erro" : "sucesso"}>{estadoReenvio.erro ?? estadoReenvio.sucesso}</FormMessage>
            <Button type="submit" variante="secundario" disabled={reenviando} className="w-full">
              {reenviando ? "Reenviando..." : "Reenviar email de confirmação"}
            </Button>
          </form>
        </div>
      )}

      <form action={acao} className="flex flex-col gap-4"> {/* ao enviar, o React chama a Server Action automaticamente */}
        <input type="hidden" name="redirecionar" value={redirecionarPara} /> {/* viaja junto no FormData, sem o usuário precisar ver */}

        <div>
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" autoComplete="email" required /> {/* "required" dá uma validação básica no navegador */}
        </div>

        <div>
          <div className="flex items-baseline justify-between"> {/* legenda à esquerda, link de recuperação à direita */}
            <Label htmlFor="senha">Senha</Label>
            <Link href="/esqueci-senha" className="mb-1 text-xs text-dourado hover:text-dourado-claro">
              Esqueci minha senha
            </Link>
          </div>
          <Input id="senha" name="senha" type="password" autoComplete="current-password" required />
        </div>

        <FormMessage tipo="erro">{estado.erro}</FormMessage> {/* só aparece quando "estado.erro" tem algum texto (nunca junto com "emailNaoConfirmado", ver actions.ts) */}

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
    </div>
  );
}
