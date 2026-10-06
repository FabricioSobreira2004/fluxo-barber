"use client"; // guarda se o card foi escondido (estado local) e chama a Server Action ao esconder

import { useState } from "react"; // controla se o checklist está visível nesta tela (depois de clicar em "Esconder")
import Link from "next/link"; // cada item pendente leva direto pra tela onde dá pra resolver ele
import { CircleCheckBig, Circle } from "lucide-react"; // ícone de "feito" e de "pendente" em cada item
import { Card } from "@/components/ui/Card"; // bloco de superfície padrão
import { esconderChecklist } from "./acoes-progresso"; // Server Action: grava que o usuário escondeu o checklist

export interface ItemChecklist { // um item da lista de primeiros passos
  chave: string; // identificador único (usado só como "key" do React)
  rotulo: string; // texto mostrado, ex: "Cadastrar pelo menos 1 barbeiro"
  feito: boolean; // calculado no servidor, a partir dos dados reais (quantidade de barbeiros, etc.)
  href?: string; // pra onde o botão "Resolver" desse item leva; sem "href", o item não tem botão (ver "dica" abaixo)
}

interface PropriedadesChecklist { // o que a página da Agenda passa pra esse card
  itensObrigatorios: ItemChecklist[]; // barbeiro, serviço e horários — sem eles, o link nem funciona
  itensProximos: ItemChecklist[]; // passos seguintes, que não bloqueiam o link
  escondidoInicialmente: boolean; // vem do servidor (user_metadata.checklist_escondido)
}

// texto de apoio pra itens sem "href" (não são algo que se resolve com 1 clique) — por chave,
// pra não precisar de mais um campo solto no tipo ItemChecklist só pra um caso só
const DICAS_SEM_BOTAO: Record<string, string> = {
  agendamento: "Compartilhe seu link para receber o primeiro.",
};

export function ChecklistPrimeirosPassos({ itensObrigatorios, itensProximos, escondidoInicialmente }: PropriedadesChecklist) {
  const [escondido, setEscondido] = useState(escondidoInicialmente); // controla a visibilidade nesta tela, sem esperar o servidor responder

  if (escondido) return null; // nada renderizado: nem o card, nem espaço vazio no lugar dele

  const todosItens = [...itensObrigatorios, ...itensProximos]; // só pra calcular o progresso geral (1 barra só, somando os 2 grupos)
  const totalFeitos = todosItens.filter((item) => item.feito).length;
  const progresso = Math.round((totalFeitos / todosItens.length) * 100);
  const tudoCompleto = totalFeitos === todosItens.length;

  function aoEsconder() { // roda ao clicar em "Esconder", só aparece quando tudo já está completo
    setEscondido(true); // some da tela na hora, sem esperar a Server Action terminar
    void esconderChecklist();
  }

  return (
    <Card data-tour="checklist-primeiros-passos" className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-display text-lg font-semibold text-texto">Primeiros passos</h2>
        <span className="text-xs lining-nums tabular-nums text-texto-secundario">
          {totalFeitos} de {todosItens.length}
        </span>
      </div>

      {/* barra de progresso: a trilha é um cinza sutil, o preenchimento é dourado e cresce via "width" */}
      <div className="h-2 overflow-hidden rounded-full bg-borda">
        <div
          className="h-full rounded-full bg-dourado transition-[width] duration-500 ease-out"
          style={{ width: `${progresso}%` }}
        />
      </div>

      {tudoCompleto ? ( // tudo feito: mensagem de parabéns, sem lista (não tem mais nada pendente pra mostrar)
        <div className="flex flex-col items-start gap-3">
          <p className="text-sm text-texto">
            🎉 Parabéns! Sua barbearia está pronta para receber agendamentos.
          </p>
          <button
            type="button"
            onClick={aoEsconder}
            className="text-sm text-dourado hover:text-dourado-claro"
          >
            Esconder
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <div>
              <h3 className="text-sm font-semibold text-texto">Obrigatório para receber agendamentos</h3>
              <p className="text-xs text-texto-secundario">Seu link só funciona depois desses 3 passos.</p>
            </div>
            <ListaItensChecklist itens={itensObrigatorios} />
          </div>

          <div className="flex flex-col gap-2">
            <h3 className="text-sm font-semibold text-texto">Próximos passos</h3>
            <ListaItensChecklist itens={itensProximos} />
          </div>
        </div>
      )}
    </Card>
  );
}

function ListaItensChecklist({ itens }: { itens: ItemChecklist[] }) { // a lista em si, reaproveitada pelos 2 grupos
  return (
    <ul className="flex flex-col gap-2">
      {itens.map((item) => (
        <li key={item.chave} className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            {item.feito ? ( // ícone preenchido e dourado quando já concluído; só o contorno, cinza, quando pendente
              <CircleCheckBig className="h-4 w-4 shrink-0 text-dourado" aria-hidden />
            ) : (
              <Circle className="h-4 w-4 shrink-0 text-texto-secundario" aria-hidden />
            )}
            <span className={item.feito ? "text-sm text-texto-secundario line-through" : "text-sm text-texto"}>
              {item.rotulo}
            </span>
          </div>
          {!item.feito && // só itens ainda pendentes mostram algo à direita
            (item.href ? ( // tem pra onde ir: botão "Resolver" de verdade
              <Link href={item.href} className="shrink-0 text-xs text-dourado hover:text-dourado-claro">
                Resolver
              </Link>
            ) : ( // não é algo que se resolve com 1 clique (ex: "receber o 1º agendamento"): só uma dica, sem link
              <span className="shrink-0 text-xs text-texto-secundario">{DICAS_SEM_BOTAO[item.chave]}</span>
            ))}
        </li>
      ))}
    </ul>
  );
}
