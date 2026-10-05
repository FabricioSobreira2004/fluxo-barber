"use client"; // precisa do usePathname (hook do navegador) pra destacar o item de menu da página atual

import Link from "next/link"; // navegação entre as páginas do painel
import { usePathname } from "next/navigation"; // descobre qual rota está ativa agora
import { type ReactNode } from "react"; // tipo genérico de "qualquer coisa que o React sabe renderizar"
import { CalendarDays, Users, Scissors, Clock, Settings } from "lucide-react"; // ícones de cada item do menu
import { Logo } from "@/components/ui/Logo"; // marca "Fluxo Barber"

const ITENS_MENU = [ // os 5 destinos do painel, nessa ordem, tanto no menu lateral quanto no inferior
  { href: "/painel/agenda", rotulo: "Agenda", Icone: CalendarDays, dataTour: undefined },
  { href: "/painel/barbeiros", rotulo: "Barbeiros", Icone: Users, dataTour: "menu-barbeiros" }, // "dataTour": onde o tour guiado (components/painel/Tour.tsx) encontra esse item pra destacar
  { href: "/painel/servicos", rotulo: "Serviços", Icone: Scissors, dataTour: "menu-servicos" },
  { href: "/painel/horarios", rotulo: "Horários", Icone: Clock, dataTour: "menu-horarios" },
  { href: "/painel/configuracoes", rotulo: "Configurações", Icone: Settings, dataTour: undefined },
];

interface PropriedadesPainelShell { // o que o layout (Server Component) precisa passar pra cá
  nomeBarbearia: string; // mostrado no topo, pra confirmar em qual barbearia o usuário está
  botaoSair: ReactNode; // vem pronto de fora porque BotaoSair é um Server Component (usa Server Action)
  children: ReactNode; // o conteúdo da página atual (Agenda, Barbeiros, etc.)
}

export function PainelShell({ nomeBarbearia, botaoSair, children }: PropriedadesPainelShell) {
  const caminhoAtual = usePathname(); // ex: "/painel/barbeiros", usado pra saber qual item destacar

  return (
    <div className="flex min-h-screen flex-col md:flex-row"> {/* empilhado no celular, lado a lado no desktop */}
      <aside className="hidden w-64 shrink-0 flex-col border-r border-borda bg-superficie p-6 md:flex"> {/* menu lateral só aparece a partir de "md" */}
        <Logo className="mb-1 text-xl" />
        <p className="mb-8 truncate text-sm text-texto-secundario">{nomeBarbearia}</p>

        <nav className="flex flex-1 flex-col gap-1">
          {ITENS_MENU.map(({ href, rotulo, Icone, dataTour }) => {
            const ativo = caminhoAtual.startsWith(href); // true quando a rota atual é essa (ou uma sub-rota dela)
            return (
              <Link
                key={href}
                href={href}
                data-tour={dataTour} // undefined simplesmente não gera o atributo; o tour guiado procura só os itens que têm esse valor
                className={ // destaque dourado no item ativo, cinza nos demais
                  `flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                    ativo ? "bg-dourado/10 text-dourado" : "text-texto-secundario hover:bg-borda hover:text-texto"
                  }`
                }
              >
                <Icone className="h-4 w-4" aria-hidden /> {/* ícone decorativo; o rótulo ao lado já identifica o link */}
                {rotulo}
              </Link>
            );
          })}
        </nav>

        {botaoSair}
      </aside>

      <header className="flex items-center justify-between border-b border-borda px-4 py-3 md:hidden"> {/* topo só no celular (no desktop o nome já está na sidebar) */}
        <div className="flex flex-col">
          <Logo className="text-lg" />
          <span className="truncate text-xs text-texto-secundario">{nomeBarbearia}</span>
        </div>
        {botaoSair}
      </header>

      <main className="flex-1 overflow-y-auto p-4 pb-24 md:p-8 md:pb-8"> {/* padding extra embaixo no celular, pra não ficar atrás do menu fixo */}
        {children}
      </main>

      <nav className="fixed inset-x-0 bottom-0 flex border-t border-borda bg-superficie md:hidden"> {/* menu inferior só no celular */}
        {ITENS_MENU.map(({ href, rotulo, Icone, dataTour }) => {
          const ativo = caminhoAtual.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              data-tour={dataTour} // mesmo atributo do menu lateral: no celular é ESTE item que está visível, e o tour acha o que estiver visível
              className={`flex flex-1 flex-col items-center gap-1 py-2 text-[11px] ${ativo ? "text-dourado" : "text-texto-secundario"}`}
            >
              <Icone className="h-5 w-5" aria-hidden />
              {rotulo}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
