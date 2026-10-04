"use client"; // precisa do hook useActionState (só existe no navegador), por isso vira Client Component

import { useActionState } from "react"; // liga um <form> a uma Server Action e guarda o resultado/erro entre tentativas
import Link from "next/link"; // link pra abrir a página pública da barbearia
import { Label } from "@/components/ui/Label"; // legenda dos campos do formulário
import { Input } from "@/components/ui/Input"; // campo de texto estilizado
import { Button } from "@/components/ui/Button"; // botão estilizado
import { FormMessage } from "@/components/ui/FormMessage"; // caixa de mensagem de erro/sucesso
import { Card } from "@/components/ui/Card"; // bloco de superfície que envolve o formulário
import { atualizarBarbearia, type EstadoConfiguracoes } from "./actions"; // Server Action e o formato do estado dela

interface Barbearia { // só os campos que este formulário usa
  id: string;
  nome: string;
  slug: string;
  telefone: string | null;
  endereco: string | null;
}

const ESTADO_INICIAL: EstadoConfiguracoes = {}; // nenhuma mensagem antes do primeiro envio

export function FormularioConfiguracoes({ barbearia }: { barbearia: Barbearia }) {
  const [estado, acao, pendente] = useActionState(atualizarBarbearia, ESTADO_INICIAL); // conecta o form à Server Action

  return (
    <Card className="max-w-xl">
      <form action={acao} className="flex flex-col gap-4"> {/* ao enviar, o React chama a Server Action automaticamente */}
        <input type="hidden" name="id" value={barbearia.id} /> {/* viaja junto no FormData, sem o usuário precisar ver */}

        <div>
          <Label>Endereço público</Label>
          <Link
            href={`/b/${barbearia.slug}`}
            target="_blank" // abre em outra aba, pra não perder o formulário de configurações
            className="text-sm text-dourado hover:text-dourado-claro"
          >
            /b/{barbearia.slug} {/* o slug em si não é editável aqui, pra não quebrar links já compartilhados */}
          </Link>
        </div>

        <div>
          <Label htmlFor="nome">Nome da barbearia</Label>
          <Input id="nome" name="nome" defaultValue={barbearia.nome} required />
        </div>

        <div>
          <Label htmlFor="telefone">Telefone</Label>
          <Input id="telefone" name="telefone" defaultValue={barbearia.telefone ?? ""} placeholder="(11) 99999-9999" />
        </div>

        <div>
          <Label htmlFor="endereco">Endereço</Label>
          <Input id="endereco" name="endereco" defaultValue={barbearia.endereco ?? ""} placeholder="Rua Exemplo, 123" />
        </div>

        <FormMessage tipo="sucesso">{estado.sucesso}</FormMessage> {/* só aparece quando "estado.sucesso" tem algum texto */}
        <FormMessage tipo="erro">{estado.erro}</FormMessage> {/* só aparece quando "estado.erro" tem algum texto */}

        <Button type="submit" disabled={pendente} className="w-full sm:w-auto"> {/* desabilita o botão enquanto a Server Action está rodando */}
          {pendente ? "Salvando..." : "Salvar alterações"}
        </Button>
      </form>
    </Card>
  );
}
