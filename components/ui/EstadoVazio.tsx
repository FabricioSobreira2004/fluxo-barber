import Link from "next/link"; // o botão de ação, quando existe, é sempre um link pra outra tela do painel
import { type LucideIcon } from "lucide-react"; // tipo comum a todo ícone do lucide-react
import { classesBotao } from "@/components/ui/Button"; // reaproveita o estilo de botão no link de ação

interface PropriedadesEstadoVazio { // o que o componente EstadoVazio recebe
  Icone: LucideIcon; // ícone mostrado acima da mensagem
  titulo: string; // frase curta, ex: "Nenhum barbeiro cadastrado"
  descricao: string; // frase de apoio, explicando o que fazer
  acao?: { rotulo: string; href: string }; // botão opcional (só faz sentido quando a ação fica em OUTRA tela)
}

// mensagem amigável usada sempre que uma lista do painel ainda não tem nenhum item cadastrado
// (Barbeiros, Serviços, Horários, Agenda) — ícone + texto, com um botão de ação quando faz sentido
export function EstadoVazio({ Icone, titulo, descricao, acao }: PropriedadesEstadoVazio) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-borda px-6 py-10 text-center">
      <Icone className="h-8 w-8 text-texto-secundario" aria-hidden /> {/* ícone decorativo; o texto já explica a situação */}
      <div className="flex flex-col gap-1">
        <p className="font-display text-base font-semibold text-texto">{titulo}</p>
        <p className="text-sm text-texto-secundario">{descricao}</p>
      </div>
      {acao && ( // só aparece quando a ação fica em outra tela do painel (senão o formulário já está logo ali)
        <Link href={acao.href} className={`${classesBotao("primario")} mt-2`}>
          {acao.rotulo}
        </Link>
      )}
    </div>
  );
}
