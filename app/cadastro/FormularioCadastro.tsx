"use client"; // precisa do hook useActionState (só existe no navegador), por isso vira Client Component

import { useActionState } from "react"; // liga um <form> a uma Server Action e guarda o resultado/erro entre tentativas
import Link from "next/link"; // link pra ir pra tela de login
import { Label } from "@/components/ui/Label"; // legenda dos campos do formulário
import { Input } from "@/components/ui/Input"; // campo de texto estilizado
import { Button } from "@/components/ui/Button"; // botão estilizado
import { FormMessage } from "@/components/ui/FormMessage"; // caixa de mensagem de erro/sucesso
import { cadastrar, reenviarConfirmacao, type EstadoCadastro, type EstadoReenvio } from "./actions"; // Server Actions de cadastro/reenvio e o formato dos estados delas

const ESTADO_INICIAL: EstadoCadastro = {}; // nenhuma mensagem antes do primeiro envio
const ESTADO_INICIAL_REENVIO: EstadoReenvio = {}; // nenhuma mensagem antes do primeiro clique em "Reenviar"

export function FormularioCadastro() {
  const [estado, acao, pendente] = useActionState(cadastrar, ESTADO_INICIAL); // conecta o form à Server Action "cadastrar"
  // 2º hook, ANTES de qualquer "return" condicional (regra do React: hooks sempre na mesma ordem em todo
  // render) — alimenta o botão "Reenviar" que só aparece depois do cadastro dar certo, mais abaixo
  const [estadoReenvio, acaoReenvio, reenviando] = useActionState(reenviarConfirmacao, ESTADO_INICIAL_REENVIO);

  if (estado.sucesso) { // conta criada, falta confirmar o email: não faz sentido mostrar o formulário de novo
    return (
      <div className="flex flex-col gap-4">
        <FormMessage tipo="sucesso">{estado.sucesso}</FormMessage>

        {/* não deixa o usuário "preso": se o email não chegar (spam, digitação errada no provedor, etc.),
            ele reenvia sem precisar recarregar a página nem perder o email já guardado no estado acima */}
        <form action={acaoReenvio} className="flex flex-col gap-2">
          <input type="hidden" name="email" value={estado.email} /> {/* mesmo email do cadastro, sem pedir de novo */}
          <FormMessage tipo={estadoReenvio.erro ? "erro" : "sucesso"}>{estadoReenvio.erro ?? estadoReenvio.sucesso}</FormMessage>
          <Button type="submit" variante="secundario" disabled={reenviando} className="w-full">
            {reenviando ? "Reenviando..." : "Não recebeu? Reenviar email de confirmação"}
          </Button>
        </form>

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

      <div className="flex items-start gap-2"> {/* checkbox exigida pela LGPD: a pessoa precisa concordar ANTES de criar a conta */}
        <input
          id="aceiteTermos"
          name="aceiteTermos"
          type="checkbox"
          required
          // "accent-dourado" pinta a caixa marcada na cor da identidade visual; o foco dourado já vem do globals.css
          className="mt-1 h-4 w-4 shrink-0 rounded border-borda bg-superficie accent-dourado"
        />
        <Label htmlFor="aceiteTermos" className="mb-0 text-xs leading-snug">
          Li e aceito os{" "}
          <Link href="/termos" target="_blank" className="text-dourado hover:text-dourado-claro">
            Termos de Uso
          </Link>{" "}
          e a{" "}
          <Link href="/privacidade" target="_blank" className="text-dourado hover:text-dourado-claro">
            Política de Privacidade
          </Link>
          .
        </Label>
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
