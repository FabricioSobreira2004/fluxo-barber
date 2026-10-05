"use client"; // o tour inteiro só existe no navegador: mede posição de elementos, escuta teclado/scroll, anima com GSAP

import { useEffect, useRef, useState } from "react"; // hooks de estado, referência e efeito colateral
import { X, PartyPopper } from "lucide-react"; // "X" fecha/pula o tour; "PartyPopper" na celebração final
import { useGSAP } from "@gsap/react"; // hook oficial do GSAP pra React: já limpa a animação sozinho ao desmontar
import gsap from "gsap"; // motor de animação
import { Button } from "@/components/ui/Button"; // botão estilizado, usado nas ações do balão
import { marcarTourVisto } from "./acoes-progresso"; // Server Action: grava que o usuário já viu o tour

// cada passo aponta pro atributo "data-tour" de um elemento (colocado no menu lateral/inferior do
// PainelShell e nos cards da própria Agenda) — "seletor: null" é o passo de boas-vindas, sem alvo
interface PassoTour {
  seletor: string | null;
  titulo: string;
  texto: string;
  enfase?: boolean; // true só no passo do link: o passo mais importante do tour, com um anel mais forte
}

function montarPassos(nomeBarbearia: string): PassoTour[] {
  return [
    {
      seletor: null,
      titulo: `Bem-vindo ao Fluxo Barber, ${nomeBarbearia}!`,
      texto: "Em 1 minuto vou te mostrar como deixar sua barbearia pronta para receber agendamentos.",
    },
    {
      seletor: '[data-tour="menu-barbeiros"]',
      titulo: "Cadastre sua equipe",
      texto: "Primeiro, cadastre sua equipe. Cada barbeiro terá a própria agenda.",
    },
    {
      seletor: '[data-tour="menu-servicos"]',
      titulo: "Seus serviços",
      texto: "Cadastre seus cortes, barbas e combos com preço e duração.",
    },
    {
      seletor: '[data-tour="menu-horarios"]',
      titulo: "Horários de atendimento",
      texto: "Defina os dias e horários em que cada barbeiro atende. Só esses horários aparecem para os clientes.",
    },
    {
      seletor: '[data-tour="link-barbearia"]',
      titulo: "O link da sua barbearia",
      texto: "Este é o link da sua barbearia! Mande para seus clientes pelo WhatsApp ou coloque na bio do Instagram. Eles escolhem o barbeiro, o serviço e o horário sozinhos.",
      enfase: true,
    },
    {
      seletor: '[data-tour="lista-agenda"]',
      titulo: "Sua agenda",
      texto: "Todo agendamento aparece aqui. Você pode confirmar, concluir ou cancelar cada um.",
    },
  ];
}

interface Retangulo { top: number; left: number; width: number; height: number } // versão "simples" de um DOMRect (só os 4 números que usamos)

// entre os elementos com esse "data-tour" (pode haver 2: um no menu lateral — só visível no
// desktop — e outro no menu inferior — só visível no celular), acha o que está REALMENTE visível
function encontrarAlvoVisivel(seletor: string): Element | null {
  const elementos = document.querySelectorAll(seletor);
  return Array.from(elementos).find((el) => el.getClientRects().length > 0) ?? null; // "getClientRects().length === 0" é como se detecta um elemento com "display: none"
}

function medirRetangulo(el: Element): Retangulo {
  const r = el.getBoundingClientRect(); // posição/tamanho relativos à JANELA (funciona igual não importa qual ancestral tem o scroll)
  return { top: r.top, left: r.left, width: r.width, height: r.height };
}

// decide de que lado do alvo o balão deve aparecer (o lado com mais espaço livre na tela) e
// garante que ele nunca saia da tela, em nenhuma direção — funciona tanto pro menu lateral
// (bastante espaço à direita) quanto pro menu inferior do celular (bastante espaço acima)
function calcularPosicaoBalao(alvo: Retangulo, larguraBalao: number, alturaBalao: number) {
  const margem = 16;
  const vw = window.innerWidth;
  const vh = window.innerHeight;

  const espacos = {
    direita: vw - (alvo.left + alvo.width),
    esquerda: alvo.left,
    baixo: vh - (alvo.top + alvo.height),
    cima: alvo.top,
  } as const;

  const lado = (Object.keys(espacos) as (keyof typeof espacos)[]).sort((a, b) => espacos[b] - espacos[a])[0]; // o lado com mais espaço livre

  let top: number;
  let left: number;

  if (lado === "direita" || lado === "esquerda") {
    top = alvo.top + alvo.height / 2 - alturaBalao / 2; // centralizado na altura do alvo
    left = lado === "direita" ? alvo.left + alvo.width + margem : alvo.left - margem - larguraBalao;
  } else {
    left = alvo.left + alvo.width / 2 - larguraBalao / 2; // centralizado na largura do alvo
    top = lado === "baixo" ? alvo.top + alvo.height + margem : alvo.top - margem - alturaBalao;
  }

  // nunca deixa o balão sair da tela, em nenhum dos 4 lados
  top = Math.min(Math.max(top, margem), vh - alturaBalao - margem);
  left = Math.min(Math.max(left, margem), vw - larguraBalao - margem);

  return { top, left };
}

interface PropriedadesTour { // o que a página da Agenda passa pra esse componente
  exibirAutomaticamente: boolean; // true só quando o usuário logado ainda não viu o tour (lido do user_metadata, no servidor)
  nomeBarbearia: string; // usado na frase de boas-vindas
}

export function Tour({ exibirAutomaticamente, nomeBarbearia }: PropriedadesTour) {
  const [aberto, setAberto] = useState(exibirAutomaticamente); // controla se o tour aparece na tela
  const [passo, setPasso] = useState(0); // índice do passo atual (0 a 5)
  const [celebrando, setCelebrando] = useState(false); // tela final, depois do botão "Concluir" no último passo
  const [retanguloAlvo, setRetanguloAlvo] = useState<Retangulo | null>(null); // posição atual do recorte (animada pelo GSAP a cada troca de passo)
  const [posicaoBalao, setPosicaoBalao] = useState<{ top: number; left: number } | null>(null);

  const balaoRef = useRef<HTMLDivElement>(null); // referência ao balão: usada pro foco (acessibilidade) e pra medir seu próprio tamanho
  const ultimoPassoAnimadoRef = useRef(-1); // guarda qual passo já recebeu a animação de entrada (fade + deslize), pra não repetir a cada recálculo de scroll
  const passos = montarPassos(nomeBarbearia); // lista de passos; recalculada a cada render, mas é bem barata (só monta 6 objetos) e "nomeBarbearia" não muda durante o tour

  // fecha o tour: marca como visto no servidor e esconde a interface
  function encerrar() {
    setAberto(false);
    setCelebrando(false);
    void marcarTourVisto(); // não precisa esperar terminar — a tela já fecha na hora
  }

  function irPara(novoPasso: number) {
    setPasso(Math.min(Math.max(novoPasso, 0), passos.length - 1)); // nunca deixa sair da faixa válida (0 a 5)
  }

  function concluir() {
    setCelebrando(true); // mostra a telinha de celebração por um instante...
    void marcarTourVisto();
    window.setTimeout(encerrar, 2200); // ...e fecha sozinho depois
  }

  // recalcula (sem animação) a posição do recorte e do balão — usado em resize/scroll, onde uma
  // animação a cada pixel rolado deixaria tudo "tremido" em vez de suave
  function recalcularNaHora() {
    if (!aberto || celebrando) return;
    const passoAtual = passos[passo];
    if (!passoAtual.seletor) {
      setRetanguloAlvo(null);
      return;
    }
    const alvo = encontrarAlvoVisivel(passoAtual.seletor);
    if (alvo) setRetanguloAlvo(medirRetangulo(alvo));
  }

  // ao trocar de passo: anima o recorte deslizando suavemente da posição antiga pra nova (GSAP);
  // se o usuário pediu movimento reduzido, pula direto pra posição final, sem animação
  useGSAP(
    () => {
      if (!aberto || celebrando) return;
      const passoAtual = passos[passo];
      const alvo = passoAtual.seletor ? encontrarAlvoVisivel(passoAtual.seletor) : null;
      alvo?.scrollIntoView({ block: "center" }); // garante que o elemento (ex: o card "Seu link", lá no meio da página) esteja visível antes de medir a posição dele
      const retAlvo = alvo ? medirRetangulo(alvo) : null;

      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        if (!retAlvo) {
          setRetanguloAlvo(null);
          return;
        }
        const origem = retanguloAlvo ?? retAlvo; // 1ª vez: já nasce no lugar certo, sem "vir de lugar nenhum"
        const objAnimado = { ...origem };
        gsap.to(objAnimado, {
          ...retAlvo,
          duration: 0.55,
          ease: "power2.inOut",
          onUpdate: () => setRetanguloAlvo({ ...objAnimado }), // a cada quadro, atualiza o estado — é isso que redesenha o recorte na nova posição
        });
      });
      mm.add("(prefers-reduced-motion: reduce)", () => { // movimento reduzido: vai direto, sem deslizar
        setRetanguloAlvo(retAlvo);
      });

      return () => mm.revert();
      // "retanguloAlvo" de propósito fora da lista de dependências: ele é o PONTO DE PARTIDA da
      // própria animação (lido uma vez, no início); incluí-lo recriaria o efeito a cada quadro
    },
    { dependencies: [passo, aberto, celebrando], scope: balaoRef }
  );

  // calcula a posição do balão toda vez que o recorte muda de lugar (ou quando o passo muda, pro
  // passo de boas-vindas, que não tem recorte nenhum)
  useEffect(() => {
    if (!aberto || celebrando) return;
    if (!balaoRef.current) return;
    const { width, height } = balaoRef.current.getBoundingClientRect();
    setPosicaoBalao(retanguloAlvo ? calcularPosicaoBalao(retanguloAlvo, width, height) : null);
  }, [retanguloAlvo, aberto, celebrando]);

  // dispara o fade + deslize de entrada do balão — só DEPOIS que a posição certa do passo atual
  // já foi aplicada no DOM (senão o GSAP "capturaria" a posição antiga como ponto de partida e o
  // balão pareceria pular de lugar no meio da animação). Roda uma única vez por passo, mesmo que
  // a posição seja recalculada de novo depois (ex: o usuário rola a tela)
  useEffect(() => {
    if (!aberto || celebrando || !balaoRef.current) return;
    if (ultimoPassoAnimadoRef.current === passo) return; // esse passo já animou a entrada; não repete
    const prontoPraAnimar = retanguloAlvo ? posicaoBalao !== null : true; // passo de boas-vindas não depende de medir nada
    if (!prontoPraAnimar) return;

    ultimoPassoAnimadoRef.current = passo;
    const mm = gsap.matchMedia();
    mm.add("(prefers-reduced-motion: no-preference)", () => {
      gsap.from(balaoRef.current, { autoAlpha: 0, y: 12, duration: 0.4, ease: "power2.out", clearProps: "all" });
    });
  }, [passo, posicaoBalao, retanguloAlvo, aberto, celebrando]);

  // animação da telinha de celebração final: o ícone "estoura" na tela com uma leve girada,
  // só quando "celebrando" vira true (e só se o usuário não pediu movimento reduzido)
  useGSAP(
    () => {
      if (!celebrando) return;
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.from(".celebracao-icone", { scale: 0.3, rotate: -15, autoAlpha: 0, duration: 0.6, ease: "back.out(2)", clearProps: "all" });
      });
      return () => mm.revert();
    },
    { dependencies: [celebrando], scope: balaoRef }
  );

  // recalcula em resize e em scroll (de QUALQUER elemento com scroll, não só da janela — por
  // isso "capture: true": pega o evento mesmo vindo de dentro do <main> do painel, que rola
  // sozinho); e foca o balão a cada passo novo, pra acessibilidade
  useEffect(() => {
    if (!aberto) return;
    window.addEventListener("resize", recalcularNaHora);
    window.addEventListener("scroll", recalcularNaHora, { capture: true, passive: true });
    balaoRef.current?.focus();
    return () => {
      window.removeEventListener("resize", recalcularNaHora);
      window.removeEventListener("scroll", recalcularNaHora, true);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- só precisa reconfigurar quando o tour abre/fecha ou o passo muda (pro foco); a função em si já lê o estado mais atual via closure
  }, [aberto, passo, celebrando]);

  // teclado: Esc pula o tour; setas avançam/voltam; Tab fica preso dentro do balão enquanto o tour está aberto
  useEffect(() => {
    if (!aberto) return;

    function aoTeclar(evento: KeyboardEvent) {
      if (evento.key === "Escape") {
        evento.preventDefault();
        encerrar();
        return;
      }
      if (celebrando) return; // na tela de celebração, só o Esc tem efeito (ela fecha sozinha)

      if (evento.key === "ArrowRight") {
        evento.preventDefault();
        if (passo === passos.length - 1) concluir();
        else irPara(passo + 1);
      } else if (evento.key === "ArrowLeft") {
        evento.preventDefault();
        irPara(passo - 1);
      } else if (evento.key === "Tab" && balaoRef.current) {
        // prende o foco dentro do balão: ao chegar no último elemento focável, Tab volta pro primeiro (e vice-versa com Shift+Tab)
        const focaveis = balaoRef.current.querySelectorAll<HTMLElement>("button, a[href]");
        if (focaveis.length === 0) return;
        const primeiro = focaveis[0];
        const ultimo = focaveis[focaveis.length - 1];
        if (evento.shiftKey && document.activeElement === primeiro) {
          evento.preventDefault();
          ultimo.focus();
        } else if (!evento.shiftKey && document.activeElement === ultimo) {
          evento.preventDefault();
          primeiro.focus();
        }
      }
    }

    window.addEventListener("keydown", aoTeclar);
    return () => window.removeEventListener("keydown", aoTeclar);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mesma razão do efeito de cima: lê o estado mais atual via closure, só precisa reconfigurar quando o tour abre/fecha
  }, [aberto, passo, celebrando]);

  if (!aberto) return null; // nada renderizado quando o tour não está ativo (nem a camada escura)

  if (celebrando) { // tela final: um brilho dourado rápido e discreto, sem recorte nenhum
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4" role="status" aria-live="polite">
        <div ref={balaoRef} tabIndex={-1} className="celebracao-tour flex max-w-sm flex-col items-center gap-3 rounded-2xl border border-dourado/40 bg-superficie p-8 text-center">
          <PartyPopper className="celebracao-icone h-10 w-10 text-dourado" aria-hidden />
          <p className="font-display text-xl font-semibold text-texto">Tudo pronto!</p>
          <p className="text-sm text-texto-secundario">Siga o checklist de primeiros passos.</p>
        </div>
      </div>
    );
  }

  const passoAtual = passos[passo];
  const primeiroPasso = passo === 0;
  const ultimoPasso = passo === passos.length - 1;

  return (
    <>
      {/* camada escura com "recorte" no elemento em foco (ou tela toda escura, no passo de boas-vindas) */}
      <RecorteTour alvo={retanguloAlvo} enfase={!!passoAtual.enfase} />

      <div
        ref={balaoRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="tour-titulo"
        tabIndex={-1}
        // sem alvo (passo de boas-vindas): centralizado na tela via classes; com alvo: posicionado
        // dinamicamente (calcularPosicaoBalao), e só fica visível depois de ter uma posição calculada
        // (evita um "pulo" visual no primeiro frame, antes da medição)
        className={
          posicaoBalao
            ? "fixed z-50 w-[calc(100vw-2rem)] max-w-sm rounded-2xl border border-dourado/40 bg-superficie p-5 shadow-xl shadow-black/50"
            : retanguloAlvo
              ? "fixed z-50 w-[calc(100vw-2rem)] max-w-sm rounded-2xl border border-dourado/40 bg-superficie p-5 opacity-0 shadow-xl shadow-black/50"
              : "fixed left-1/2 top-1/2 z-50 w-[calc(100vw-2rem)] max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-dourado/40 bg-superficie p-5 shadow-xl shadow-black/50"
        }
        style={posicaoBalao ? { top: posicaoBalao.top, left: posicaoBalao.left } : undefined}
      >
        <div className="mb-3 flex items-center justify-between gap-3">
          <span className="text-xs font-medium tabular-nums text-texto-secundario">
            {passo + 1} de {passos.length}
          </span>
          <button
            type="button"
            onClick={encerrar}
            className="rounded-full p-1 text-texto-secundario transition-colors hover:text-texto"
            aria-label="Pular tutorial"
          >
            <X className="h-4 w-4" aria-hidden />
          </button>
        </div>

        <h2 id="tour-titulo" className="mb-2 font-display text-lg font-semibold text-texto">
          {passoAtual.titulo}
        </h2>
        <p className="mb-5 text-sm text-texto-secundario">{passoAtual.texto}</p>

        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={encerrar}
            className="text-sm text-texto-secundario transition-colors hover:text-texto"
          >
            Pular tutorial
          </button>

          <div className="flex items-center gap-2">
            {!primeiroPasso && ( // sem "Voltar" no 1º passo: não existe passo anterior
              <Button type="button" variante="secundario" onClick={() => irPara(passo - 1)}>
                Voltar
              </Button>
            )}
            <Button type="button" onClick={ultimoPasso ? concluir : () => irPara(passo + 1)}>
              {primeiroPasso ? "Começar" : ultimoPasso ? "Concluir" : "Próximo"}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}

// camada escura com um "buraco" retangular (4 tiras, uma de cada lado do alvo) + um anel dourado
// em volta do buraco. 4 tiras em vez de 1 overlay só: assim o clique passa limpo pelo elemento em
// foco (ele não tem NENHUMA camada por cima), mas continua bloqueado em qualquer outro lugar da tela
function RecorteTour({ alvo, enfase }: { alvo: Retangulo | null; enfase: boolean }) {
  if (!alvo) {
    return <div className="fixed inset-0 z-40 bg-black/75" aria-hidden />; // passo de boas-vindas: tela inteira escurecida, sem recorte
  }

  const margem = 6; // "respiro" entre o elemento e a borda do recorte, pra não ficar grudado
  const r = {
    top: Math.max(alvo.top - margem, 0),
    left: Math.max(alvo.left - margem, 0),
    right: Math.min(alvo.left + alvo.width + margem, window.innerWidth),
    bottom: Math.min(alvo.top + alvo.height + margem, window.innerHeight),
  };

  return (
    <div aria-hidden>
      {/* tira de cima, da esquerda, da direita e de baixo — juntas, cobrem tudo MENOS o recorte */}
      <div className="fixed inset-x-0 top-0 z-40 bg-black/75" style={{ height: r.top }} />
      <div className="fixed inset-x-0 bottom-0 z-40 bg-black/75" style={{ top: r.bottom }} />
      <div className="fixed z-40 bg-black/75" style={{ top: r.top, height: r.bottom - r.top, left: 0, width: r.left }} />
      <div className="fixed z-40 bg-black/75" style={{ top: r.top, height: r.bottom - r.top, left: r.right, right: 0 }} />
      {/* anel dourado em volta do recorte; no passo "enfase" (o do link), fica mais grosso e com um leve brilho */}
      <div
        className={`pointer-events-none fixed z-40 rounded-lg border-2 ${enfase ? "border-dourado shadow-[0_0_16px_2px_rgba(201,162,39,0.5)]" : "border-dourado/80"}`}
        style={{ top: r.top, left: r.left, width: r.right - r.left, height: r.bottom - r.top }}
      />
    </div>
  );
}
