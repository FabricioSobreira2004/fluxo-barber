"use client"; // precisa de useState/useActionState (hooks só existem no navegador), por isso vira Client Component

import { useActionState, useState } from "react"; // hooks de estado do React
import { Label } from "@/components/ui/Label"; // legenda dos campos do formulário
import { Input } from "@/components/ui/Input"; // campo de texto estilizado
import { Button } from "@/components/ui/Button"; // botão estilizado
import { FormMessage } from "@/components/ui/FormMessage"; // caixa de mensagem de erro
import { gerarSlug } from "@/utils/slug"; // mesma função usada no servidor, pra já mostrar o slug em tempo real
import { criarBarbearia, type EstadoOnboarding } from "./actions"; // Server Action e o formato do estado dela

const ESTADO_INICIAL: EstadoOnboarding = {}; // nenhum erro antes do primeiro envio

export function FormularioOnboarding() {
  const [estado, acao, pendente] = useActionState(criarBarbearia, ESTADO_INICIAL); // conecta o form à Server Action
  const [nome, setNome] = useState(""); // nome digitado, usado pra gerar o slug sugerido
  const [slug, setSlug] = useState(""); // valor mostrado no campo de slug
  const [slugEditadoManualmente, setSlugEditadoManualmente] = useState(false); // true assim que o usuário mexe direto no campo de slug

  function aoDigitarNome(valor: string) { // chamado a cada letra digitada no campo "nome"
    setNome(valor);
    if (!slugEditadoManualmente) { // só continua auto-gerando enquanto o usuário não tiver editado o slug na mão
      setSlug(gerarSlug(valor));
    }
  }

  function aoDigitarSlug(valor: string) { // chamado a cada letra digitada no campo "slug"
    setSlugEditadoManualmente(true); // a partir de agora, parar de sobrescrever esse campo com base no nome
    setSlug(valor);
  }

  return (
    <form action={acao} className="flex flex-col gap-4"> {/* ao enviar, o React chama a Server Action automaticamente */}
      <div>
        <Label htmlFor="nome">Nome da barbearia</Label>
        <Input
          id="nome"
          name="nome"
          value={nome}
          onChange={(evento) => aoDigitarNome(evento.target.value)} // atualiza o nome e (se aplicável) o slug sugerido
          placeholder="Barbearia do Zé"
          required
        />
      </div>

      <div>
        <Label htmlFor="slug">Endereço da página pública</Label>
        <div className="flex items-center gap-1"> {/* prefixo "/b/" fixo, só o slug é editável */}
          <span className="text-sm text-texto-secundario">/b/</span>
          <Input
            id="slug"
            name="slug"
            value={slug}
            onChange={(evento) => aoDigitarSlug(evento.target.value)} // edição manual trava a auto-geração
            placeholder="barbearia-do-ze"
            required
            className="flex-1"
          />
        </div>
      </div>

      <FormMessage tipo="erro">{estado.erro}</FormMessage> {/* só aparece quando "estado.erro" tem algum texto */}

      <Button type="submit" disabled={pendente} className="w-full"> {/* desabilita o botão enquanto a Server Action está rodando */}
        {pendente ? "Criando..." : "Criar barbearia"}
      </Button>
    </form>
  );
}
