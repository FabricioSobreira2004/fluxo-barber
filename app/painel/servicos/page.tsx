import { type Metadata } from "next"; // tipo da metadata desta página
import { obterBarbeariaAtual } from "@/utils/supabase/barbearia-atual"; // descobre a barbearia do usuário logado
import { Badge } from "@/components/ui/Badge"; // etiqueta colorida de status
import { Card } from "@/components/ui/Card"; // bloco de superfície padrão
import { centavosParaReais } from "@/utils/dinheiro"; // formata o preço (guardado em centavos) pra exibição
import { BotaoApagar } from "@/components/painel/BotaoApagar"; // botão "Apagar" com confirmação, reutilizado em Barbeiros/Serviços
import { FormularioNovoServico } from "./FormularioNovoServico"; // formulário (Client Component) de cadastro
import { alternarAtivoServico, apagarServico } from "./actions"; // Server Actions usadas nos botões de cada linha

export const metadata: Metadata = { title: "Serviços | Fluxo Barber" }; // título específico desta página do painel

export default async function PaginaServicos() {
  const { supabase, barbeariaId } = await obterBarbeariaAtual(); // garante login e descobre em qual barbearia buscar

  const { data: servicos } = await supabase // lista todos os serviços (ativos e inativos) dessa barbearia
    .from("servicos")
    .select("id, nome, duracao_min, preco_centavos, ativo")
    .eq("barbearia_id", barbeariaId)
    .order("nome"); // ordem alfabética, mais fácil de achar um serviço específico

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-display text-2xl font-semibold text-texto">Serviços</h1>

      <Card className="max-w-md">
        <FormularioNovoServico />
      </Card>

      <div className="flex flex-col gap-3">
        {(servicos ?? []).map((servico) => ( // lista cada serviço com duração, preço, status e o botão de alternar
          // "flex-col" no celular evita que um nome de serviço comprido empurre os botões de ação pra fora do card;
          // a partir de "sm" (640px) já cabe tudo numa linha só, então volta a ser "flex-row"
          <Card key={servico.id} className="flex flex-col items-start gap-3 p-4 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
            <div className="flex flex-col gap-1">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <span className="text-texto">{servico.nome}</span>
                <Badge variante={servico.ativo ? "sucesso" : "neutro"}>{servico.ativo ? "Ativo" : "Inativo"}</Badge>
              </div>
              <span className="text-sm text-texto-secundario">
                {/* duração e preço são números: tabular-nums alinha os dígitos, font-bold reforça a leitura */}
                <span className="font-bold tabular-nums">{servico.duracao_min}</span> min · R${" "}
                <span className="font-bold tabular-nums">{centavosParaReais(servico.preco_centavos)}</span>
              </span>
            </div>
            <div className="flex shrink-0 items-center gap-4"> {/* os dois botões de ação ficam lado a lado */}
              {/* form com Server Action "pré-preenchida" via bind: ao clicar, já manda o id e o valor oposto do atual */}
              <form action={alternarAtivoServico.bind(null, servico.id, !servico.ativo)}>
                <button type="submit" className="text-sm text-dourado hover:text-dourado-claro">
                  {servico.ativo ? "Desativar" : "Ativar"}
                </button>
              </form>

              <BotaoApagar
                acao={apagarServico.bind(null, servico.id)} // já embute o id; o useActionState dentro do botão cuida do resto
                mensagemConfirmacao={`Tem certeza que deseja apagar "${servico.nome}"? Essa ação não pode ser desfeita.`}
              />
            </div>
          </Card>
        ))}

        {(servicos ?? []).length === 0 && ( // mensagem amigável quando ainda não existe nenhum serviço
          <p className="text-sm text-texto-secundario">Nenhum serviço cadastrado ainda.</p>
        )}
      </div>
    </div>
  );
}
