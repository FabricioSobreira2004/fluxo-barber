import Link from "next/link"; // link pra voltar pra home clicando no logo
import { type ReactNode } from "react"; // tipo genérico de "qualquer coisa que o React sabe renderizar"
import { Logo } from "@/components/ui/Logo"; // marca "Fluxo Barber"
import { Card } from "@/components/ui/Card"; // bloco de superfície que já tem o visual padrão

interface PropriedadesAuthCard { // o que o AuthCard recebe
  titulo: string; // título da tela (ex: "Entrar", "Criar conta")
  children: ReactNode; // o formulário em si, montado por quem usa o componente
}

export function AuthCard({ titulo, children }: PropriedadesAuthCard) { // layout compartilhado entre /login e /cadastro
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 px-6 py-12"> {/* centraliza tudo na tela */}
      <Link href="/"> {/* clicar no logo leva de volta pra landing page */}
        <Logo />
      </Link>
      <Card className="w-full max-w-sm"> {/* largura limitada, pra não esticar o formulário em telas grandes */}
        <h1 className="mb-6 font-display text-2xl font-semibold text-texto">{titulo}</h1>
        {children}
      </Card>
    </main>
  );
}
