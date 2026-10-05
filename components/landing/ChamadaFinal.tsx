import Link from "next/link"; // navegação sem recarregar a página
import { classesBotao } from "@/components/ui/Button"; // reaproveita o estilo de botão no link de CTA
import { Destaque } from "@/components/ui/Destaque"; // trecho de texto em dourado, usado em "perder tempo"

export function ChamadaFinal() { // chamada final pra ação, logo antes do rodapé, pra quem rolou a página inteira e ainda não decidiu
  return (
    // "py-16 md:py-20": mesmo ritmo vertical das outras seções da página (antes era só "py-20", diferente das outras)
    <section className="flex flex-col items-center gap-6 px-6 py-16 text-center md:px-12 md:py-20">
      {/* "mx-auto max-w-6xl": mesma largura máxima e mesmo alinhamento das outras seções */}
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-6">
        <h2 className="text-balance font-display text-3xl font-bold text-texto md:text-4xl"> {/* "text-balance": evita sobrar 1 palavra sozinha numa linha */}
          Pare de <Destaque>perder tempo</Destaque> marcando horário no WhatsApp
        </h2>
        {/* mesmo tom de lucro/alto padrão do subtítulo do topo, pra fechar a página com a mesma mensagem */}
        <p className="max-w-xl text-balance text-base text-texto/80 md:text-lg">
          Crie sua conta gratuita, automatize sua agenda e ganhe tempo pro que realmente gera lucro.
        </p>
        <Link href="/cadastro" className={`${classesBotao("primario")} px-8 py-3 text-base`}>
          Criar conta gratuita
        </Link>
      </div>
    </section>
  );
}
