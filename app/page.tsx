import Link from "next/link"; // navegação entre páginas do Next.js sem recarregar tudo
import { CalendarCheck, Clock, Users, Scissors } from "lucide-react"; // ícones usados nos cards de benefício
import { Logo } from "@/components/ui/Logo"; // marca "Fluxo Barber" no topo
import { classesBotao } from "@/components/ui/Button"; // reaproveita o estilo de botão em links (Criar conta/Entrar)

const beneficios = [ // lista de benefícios mostrados na landing page, cada um com ícone, título e descrição
  {
    Icone: CalendarCheck,
    titulo: "Agenda online",
    descricao: "Seus clientes marcam horário sozinhos, a qualquer hora, sem precisar ligar pra barbearia.",
  },
  {
    Icone: Clock,
    titulo: "Sem conflito de horário",
    descricao: "O sistema trava automaticamente dois agendamentos no mesmo horário com o mesmo barbeiro.",
  },
  {
    Icone: Users,
    titulo: "Gestão de equipe",
    descricao: "Cadastre seus barbeiros, defina os horários de trabalho de cada um e acompanhe a agenda.",
  },
  {
    Icone: Scissors,
    titulo: "Serviços e preços",
    descricao: "Organize os serviços oferecidos, com duração e preço, e deixe a agenda calcular o resto.",
  },
];

export default function Home() { // landing page pública: primeira tela que um visitante vê
  return (
    <main className="flex min-h-screen flex-col">
      <header className="flex items-center justify-between px-6 py-5 md:px-12"> {/* topo com logo e ações de conta */}
        <Logo />
        <nav className="flex items-center gap-3">
          <Link href="/login" className={classesBotao("secundario")}>Entrar</Link> {/* quem já tem conta */}
          <Link href="/cadastro" className={classesBotao("primario")}>Criar conta</Link> {/* quem é novo */}
        </nav>
      </header>

      <section className="flex flex-1 flex-col items-center gap-6 px-6 py-16 text-center md:py-24"> {/* seção de destaque (hero) */}
        <h1 className="font-display text-4xl font-bold leading-tight text-texto md:text-6xl">
          Agendamento simples para <span className="text-dourado">barbearias</span> {/* palavra-chave em dourado */}
        </h1>
        <p className="max-w-2xl text-lg text-texto-secundario">
          O Fluxo Barber organiza a agenda da sua barbearia: clientes marcam horário online, sua
          equipe não tem mais conflito de horário, e você acompanha tudo em um painel simples.
        </p>
        <div className="flex flex-col gap-3 sm:flex-row"> {/* botões empilhados no celular, lado a lado no desktop */}
          <Link href="/cadastro" className={`${classesBotao("primario")} px-6 py-3 text-base`}>
            Criar conta gratuita
          </Link>
          <Link href="/login" className={`${classesBotao("secundario")} px-6 py-3 text-base`}>
            Já tenho conta
          </Link>
        </div>
      </section>

      <section className="grid gap-6 px-6 py-16 md:grid-cols-2 md:px-12 lg:grid-cols-4"> {/* grade de benefícios, 1 coluna no celular */}
        {beneficios.map(({ Icone, titulo, descricao }) => (
          <div key={titulo} className="rounded-xl border border-borda bg-superficie p-6"> {/* card de benefício */}
            <Icone className="mb-3 h-8 w-8 text-dourado" aria-hidden /> {/* ícone decorativo; o título já explica o conteúdo */}
            <h3 className="mb-2 font-display text-lg font-semibold text-texto">{titulo}</h3>
            <p className="text-sm text-texto-secundario">{descricao}</p>
          </div>
        ))}
      </section>

      <footer className="border-t border-borda px-6 py-6 text-center text-sm text-texto-secundario">
        © {new Date().getFullYear()} Fluxo Barber {/* ano atual calculado automaticamente, nunca fica desatualizado */}
      </footer>
    </main>
  );
}
