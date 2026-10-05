"use client"; // assistente de várias etapas: precisa de estado local e do GSAP pra animar a troca entre elas

import { useRef, useState, type Ref } from "react"; // estado das etapas/campos + referência pro conteúdo animado
import { useRouter } from "next/navigation"; // navega pro painel ao final (sem recarregar a página toda)
import Link from "next/link"; // logo no topo (leva pra home) e o link "Pular e configurar depois"
import { Plus, Trash2, Copy, Check, Share2 } from "lucide-react"; // ícones usados nos botões do assistente
import { useGSAP } from "@gsap/react"; // hook oficial do GSAP pra React: já limpa a animação sozinho ao desmontar
import gsap from "gsap"; // motor de animação
import { Logo } from "@/components/ui/Logo"; // marca "Fluxo Barber" no topo
import { Card } from "@/components/ui/Card"; // bloco de superfície padrão
import { Label } from "@/components/ui/Label"; // legenda dos campos
import { Input } from "@/components/ui/Input"; // campo de texto estilizado
import { Button, classesBotao } from "@/components/ui/Button"; // botão estilizado
import { Footer } from "@/components/Footer"; // rodapé com copyright, links legais e assinatura
import { reaisParaCentavos } from "@/utils/dinheiro"; // converte o preço digitado ("35,00") pra centavos, do jeito que o banco guarda
import { marcarLinkCompartilhado } from "@/components/painel/acoes-progresso"; // conta o "copiar/compartilhar" no checklist, mesmo vindo daqui
import { concluirConfiguracaoRapida, type ServicoRapido } from "./actions"; // Server Action que grava tudo de uma vez, ao final

const DIAS_SEMANA = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"]; // rótulos curtos, na mesma ordem do "dia_semana" do banco (0 = domingo)
const DIAS_PADRAO_ATIVOS = [1, 2, 3, 4, 5, 6]; // segunda a sábado, sugestão inicial (domingo começa desmarcado)

const SERVICOS_SUGERIDOS = [ // sugestões prontas pra marcar na etapa 2; a duração vem daqui, mas é só um ponto de partida editável
  { nome: "Corte", duracaoMin: 30 },
  { nome: "Barba", duracaoMin: 30 },
  { nome: "Corte + Barba", duracaoMin: 60 },
];

interface LinhaServico { // um serviço sendo editado no formulário (ainda não salvo) — tanto os sugeridos quanto os "outro" usam este mesmo formato
  idLocal: number; // só pra identificar a linha na tela (key do React); não é o id de verdade, que só existe depois de salvar
  nome: string;
  duracaoMin: string; // como texto, porque é o valor de um <input> controlado (vira número só na hora de enviar)
  preco: string; // idem — o preço é OBRIGATÓRIO e digitado pelo dono; o sistema nunca sugere um valor
}

interface PropriedadesAssistente { // o que a página (Server Component) passa pra cá
  nomeBarbearia: string;
  slug: string;
  origemSite: string;
  nomeSugerido: string; // pro atalho "Eu mesmo atendo" (pode vir vazio, se não der pra sugerir nada)
}

export function AssistenteConfiguracaoRapida({ nomeBarbearia, slug, origemSite, nomeSugerido }: PropriedadesAssistente) {
  const router = useRouter(); // usado só no final, pra ir pro painel depois de "Continuar"

  const [etapa, setEtapa] = useState(0); // 0 = barbeiros, 1 = serviços, 2 = horários; "concluido" é um estado à parte (ver "resultado" abaixo)
  const [nomesBarbeiros, setNomesBarbeiros] = useState<string[]>([""]); // começa com 1 campo vazio
  const [servicos, setServicos] = useState<LinhaServico[]>([]); // nenhum serviço selecionado no começo
  const [proximoIdServico, setProximoIdServico] = useState(0); // contador simples pra gerar "idLocal" único a cada linha nova
  const [diasAtivos, setDiasAtivos] = useState<number[]>(DIAS_PADRAO_ATIVOS);
  const [horaInicio, setHoraInicio] = useState("09:00");
  const [horaFim, setHoraFim] = useState("19:00");
  const [enviando, setEnviando] = useState(false);
  const [erroEnvio, setErroEnvio] = useState<string | null>(null);
  const [resultado, setResultado] = useState<{ pronta: boolean } | null>(null); // != null quando a etapa final (depois do "Concluir") está sendo mostrada

  const conteudoRef = useRef<HTMLDivElement>(null); // referência ao bloco de conteúdo da etapa atual, animado a cada troca

  useGSAP(() => { // entra com fade + leve deslize a cada troca de etapa (ou ao mostrar o resultado final)
    const mm = gsap.matchMedia();
    mm.add("(prefers-reduced-motion: no-preference)", () => {
      gsap.from(conteudoRef.current, { autoAlpha: 0, y: 14, duration: 0.35, ease: "power2.out", clearProps: "all" });
    });
    return () => mm.revert();
  }, { dependencies: [etapa, resultado], scope: conteudoRef });

  function alternarServicoSugerido(sugestao: (typeof SERVICOS_SUGERIDOS)[number]) { // liga/desliga um dos 3 chips de sugestão
    const jaAdicionado = servicos.find((s) => s.nome === sugestao.nome);
    if (jaAdicionado) {
      setServicos((atual) => atual.filter((s) => s.idLocal !== jaAdicionado.idLocal)); // já estava marcado: remove (desliga o chip)
    } else {
      setServicos((atual) => [...atual, { idLocal: proximoIdServico, nome: sugestao.nome, duracaoMin: String(sugestao.duracaoMin), preco: "" }]);
      setProximoIdServico((id) => id + 1);
    }
  }

  function adicionarServicoCustom() { // botão "+ Adicionar outro" da etapa 2: uma linha em branco, pro dono descrever um serviço que não está nas sugestões
    setServicos((atual) => [...atual, { idLocal: proximoIdServico, nome: "", duracaoMin: "30", preco: "" }]);
    setProximoIdServico((id) => id + 1);
  }

  function alternarDia(dia: number) { // liga/desliga um dia da semana no seletor de horário
    setDiasAtivos((atual) => (atual.includes(dia) ? atual.filter((d) => d !== dia) : [...atual, dia].sort()));
  }

  async function concluir() { // roda ao clicar "Concluir" na última etapa (horários)
    setEnviando(true);
    setErroEnvio(null);

    const servicosParaEnviar: ServicoRapido[] = servicos.map((s) => ({
      nome: s.nome,
      duracaoMin: Number(s.duracaoMin) || 30, // qualquer coisa que não seja um número válido cai no padrão de 30min, pra nunca travar o envio
      precoCentavos: reaisParaCentavos(s.preco) ?? 0, // "" ou valor inválido vira 0 — e preço 0 já é filtrado pela Server Action (serviço precisa de preço > 0 pra contar)
    }));

    const resposta = await concluirConfiguracaoRapida(
      nomesBarbeiros.map((nome) => ({ nome })),
      servicosParaEnviar,
      diasAtivos.length > 0 ? { diasSemana: diasAtivos, inicio: horaInicio, fim: horaFim } : null
    );

    setEnviando(false);
    if (resposta.erro) {
      setErroEnvio(resposta.erro);
      return;
    }
    setResultado({ pronta: resposta.pronta }); // mostra a telinha final (mensagem varia conforme ficou pronta ou não de verdade)
  }

  return (
    <main className="flex min-h-screen flex-col items-center gap-8 px-6 py-12">
      <Link href="/">
        <Logo />
      </Link>

      <Card className="w-full max-w-xl">
        {resultado ? (
          <EtapaFinal
            ref={conteudoRef}
            pronta={resultado.pronta}
            nomeBarbearia={nomeBarbearia}
            slug={slug}
            origemSite={origemSite}
            aoContinuar={() => router.push("/painel/agenda")}
          />
        ) : (
          <div className="flex flex-col gap-6">
            <BarraProgresso etapaAtual={etapa} /> {/* 3 segmentos: quantas etapas já foram passadas */}

            <div ref={conteudoRef}>
              {etapa === 0 && (
                <EtapaBarbeiros
                  nomes={nomesBarbeiros}
                  onMudar={setNomesBarbeiros}
                  nomeSugerido={nomeSugerido}
                />
              )}
              {etapa === 1 && (
                <EtapaServicos
                  servicos={servicos}
                  onMudarServicos={setServicos}
                  onAlternarSugestao={alternarServicoSugerido}
                  onAdicionarCustom={adicionarServicoCustom}
                />
              )}
              {etapa === 2 && (
                <EtapaHorarios
                  diasAtivos={diasAtivos}
                  onAlternarDia={alternarDia}
                  horaInicio={horaInicio}
                  horaFim={horaFim}
                  onMudarHoraInicio={setHoraInicio}
                  onMudarHoraFim={setHoraFim}
                />
              )}
            </div>

            {erroEnvio && <p className="text-sm text-erro">{erroEnvio}</p>}

            <div className="flex flex-wrap items-center justify-between gap-3">
              <Link href="/painel/agenda" className="text-sm text-texto-secundario hover:text-texto">
                Pular e configurar depois
              </Link>

              <div className="flex items-center gap-2">
                {etapa > 0 && (
                  <Button type="button" variante="secundario" onClick={() => setEtapa((e) => e - 1)} disabled={enviando}>
                    Voltar
                  </Button>
                )}
                {etapa < 2 ? (
                  <Button type="button" onClick={() => setEtapa((e) => e + 1)}>
                    Próximo
                  </Button>
                ) : (
                  <Button type="button" onClick={concluir} disabled={enviando}>
                    {enviando ? "Salvando..." : "Concluir"}
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}
      </Card>

      <Footer />
    </main>
  );
}

function BarraProgresso({ etapaAtual }: { etapaAtual: number }) { // 3 barrinhas horizontais, preenchendo conforme avança
  return (
    <div className="flex gap-2">
      {[0, 1, 2].map((indice) => (
        <div key={indice} className="h-1.5 flex-1 overflow-hidden rounded-full bg-borda">
          <div
            className={`h-full rounded-full bg-dourado transition-[width] duration-500 ease-out ${indice <= etapaAtual ? "w-full" : "w-0"}`}
          />
        </div>
      ))}
    </div>
  );
}

interface PropriedadesEtapaBarbeiros {
  nomes: string[];
  onMudar: (nomes: string[]) => void;
  nomeSugerido: string;
}

function EtapaBarbeiros({ nomes, onMudar, nomeSugerido }: PropriedadesEtapaBarbeiros) { // etapa 1: "Quem atende na sua barbearia?"
  function mudarNome(indice: number, valor: string) {
    onMudar(nomes.map((nome, i) => (i === indice ? valor : nome)));
  }

  function remover(indice: number) {
    onMudar(nomes.length === 1 ? [""] : nomes.filter((_, i) => i !== indice)); // nunca deixa a lista inteiramente vazia: sem campo nenhum, não dá pra digitar
  }

  function euMesmoAtendo() { // preenche o 1º campo vazio com o nome sugerido (ou adiciona um campo novo, se nenhum estiver vazio)
    const indiceVazio = nomes.findIndex((n) => n.trim() === "");
    if (indiceVazio >= 0) mudarNome(indiceVazio, nomeSugerido);
    else onMudar([...nomes, nomeSugerido]);
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="font-display text-xl font-semibold text-texto">Quem atende na sua barbearia?</h1>
        <p className="text-sm text-texto-secundario">Cadastre os barbeiros que vão usar a agenda.</p>
      </div>

      {nomeSugerido && ( // só aparece quando deu pra sugerir algum nome (ver utils/nome-usuario.ts)
        <button type="button" onClick={euMesmoAtendo} className={`${classesBotao("secundario")} self-start`}>
          Eu mesmo atendo
        </button>
      )}

      <div className="flex flex-col gap-2">
        {nomes.map((nome, indice) => (
          <div key={indice} className="flex items-center gap-2">
            <Input
              value={nome}
              onChange={(e) => mudarNome(indice, e.target.value)}
              placeholder="Nome do barbeiro"
              className="flex-1"
            />
            <button type="button" onClick={() => remover(indice)} className="shrink-0 p-2 text-texto-secundario hover:text-erro" aria-label="Remover">
              <Trash2 className="h-4 w-4" aria-hidden />
            </button>
          </div>
        ))}
      </div>

      <button type="button" onClick={() => onMudar([...nomes, ""])} className="flex items-center gap-1 self-start text-sm text-dourado hover:text-dourado-claro">
        <Plus className="h-4 w-4" aria-hidden /> Adicionar outro barbeiro
      </button>
    </div>
  );
}

interface PropriedadesEtapaServicos {
  servicos: LinhaServico[];
  onMudarServicos: (servicos: LinhaServico[]) => void;
  onAlternarSugestao: (sugestao: (typeof SERVICOS_SUGERIDOS)[number]) => void;
  onAdicionarCustom: () => void;
}

function EtapaServicos({ servicos, onMudarServicos, onAlternarSugestao, onAdicionarCustom }: PropriedadesEtapaServicos) { // etapa 2: "Quais serviços você oferece?"
  function mudarCampo(idLocal: number, campo: "nome" | "duracaoMin" | "preco", valor: string) {
    onMudarServicos(servicos.map((s) => (s.idLocal === idLocal ? { ...s, [campo]: valor } : s)));
  }

  function remover(idLocal: number) {
    onMudarServicos(servicos.filter((s) => s.idLocal !== idLocal));
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="font-display text-xl font-semibold text-texto">Quais serviços você oferece?</h1>
        <p className="text-sm text-texto-secundario">Marque as sugestões ou adicione os seus. O preço é obrigatório.</p>
      </div>

      <div className="flex flex-wrap gap-2"> {/* os 3 chips de sugestão, acendendo em dourado quando já adicionados */}
        {SERVICOS_SUGERIDOS.map((sugestao) => {
          const ativo = servicos.some((s) => s.nome === sugestao.nome);
          return (
            <button
              key={sugestao.nome}
              type="button"
              onClick={() => onAlternarSugestao(sugestao)}
              className={`rounded-full border px-3 py-1 text-sm transition-colors ${
                ativo ? "border-dourado bg-dourado/10 text-dourado" : "border-borda text-texto-secundario hover:text-texto"
              }`}
            >
              {sugestao.nome} ({sugestao.duracaoMin} min)
            </button>
          );
        })}
      </div>

      <div className="flex flex-col gap-3">
        {servicos.map((servico) => (
          <div key={servico.idLocal} className="flex flex-col gap-2 rounded-lg border border-borda p-3 sm:flex-row sm:items-end">
            <div className="flex-1">
              <Label htmlFor={`nome-servico-${servico.idLocal}`}>Serviço</Label>
              <Input
                id={`nome-servico-${servico.idLocal}`}
                value={servico.nome}
                onChange={(e) => mudarCampo(servico.idLocal, "nome", e.target.value)}
                placeholder="Ex: Sobrancelha"
              />
            </div>
            <div className="w-full sm:w-28">
              <Label htmlFor={`duracao-servico-${servico.idLocal}`}>Duração (min)</Label>
              <Input
                id={`duracao-servico-${servico.idLocal}`}
                type="number"
                min={5}
                step={5}
                value={servico.duracaoMin}
                onChange={(e) => mudarCampo(servico.idLocal, "duracaoMin", e.target.value)}
              />
            </div>
            <div className="w-full sm:w-32">
              <Label htmlFor={`preco-servico-${servico.idLocal}`}>Preço (R$)</Label>
              <Input
                id={`preco-servico-${servico.idLocal}`}
                inputMode="decimal"
                value={servico.preco}
                onChange={(e) => mudarCampo(servico.idLocal, "preco", e.target.value)}
                placeholder="35,00"
              />
            </div>
            <button type="button" onClick={() => remover(servico.idLocal)} className="shrink-0 self-start p-2 text-texto-secundario hover:text-erro sm:self-end" aria-label="Remover">
              <Trash2 className="h-4 w-4" aria-hidden />
            </button>
          </div>
        ))}
      </div>

      <button type="button" onClick={onAdicionarCustom} className="flex items-center gap-1 self-start text-sm text-dourado hover:text-dourado-claro">
        <Plus className="h-4 w-4" aria-hidden /> Adicionar outro serviço
      </button>
    </div>
  );
}

interface PropriedadesEtapaHorarios {
  diasAtivos: number[];
  onAlternarDia: (dia: number) => void;
  horaInicio: string;
  horaFim: string;
  onMudarHoraInicio: (valor: string) => void;
  onMudarHoraFim: (valor: string) => void;
}

function EtapaHorarios({ diasAtivos, onAlternarDia, horaInicio, horaFim, onMudarHoraInicio, onMudarHoraFim }: PropriedadesEtapaHorarios) { // etapa 3: "Quando vocês atendem?"
  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="font-display text-xl font-semibold text-texto">Quando vocês atendem?</h1>
        <p className="text-sm text-texto-secundario">
          Esse horário vale pra todos os barbeiros cadastrados na 1ª etapa — dá pra ajustar cada um depois, em Horários.
        </p>
      </div>

      <div className="flex flex-wrap gap-2"> {/* 1 chip por dia da semana, igual ao filtro de barbeiro que já existe na Agenda */}
        {DIAS_SEMANA.map((rotulo, dia) => {
          const ativo = diasAtivos.includes(dia);
          return (
            <button
              key={dia}
              type="button"
              onClick={() => onAlternarDia(dia)}
              className={`h-10 w-12 rounded-lg border text-sm transition-colors ${
                ativo ? "border-dourado bg-dourado/10 text-dourado" : "border-borda text-texto-secundario hover:text-texto"
              }`}
            >
              {rotulo}
            </button>
          );
        })}
      </div>

      <div className="flex gap-3">
        <div className="flex-1">
          <Label htmlFor="hora-inicio">Início</Label>
          <Input id="hora-inicio" type="time" value={horaInicio} onChange={(e) => onMudarHoraInicio(e.target.value)} />
        </div>
        <div className="flex-1">
          <Label htmlFor="hora-fim">Fim</Label>
          <Input id="hora-fim" type="time" value={horaFim} onChange={(e) => onMudarHoraFim(e.target.value)} />
        </div>
      </div>
    </div>
  );
}

interface PropriedadesEtapaFinal {
  ref: Ref<HTMLDivElement>;
  pronta: boolean;
  nomeBarbearia: string;
  slug: string;
  origemSite: string;
  aoContinuar: () => void;
}

function EtapaFinal({ ref, pronta, nomeBarbearia, slug, origemSite, aoContinuar }: PropriedadesEtapaFinal) { // telinha de fechamento do assistente
  const [copiado, setCopiado] = useState(false);
  const urlCompleta = `${origemSite}/b/${slug}`;
  const mensagemWhatsApp = `Agora você pode marcar seu horário na ${nomeBarbearia} pelo link: ${urlCompleta}`;
  const linkWhatsApp = `https://wa.me/?text=${encodeURIComponent(mensagemWhatsApp)}`;

  async function copiar() {
    await navigator.clipboard.writeText(urlCompleta);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
    void marcarLinkCompartilhado();
  }

  return (
    <div ref={ref} className="flex flex-col items-center gap-4 text-center">
      {pronta ? ( // só afirma "pronto" depois de CONFERIR de verdade (resultado vem da mesma função central usada em todo o site)
        <>
          <h1 className="font-display text-xl font-semibold text-texto">Pronto! Seu link já aceita agendamentos.</h1>
          <p className="truncate rounded-lg border border-borda bg-fundo px-3 py-2 font-mono text-sm text-dourado w-full">
            {urlCompleta}
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Button type="button" onClick={copiar} className="gap-2">
              {copiado ? (
                <>
                  <Check className="h-4 w-4" aria-hidden /> Link copiado!
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" aria-hidden /> Copiar link
                </>
              )}
            </Button>
            <a
              href={linkWhatsApp}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => void marcarLinkCompartilhado()}
              className={`${classesBotao("secundario")} gap-2`}
            >
              <Share2 className="h-4 w-4" aria-hidden /> Compartilhar no WhatsApp
            </a>
          </div>
        </>
      ) : (
        <>
          <h1 className="font-display text-xl font-semibold text-texto">Quase lá!</h1>
          <p className="text-sm text-texto-secundario">
            Faltou preencher alguma etapa — termine de configurar no painel pra seu link começar a aceitar agendamentos.
          </p>
        </>
      )}

      <Button type="button" onClick={aoContinuar} variante={pronta ? "secundario" : "primario"} className="mt-2">
        Continuar para o painel
      </Button>
    </div>
  );
}
