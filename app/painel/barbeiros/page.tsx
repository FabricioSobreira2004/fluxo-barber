import { type Metadata } from "next"; // tipo da metadata desta página
import { obterBarbeariaAtual } from "@/utils/supabase/barbearia-atual"; // descobre a barbearia do usuário logado
import { Badge } from "@/components/ui/Badge"; // etiqueta colorida de status
import { Card } from "@/components/ui/Card"; // bloco de superfície padrão
import { BotaoApagar } from "@/components/painel/BotaoApagar"; // botão "Apagar" com confirmação, reutilizado em Barbeiros/Serviços
import { FormularioNovoBarbeiro } from "./FormularioNovoBarbeiro"; // formulário (Client Component) de cadastro
import { alternarAtivoBarbeiro, apagarBarbeiro } from "./actions"; // Server Actions usadas nos botões de cada linha

export const metadata: Metadata = { title: "Barbeiros | Fluxo Barber" }; // título específico desta página do painel

export default async function PaginaBarbeiros() {
  const { supabase, barbeariaId } = await obterBarbeariaAtual(); // garante login e descobre em qual barbearia buscar

  const { data: barbeiros } = await supabase // lista todos os barbeiros (ativos e inativos) dessa barbearia
    .from("barbeiros")
    .select("id, nome, ativo")
    .eq("barbearia_id", barbeariaId)
    .order("nome"); // ordem alfabética, mais fácil de achar um barbeiro específico

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-display text-2xl font-semibold text-texto">Barbeiros</h1>

      <Card className="max-w-md">
        <FormularioNovoBarbeiro />
      </Card>

      <div className="flex flex-col gap-3">
        {(barbeiros ?? []).map((barbeiro) => ( // lista cada barbeiro com seu status e o botão de alternar
          // "flex-col" no celular evita que um nome comprido empurre os botões de ação pra fora do card;
          // a partir de "sm" (640px) já cabe tudo numa linha só, então volta a ser "flex-row"
          <Card key={barbeiro.id} className="flex flex-col items-start gap-3 p-4 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <span className="text-texto">{barbeiro.nome}</span>
              <Badge variante={barbeiro.ativo ? "sucesso" : "neutro"}>{barbeiro.ativo ? "Ativo" : "Inativo"}</Badge>
            </div>
            <div className="flex shrink-0 items-center gap-4"> {/* os dois botões de ação ficam lado a lado */}
              {/* form com Server Action "pré-preenchida" via bind: ao clicar, já manda o id e o valor oposto do atual */}
              <form action={alternarAtivoBarbeiro.bind(null, barbeiro.id, !barbeiro.ativo)}>
                <button type="submit" className="text-sm text-dourado hover:text-dourado-claro">
                  {barbeiro.ativo ? "Desativar" : "Ativar"}
                </button>
              </form>

              <BotaoApagar
                acao={apagarBarbeiro.bind(null, barbeiro.id)} // já embute o id; o useActionState dentro do botão cuida do resto
                mensagemConfirmacao={`Tem certeza que deseja apagar "${barbeiro.nome}"? Essa ação não pode ser desfeita.`}
              />
            </div>
          </Card>
        ))}

        {(barbeiros ?? []).length === 0 && ( // mensagem amigável quando ainda não existe nenhum barbeiro
          <p className="text-sm text-texto-secundario">Nenhum barbeiro cadastrado ainda.</p>
        )}
      </div>
    </div>
  );
}
