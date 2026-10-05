"use client"; // precisa de estado (feedback "Link copiado!", o aviso de link incompleto) e da API de clipboard do navegador

import { useRef, useState } from "react"; // estado local + referência pro aviso (animação GSAP)
import Link from "next/link"; // links "Completar agora" e os itens que faltam, levando direto pra tela certa
import { Copy, Check, Share2, ExternalLink, TriangleAlert } from "lucide-react"; // ícones dos botões e do aviso
import { useGSAP } from "@gsap/react"; // hook oficial do GSAP pra React: já limpa a animação sozinho ao desmontar
import gsap from "gsap"; // motor de animação
import { Card } from "@/components/ui/Card"; // bloco de superfície padrão
import { Badge } from "@/components/ui/Badge"; // selo colorido de status
import { Button } from "@/components/ui/Button"; // botão estilizado (usado no "Copiar link")
import { classesBotao } from "@/components/ui/Button"; // mesmo estilo de botão, mas aplicado a <a>/<button> que não são o Button padrão
import { marcarLinkCompartilhado } from "./acoes-progresso"; // Server Action: marca o item do checklist como feito
import { type StatusProntidao } from "@/utils/supabase/prontidao"; // formato do status (pronta + o que falta), calculado no servidor

interface PropriedadesLinkBarbearia { // o que a página (Agenda ou Configurações) passa pra esse card
  slug: string; // identificador da barbearia na URL pública (/b/<slug>)
  nomeBarbearia: string; // usado na mensagem pronta do WhatsApp
  origemSite: string; // domínio atual do site (http://localhost:3000, ou o domínio publicado), pra montar a URL completa
  status: StatusProntidao; // se o link já funciona de verdade, e o que falta quando não funciona
}

type AcaoLink = "copiar" | "whatsapp"; // as duas ações que o aviso de "link incompleto" pode interromper

export function LinkBarbearia({ slug, nomeBarbearia, origemSite, status }: PropriedadesLinkBarbearia) { // card "Seu link": o ponto mais importante do painel pro dono começar a receber clientes
  const [copiado, setCopiado] = useState(false); // true por 2 segundos, logo depois de clicar em "Copiar link"
  const [acaoPendente, setAcaoPendente] = useState<AcaoLink | null>(null); // != null quando o aviso de "link incompleto" está aberto, guardando qual botão foi clicado

  const caminhoPublico = `/b/${slug}`; // caminho relativo, usado no botão "Abrir minha página" (não precisa do domínio completo pra isso)
  const urlCompleta = `${origemSite}${caminhoPublico}`; // URL de verdade, pronta pra copiar ou mandar pro cliente
  const mensagemWhatsApp = `Agora você pode marcar seu horário na ${nomeBarbearia} pelo link: ${urlCompleta}`; // texto já pronto, só a pessoa escolher o contato e enviar
  const linkWhatsApp = `https://wa.me/?text=${encodeURIComponent(mensagemWhatsApp)}`; // "wa.me" sem número abre o seletor de contato do WhatsApp, com a mensagem pré-preenchida

  async function executarCopiar() { // a ação "copiar" de verdade, sem nenhuma checagem — chamada direto (link pronto) ou depois do aviso
    await navigator.clipboard.writeText(urlCompleta); // copia a URL completa pra área de transferência
    setCopiado(true); // troca o texto do botão pra "Link copiado!" por um instante
    setTimeout(() => setCopiado(false), 2000); // volta ao normal depois de 2 segundos
    void marcarLinkCompartilhado(); // avisa o checklist que esse passo foi feito; não precisa esperar terminar pra seguir em frente
  }

  function executarWhatsapp() { // a ação "WhatsApp" de verdade, sem nenhuma checagem
    window.open(linkWhatsApp, "_blank", "noopener,noreferrer"); // abre o WhatsApp numa aba separada, sem sair do painel
    void marcarLinkCompartilhado(); // compartilhar pelo WhatsApp também conta como o passo do checklist
  }

  function aoClicarCopiar() { // roda sempre que o botão "Copiar link" é clicado
    if (status.pronta) executarCopiar(); // link já funciona: copia direto, sem perguntar nada
    else setAcaoPendente("copiar"); // link incompleto: abre o aviso antes, e só copia se o dono confirmar "mesmo assim"
  }

  function aoClicarWhatsapp() { // mesma lógica do botão de cima, pro botão do WhatsApp
    if (status.pronta) executarWhatsapp();
    else setAcaoPendente("whatsapp");
  }

  function confirmarMesmoAssim() { // botão "Compartilhar mesmo assim", dentro do aviso
    if (acaoPendente === "copiar") executarCopiar();
    else if (acaoPendente === "whatsapp") executarWhatsapp();
    setAcaoPendente(null); // fecha o aviso de qualquer forma
  }

  return (
    <Card data-tour="link-barbearia" className="flex flex-col gap-4"> {/* "data-tour": o passo 5 do tutorial guiado procura esse card por esse atributo */}
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 className="font-display text-lg font-semibold text-texto">Seu link</h2>
          <p className="text-sm text-texto-secundario">
            Compartilhe esse link com seus clientes — eles agendam sozinhos, sem precisar te chamar.
          </p>
        </div>
        {/* selo de status: verde quando os 3 requisitos (barbeiro, serviço, horário) estão OK, âmbar quando falta algo */}
        <Badge variante={status.pronta ? "sucesso" : "aviso"}>
          {status.pronta ? "Pronto para receber agendamentos" : "Ainda não está pronto"}
        </Badge>
      </div>

      {/* URL em destaque, só leitura (não dá pra editar aqui — o slug muda em Configurações) */}
      <p className="truncate rounded-lg border border-borda bg-fundo px-3 py-2 font-mono text-sm text-dourado">
        {urlCompleta}
      </p>

      {!status.pronta && ( // lista do que falta, cada item já levando direto pra tela onde se resolve
        <p className="text-sm text-aviso">
          Falta:{" "}
          {status.itensFaltando.map((item, indice) => (
            <span key={item.chave}>
              <Link href={item.href} className="underline hover:text-dourado-claro">
                {item.rotulo}
              </Link>
              {indice < status.itensFaltando.length - 1 && " · "} {/* separador entre os itens, exceto depois do último */}
            </span>
          ))}
        </p>
      )}

      <div className="flex flex-wrap gap-3">
        <Button type="button" onClick={aoClicarCopiar} data-tour="botao-copiar-link" className="gap-2">
          {copiado ? ( // feedback visual rápido, confirmando que copiou de verdade
            <>
              <Check className="h-4 w-4" aria-hidden /> Link copiado!
            </>
          ) : (
            <>
              <Copy className="h-4 w-4" aria-hidden /> Copiar link
            </>
          )}
        </Button>

        {/* "WhatsApp" virou <button> (antes era <a href>): precisa poder interromper com o aviso
            antes de abrir o link, quando a barbearia ainda não está pronta */}
        <button
          type="button"
          onClick={aoClicarWhatsapp}
          data-tour="botao-whatsapp-link"
          className={`${classesBotao("secundario")} gap-2`}
        >
          <Share2 className="h-4 w-4" aria-hidden /> Compartilhar no WhatsApp
        </button>

        <a
          href={caminhoPublico}
          target="_blank"
          rel="noopener noreferrer"
          className={`${classesBotao("secundario")} gap-2`}
        >
          <ExternalLink className="h-4 w-4" aria-hidden /> Abrir minha página
        </a>
      </div>

      {acaoPendente && ( // aviso: só existe enquanto o dono não decidiu "completar agora" ou "mesmo assim"
        <AvisoLinkIncompleto
          itensFaltando={status.itensFaltando}
          onCompletarAgora={() => setAcaoPendente(null)} // o próprio link "Completar agora" já navega pra outra tela; só precisa fechar o aviso
          onCompartilharMesmoAssim={confirmarMesmoAssim}
          onFechar={() => setAcaoPendente(null)}
        />
      )}
    </Card>
  );
}

interface PropriedadesAviso { // o que o aviso de "link incompleto" recebe
  itensFaltando: StatusProntidao["itensFaltando"];
  onCompletarAgora: () => void;
  onCompartilharMesmoAssim: () => void;
  onFechar: () => void;
}

// aviso em forma de modal central, mostrado quando o dono tenta copiar/compartilhar o link ANTES
// de cadastrar barbeiro, serviço e horários — avisa que o cliente veria uma página sem horários
function AvisoLinkIncompleto({ itensFaltando, onCompletarAgora, onCompartilharMesmoAssim, onFechar }: PropriedadesAviso) {
  const caixaRef = useRef<HTMLDivElement>(null); // referência pro quadro do aviso, animado ao aparecer

  useGSAP(() => {
    const mm = gsap.matchMedia(); // respeita o "prefers-reduced-motion" do sistema
    mm.add("(prefers-reduced-motion: no-preference)", () => {
      gsap.from(caixaRef.current, { autoAlpha: 0, y: 16, scale: 0.97, duration: 0.3, ease: "power2.out" }); // fade + leve deslize/escala ao abrir
    });
    return () => mm.revert();
  }, { scope: caixaRef });

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4"
      role="alertdialog" // "alert": é um aviso que pede uma decisão, não só informativo
      aria-modal="true"
      aria-labelledby="aviso-link-titulo"
    >
      <div ref={caixaRef} className="w-full max-w-sm rounded-2xl border border-aviso/40 bg-superficie p-6">
        <div className="mb-3 flex items-start gap-3">
          <TriangleAlert className="mt-0.5 h-5 w-5 shrink-0 text-aviso" aria-hidden />
          <h2 id="aviso-link-titulo" className="font-display text-base font-semibold text-texto">
            Seu link ainda não aceita agendamentos
          </h2>
        </div>

        <p className="mb-4 text-sm text-texto-secundario">
          Seus clientes vão ver uma página sem horários disponíveis. Falta:{" "}
          {itensFaltando.map((item) => item.rotulo).join(" · ")}.
        </p>

        <div className="flex flex-col gap-2">
          <Link href={itensFaltando[0]?.href ?? "/painel/barbeiros"} onClick={onCompletarAgora} className={classesBotao("primario")}>
            Completar agora
          </Link>
          <button type="button" onClick={onCompartilharMesmoAssim} className="text-sm text-texto-secundario hover:text-texto">
            Compartilhar mesmo assim
          </button>
          <button type="button" onClick={onFechar} className="text-xs text-texto-secundario/70 hover:text-texto-secundario">
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}
