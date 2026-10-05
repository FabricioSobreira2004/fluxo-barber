import { ImageResponse } from "next/og"; // gera uma imagem (PNG) a partir de JSX, sem precisar de nenhum arquivo de design

export const alt = "Fluxo Barber — agendamento online para barbearias"; // texto alternativo da imagem (acessibilidade + fallback)
export const size = { width: 1200, height: 630 }; // tamanho recomendado pelo Facebook/WhatsApp pra pré-visualização de link
export const contentType = "image/png"; // formato da imagem gerada

// imagem usada quando um link do site é compartilhado (ex: no WhatsApp); o Next.js gera e serve isso
// automaticamente como "og:image", sem precisarmos desenhar/exportar um arquivo .png manualmente
export default function ImagemCompartilhamento() {
  return new ImageResponse(
    (
      <div
        style={{ // "display: flex" é obrigatório aqui -- o motor que desenha essa imagem só entende layout flexbox
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 24,
          backgroundColor: "#0b0b0b", // mesmo preto de fundo da identidade visual (ver app/globals.css)
        }}
      >
        <div style={{ display: "flex", fontSize: 96, fontWeight: 700, color: "#f5f5f5" }}>
          Fluxo <span style={{ color: "#c9a227", marginLeft: 20 }}>Barber</span> {/* "Barber" em dourado, igual ao logo do site */}
        </div>
        <div style={{ display: "flex", fontSize: 32, color: "#a3a3a3" }}>
          Agendamento online para barbearias
        </div>
      </div>
    ),
    { ...size }
  );
}
