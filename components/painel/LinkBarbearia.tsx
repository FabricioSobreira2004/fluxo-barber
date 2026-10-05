"use client"; // precisa de estado (feedback "Link copiado!") e da API de clipboard do navegador

import { useState } from "react"; // guarda se o "Link copiado!" deve aparecer agora
import { Copy, Check, Share2, ExternalLink } from "lucide-react"; // ícones dos 3 botões
import { Card } from "@/components/ui/Card"; // bloco de superfície padrão
import { Button } from "@/components/ui/Button"; // botão estilizado (usado no "Copiar link")
import { classesBotao } from "@/components/ui/Button"; // mesmo estilo de botão, mas aplicado a <a> (WhatsApp/abrir página)
import { marcarLinkCompartilhado } from "./acoes-progresso"; // Server Action: marca o item do checklist como feito

interface PropriedadesLinkBarbearia { // o que a página (Agenda ou Configurações) passa pra esse card
  slug: string; // identificador da barbearia na URL pública (/b/<slug>)
  nomeBarbearia: string; // usado na mensagem pronta do WhatsApp
  origemSite: string; // domínio atual do site (http://localhost:3000, ou o domínio publicado), pra montar a URL completa
}

export function LinkBarbearia({ slug, nomeBarbearia, origemSite }: PropriedadesLinkBarbearia) { // card "Seu link": o ponto mais importante do painel pro dono começar a receber clientes
  const [copiado, setCopiado] = useState(false); // true por 2 segundos, logo depois de clicar em "Copiar link"

  const caminhoPublico = `/b/${slug}`; // caminho relativo, usado no botão "Abrir minha página" (não precisa do domínio completo pra isso)
  const urlCompleta = `${origemSite}${caminhoPublico}`; // URL de verdade, pronta pra copiar ou mandar pro cliente
  const mensagemWhatsApp = `Agora você pode marcar seu horário na ${nomeBarbearia} pelo link: ${urlCompleta}`; // texto já pronto, só a pessoa escolher o contato e enviar
  const linkWhatsApp = `https://wa.me/?text=${encodeURIComponent(mensagemWhatsApp)}`; // "wa.me" sem número abre o seletor de contato do WhatsApp, com a mensagem pré-preenchida

  async function copiarLink() { // roda ao clicar em "Copiar link"
    await navigator.clipboard.writeText(urlCompleta); // copia a URL completa pra área de transferência
    setCopiado(true); // troca o texto do botão pra "Link copiado!" por um instante
    setTimeout(() => setCopiado(false), 2000); // volta ao normal depois de 2 segundos
    void marcarLinkCompartilhado(); // avisa o checklist que esse passo foi feito; não precisa esperar terminar pra seguir em frente
  }

  return (
    <Card data-tour="link-barbearia" className="flex flex-col gap-4"> {/* "data-tour": o passo 5 do tutorial guiado procura esse card por esse atributo */}
      <div>
        <h2 className="font-display text-lg font-semibold text-texto">Seu link</h2>
        <p className="text-sm text-texto-secundario">
          Compartilhe esse link com seus clientes — eles agendam sozinhos, sem precisar te chamar.
        </p>
      </div>

      {/* URL em destaque, só leitura (não dá pra editar aqui — o slug muda em Configurações) */}
      <p className="truncate rounded-lg border border-borda bg-fundo px-3 py-2 font-mono text-sm text-dourado">
        {urlCompleta}
      </p>

      <div className="flex flex-wrap gap-3">
        <Button type="button" onClick={copiarLink} data-tour="botao-copiar-link" className="gap-2">
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

        <a
          href={linkWhatsApp}
          target="_blank" // abre o WhatsApp (app ou web) numa aba/janela separada, sem sair do painel
          rel="noopener noreferrer" // evita que a aba aberta tenha acesso de volta a esta página, por segurança
          onClick={() => void marcarLinkCompartilhado()} // compartilhar pelo WhatsApp também conta como o passo do checklist
          data-tour="botao-whatsapp-link"
          className={`${classesBotao("secundario")} gap-2`}
        >
          <Share2 className="h-4 w-4" aria-hidden /> Compartilhar no WhatsApp
        </a>

        <a
          href={caminhoPublico}
          target="_blank"
          rel="noopener noreferrer"
          className={`${classesBotao("secundario")} gap-2`}
        >
          <ExternalLink className="h-4 w-4" aria-hidden /> Abrir minha página
        </a>
      </div>
    </Card>
  );
}
